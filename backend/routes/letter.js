const express = require("express");
const fs = require("fs");
const path = require("path");
const { db } = require("../database/init");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

function canAccess(requestUser, row) {
  // owner can access
  if (requestUser.username === row.user_username) return true;

  // approval/admin roles can access
  if (["principal", "headclerk", "hod", "registry"].includes(requestUser.role)) return true;

  return false;
}

// GET /api/leave-letter/:requestId
// Query param: ?download=1 (optional)
router.get("/leave-letter/:requestId", authenticateToken, (req, res) => {
  try {
    const id = Number(req.params.requestId);

    const row = db.prepare(`
      SELECT lr.*, u.full_name, u.department, u.designation
      FROM leave_requests lr
      JOIN users u ON u.username = lr.user_username
      WHERE lr.id = ?
    `).get(id);

    if (!row) return res.status(404).json({ message: "Leave request not found" });
    if (row.status !== "Approved") {
      return res.status(400).json({ message: "Letter is available only for approved leave" });
    }
    if (!canAccess(req.user, row)) return res.status(403).json({ message: "Forbidden" });

    const lettersDir = path.join(__dirname, "../uploads/leave-letters");
    if (!fs.existsSync(lettersDir)) fs.mkdirSync(lettersDir, { recursive: true });

    let letterPath = row.letter_path || null;

    // Generate once and store path
    if (!letterPath) {
      const fileName = `leave_letter_${row.id}_${Date.now()}.html`;
      const absPath = path.join(lettersDir, fileName);

      const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Leave Approval Letter</title>
</head>
<body style="font-family: Arial, sans-serif; padding: 24px; line-height: 1.5;">
  <div style="border-bottom: 1px solid #ccc; padding-bottom: 12px; margin-bottom: 16px;">
    <h2 style="margin: 0;">College Leave Approval Letter</h2>
    <p style="margin: 6px 0 0 0;">(Letterhead Placeholder)</p>
  </div>

  <p><strong>Employee Name:</strong> ${row.full_name}</p>
  <p><strong>Department:</strong> ${row.department || "-"}</p>
  <p><strong>Designation:</strong> ${row.designation || "-"}</p>

  <hr />

  <p><strong>Leave Category:</strong> ${row.leave_category || "-"}</p>
  <p><strong>Special Leave Type:</strong> ${row.special_leave_type || "-"}</p>
  <p><strong>Leave Type:</strong> ${row.leave_type || "-"}</p>
  <p><strong>From:</strong> ${row.start_date}</p>
  <p><strong>To:</strong> ${row.end_date}</p>
  <p><strong>Duration (days):</strong> ${row.duration_days != null ? row.duration_days : "-"}</p>
  <p><strong>Reason:</strong> ${row.reason || "-"}</p>

  <hr />

  <p><strong>Approved By:</strong> ${row.final_approver || "Principal"}</p>
  <p><strong>Approval Date:</strong> ${row.approved_at || "-"}</p>

  <br />
  <p>Signature: __________________________</p>
</body>
</html>`;

      fs.writeFileSync(absPath, html, "utf8");
      letterPath = `/uploads/leave-letters/${fileName}`;

      const hasLetterCol = db.prepare(`PRAGMA table_info(leave_requests)`).all().some(c => c.name === "letter_path");
      if (hasLetterCol) {
        db.prepare(`UPDATE leave_requests SET letter_path = ? WHERE id = ?`).run(letterPath, row.id);
      }
    }

    if (req.query.download === "1") {
      // redirect to static file route
      return res.redirect(letterPath);
    }

    return res.json({
      request_id: row.id,
      letter_path: letterPath,
      download_url: `/api/leave-letter/${row.id}?download=1`
    });
  } catch (e) {
    console.error("leave-letter error:", e);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;