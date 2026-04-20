const express = require("express");
const multer = require("multer");
const path = require("path");
const { db } = require("../database/init");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "..", "uploads"));
  },
  filename: function (req, file, cb) {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}-${file.originalname}`);
  }
});

const upload = multer({ storage });

function calculateLeaveDays(start, end, leaveType) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const msInDay = 1000 * 60 * 60 * 24;
  const diffDays = Math.floor((endDate - startDate) / msInDay) + 1;
  if (leaveType === "half_day") return 0.5;
  return diffDays > 0 ? diffDays : 0;
}

// POST /api/leave-requests
router.post(
  "/leave-requests",
  authenticateToken,
  authorizeRoles("faculty", "hod", "officestaff", "registry"),
  upload.single("attachment"),
  (req, res) => {
    const {
      start_date,
      end_date,
      reason,
      leave_type = "full_day",
      leave_category = "casual",
      special_leave_type = "regular"
    } = req.body;

    if (!start_date || !end_date || !reason) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const attachment_path = req.file ? `/uploads/${req.file.filename}` : null;

    const insert = db.prepare(`
      INSERT INTO leave_requests (
        user_username, start_date, end_date, reason, status, leave_type, leave_category,
        special_leave_type, attachment_path
      )
      VALUES (?, ?, ?, ?, 'Pending', ?, ?, ?, ?)
    `);

    const result = insert.run(
      req.user.username,
      start_date,
      end_date,
      reason,
      leave_type,
      leave_category,
      special_leave_type,
      attachment_path
    );

    res.status(201).json({
      message: "Leave request submitted successfully",
      leaveRequestId: result.lastInsertRowid
    });
  }
);

// GET /api/leave-requests
router.get("/leave-requests", authenticateToken, (req, res) => {
  const rows = db.prepare(`
    SELECT * FROM leave_requests
    WHERE user_username = ?
    ORDER BY created_at DESC
  `).all(req.user.username);

  res.json(rows);
});

// GET /api/leave-requests/status
router.get("/leave-requests/status", authenticateToken, (req, res) => {
  const pending = db.prepare(`
    SELECT COUNT(*) as count FROM leave_requests
    WHERE user_username = ? AND status = 'Pending'
  `).get(req.user.username).count;

  const approved = db.prepare(`
    SELECT COUNT(*) as count FROM leave_requests
    WHERE user_username = ? AND status = 'Approved'
  `).get(req.user.username).count;

  const rejected = db.prepare(`
    SELECT COUNT(*) as count FROM leave_requests
    WHERE user_username = ? AND status = 'Rejected'
  `).get(req.user.username).count;

  res.json({ pending, approved, rejected });
});

// GET /api/leave-requests/history
router.get("/leave-requests/history", authenticateToken, (req, res) => {
  const { from, to } = req.query;

  let query = `
    SELECT * FROM leave_requests
    WHERE user_username = ? AND status = 'Approved'
  `;
  const params = [req.user.username];

  if (from) {
    query += " AND start_date >= ?";
    params.push(from);
  }
  if (to) {
    query += " AND end_date <= ?";
    params.push(to);
  }

  query += " ORDER BY start_date DESC";

  const rows = db.prepare(query).all(...params);

  res.json(rows);
});

// GET /api/leave-requests/stats
router.get("/leave-requests/stats", authenticateToken, (req, res) => {
  const rows = db.prepare(`
    SELECT 
      strftime('%Y-%m', start_date) as month,
      COUNT(*) as total_requests
    FROM leave_requests
    WHERE user_username = ?
    GROUP BY strftime('%Y-%m', start_date)
    ORDER BY month ASC
  `).all(req.user.username);

  res.json(rows);
});



module.exports = router;

