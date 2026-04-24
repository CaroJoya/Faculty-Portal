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

// Helper function to extract recommendations from reason field
function extractRecommendations(reasonText) {
  if (!reasonText) return null;
  
  const marker = "--- Recommended Alternate Faculty ---";
  const index = reasonText.indexOf(marker);
  
  if (index === -1) return null;
  
  const recsPart = reasonText.substring(index + marker.length).trim();
  if (!recsPart) return null;
  
  // Parse bullet points (• symbol)
  const lines = recsPart.split("\n");
  const recommendations = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("•")) {
      const name = trimmed.substring(1).trim();
      if (name) recommendations.push(name);
    }
  }
  
  return recommendations.length > 0 ? recommendations : null;
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

    // NEW: Extract recommendations from reason field
    const recommendations = extractRecommendations(row.reason);
    
    // Get clean reason without the recommendations section
    let cleanReason = row.reason || "-";
    const marker = "--- Recommended Alternate Faculty ---";
    const markerIndex = cleanReason.indexOf(marker);
    if (markerIndex !== -1) {
      cleanReason = cleanReason.substring(0, markerIndex).trim();
    }

    // Generate once and store path
    if (!letterPath) {
      const fileName = `leave_letter_${row.id}_${Date.now()}.html`;
      const absPath = path.join(lettersDir, fileName);

      // Build recommendations HTML section if present
      let recommendationsHtml = "";
      if (recommendations && recommendations.length > 0) {
        const recsListItems = recommendations.map(rec => `<li style="margin-bottom: 4px;">${escapeHtml(rec)}</li>`).join("");
        recommendationsHtml = `
          <hr />
          <div style="margin-top: 16px;">
            <p><strong>Recommended Alternate Faculty Arrangements:</strong></p>
            <ul style="margin-top: 8px; margin-bottom: 8px; padding-left: 20px;">
              ${recsListItems}
            </ul>
          </div>
        `;
      }

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

  <p><strong>Employee Name:</strong> ${escapeHtml(row.full_name)}</p>
  <p><strong>Department:</strong> ${escapeHtml(row.department || "-")}</p>
  <p><strong>Designation:</strong> ${escapeHtml(row.designation || "-")}</p>

  <hr />

  <p><strong>Leave Category:</strong> ${escapeHtml(row.leave_category || "-")}</p>
  <p><strong>Special Leave Type:</strong> ${escapeHtml(row.special_leave_type || "-")}</p>
  <p><strong>Leave Type:</strong> ${escapeHtml(row.leave_type || "-")}</p>
  <p><strong>From:</strong> ${escapeHtml(row.start_date)}</p>
  <p><strong>To:</strong> ${escapeHtml(row.end_date)}</p>
  <p><strong>Duration (days):</strong> ${row.duration_days != null ? row.duration_days : "-"}</p>
  <p><strong>Reason:</strong> ${escapeHtml(cleanReason)}</p>

  ${recommendationsHtml}

  <hr />

  <p><strong>Approved By:</strong> ${escapeHtml(row.final_approver || "Principal")}</p>
  <p><strong>Approval Date:</strong> ${escapeHtml(row.approved_at || "-")}</p>

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

// Helper function to escape HTML special characters
function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

module.exports = router;