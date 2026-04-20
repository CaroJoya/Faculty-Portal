const express = require("express");
const { db } = require("../database/init");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");

const router = express.Router();

function ensureVacationEligible(role) {
  return ["faculty", "hod", "registry", "officestaff"].includes(role);
}

function daysBetweenInclusive(start, end) {
  const d = db.prepare(`SELECT (julianday(?) - julianday(?) + 1) as d`).get(end, start).d;
  return Number(d || 0);
}

// GET /api/vacation/current-period
router.get("/vacation/current-period", authenticateToken, (req, res) => {
  try {
    if (!ensureVacationEligible(req.user.role)) {
      return res.status(403).json({ message: "Vacation not allowed for this role" });
    }

    const period = db.prepare(`
      SELECT *
      FROM vacation_periods
      WHERE is_active = 1
      ORDER BY id DESC
      LIMIT 1
    `).get();

    res.json({ active_period: period || null });
  } catch (e) {
    console.error("vacation/current-period error:", e);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// GET /api/vacation/my-usage
router.get("/vacation/my-usage", authenticateToken, (req, res) => {
  try {
    if (!ensureVacationEligible(req.user.role)) {
      return res.status(403).json({ message: "Vacation not allowed for this role" });
    }

    const active = db.prepare(`
      SELECT id
      FROM vacation_periods
      WHERE is_active = 1
      ORDER BY id DESC
      LIMIT 1
    `).get();

    if (!active) {
      return res.json({
        vacation_period_id: null,
        vacation_days_used: 0,
        vacation_days_remaining: 7
      });
    }

    let usage = db.prepare(`
      SELECT *
      FROM vacation_usage
      WHERE faculty_id = ? AND vacation_period_id = ?
    `).get(req.user.username, active.id);

    if (!usage) {
      db.prepare(`
        INSERT INTO vacation_usage (faculty_id, vacation_period_id, vacation_days_used, vacation_days_remaining)
        VALUES (?, ?, 0, 7)
      `).run(req.user.username, active.id);

      usage = db.prepare(`
        SELECT *
        FROM vacation_usage
        WHERE faculty_id = ? AND vacation_period_id = ?
      `).get(req.user.username, active.id);
    }

    res.json(usage);
  } catch (e) {
    console.error("vacation/my-usage error:", e);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// POST /api/vacation/request
router.post("/vacation/request", authenticateToken, (req, res) => {
  try {
    if (!ensureVacationEligible(req.user.role)) {
      return res.status(403).json({ message: "Vacation not allowed for this role" });
    }

    const { start_date, end_date, reason } = req.body || {};
    if (!start_date || !end_date) {
      return res.status(400).json({ message: "start_date and end_date are required" });
    }

    const active = db.prepare(`
      SELECT *
      FROM vacation_periods
      WHERE is_active = 1
      ORDER BY id DESC
      LIMIT 1
    `).get();

    if (!active) return res.status(400).json({ message: "No active vacation period" });

    if (start_date < active.start_date || end_date > active.end_date) {
      return res.status(400).json({ message: "Vacation request must be inside active vacation period" });
    }

    const requestedDays = daysBetweenInclusive(start_date, end_date);
    if (requestedDays <= 0) return res.status(400).json({ message: "Invalid date range" });

    let usage = db.prepare(`
      SELECT *
      FROM vacation_usage
      WHERE faculty_id = ? AND vacation_period_id = ?
    `).get(req.user.username, active.id);

    if (!usage) {
      db.prepare(`
        INSERT INTO vacation_usage (faculty_id, vacation_period_id, vacation_days_used, vacation_days_remaining)
        VALUES (?, ?, 0, 7)
      `).run(req.user.username, active.id);

      usage = db.prepare(`
        SELECT *
        FROM vacation_usage
        WHERE faculty_id = ? AND vacation_period_id = ?
      `).get(req.user.username, active.id);
    }

    if (usage.vacation_days_remaining < requestedDays) {
      return res.status(400).json({ message: "Not enough vacation days remaining" });
    }

    const tx = db.transaction(() => {
      // Auto-approved vacation leave entry in leave_requests
      db.prepare(`
        INSERT INTO leave_requests
          (user_username, start_date, end_date, duration_days, leave_type, leave_category, reason, status, approved_at, final_approver, admin_comments, created_at)
        VALUES
          (?, ?, ?, ?, 'Vacation', 'vacation', ?, 'Approved', CURRENT_TIMESTAMP, 'Vacation Auto-Approval', 'Auto-approved vacation leave', CURRENT_TIMESTAMP)
      `).run(req.user.username, start_date, end_date, requestedDays, reason || "Vacation leave");

      db.prepare(`
        UPDATE vacation_usage
        SET vacation_days_used = vacation_days_used + ?,
            vacation_days_remaining = vacation_days_remaining - ?
        WHERE faculty_id = ? AND vacation_period_id = ?
      `).run(requestedDays, requestedDays, req.user.username, active.id);
    });

    tx();

    res.json({ message: "Vacation leave submitted and auto-approved", days_used: requestedDays });
  } catch (e) {
    console.error("vacation/request error:", e);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// GET /api/vacation/my-history
router.get("/vacation/my-history", authenticateToken, (req, res) => {
  try {
    if (!ensureVacationEligible(req.user.role)) {
      return res.status(403).json({ message: "Vacation not allowed for this role" });
    }

    const rows = db.prepare(`
      SELECT id, start_date, end_date, duration_days, reason, status, approved_at, created_at
      FROM leave_requests
      WHERE user_username = ?
        AND (leave_category = 'vacation' OR leave_type = 'Vacation')
      ORDER BY created_at DESC
    `).all(req.user.username);

    res.json(rows);
  } catch (e) {
    console.error("vacation/my-history error:", e);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// GET /api/vacation/summer-winter/current
router.get("/vacation/summer-winter/current", authenticateToken, (req, res) => {
  try {
    if (!ensureVacationEligible(req.user.role)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const summer = db.prepare(`
      SELECT * FROM summer_winter_vacation
      WHERE vacation_type = 'Summer Vacation' AND is_active = 1
      ORDER BY id DESC LIMIT 1
    `).get();

    const winter = db.prepare(`
      SELECT * FROM summer_winter_vacation
      WHERE vacation_type = 'Winter Vacation' AND is_active = 1
      ORDER BY id DESC LIMIT 1
    `).get();

    res.json({ summer: summer || null, winter: winter || null });
  } catch (e) {
    console.error("vacation/summer-winter/current error:", e);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// GET /api/vacation/summer-winter/my-calculations
router.get("/vacation/summer-winter/my-calculations", authenticateToken, (req, res) => {
  try {
    if (!ensureVacationEligible(req.user.role)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const rows = db.prepare(`
      SELECT *
      FROM faculty_vacation_calculation
      WHERE faculty_id = ?
      ORDER BY id DESC
    `).all(req.user.username);

    res.json(rows);
  } catch (e) {
    console.error("vacation/summer-winter/my-calculations error:", e);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;