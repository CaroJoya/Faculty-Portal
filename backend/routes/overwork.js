const express = require("express");
const path = require("path");
const { db } = require("../database/init");
const { authenticateToken } = require("../middleware/auth");
const { uploader } = require("../utils/fileUpload");
const { CONVERSION_HOURS_PER_LEAVE } = require("../config/constants");

const router = express.Router();

function eligible(role) {
  return ["faculty", "hod", "registry", "officestaff"].includes(role);
}

function getPendingHours(username) {
  const totalRow = db.prepare(`
    SELECT COALESCE(SUM(COALESCE(hours, hours_worked, 0)), 0) as total_hours
    FROM extra_work_days
    WHERE user_username = ?
      AND status IN ('approved', 'converted', 'pending')
  `).get(username);

  const usedRow = db.prepare(`
    SELECT COALESCE(SUM(COALESCE(hours_used, 0)), 0) as used_hours
    FROM leave_conversions
    WHERE (user_username = ? OR user_username IS NULL)
      AND status IN ('converted', 'approved')
  `).get(username);

  const total = Number(totalRow.total_hours || 0);
  const used = Number(usedRow.used_hours || 0);
  return Math.max(0, total - used);
}

function autoConvertIfEligible(username) {
  const pending = getPendingHours(username);

  if (pending < CONVERSION_HOURS_PER_LEAVE) {
    return { converted: false, pending_hours: pending };
  }

  const units = Math.floor(pending / CONVERSION_HOURS_PER_LEAVE);
  const hoursUsed = units * CONVERSION_HOURS_PER_LEAVE;
  const earnedDays = units;

  const tx = db.transaction(() => {
    db.prepare(`
      INSERT INTO leave_conversions (
        user_username, hours_used, earned_days, status, approver_username, approver_comments, created_at
      )
      VALUES (?, ?, ?, 'converted', 'system', 'Auto conversion', CURRENT_TIMESTAMP)
    `).run(username, hoursUsed, earnedDays);

    db.prepare(`
      UPDATE users
      SET
        earned_leave_total = COALESCE(earned_leave_total, 0) + ?,
        earned_leave_left = COALESCE(earned_leave_left, 0) + ?,
        pending_overwork_hours = MAX(0, COALESCE(pending_overwork_hours, 0) - ?)
      WHERE username = ?
    `).run(earnedDays, earnedDays, hoursUsed, username);
  });
  tx();

  return {
    converted: true,
    units,
    hours_used: hoursUsed,
    earned_days: earnedDays,
    pending_hours_after: getPendingHours(username)
  };
}

// POST /api/overwork/add
router.post("/overwork/add", authenticateToken, uploader.single("attachment"), (req, res) => {
  try {
    if (!eligible(req.user.role)) return res.status(403).json({ message: "Not allowed" });

    const { work_date, hours, reason } = req.body || {};
    if (!work_date || !hours || !reason) {
      return res.status(400).json({ message: "work_date, hours, reason are required" });
    }

    const h = Number(hours);
    if (h <= 0) return res.status(400).json({ message: "hours must be greater than 0" });

    const attachmentPath = req.file
      ? req.file.path.split(path.join(__dirname, ".."))[1].replace(/\\/g, "/")
      : null;

    db.prepare(`
      INSERT INTO extra_work_days (
        user_username, work_date, reason, hours_worked, hours, attachment_path, status, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, 'approved', CURRENT_TIMESTAMP)
    `).run(req.user.username, work_date, reason, h, h, attachmentPath);

    db.prepare(`
      UPDATE users
      SET
        overwork_hours = COALESCE(overwork_hours, 0) + ?,
        pending_overwork_hours = COALESCE(pending_overwork_hours, 0) + ?
      WHERE username = ?
    `).run(h, h, req.user.username);

    const autoResult = autoConvertIfEligible(req.user.username);

    res.status(201).json({
      message: "Overwork entry added successfully",
      conversion_hours_per_leave: CONVERSION_HOURS_PER_LEAVE,
      auto_conversion: autoResult
    });
  } catch (e) {
    console.error("overwork/add error:", e);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// GET /api/overwork/my-history
router.get("/overwork/my-history", authenticateToken, (req, res) => {
  try {
    if (!eligible(req.user.role)) return res.status(403).json({ message: "Not allowed" });

    const history = db.prepare(`
      SELECT *
      FROM extra_work_days
      WHERE user_username = ?
      ORDER BY created_at DESC
    `).all(req.user.username);

    const conversions = db.prepare(`
      SELECT *
      FROM leave_conversions
      WHERE user_username = ?
      ORDER BY created_at DESC
    `).all(req.user.username);

    const pending = getPendingHours(req.user.username);
    const progress = Number(((pending / CONVERSION_HOURS_PER_LEAVE) * 100).toFixed(2));

    res.json({
      conversion_hours_per_leave: CONVERSION_HOURS_PER_LEAVE,
      pending_hours: pending,
      progress_to_next_leave_percent: Math.min(progress, 100),
      history,
      conversions
    });
  } catch (e) {
    console.error("overwork/my-history error:", e);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// POST /api/overwork/convert (manual conversion)
router.post("/overwork/convert", authenticateToken, (req, res) => {
  try {
    if (!eligible(req.user.role)) return res.status(403).json({ message: "Not allowed" });

    const pending = getPendingHours(req.user.username);
    if (pending < CONVERSION_HOURS_PER_LEAVE) {
      return res.status(400).json({ message: `Need at least ${CONVERSION_HOURS_PER_LEAVE} pending hours` });
    }

    const units = Math.floor(pending / CONVERSION_HOURS_PER_LEAVE);
    const hoursUsed = units * CONVERSION_HOURS_PER_LEAVE;
    const earnedDays = units;

    const tx = db.transaction(() => {
      db.prepare(`
        INSERT INTO leave_conversions (
          user_username, hours_used, earned_days, status, approver_username, approver_comments, created_at
        )
        VALUES (?, ?, ?, 'converted', 'manual', 'Manual conversion', CURRENT_TIMESTAMP)
      `).run(req.user.username, hoursUsed, earnedDays);

      db.prepare(`
        UPDATE users
        SET
          earned_leave_total = COALESCE(earned_leave_total, 0) + ?,
          earned_leave_left = COALESCE(earned_leave_left, 0) + ?,
          pending_overwork_hours = MAX(0, COALESCE(pending_overwork_hours, 0) - ?)
        WHERE username = ?
      `).run(earnedDays, earnedDays, hoursUsed, req.user.username);
    });
    tx();

    res.json({
      message: "Manual conversion completed",
      hours_used: hoursUsed,
      earned_days: earnedDays,
      pending_hours_after: getPendingHours(req.user.username)
    });
  } catch (e) {
    console.error("overwork/convert error:", e);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;