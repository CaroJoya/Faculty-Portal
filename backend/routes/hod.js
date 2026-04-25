const express = require("express");
const bcrypt = require("bcryptjs");
const { db } = require("../database/init");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");

const router = express.Router();

function getHodDepartment(username) {
  const hod = db.prepare("SELECT username, role, department FROM users WHERE username = ?").get(username);
  if (!hod || hod.role !== "hod") return null;
  return hod.department;
}

function ensureHod(req, res) {
  const department = getHodDepartment(req.user.username);
  if (!department) {
    res.status(403).json({ message: "Only HOD can access this endpoint" });
    return null;
  }
  return department;
}

// ========== 1) GET /api/hod/dashboard-stats ==========
router.get("/hod/dashboard-stats", authenticateToken, authorizeRoles("hod"), (req, res) => {
  try {
    const hodDepartment = ensureHod(req, res);
    if (!hodDepartment) return;

    const total_faculty = db.prepare(`
      SELECT COUNT(*) AS count
      FROM users
      WHERE role = 'faculty' AND department = ? AND deleted_at IS NULL
    `).get(hodDepartment).count;

    const pending_faculty_leaves = db.prepare(`
      SELECT COUNT(*) AS count
      FROM leave_requests lr
      JOIN users u ON u.username = lr.user_username
      WHERE u.role = 'faculty'
        AND u.department = ?
        AND u.deleted_at IS NULL
        AND lr.status = 'Pending'
        AND (lr.hod_approved IS NULL OR lr.hod_approved = 0)
    `).get(hodDepartment).count;

    const approved_faculty_leaves = db.prepare(`
      SELECT COUNT(*) AS count
      FROM leave_requests lr
      JOIN users u ON u.username = lr.user_username
      WHERE u.role = 'faculty'
        AND u.department = ?
        AND u.deleted_at IS NULL
        AND lr.status = 'Approved'
        AND strftime('%Y', lr.start_date) = strftime('%Y', 'now')
    `).get(hodDepartment).count;

    const rejected_faculty_leaves = db.prepare(`
      SELECT COUNT(*) AS count
      FROM leave_requests lr
      JOIN users u ON u.username = lr.user_username
      WHERE u.role = 'faculty'
        AND u.department = ?
        AND u.deleted_at IS NULL
        AND lr.status = 'Rejected'
        AND strftime('%Y', lr.start_date) = strftime('%Y', 'now')
    `).get(hodDepartment).count;

    const recent_requests = db.prepare(`
      SELECT 
        lr.id,
        lr.start_date,
        lr.end_date,
        lr.leave_type,
        lr.leave_category,
        lr.special_leave_type,
        lr.reason,
        lr.status,
        lr.created_at,
        u.username,
        u.full_name,
        u.department
      FROM leave_requests lr
      JOIN users u ON u.username = lr.user_username
      WHERE u.role = 'faculty'
        AND u.department = ?
        AND u.deleted_at IS NULL
        AND lr.status = 'Pending'
        AND (lr.hod_approved IS NULL OR lr.hod_approved = 0)
      ORDER BY lr.created_at DESC
      LIMIT 10
    `).all(hodDepartment);

    const dist = db.prepare(`
      SELECT
        SUM(CASE WHEN lr.leave_category = 'medical' THEN 1 ELSE 0 END) AS medical_count,
        SUM(CASE WHEN lr.leave_category = 'casual' THEN 1 ELSE 0 END) AS casual_count,
        SUM(CASE WHEN lr.leave_category = 'earned' THEN 1 ELSE 0 END) AS earned_count
      FROM leave_requests lr
      JOIN users u ON u.username = lr.user_username
      WHERE u.role = 'faculty'
        AND u.department = ?
        AND u.deleted_at IS NULL
        AND lr.status = 'Pending'
        AND (lr.hod_approved IS NULL OR lr.hod_approved = 0)
    `).get(hodDepartment);

    res.json({
      total_faculty,
      pending_faculty_leaves,
      approved_faculty_leaves,
      rejected_faculty_leaves,
      recent_requests,
      medical_count: Number(dist.medical_count || 0),
      casual_count: Number(dist.casual_count || 0),
      earned_count: Number(dist.earned_count || 0)
    });
  } catch (err) {
    console.error("HOD dashboard-stats error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ========== 2) GET /api/hod/faculty-requests ==========
router.get("/hod/faculty-requests", authenticateToken, authorizeRoles("hod"), (req, res) => {
  try {
    const hodDepartment = ensureHod(req, res);
    if (!hodDepartment) return;

    const rows = db.prepare(`
      SELECT
        lr.*,
        u.full_name,
        u.email,
        u.phone_number,
        u.department,
        u.designation
      FROM leave_requests lr
      JOIN users u ON u.username = lr.user_username
      WHERE u.role = 'faculty'
        AND u.department = ?
        AND u.deleted_at IS NULL
        AND lr.status = 'Pending'
        AND (lr.hod_approved IS NULL OR lr.hod_approved = 0)
      ORDER BY lr.created_at DESC
    `).all(hodDepartment);

    res.json(rows);
  } catch (err) {
    console.error("HOD faculty-requests error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ========== 3) GET /api/hod/request/:id ==========
router.get("/hod/request/:id", authenticateToken, authorizeRoles("hod"), (req, res) => {
  try {
    const hodDepartment = ensureHod(req, res);
    if (!hodDepartment) return;

    const id = Number(req.params.id);
    const requestRow = db.prepare(`
      SELECT
        lr.*,
        u.username,
        u.full_name,
        u.email,
        u.phone_number,
        u.department,
        u.designation,
        u.medical_leave_left,
        u.casual_leave_left,
        u.earned_leave_left
      FROM leave_requests lr
      JOIN users u ON u.username = lr.user_username
      WHERE lr.id = ?
        AND u.role = 'faculty'
        AND u.deleted_at IS NULL
    `).get(id);

    if (!requestRow) return res.status(404).json({ message: "Request not found" });
    if (requestRow.department !== hodDepartment) {
      return res.status(403).json({ message: "Forbidden: Different department" });
    }

    const recent_history = db.prepare(`
      SELECT id, start_date, end_date, leave_category, leave_type, reason, approved_at
      FROM leave_requests
      WHERE user_username = ? AND status = 'Approved'
      ORDER BY approved_at DESC, created_at DESC
      LIMIT 5
    `).all(requestRow.user_username);

    const leave_statistics = db.prepare(`
      SELECT
        SUM(CASE WHEN leave_category = 'medical' AND status = 'Approved' THEN 1 ELSE 0 END) AS medical_taken,
        SUM(CASE WHEN leave_category = 'casual' AND status = 'Approved' THEN 1 ELSE 0 END) AS casual_taken,
        SUM(CASE WHEN leave_category = 'earned' AND status = 'Approved' THEN 1 ELSE 0 END) AS earned_taken
      FROM leave_requests
      WHERE user_username = ?
        AND strftime('%Y', start_date) = strftime('%Y', 'now')
    `).get(requestRow.user_username);

    res.json({
      request: requestRow,
      recent_history,
      leave_statistics: {
        medical_taken: Number(leave_statistics.medical_taken || 0),
        casual_taken: Number(leave_statistics.casual_taken || 0),
        earned_taken: Number(leave_statistics.earned_taken || 0)
      }
    });
  } catch (err) {
    console.error("HOD request/:id error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ========== 4) POST /api/hod/forward-to-principal/:id ==========
router.post("/hod/forward-to-principal/:id", authenticateToken, authorizeRoles("hod"), (req, res) => {
  try {
    const hodDepartment = ensureHod(req, res);
    if (!hodDepartment) return;

    const id = Number(req.params.id);
    const { hod_comments } = req.body;

    const row = db.prepare(`
      SELECT lr.id, lr.status, u.department
      FROM leave_requests lr
      JOIN users u ON u.username = lr.user_username
      WHERE lr.id = ? AND u.role = 'faculty' AND u.deleted_at IS NULL
    `).get(id);

    if (!row) return res.status(404).json({ message: "Request not found" });
    if (row.department !== hodDepartment) {
      return res.status(403).json({ message: "Forbidden: Different department" });
    }
    if (row.status !== "Pending") {
      return res.status(400).json({ message: "Only pending requests can be forwarded" });
    }

    db.prepare(`
      UPDATE leave_requests
      SET
        hod_approved = 1,
        hod_comments = ?,
        hod_approved_by = ?,
        hod_approved_at = CURRENT_TIMESTAMP,
        status = 'Pending',
        final_approver = 'Principal'
      WHERE id = ?
    `).run(hod_comments || null, req.user.username, id);

    res.json({ message: "Request forwarded to Principal successfully" });
  } catch (err) {
    console.error("HOD forward-to-principal error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ========== 5) POST /api/hod/reject-request/:id ==========
router.post("/hod/reject-request/:id", authenticateToken, authorizeRoles("hod"), (req, res) => {
  try {
    const hodDepartment = ensureHod(req, res);
    if (!hodDepartment) return;

    const id = Number(req.params.id);
    const { rejection_reason } = req.body;

    if (!rejection_reason || !String(rejection_reason).trim()) {
      return res.status(400).json({ message: "Rejection reason is required" });
    }

    const row = db.prepare(`
      SELECT lr.id, lr.status, u.department
      FROM leave_requests lr
      JOIN users u ON u.username = lr.user_username
      WHERE lr.id = ? AND u.role = 'faculty' AND u.deleted_at IS NULL
    `).get(id);

    if (!row) return res.status(404).json({ message: "Request not found" });
    if (row.department !== hodDepartment) {
      return res.status(403).json({ message: "Forbidden: Different department" });
    }
    if (row.status !== "Pending") {
      return res.status(400).json({ message: "Only pending requests can be rejected" });
    }

    db.prepare(`
      UPDATE leave_requests
      SET
        status = 'Rejected',
        admin_comments = ?,
        hod_approved = 0,
        hod_comments = ?,
        hod_approved_by = ?,
        hod_approved_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(rejection_reason, rejection_reason, req.user.username, id);

    res.json({ message: "Request rejected successfully" });
  } catch (err) {
    console.error("HOD reject-request error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ========== 6) GET /api/hod/faculty-list ==========
router.get("/hod/faculty-list", authenticateToken, authorizeRoles("hod"), (req, res) => {
  try {
    const hodDepartment = ensureHod(req, res);
    if (!hodDepartment) return;

    const rows = db.prepare(`
      SELECT
        u.username,
        u.full_name,
        u.email,
        u.phone_number,
        u.department,
        u.designation,
        u.date_of_joining,
        u.medical_leave_left,
        u.casual_leave_left,
        u.earned_leave_left,
        (SELECT COUNT(*) FROM leave_requests lr WHERE lr.user_username = u.username AND lr.status = 'Approved') AS approved_count,
        (SELECT COUNT(*) FROM leave_requests lr WHERE lr.user_username = u.username AND lr.status = 'Pending') AS pending_count
      FROM users u
      WHERE u.role = 'faculty'
        AND u.department = ?
        AND u.deleted_at IS NULL
      ORDER BY u.full_name ASC
    `).all(hodDepartment);

    res.json(rows);
  } catch (err) {
    console.error("HOD faculty-list error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ========== 7) POST /api/hod/add-faculty ==========
router.post("/hod/add-faculty", authenticateToken, authorizeRoles("hod"), (req, res) => {
  try {
    const hodDepartment = ensureHod(req, res);
    if (!hodDepartment) return;

    const { full_name, email, phone_number, account_type, date_of_joining } = req.body;

    if (!full_name || !email) {
      return res.status(400).json({ message: "full_name and email are required" });
    }

    const emailLower = String(email).trim().toLowerCase();
    if (!emailLower.includes("@")) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const baseUsername = emailLower.split("@")[0].replace(/[^a-zA-Z0-9._-]/g, "");
    if (!baseUsername) {
      return res.status(400).json({ message: "Could not generate username from email" });
    }

    let username = baseUsername;
    let counter = 1;
    while (db.prepare("SELECT username FROM users WHERE username = ?").get(username)) {
      username = `${baseUsername}${counter}`;
      counter++;
    }

    const existingEmail = db.prepare("SELECT username FROM users WHERE email = ?").get(emailLower);
    if (existingEmail) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const defaultPassword = "password123";
    const password_hash = bcrypt.hashSync(defaultPassword, 10);
    const designation = account_type === "Lab Assistant" ? "Lab Assistant" : "Faculty";

    db.prepare(`
      INSERT INTO users (
        username, password_hash, email, full_name, department, designation, role, phone_number, date_of_joining,
        medical_leave_total, medical_leave_used, medical_leave_left,
        casual_leave_total, casual_leave_used, casual_leave_left,
        earned_leave_total, earned_leave_used, earned_leave_left,
        maternity_paternity_total, maternity_paternity_used, maternity_paternity_left,
        overwork_hours, pending_overwork_hours,
        is_hod, is_registry, is_principal, managed_department
      )
      VALUES (?, ?, ?, ?, ?, ?, 'faculty', ?, ?,
              10, 0, 10,
              10, 0, 10,
              0, 0, 0,
              180, 0, 180,
              0, 0,
              0, 0, 0, NULL)
    `).run(
      username,
      password_hash,
      emailLower,
      full_name,
      hodDepartment,
      designation,
      phone_number || null,
      date_of_joining || null
    );

    res.status(201).json({
      message: "Faculty created successfully",
      credentials: {
        username,
        password: defaultPassword,
        department: hodDepartment
      }
    });
  } catch (err) {
    console.error("HOD add-faculty error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ========== 8) POST /api/hod/reset-password/:username ==========
router.post("/hod/reset-password/:username", authenticateToken, authorizeRoles("hod"), (req, res) => {
  try {
    const hodDepartment = ensureHod(req, res);
    if (!hodDepartment) return;

    const targetUsername = req.params.username;

    const faculty = db.prepare(`
      SELECT username, role, department
      FROM users
      WHERE username = ?
    `).get(targetUsername);

    if (!faculty) return res.status(404).json({ message: "Faculty not found" });
    if (faculty.role !== "faculty") return res.status(400).json({ message: "Only faculty password can be reset" });
    if (faculty.department !== hodDepartment) {
      return res.status(403).json({ message: "Forbidden: Different department" });
    }

    const hash = bcrypt.hashSync("password123", 10);
    db.prepare("UPDATE users SET password_hash = ? WHERE username = ?").run(hash, targetUsername);

    res.json({ message: `Password reset successful for ${targetUsername}` });
  } catch (err) {
    console.error("HOD reset-password error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ========== 9) DELETE /api/hod/delete-faculty/:username (SOFT DELETE with 30-day restore) ==========
router.delete("/hod/delete-faculty/:username", authenticateToken, authorizeRoles("hod"), (req, res) => {
  try {
    const hodDepartment = ensureHod(req, res);
    if (!hodDepartment) return;

    const targetUsername = req.params.username;
    
    if (targetUsername === req.user.username) {
      return res.status(400).json({ message: "You cannot delete your own account" });
    }
    
    const faculty = db.prepare(`
      SELECT username, role, department, deleted_at
      FROM users
      WHERE username = ?
    `).get(targetUsername);

    if (!faculty) return res.status(404).json({ message: "Faculty not found" });
    if (faculty.role !== "faculty") return res.status(400).json({ message: "Only faculty can be deleted" });
    if (faculty.department !== hodDepartment) {
      return res.status(403).json({ message: "Forbidden: Different department" });
    }
    
    if (faculty.deleted_at) {
      return res.status(400).json({ message: "Faculty already deleted" });
    }

    db.prepare(`
      UPDATE users
      SET deleted_at = CURRENT_TIMESTAMP,
          deleted_by = ?
      WHERE username = ?
    `).run(req.user.username, targetUsername);

    res.json({ 
      message: `Faculty ${targetUsername} soft deleted successfully. They can be restored within 30 days.`,
      deleted_at: new Date().toISOString(),
      deleted_by: req.user.username
    });
  } catch (err) {
    console.error("HOD delete-faculty error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ========== 10) POST /api/hod/restore-faculty/:username ==========
router.post("/hod/restore-faculty/:username", authenticateToken, authorizeRoles("hod"), (req, res) => {
  try {
    const hodDepartment = ensureHod(req, res);
    if (!hodDepartment) return;

    const targetUsername = req.params.username;
    
    const faculty = db.prepare(`
      SELECT username, role, department, deleted_at
      FROM users
      WHERE username = ?
    `).get(targetUsername);

    if (!faculty) return res.status(404).json({ message: "Faculty not found" });
    if (faculty.role !== "faculty") return res.status(400).json({ message: "Only faculty can be restored" });
    if (faculty.department !== hodDepartment) {
      return res.status(403).json({ message: "Forbidden: Different department" });
    }
    
    if (!faculty.deleted_at) {
      return res.status(400).json({ message: "Faculty is not deleted" });
    }
    
    const deletedDate = new Date(faculty.deleted_at);
    const now = new Date();
    const daysDeleted = Math.floor((now - deletedDate) / (1000 * 60 * 60 * 24));
    
    if (daysDeleted > 30) {
      return res.status(400).json({ 
        message: `Cannot restore: ${daysDeleted} days have passed. Maximum restore window is 30 days.`,
        days_passed: daysDeleted
      });
    }

    db.prepare(`
      UPDATE users
      SET deleted_at = NULL,
          deleted_by = NULL,
          restored_at = CURRENT_TIMESTAMP,
          restored_by = ?
      WHERE username = ?
    `).run(req.user.username, targetUsername);

    res.json({ 
      message: `Faculty ${targetUsername} restored successfully.`,
      restored_at: new Date().toISOString(),
      restored_by: req.user.username,
      days_until_permanent: 30 - daysDeleted
    });
  } catch (err) {
    console.error("HOD restore-faculty error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ========== 11) GET /api/hod/deleted-faculty-history ==========
router.get("/hod/deleted-faculty-history", authenticateToken, authorizeRoles("hod"), (req, res) => {
  try {
    const hodDepartment = ensureHod(req, res);
    if (!hodDepartment) return;

    const deletedFaculty = db.prepare(`
      SELECT 
        u.username,
        u.full_name,
        u.email,
        u.department,
        u.designation,
        u.deleted_at,
        u.deleted_by,
        u.restored_at,
        u.restored_by,
        d.full_name as deleted_by_name,
        r.full_name as restored_by_name
      FROM users u
      LEFT JOIN users d ON d.username = u.deleted_by
      LEFT JOIN users r ON r.username = u.restored_by
      WHERE u.role = 'faculty'
        AND u.department = ?
        AND u.deleted_at IS NOT NULL
      ORDER BY u.deleted_at DESC
    `).all(hodDepartment);

    const result = deletedFaculty.map(faculty => {
      const leaveHistory = db.prepare(`
        SELECT 
          lr.id,
          lr.start_date,
          lr.end_date,
          lr.duration_days,
          lr.reason,
          lr.status,
          lr.leave_category,
          lr.leave_type,
          lr.created_at,
          lr.approved_at,
          lr.hod_approved_by,
          lr.final_approver
        FROM leave_requests lr
        WHERE lr.user_username = ?
        ORDER BY lr.created_at DESC
      `).all(faculty.username);

      return {
        ...faculty,
        leave_history: leaveHistory,
        total_leaves_taken: leaveHistory.length,
        total_days_consumed: leaveHistory.reduce((sum, l) => sum + (l.duration_days || 0), 0)
      };
    });

    res.json({
      department: hodDepartment,
      deleted_count: result.length,
      deleted_faculty: result
    });
  } catch (err) {
    console.error("HOD deleted-faculty-history error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;