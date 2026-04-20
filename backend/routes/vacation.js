const express = require("express");
const { db } = require("../database/init");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");
const { CONVERSION_HOURS_PER_LEAVE } = require("../config/constants");

const router = express.Router();

function ensureVacationEligible(role) {
  return ["faculty", "hod", "registry", "officestaff"].includes(role);
}

function daysBetweenInclusive(start, end) {
  const d = db.prepare(`SELECT (julianday(?) - julianday(?) + 1) as d`).get(end, start).d;
  return Number(d || 0);
}

function getActivePeriod(vacationType) {
  return db.prepare(`
    SELECT *
    FROM summer_winter_vacation
    WHERE vacation_type = ? AND is_active = 1
    ORDER BY id DESC
    LIMIT 1
  `).get(vacationType);
}

function getQuota(vacationType) {
  if (vacationType === "Summer Vacation") return 27;
  if (vacationType === "Winter Vacation") return 21;
  return 0;
}

// GET /api/vacation/summer-winter/current
router.get("/vacation/summer-winter/current", authenticateToken, (req, res) => {
  try {
    if (!ensureVacationEligible(req.user.role)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const summer = getActivePeriod("Summer Vacation");
    const winter = getActivePeriod("Winter Vacation");

    res.json({ summer: summer || null, winter: winter || null });
  } catch (e) {
    console.error("vacation/summer-winter/current error:", e);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// GET /api/vacation/my-remaining
router.get("/vacation/my-remaining", authenticateToken, (req, res) => {
  try {
    if (!ensureVacationEligible(req.user.role)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const summer = getActivePeriod("Summer Vacation");
    const winter = getActivePeriod("Winter Vacation");

    function getUsedDays(period, type) {
      if (!period) return 0;
      const row = db.prepare(`
        SELECT COALESCE(SUM(duration_days), 0) as used
        FROM leave_requests
        WHERE user_username = ?
          AND leave_category = 'vacation'
          AND special_leave_type = ?
          AND status = 'Approved'
          AND start_date >= ?
          AND end_date <= ?
      `).get(req.user.username, type, period.start_date, period.end_date);
      return Number(row.used || 0);
    }

    const summerUsed = getUsedDays(summer, "Summer Vacation");
    const winterUsed = getUsedDays(winter, "Winter Vacation");

    const summerQuota = 27;
    const winterQuota = 21;

    res.json({
      summer: {
        period: summer || null,
        quota: summerQuota,
        used: summerUsed,
        remaining: Math.max(0, summerQuota - summerUsed)
      },
      winter: {
        period: winter || null,
        quota: winterQuota,
        used: winterUsed,
        remaining: Math.max(0, winterQuota - winterUsed)
      }
    });
  } catch (e) {
    console.error("vacation/my-remaining error:", e);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// POST /api/vacation/request
// body: { start_date, end_date, reason, vacation_type: 'Summer Vacation' | 'Winter Vacation' }
router.post("/vacation/request", authenticateToken, (req, res) => {
  try {
    if (!ensureVacationEligible(req.user.role)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const { start_date, end_date, reason, vacation_type } = req.body || {};
    if (!start_date || !end_date || !vacation_type) {
      return res.status(400).json({ message: "start_date, end_date and vacation_type are required" });
    }

    if (!["Summer Vacation", "Winter Vacation"].includes(vacation_type)) {
      return res.status(400).json({ message: "vacation_type must be Summer Vacation or Winter Vacation" });
    }

    const period = getActivePeriod(vacation_type);
    if (!period) {
      return res.status(400).json({ message: `No active period for ${vacation_type}` });
    }

    if (start_date < period.start_date || end_date > period.end_date) {
      return res.status(400).json({ message: "Vacation request must be within active 40-day period" });
    }

    const requestedDays = daysBetweenInclusive(start_date, end_date);
    if (requestedDays <= 0) {
      return res.status(400).json({ message: "Invalid date range" });
    }

    const quota = getQuota(vacation_type);

    const usedRow = db.prepare(`
      SELECT COALESCE(SUM(duration_days), 0) as used
      FROM leave_requests
      WHERE user_username = ?
        AND leave_category = 'vacation'
        AND special_leave_type = ?
        AND status = 'Approved'
        AND start_date >= ?
        AND end_date <= ?
    `).get(req.user.username, vacation_type, period.start_date, period.end_date);

    const used = Number(usedRow.used || 0);
    const remaining = quota - used;

    if (requestedDays > remaining) {
      return res.status(400).json({
        message: `Insufficient quota. Remaining ${vacation_type} days: ${remaining}`
      });
    }

    // Auto-approved vacation
    db.prepare(`
      INSERT INTO leave_requests (
        user_username, start_date, end_date, duration_days, reason,
        status, leave_type, leave_category, special_leave_type,
        approved_at, final_approver, admin_comments, created_at
      )
      VALUES (?, ?, ?, ?, ?, 'Approved', 'full_day', 'vacation', ?, CURRENT_TIMESTAMP, 'Vacation Auto-Approval', 'Auto-approved vacation leave', CURRENT_TIMESTAMP)
    `).run(
      req.user.username,
      start_date,
      end_date,
      requestedDays,
      reason || `${vacation_type} leave`,
      vacation_type
    );

    res.status(201).json({
      message: "Vacation leave submitted and auto-approved",
      vacation_type,
      requested_days: requestedDays,
      remaining_after: remaining - requestedDays
    });
  } catch (e) {
    console.error("vacation/request error:", e);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// GET /api/vacation/my-history
router.get("/vacation/my-history", authenticateToken, (req, res) => {
  try {
    if (!ensureVacationEligible(req.user.role)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const rows = db.prepare(`
      SELECT id, start_date, end_date, duration_days, reason, status, approved_at, special_leave_type, created_at
      FROM leave_requests
      WHERE user_username = ?
        AND leave_category = 'vacation'
      ORDER BY created_at DESC
    `).all(req.user.username);

    res.json(rows);
  } catch (e) {
    console.error("vacation/my-history error:", e);
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

// POST /api/vacation/calculate/:periodId (Head Clerk only)
// Formula: earned_leaves = remaining_days / CONVERSION_HOURS_PER_LEAVE
router.post("/vacation/calculate/:periodId", authenticateToken, authorizeRoles("headclerk"), (req, res) => {
  try {
    const periodId = Number(req.params.periodId);
    const period = db.prepare(`
      SELECT * FROM summer_winter_vacation WHERE id = ?
    `).get(periodId);

    if (!period) return res.status(404).json({ message: "Vacation period not found" });

    const vacationType = period.vacation_type;
    const quota = getQuota(vacationType);

    const employees = db.prepare(`
      SELECT username, role
      FROM users
      WHERE role IN ('faculty', 'hod', 'registry', 'officestaff')
    `).all();

    const tx = db.transaction(() => {
      for (const emp of employees) {
        const used = Number(
          db.prepare(`
            SELECT COALESCE(SUM(duration_days), 0) as used
            FROM leave_requests
            WHERE user_username = ?
              AND leave_category = 'vacation'
              AND special_leave_type = ?
              AND status = 'Approved'
              AND start_date >= ?
              AND end_date <= ?
          `).get(emp.username, vacationType, period.start_date, period.end_date).used || 0
        );

        const remaining = Math.max(0, quota - used);
        const earnedLeaves = Number((remaining / CONVERSION_HOURS_PER_LEAVE).toFixed(3));

        db.prepare(`
          INSERT INTO faculty_vacation_calculation (
            faculty_id, period_id, vacation_type, quota_days, used_days, remaining_days, earned_leaves, calculated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `).run(emp.username, periodId, vacationType, quota, used, remaining, earnedLeaves);

        db.prepare(`
          UPDATE users
          SET earned_leave_total = COALESCE(earned_leave_total, 0) + ?,
              earned_leave_left = COALESCE(earned_leave_left, 0) + ?,
              summer_vacation_earned = CASE WHEN ?='Summer Vacation' THEN COALESCE(summer_vacation_earned,0) + ? ELSE COALESCE(summer_vacation_earned,0) END,
              winter_vacation_earned = CASE WHEN ?='Winter Vacation' THEN COALESCE(winter_vacation_earned,0) + ? ELSE COALESCE(winter_vacation_earned,0) END,
              total_vacation_earned = COALESCE(total_vacation_earned,0) + ?
          WHERE username = ?
        `).run(
          earnedLeaves, earnedLeaves,
          vacationType, earnedLeaves,
          vacationType, earnedLeaves,
          earnedLeaves,
          emp.username
        );
      }
    });

    tx();

    res.json({
      message: "Vacation calculation completed successfully",
      period_id: periodId,
      vacation_type: vacationType,
      conversion_hours_per_leave: CONVERSION_HOURS_PER_LEAVE
    });
  } catch (e) {
    console.error("vacation/calculate/:periodId error:", e);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;