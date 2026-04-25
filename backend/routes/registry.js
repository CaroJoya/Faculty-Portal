const express = require("express");
const bcrypt = require("bcryptjs");
const { db } = require("../database/init");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");

const router = express.Router();

function ensureRegistry(req, res) {
  const u = db.prepare("SELECT username, role, department FROM users WHERE username = ?").get(req.user.username);
  if (!u || u.role !== "registry") {
    res.status(403).json({ message: "Only Registry can access this endpoint" });
    return null;
  }
  return u;
}

function ensureOfficeStaffUser(username) {
  return db.prepare(`
    SELECT username, role, department
    FROM users
    WHERE username = ?
  `).get(username);
}

// ========== 1) dashboard stats ==========
router.get("/registry/dashboard-stats", authenticateToken, authorizeRoles("registry"), (req, res) => {
  try {
    const reg = ensureRegistry(req, res);
    if (!reg) return;

    const total_staff = db.prepare(`
      SELECT COUNT(*) AS c
      FROM users
      WHERE role = 'officestaff' AND department = 'Office' AND deleted_at IS NULL
    `).get().c;

    const pending_staff_leaves = db.prepare(`
      SELECT COUNT(*) AS c
      FROM leave_requests lr
      JOIN users u ON u.username = lr.user_username
      WHERE u.role = 'officestaff'
        AND u.department = 'Office'
        AND u.deleted_at IS NULL
        AND lr.status = 'Pending'
        AND (lr.hod_approved IS NULL OR lr.hod_approved = 0)
    `).get().c;

    const approved_staff_leaves = db.prepare(`
      SELECT COUNT(*) AS c
      FROM leave_requests lr
      JOIN users u ON u.username = lr.user_username
      WHERE u.role = 'officestaff'
        AND u.department = 'Office'
        AND u.deleted_at IS NULL
        AND lr.status = 'Approved'
        AND strftime('%Y', lr.start_date) = strftime('%Y', 'now')
    `).get().c;

    const rejected_staff_leaves = db.prepare(`
      SELECT COUNT(*) AS c
      FROM leave_requests lr
      JOIN users u ON u.username = lr.user_username
      WHERE u.role = 'officestaff'
        AND u.department = 'Office'
        AND u.deleted_at IS NULL
        AND lr.status = 'Rejected'
        AND strftime('%Y', lr.start_date) = strftime('%Y', 'now')
    `).get().c;

    const recent_requests = db.prepare(`
      SELECT lr.*, u.full_name, u.email, u.phone_number, u.department
      FROM leave_requests lr
      JOIN users u ON u.username = lr.user_username
      WHERE u.role = 'officestaff'
        AND u.department = 'Office'
        AND u.deleted_at IS NULL
        AND lr.status = 'Pending'
        AND (lr.hod_approved IS NULL OR lr.hod_approved = 0)
      ORDER BY lr.created_at DESC
      LIMIT 10
    `).all();

    const dist = db.prepare(`
      SELECT
        SUM(CASE WHEN lr.leave_category = 'medical' THEN 1 ELSE 0 END) AS medical_count,
        SUM(CASE WHEN lr.leave_category = 'casual' THEN 1 ELSE 0 END) AS casual_count,
        SUM(CASE WHEN lr.leave_category = 'earned' THEN 1 ELSE 0 END) AS earned_count
      FROM leave_requests lr
      JOIN users u ON u.username = lr.user_username
      WHERE u.role = 'officestaff'
        AND u.department = 'Office'
        AND u.deleted_at IS NULL
        AND lr.status = 'Pending'
        AND (lr.hod_approved IS NULL OR lr.hod_approved = 0)
    `).get();

    return res.json({
      total_staff,
      pending_staff_leaves,
      approved_staff_leaves,
      rejected_staff_leaves,
      recent_requests,
      medical_count: Number(dist.medical_count || 0),
      casual_count: Number(dist.casual_count || 0),
      earned_count: Number(dist.earned_count || 0)
    });
  } catch (e) {
    console.error("REGISTRY dashboard-stats error:", e);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// ========== 2) pending staff requests ==========
router.get("/registry/staff-requests", authenticateToken, authorizeRoles("registry"), (req, res) => {
  try {
    const reg = ensureRegistry(req, res);
    if (!reg) return;

    const rows = db.prepare(`
      SELECT lr.*, u.full_name, u.email, u.phone_number, u.department, u.designation,
             u.medical_leave_left, u.casual_leave_left, u.earned_leave_left
      FROM leave_requests lr
      JOIN users u ON u.username = lr.user_username
      WHERE u.role = 'officestaff'
        AND u.department = 'Office'
        AND u.deleted_at IS NULL
        AND lr.status = 'Pending'
        AND (lr.hod_approved IS NULL OR lr.hod_approved = 0)
      ORDER BY lr.created_at DESC
    `).all();

    return res.json(rows);
  } catch (e) {
    console.error("REGISTRY staff-requests error:", e);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// ========== 3) request details ==========
router.get("/registry/request/:id", authenticateToken, authorizeRoles("registry"), (req, res) => {
  try {
    const reg = ensureRegistry(req, res);
    if (!reg) return;

    const id = Number(req.params.id);

    const request = db.prepare(`
      SELECT lr.*, u.username, u.full_name, u.email, u.phone_number, u.department, u.designation,
             u.medical_leave_left, u.casual_leave_left, u.earned_leave_left
      FROM leave_requests lr
      JOIN users u ON u.username = lr.user_username
      WHERE lr.id = ? AND u.role = 'officestaff' AND u.deleted_at IS NULL
    `).get(id);

    if (!request) return res.status(404).json({ message: "Request not found" });
    if (request.department !== "Office") return res.status(403).json({ message: "Forbidden: Different department" });

    const recent_history = db.prepare(`
      SELECT id, start_date, end_date, leave_category, leave_type, approved_at
      FROM leave_requests
      WHERE user_username = ? AND status = 'Approved'
      ORDER BY approved_at DESC, created_at DESC
      LIMIT 5
    `).all(request.user_username);

    const leave_statistics = db.prepare(`
      SELECT
        SUM(CASE WHEN leave_category = 'medical' AND status = 'Approved' THEN 1 ELSE 0 END) AS medical_taken,
        SUM(CASE WHEN leave_category = 'casual' AND status = 'Approved' THEN 1 ELSE 0 END) AS casual_taken,
        SUM(CASE WHEN leave_category = 'earned' AND status = 'Approved' THEN 1 ELSE 0 END) AS earned_taken
      FROM leave_requests
      WHERE user_username = ?
        AND strftime('%Y', start_date) = strftime('%Y', 'now')
    `).get(request.user_username);

    return res.json({
      request,
      recent_history,
      leave_statistics: {
        medical_taken: Number(leave_statistics.medical_taken || 0),
        casual_taken: Number(leave_statistics.casual_taken || 0),
        earned_taken: Number(leave_statistics.earned_taken || 0)
      }
    });
  } catch (e) {
    console.error("REGISTRY request/:id error:", e);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// ========== 4) approve + forward ==========
router.post("/registry/approve-forward/:id", authenticateToken, authorizeRoles("registry"), (req, res) => {
  try {
    const reg = ensureRegistry(req, res);
    if (!reg) return;

    const id = Number(req.params.id);
    const { comments } = req.body;

    const row = db.prepare(`
      SELECT lr.id, lr.status, u.department, u.role
      FROM leave_requests lr
      JOIN users u ON u.username = lr.user_username
      WHERE lr.id = ?
    `).get(id);

    if (!row) return res.status(404).json({ message: "Request not found" });
    if (row.role !== "officestaff" || row.department !== "Office") {
      return res.status(403).json({ message: "Forbidden: Not an Office Staff request" });
    }
    if (row.status !== "Pending") return res.status(400).json({ message: "Only pending requests can be forwarded" });

    db.prepare(`
      UPDATE leave_requests
      SET hod_approved = 1,
          hod_comments = ?,
          hod_approved_by = ?,
          hod_approved_at = CURRENT_TIMESTAMP,
          status = 'Pending',
          final_approver = 'Principal'
      WHERE id = ?
    `).run(comments || null, req.user.username, id);

    return res.json({ message: "Approved by Registry and forwarded to Principal" });
  } catch (e) {
    console.error("REGISTRY approve-forward error:", e);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// ========== 5) reject ==========
router.post("/registry/reject-request/:id", authenticateToken, authorizeRoles("registry"), (req, res) => {
  try {
    const reg = ensureRegistry(req, res);
    if (!reg) return;

    const id = Number(req.params.id);
    const { rejection_reason } = req.body;
    if (!rejection_reason || !String(rejection_reason).trim()) {
      return res.status(400).json({ message: "Rejection reason is required" });
    }

    const row = db.prepare(`
      SELECT lr.id, lr.status, u.department, u.role
      FROM leave_requests lr
      JOIN users u ON u.username = lr.user_username
      WHERE lr.id = ?
    `).get(id);

    if (!row) return res.status(404).json({ message: "Request not found" });
    if (row.role !== "officestaff" || row.department !== "Office") {
      return res.status(403).json({ message: "Forbidden: Not an Office Staff request" });
    }
    if (row.status !== "Pending") return res.status(400).json({ message: "Only pending requests can be rejected" });

    db.prepare(`
      UPDATE leave_requests
      SET status = 'Rejected',
          admin_comments = ?,
          hod_approved = 0,
          hod_comments = ?,
          hod_approved_by = ?,
          hod_approved_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(rejection_reason, rejection_reason, req.user.username, id);

    return res.json({ message: "Request rejected by Registry" });
  } catch (e) {
    console.error("REGISTRY reject-request error:", e);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// ========== 6) staff list ==========
router.get("/registry/staff-list", authenticateToken, authorizeRoles("registry"), (req, res) => {
  try {
    const reg = ensureRegistry(req, res);
    if (!reg) return;

    const rows = db.prepare(`
      SELECT
        u.username, u.full_name, u.email, u.phone_number, u.department, u.designation, u.date_of_joining,
        u.medical_leave_left, u.casual_leave_left, u.earned_leave_left,
        (SELECT COUNT(*) FROM leave_requests lr WHERE lr.user_username = u.username AND lr.status = 'Approved') AS approved_count,
        (SELECT COUNT(*) FROM leave_requests lr WHERE lr.user_username = u.username AND lr.status = 'Pending') AS pending_count
      FROM users u
      WHERE u.role = 'officestaff' AND u.department = 'Office' AND u.deleted_at IS NULL
      ORDER BY u.full_name ASC
    `).all();

    return res.json(rows);
  } catch (e) {
    console.error("REGISTRY staff-list error:", e);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// ========== 7) add staff ==========
router.post("/registry/add-staff", authenticateToken, authorizeRoles("registry"), (req, res) => {
  try {
    const reg = ensureRegistry(req, res);
    if (!reg) return;

    const { full_name, email, phone_number, designation, date_of_joining } = req.body;
    if (!full_name || !email) return res.status(400).json({ message: "full_name and email are required" });

    const emailLower = String(email).trim().toLowerCase();
    if (!emailLower.includes("@")) return res.status(400).json({ message: "Invalid email format" });

    const base = emailLower.split("@")[0].replace(/[^a-zA-Z0-9._-]/g, "");
    if (!base) return res.status(400).json({ message: "Cannot derive username from email" });

    let username = base;
    let n = 1;
    while (db.prepare("SELECT username FROM users WHERE username = ?").get(username)) {
      username = `${base}${n}`;
      n++;
    }

    if (db.prepare("SELECT username FROM users WHERE email = ?").get(emailLower)) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const password = "password123";
    const password_hash = bcrypt.hashSync(password, 10);

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
      VALUES (?, ?, ?, ?, 'Office', ?, 'officestaff', ?, ?,
              10, 0, 10,
              10, 0, 10,
              0, 0, 0,
              180, 0, 180,
              0, 0,
              0, 0, 0, NULL)
    `).run(
      username, password_hash, emailLower, full_name,
      designation || "Office Staff",
      phone_number || null, date_of_joining || null
    );

    return res.status(201).json({
      message: "Office staff created successfully",
      credentials: { username, password, department: "Office" }
    });
  } catch (e) {
    console.error("REGISTRY add-staff error:", e);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// ========== 8) reset password ==========
router.post("/registry/reset-password/:username", authenticateToken, authorizeRoles("registry"), (req, res) => {
  try {
    const reg = ensureRegistry(req, res);
    if (!reg) return;

    const target = ensureOfficeStaffUser(req.params.username);
    if (!target) return res.status(404).json({ message: "Staff not found" });
    if (target.role !== "officestaff" || target.department !== "Office") {
      return res.status(403).json({ message: "Forbidden: Can reset only Office Staff" });
    }

    const hash = bcrypt.hashSync("password123", 10);
    db.prepare("UPDATE users SET password_hash = ? WHERE username = ?").run(hash, target.username);

    return res.json({ message: `Password reset successful for ${target.username}` });
  } catch (e) {
    console.error("REGISTRY reset-password error:", e);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// ========== 9) DELETE /api/registry/delete-staff/:username (SOFT DELETE) ==========
router.delete("/registry/delete-staff/:username", authenticateToken, authorizeRoles("registry"), (req, res) => {
  try {
    const reg = ensureRegistry(req, res);
    if (!reg) return;

    const targetUsername = req.params.username;
    
    if (targetUsername === req.user.username) {
      return res.status(400).json({ message: "You cannot delete your own account" });
    }
    
    const target = db.prepare(`
      SELECT username, role, department, deleted_at
      FROM users
      WHERE username = ?
    `).get(targetUsername);
    
    if (!target) return res.status(404).json({ message: "Staff not found" });
    if (target.role !== "officestaff" || target.department !== "Office") {
      return res.status(403).json({ message: "Forbidden: Can delete only Office Staff" });
    }
    
    if (target.deleted_at) {
      return res.status(400).json({ message: "Staff already deleted" });
    }

    db.prepare(`
      UPDATE users
      SET deleted_at = CURRENT_TIMESTAMP,
          deleted_by = ?
      WHERE username = ?
    `).run(req.user.username, targetUsername);

    res.json({ 
      message: `Staff ${targetUsername} soft deleted successfully. They can be restored within 30 days.`,
      deleted_at: new Date().toISOString(),
      deleted_by: req.user.username
    });
  } catch (e) {
    console.error("REGISTRY delete-staff error:", e);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// ========== 10) POST /api/registry/restore-staff/:username ==========
router.post("/registry/restore-staff/:username", authenticateToken, authorizeRoles("registry"), (req, res) => {
  try {
    const reg = ensureRegistry(req, res);
    if (!reg) return;

    const targetUsername = req.params.username;
    
    const target = db.prepare(`
      SELECT username, role, department, deleted_at
      FROM users
      WHERE username = ?
    `).get(targetUsername);
    
    if (!target) return res.status(404).json({ message: "Staff not found" });
    if (target.role !== "officestaff" || target.department !== "Office") {
      return res.status(403).json({ message: "Forbidden: Can restore only Office Staff" });
    }
    
    if (!target.deleted_at) {
      return res.status(400).json({ message: "Staff is not deleted" });
    }
    
    const deletedDate = new Date(target.deleted_at);
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
      message: `Staff ${targetUsername} restored successfully.`,
      restored_at: new Date().toISOString(),
      restored_by: req.user.username
    });
  } catch (e) {
    console.error("REGISTRY restore-staff error:", e);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// ========== 11) GET /api/registry/deleted-staff-history ==========
router.get("/registry/deleted-staff-history", authenticateToken, authorizeRoles("registry"), (req, res) => {
  try {
    const reg = ensureRegistry(req, res);
    if (!reg) return;

    const deletedStaff = db.prepare(`
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
      WHERE u.role = 'officestaff'
        AND u.department = 'Office'
        AND u.deleted_at IS NOT NULL
      ORDER BY u.deleted_at DESC
    `).all();

    const result = deletedStaff.map(staff => {
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
          lr.approved_at
        FROM leave_requests lr
        WHERE lr.user_username = ?
        ORDER BY lr.created_at DESC
      `).all(staff.username);

      return {
        ...staff,
        leave_history: leaveHistory,
        total_leaves_taken: leaveHistory.length,
        total_days_consumed: leaveHistory.reduce((sum, l) => sum + (l.duration_days || 0), 0)
      };
    });

    res.json({
      deleted_count: result.length,
      deleted_staff: result
    });
  } catch (e) {
    console.error("REGISTRY deleted-staff-history error:", e);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;