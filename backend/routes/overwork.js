const express = require("express");
const path = require("path");
const { db } = require("../database/init");
const { authenticateToken } = require("../middleware/auth");
const { uploader } = require("../utils/fileUpload");
const { CONVERSION_HOURS_PER_LEAVE } = require("../config/constants");
const { sendCompensationNotification } = require("../utils/emailService");

const router = express.Router();

function eligible(role) {
  return ["faculty", "hod", "registry", "officestaff"].includes(role);
}

function getApprover(user) {
  if (user.role === "faculty") {
    return db.prepare(`SELECT username, email, full_name FROM users WHERE role='hod' AND department=? LIMIT 1`).get(user.department);
  }
  if (user.role === "officestaff") {
    return db.prepare(`SELECT username, email, full_name FROM users WHERE role='registry' LIMIT 1`).get();
  }
  if (user.role === "hod" || user.role === "registry") {
    return db.prepare(`SELECT username, email, full_name FROM users WHERE role='principal' LIMIT 1`).get();
  }
  return null;
}

function ensureExtraWorkTables() {
  // Keep safe if tables already exist
  db.prepare(`
    CREATE TABLE IF NOT EXISTS extra_work_days (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_username TEXT NOT NULL,
      work_date TEXT NOT NULL,
      hours REAL NOT NULL,
      reason TEXT,
      attachment_path TEXT,
      status TEXT DEFAULT 'pending', -- pending/approved/rejected/converted
      approver_username TEXT,
      approver_comments TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS leave_conversions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_username TEXT NOT NULL,
      extra_work_id INTEGER,
      hours_used REAL NOT NULL,
      earned_days REAL NOT NULL,
      status TEXT DEFAULT 'pending', -- pending/approved/rejected/converted
      approver_username TEXT,
      approver_comments TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
}
ensureExtraWorkTables();

// Add overwork day
router.post("/overwork/add", authenticateToken, uploader.single("file"), (req, res) => {
  try {
    if (!eligible(req.user.role)) return res.status(403).json({ message: "Not allowed" });

    const { work_date, hours, reason } = req.body || {};
    if (!work_date || !hours) return res.status(400).json({ message: "work_date and hours are required" });

    const h = Number(hours);
    if (h <= 0) return res.status(400).json({ message: "hours must be > 0" });

    const attachmentPath = req.file
      ? req.file.path.split(path.join(__dirname, ".."))[1].replace(/\\/g, "/")
      : null;

    db.prepare(`
      INSERT INTO extra_work_days (user_username, work_date, hours, reason, attachment_path, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `).run(req.user.username, work_date, h, reason || null, attachmentPath);

    res.json({ message: "Overwork day added", conversion_hours_per_leave: CONVERSION_HOURS_PER_LEAVE });
  } catch (e) {
    console.error("overwork/add error:", e);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// My overwork summary + history
router.get("/overwork/my-summary", authenticateToken, (req, res) => {
  try {
    if (!eligible(req.user.role)) return res.status(403).json({ message: "Not allowed" });

    const rows = db.prepare(`
      SELECT * FROM extra_work_days
      WHERE user_username = ?
      ORDER BY created_at DESC
    `).all(req.user.username);

    const approvedHours = db.prepare(`
      SELECT COALESCE(SUM(hours),0) as h
      FROM extra_work_days
      WHERE user_username = ? AND status IN ('approved', 'converted')
    `).get(req.user.username).h;

    const convertedHours = db.prepare(`
      SELECT COALESCE(SUM(hours_used),0) as h
      FROM leave_conversions
      WHERE user_username = ? AND status IN ('approved', 'converted')
    `).get(req.user.username).h;

    const pendingHours = Math.max(0, Number(approvedHours) - Number(convertedHours));
    const earnedLeavesFromOverwork = db.prepare(`
      SELECT COALESCE(SUM(earned_days),0) as d
      FROM leave_conversions
      WHERE user_username = ? AND status IN ('approved', 'converted')
    `).get(req.user.username).d;

    res.json({
      conversion_hours_per_leave: CONVERSION_HOURS_PER_LEAVE,
      approved_hours: Number(approvedHours),
      converted_hours: Number(convertedHours),
      pending_hours: Number(pendingHours),
      progress_to_next_leave: Number((pendingHours / CONVERSION_HOURS_PER_LEAVE) * 100).toFixed(2),
      earned_leaves_from_overwork: Number(earnedLeavesFromOverwork),
      history: rows
    });
  } catch (e) {
    console.error("overwork/my-summary error:", e);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Request manual conversion
router.post("/overwork/request-conversion", authenticateToken, async (req, res) => {
  try {
    if (!eligible(req.user.role)) return res.status(403).json({ message: "Not allowed" });

    const user = db.prepare(`SELECT username, full_name, role, department, email FROM users WHERE username=?`).get(req.user.username);

    const approvedHours = db.prepare(`
      SELECT COALESCE(SUM(hours),0) as h
      FROM extra_work_days
      WHERE user_username = ? AND status IN ('approved', 'converted')
    `).get(req.user.username).h;

    const convertedHours = db.prepare(`
      SELECT COALESCE(SUM(hours_used),0) as h
      FROM leave_conversions
      WHERE user_username = ? AND status IN ('approved', 'converted')
    `).get(req.user.username).h;

    const pendingHours = Math.max(0, Number(approvedHours) - Number(convertedHours));
    if (pendingHours < CONVERSION_HOURS_PER_LEAVE) {
      return res.status(400).json({ message: `Need at least ${CONVERSION_HOURS_PER_LEAVE} pending hours` });
    }

    const earnedDays = Number((pendingHours / CONVERSION_HOURS_PER_LEAVE).toFixed(2));

    const ins = db.prepare(`
      INSERT INTO leave_conversions (user_username, hours_used, earned_days, status)
      VALUES (?, ?, ?, 'pending')
    `).run(req.user.username, pendingHours, earnedDays);

    const approver = getApprover(user);
    if (approver?.email) {
      await sendCompensationNotification({
        user_name: user.full_name,
        user_username: user.username,
        department: user.department,
        work_date: "-",
        hours: pendingHours,
        earned_leaves: earnedDays,
        details: "Manual conversion request"
      }, "requested", "", approver.email);
    }

    res.json({ message: "Compensation request submitted", conversion_id: ins.lastInsertRowid, pending_hours: pendingHours, earned_days: earnedDays });
  } catch (e) {
    console.error("overwork/request-conversion error:", e);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Approver list pending conversion requests
router.get("/overwork/pending-conversions", authenticateToken, (req, res) => {
  try {
    if (!["hod", "registry", "principal"].includes(req.user.role)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    let rows = [];
    if (req.user.role === "hod") {
      rows = db.prepare(`
        SELECT lc.*, u.full_name, u.department, u.role, u.email
        FROM leave_conversions lc
        JOIN users u ON u.username = lc.user_username
        WHERE lc.status='pending' AND u.role='faculty' AND u.department=?
        ORDER BY lc.created_at DESC
      `).all(req.user.department);
    } else if (req.user.role === "registry") {
      rows = db.prepare(`
        SELECT lc.*, u.full_name, u.department, u.role, u.email
        FROM leave_conversions lc
        JOIN users u ON u.username = lc.user_username
        WHERE lc.status='pending' AND u.role='officestaff'
        ORDER BY lc.created_at DESC
      `).all();
    } else {
      rows = db.prepare(`
        SELECT lc.*, u.full_name, u.department, u.role, u.email
        FROM leave_conversions lc
        JOIN users u ON u.username = lc.user_username
        WHERE lc.status='pending' AND u.role IN ('hod','registry')
        ORDER BY lc.created_at DESC
      `).all();
    }

    res.json(rows);
  } catch (e) {
    console.error("overwork/pending-conversions error:", e);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Approve conversion
router.post("/overwork/approve-conversion/:id", authenticateToken, async (req, res) => {
  try {
    if (!["hod", "registry", "principal"].includes(req.user.role)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const id = Number(req.params.id);
    const { comments } = req.body || {};
    const row = db.prepare(`
      SELECT lc.*, u.role as user_role, u.department, u.email, u.full_name, u.earned_leave_left
      FROM leave_conversions lc
      JOIN users u ON u.username = lc.user_username
      WHERE lc.id=? AND lc.status='pending'
    `).get(id);

    if (!row) return res.status(404).json({ message: "Pending conversion not found" });

    // Scope checks
    if (req.user.role === "hod" && !(row.user_role === "faculty" && row.department === req.user.department)) {
      return res.status(403).json({ message: "Not allowed for this request" });
    }
    if (req.user.role === "registry" && row.user_role !== "officestaff") {
      return res.status(403).json({ message: "Not allowed for this request" });
    }
    if (req.user.role === "principal" && !["hod", "registry"].includes(row.user_role)) {
      return res.status(403).json({ message: "Not allowed for this request" });
    }

    const tx = db.transaction(() => {
      db.prepare(`
        UPDATE leave_conversions
        SET status='approved', approver_username=?, approver_comments=?
        WHERE id=?
      `).run(req.user.username, comments || null, id);

      db.prepare(`
        UPDATE users
        SET earned_leave_left = COALESCE(earned_leave_left,0) + ?
        WHERE username = ?
      `).run(row.earned_days, row.user_username);
    });
    tx();

    const updated = db.prepare(`SELECT earned_leave_left FROM users WHERE username=?`).get(row.user_username);
    await sendCompensationNotification({
      hours: row.hours_used,
      earned_leaves: row.earned_days,
      updated_earned_leave_left: updated?.earned_leave_left
    }, "approved", comments || "", row.email);

    res.json({ message: "Compensation approved", earned_days_added: row.earned_days });
  } catch (e) {
    console.error("overwork/approve-conversion error:", e);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Reject conversion
router.post("/overwork/reject-conversion/:id", authenticateToken, async (req, res) => {
  try {
    if (!["hod", "registry", "principal"].includes(req.user.role)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const id = Number(req.params.id);
    const { comments } = req.body || {};
    if (!comments || !String(comments).trim()) {
      return res.status(400).json({ message: "Rejection reason required" });
    }

    const row = db.prepare(`
      SELECT lc.*, u.role as user_role, u.department, u.email
      FROM leave_conversions lc
      JOIN users u ON u.username = lc.user_username
      WHERE lc.id=? AND lc.status='pending'
    `).get(id);

    if (!row) return res.status(404).json({ message: "Pending conversion not found" });

    if (req.user.role === "hod" && !(row.user_role === "faculty" && row.department === req.user.department)) {
      return res.status(403).json({ message: "Not allowed for this request" });
    }
    if (req.user.role === "registry" && row.user_role !== "officestaff") {
      return res.status(403).json({ message: "Not allowed for this request" });
    }
    if (req.user.role === "principal" && !["hod", "registry"].includes(row.user_role)) {
      return res.status(403).json({ message: "Not allowed for this request" });
    }

    db.prepare(`
      UPDATE leave_conversions
      SET status='rejected', approver_username=?, approver_comments=?
      WHERE id=?
    `).run(req.user.username, comments, id);

    await sendCompensationNotification({
      hours: row.hours_used,
      earned_leaves: row.earned_days
    }, "rejected", comments, row.email);

    res.json({ message: "Compensation rejected" });
  } catch (e) {
    console.error("overwork/reject-conversion error:", e);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Auto convert helper endpoint (optional trigger)
router.post("/overwork/auto-convert", authenticateToken, (req, res) => {
  try {
    if (!eligible(req.user.role)) return res.status(403).json({ message: "Not allowed" });

    const approvedHours = db.prepare(`
      SELECT COALESCE(SUM(hours),0) as h
      FROM extra_work_days
      WHERE user_username = ? AND status IN ('approved', 'converted')
    `).get(req.user.username).h;

    const convertedHours = db.prepare(`
      SELECT COALESCE(SUM(hours_used),0) as h
      FROM leave_conversions
      WHERE user_username = ? AND status IN ('approved', 'converted')
    `).get(req.user.username).h;

    const pendingHours = Math.max(0, Number(approvedHours) - Number(convertedHours));
    if (pendingHours < CONVERSION_HOURS_PER_LEAVE) {
      return res.status(400).json({ message: "Not enough pending hours to auto-convert" });
    }

    const units = Math.floor(pendingHours / CONVERSION_HOURS_PER_LEAVE);
    const hoursUsed = units * CONVERSION_HOURS_PER_LEAVE;
    const earnedDays = units; // 1 leave per unit

    const tx = db.transaction(() => {
      db.prepare(`
        INSERT INTO leave_conversions (user_username, hours_used, earned_days, status, approver_username, approver_comments)
        VALUES (?, ?, ?, 'approved', 'system', 'Auto conversion')
      `).run(req.user.username, hoursUsed, earnedDays);

      db.prepare(`
        UPDATE users
        SET earned_leave_left = COALESCE(earned_leave_left,0) + ?
        WHERE username = ?
      `).run(earnedDays, req.user.username);
    });
    tx();

    res.json({ message: "Auto-conversion done", hours_used: hoursUsed, earned_days: earnedDays });
  } catch (e) {
    console.error("overwork/auto-convert error:", e);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;