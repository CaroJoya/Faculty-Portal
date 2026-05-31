const express = require("express");
const { db } = require("../database/init");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");
const { uploader } = require("../utils/fileUpload");
const { sendNewLeaveRequest } = require("../utils/emailService");

const router = express.Router();

const ALLOWED_LEAVE_TYPES = new Set(["full_day", "half_day"]);

function isValidDate(value) {
  return Boolean(value) && !Number.isNaN(Date.parse(value));
}

function calculateLeaveDays(start, end, leaveType) {
  if (leaveType === "half_day") return 0.5;
  const d = db.prepare(`SELECT (julianday(?) - julianday(?) + 1) AS d`).get(end, start).d;
  return Number(d || 0);
}

// GET /api/leave-requests (current user only)
router.get(
  "/leave-requests",
  authenticateToken,
  authorizeRoles("faculty", "hod", "officestaff", "registry"),
  (req, res) => {
    try {
      const rows = db.prepare(`
        SELECT *
        FROM leave_requests
        WHERE user_username = ?
        ORDER BY created_at DESC
      `).all(req.user.username);

      res.json(rows);
    } catch (e) {
      console.error("leave-requests GET error:", e);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

// GET /api/leave-requests/status (current user only)
router.get(
  "/leave-requests/status",
  authenticateToken,
  authorizeRoles("faculty", "hod", "officestaff", "registry"),
  (req, res) => {
    try {
      const row = db.prepare(`
        SELECT
          SUM(CASE WHEN status = 'Pending' AND cancelled_at IS NULL THEN 1 ELSE 0 END) AS pending,
          SUM(CASE WHEN status = 'Approved' AND cancelled_at IS NULL THEN 1 ELSE 0 END) AS approved,
          SUM(CASE WHEN status = 'Rejected' AND cancelled_at IS NULL THEN 1 ELSE 0 END) AS rejected
        FROM leave_requests
        WHERE user_username = ?
      `).get(req.user.username);

      res.json({
        pending: Number(row?.pending || 0),
        approved: Number(row?.approved || 0),
        rejected: Number(row?.rejected || 0)
      });
    } catch (e) {
      console.error("leave-requests/status GET error:", e);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

// POST /api/leave-requests
router.post(
  "/leave-requests",
  authenticateToken,
  authorizeRoles("faculty", "hod", "officestaff", "registry"),
  uploader.single("attachment"),
  (req, res) => {
    try {
      let {
        start_date,
        end_date: raw_end_date,
        reason,
        leave_type = "full_day",
        leave_category = "casual",
        special_leave_type = "regular"
      } = req.body;

      start_date = String(start_date || "").trim();
      raw_end_date = String(raw_end_date || "").trim();
      leave_type = String(leave_type || "").trim();
      leave_category = String(leave_category || "").trim();
      special_leave_type = String(special_leave_type || "").trim();
      reason = String(reason || "").trim();

      if (!start_date || !reason) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      if (!ALLOWED_LEAVE_TYPES.has(leave_type)) {
        return res.status(400).json({ message: "Invalid leave type" });
      }

      const end_date = leave_type === "half_day" ? start_date : raw_end_date;
      if (!end_date) {
        return res.status(400).json({ message: "End date is required" });
      }

      if (!isValidDate(start_date) || !isValidDate(end_date)) {
        return res.status(400).json({ message: "Invalid date format" });
      }

      const duration_days = calculateLeaveDays(start_date, end_date, leave_type);
      if (duration_days <= 0) {
        return res.status(400).json({ message: "Invalid date range" });
      }

      if (reason.length > 2000) {
        return res.status(400).json({ message: "Reason is too long" });
      }

      const attachment_path = req.file ? `/uploads/${req.file.filename}` : null;

      if ((special_leave_type || "").toLowerCase() === "od" && !attachment_path) {
        return res.status(400).json({ message: "OD letter upload is required for OD leave request" });
      }

      let finalReason = reason;
      const userRole = req.user.role;
      if (userRole === "faculty" && req.body.recommendations) {
        try {
          const recommendations = JSON.parse(req.body.recommendations);
          if (Array.isArray(recommendations) && recommendations.length > 0) {
            const validRecs = recommendations
              .filter(r => r && typeof r === "string" && r.trim() !== "")
              .map(r => r.trim().slice(0, 100))
              .slice(0, 3);
            if (validRecs.length > 0) {
              const recsText = validRecs.map(r => `• ${r}`).join("\n");
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

      const leaveRequestId = result.lastInsertRowid;
      const responseMessage = {
        message: "Leave request submitted successfully",
        leaveRequestId: leaveRequestId,
        duration_days
      };

      // SEND RESPONSE IMMEDIATELY - Email happens in background with proper error logging
      res.status(201).json(responseMessage);

      // --- BACKGROUND EMAIL NOTIFICATION (does NOT block response) ---
      (async () => {
        try {
          const leaveRow = db.prepare("SELECT * FROM leave_requests WHERE id = ?").get(leaveRequestId);
          const requester = db.prepare("SELECT username, full_name, email, department, role FROM users WHERE username = ?").get(req.user.username);

          if (requester && leaveRow) {
            console.log(`[Leave Request] Sending notifications for request ${leaveRequestId} from ${requester.username} (${requester.role})`);
            
            if (requester.role === "faculty") {
              // find HOD for this department
              let hod = db.prepare("SELECT username, full_name, email, managed_department FROM users WHERE is_hod = 1 AND managed_department = ? LIMIT 1").get(requester.department);
              if (!hod) {
                // fallback to any hod with the same department
                hod = db.prepare("SELECT username, full_name, email, department FROM users WHERE role = 'hod' AND department = ? LIMIT 1").get(requester.department);
              }
              if (hod && hod.email) {
                const reviewLink = `${process.env.FRONTEND_URL || "http://localhost:5173"}/hod-admin/faculty-requests/${leaveRequestId}`;
                const emailSent = await sendNewLeaveRequest(requester, leaveRow, hod, reviewLink);
                console.log(`[Leave Request] Email to HOD (${hod.email}): ${emailSent ? 'SUCCESS' : 'FAILED'}`);
              } else {
                console.log(`[Leave Request] No HOD found for department: ${requester.department}`);
              }
            } else if (requester.role === "officestaff") {
              // notify registry
              const registry = db.prepare("SELECT username, full_name, email FROM users WHERE is_registry = 1 LIMIT 1").get();
              if (registry && registry.email) {
                const reviewLink = `${process.env.FRONTEND_URL || "http://localhost:5173"}/registry-admin/staff-requests/${leaveRequestId}`;
                const emailSent = await sendNewLeaveRequest(requester, leaveRow, registry, reviewLink);
                console.log(`[Leave Request] Email to Registry (${registry.email}): ${emailSent ? 'SUCCESS' : 'FAILED'}`);
              } else {
                console.log(`[Leave Request] No Registry found`);
              }
            } else if (requester.role === "hod") {
              // HOD requests go directly to principal
              const principal = db.prepare("SELECT username, full_name, email FROM users WHERE is_principal = 1 LIMIT 1").get();
              if (principal && principal.email) {
                const reviewLink = `${process.env.FRONTEND_URL || "http://localhost:5173"}/principal/all-pending`;
                const emailSent = await sendNewLeaveRequest(requester, leaveRow, principal, reviewLink);
                console.log(`[Leave Request] Email to Principal (${principal.email}): ${emailSent ? 'SUCCESS' : 'FAILED'}`);
              }
            } else {
              console.log(`[Leave Request] Role ${requester.role} does not require email notification`);
            }
          }
        } catch (e) {
          console.error("[Leave Request] Background email notification error:", e);
        }
      })(); // Immediately invoked async function

    } catch (e) {
      console.error("leave-requests POST error:", e);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

// DELETE /api/leave-requests/:id - Cancel a pending leave request
router.delete(
  "/leave-requests/:id",
  authenticateToken,
  authorizeRoles("faculty", "hod", "officestaff", "registry"),
  (req, res) => {
    try {
      const leaveId = parseInt(req.params.id, 10);
      if (!leaveId || leaveId <= 0) {
        return res.status(400).json({ message: "Invalid leave request ID" });
      }

      // Fetch the leave request
      const leaveRequest = db.prepare(`
        SELECT * FROM leave_requests WHERE id = ?
      `).get(leaveId);

      if (!leaveRequest) {
        return res.status(404).json({ message: "Leave request not found" });
      }

      // Check if user is the owner of the leave request
      if (leaveRequest.user_username !== req.user.username) {
        return res.status(403).json({ message: "You can only cancel your own leave requests" });
      }

      // Check if already cancelled
      if (leaveRequest.cancelled_at !== null) {
        return res.status(400).json({ message: "This leave request has already been cancelled" });
      }

      // Check if status is Pending (only allow deletion of pending requests)
      if (leaveRequest.status !== "Pending") {
        return res.status(400).json({ 
          message: `Cannot cancel ${leaveRequest.status} leave request. Only pending requests can be cancelled.` 
        });
      }

      // Mark as cancelled (soft delete)
      db.prepare(`
        UPDATE leave_requests
        SET cancelled_at = CURRENT_TIMESTAMP,
            cancelled_by = ?
        WHERE id = ?
      `).run(req.user.username, leaveId);

      res.json({ 
        message: "Leave request cancelled successfully",
        leaveRequestId: leaveId
      });

    } catch (e) {
      console.error("leave-requests DELETE error:", e);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

module.exports = router;