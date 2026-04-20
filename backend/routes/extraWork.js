const express = require("express");
const { db } = require("../database/init");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// POST /api/extra-work
router.post("/extra-work", authenticateToken, (req, res) => {
  const { work_date, reason, work_type = "holiday", hours_worked = 8.0 } = req.body;

  if (!work_date || !reason) {
    return res.status(400).json({ message: "work_date and reason are required" });
  }

  const result = db.prepare(`
    INSERT INTO extra_work_days (
      user_username, work_date, reason, work_type, hours_worked, status
    ) VALUES (?, ?, ?, ?, ?, 'pending')
  `).run(req.user.username, work_date, reason, work_type, Number(hours_worked || 8.0));

  // Auto conversion logic (simple): every 5h -> +1 earned leave, pending_overwork reset remainder
  const user = db.prepare("SELECT * FROM users WHERE username = ?").get(req.user.username);
  const newPending = Number(user.pending_overwork_hours || 0) + Number(hours_worked || 0);
  const earnedFromThis = Math.floor(newPending / 5);
  const remainder = newPending % 5;

  if (earnedFromThis > 0) {
    db.prepare(`
      UPDATE users
      SET 
        earned_leave_total = earned_leave_total + ?,
        earned_leave_left = earned_leave_left + ?,
        overwork_hours = overwork_hours + ?,
        pending_overwork_hours = ?
      WHERE username = ?
    `).run(earnedFromThis, earnedFromThis, Number(hours_worked || 0), remainder, req.user.username);
  } else {
    db.prepare(`
      UPDATE users
      SET
        overwork_hours = overwork_hours + ?,
        pending_overwork_hours = ?
      WHERE username = ?
    `).run(Number(hours_worked || 0), newPending, req.user.username);
  }

  res.status(201).json({
    message: "Extra work submitted successfully",
    id: result.lastInsertRowid,
    autoEarnedLeaves: earnedFromThis
  });
});

// GET /api/extra-work
router.get("/extra-work", authenticateToken, (req, res) => {
  const rows = db.prepare(`
    SELECT * FROM extra_work_days
    WHERE user_username = ?
    ORDER BY created_at DESC
  `).all(req.user.username);

  res.json(rows);
});

// POST /api/leave-conversion
router.post("/leave-conversion", authenticateToken, (req, res) => {
  const { extra_work_day_id, leave_request_id, comments } = req.body;
  if (!extra_work_day_id || !leave_request_id) {
    return res.status(400).json({ message: "extra_work_day_id and leave_request_id are required" });
  }

  const extra = db.prepare(`
    SELECT * FROM extra_work_days
    WHERE id = ? AND user_username = ?
  `).get(extra_work_day_id, req.user.username);

  if (!extra) return res.status(404).json({ message: "Extra work day not found" });

  const leave = db.prepare(`
    SELECT * FROM leave_requests
    WHERE id = ? AND user_username = ?
  `).get(leave_request_id, req.user.username);

  if (!leave) return res.status(404).json({ message: "Leave request not found" });

  const result = db.prepare(`
    INSERT INTO leave_conversions (
      extra_work_day_id, leave_request_id, status, comments
    ) VALUES (?, ?, 'pending', ?)
  `).run(extra_work_day_id, leave_request_id, comments || null);

  res.status(201).json({
    message: "Leave conversion request submitted",
    conversionId: result.lastInsertRowid
  });
});

module.exports = router;