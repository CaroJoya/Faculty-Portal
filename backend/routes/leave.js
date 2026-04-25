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
  if (leaveType === "half_day") return 0.5;
  const d = db.prepare(`SELECT (julianday(?) - julianday(?) + 1) AS d`).get(end, start).d;
  return Number(d || 0);
}

// POST /api/leave-requests
router.post(
  "/leave-requests",
  authenticateToken,
  authorizeRoles("faculty", "hod", "officestaff", "registry"),
  upload.single("attachment"),
  (req, res) => {
    try {
      const {
        start_date,
        end_date: raw_end_date,
        reason,
        leave_type = "full_day",
        leave_category = "casual",
        special_leave_type = "regular"
      } = req.body;

      const end_date = leave_type === "half_day" ? start_date : raw_end_date;
      const duration_days = calculateLeaveDays(start_date, end_date, leave_type);

      if (!start_date || !end_date || !reason) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      if (duration_days <= 0) {
        return res.status(400).json({ message: "Invalid date range" });
      }

      const attachment_path = req.file ? `/uploads/${req.file.filename}` : null;

      if ((special_leave_type || "").toLowerCase() === "od" && !attachment_path) {
        return res.status(400).json({ message: "OD letter upload is required for OD leave request" });
      }

      let finalReason = reason;
      
      // Only faculty can have recommendations
      const userRole = req.user.role;
      if (userRole === "faculty" && req.body.recommendations) {
        try {
          const recommendations = JSON.parse(req.body.recommendations);
          if (Array.isArray(recommendations) && recommendations.length > 0) {
            const validRecs = recommendations.filter(r => r && typeof r === "string" && r.trim() !== "").slice(0, 3);
            if (validRecs.length > 0) {
              const recsText = validRecs.map(r => `• ${r.trim()}`).join("\n");
              finalReason = `${reason}\n\n--- Recommended Alternate Faculty ---\n${recsText}`;
            }
          }
        } catch (e) {
          console.error("Failed to parse recommendations:", e);
        }
      }

      const insert = db.prepare(`
        INSERT INTO leave_requests (
          user_username, start_date, end_date, duration_days, reason, status, leave_type, leave_category,
          special_leave_type, attachment_path, letter_path
        )
        VALUES (?, ?, ?, ?, ?, 'Pending', ?, ?, ?, ?, NULL)
      `);

      const result = insert.run(
        req.user.username,
        start_date,
        end_date,
        duration_days,
        finalReason,
        leave_type,
        leave_category,
        special_leave_type,
        attachment_path
      );

      res.status(201).json({
        message: "Leave request submitted successfully",
        leaveRequestId: result.lastInsertRowid,
        duration_days
      });
    } catch (e) {
      console.error("leave-requests POST error:", e);
      return res.status(500).json({ message: "Internal Server Error" });
    }
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