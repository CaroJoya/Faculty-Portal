const express = require("express");
const { db } = require("../database/init");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");

const router = express.Router();

function ensurePrincipal(req, res) {
  const u = db.prepare("SELECT username, role FROM users WHERE username = ?").get(req.user.username);
  if (!u || u.role !== "principal") {
    res.status(403).json({ message: "Only Principal can access this endpoint" });
    return null;
  }
  return u;
}

function parseDays(reqRow) {
  if (reqRow.duration_days != null) return Number(reqRow.duration_days);
  if (reqRow.start_date && reqRow.end_date) {
    const d = db.prepare(`SELECT (julianday(?) - julianday(?) + 1) AS d`).get(reqRow.end_date, reqRow.start_date).d;
    return Math.max(0.5, Number(d || 1));
  }
  return 1;
}

function deductLeaveBalance(username, category, days) {
  if (!["medical", "casual", "earned"].includes((category || "").toLowerCase())) return;

  const user = db.prepare(`
    SELECT username, medical_leave_left, casual_leave_left, earned_leave_left,
           medical_leave_used, casual_leave_used, earned_leave_used
    FROM users WHERE username = ?
  `).get(username);
  if (!user) throw new Error("User not found for balance deduction");

  const d = Number(days || 0);
  if (category === "medical") {
    db.prepare(`
      UPDATE users
      SET medical_leave_left = MAX(0, COALESCE(medical_leave_left,0) - ?),
          medical_leave_used = COALESCE(medical_leave_used,0) + ?
      WHERE username = ?
    `).run(d, d, username);
  } else if (category === "casual") {
    db.prepare(`
      UPDATE users
      SET casual_leave_left = MAX(0, COALESCE(casual_leave_left,0) - ?),
          casual_leave_used = COALESCE(casual_leave_used,0) + ?
      WHERE username = ?
    `).run(d, d, username);
  } else if (category === "earned") {
    db.prepare(`
      UPDATE users
      SET earned_leave_left = MAX(0, COALESCE(earned_leave_left,0) - ?),
          earned_leave_used = COALESCE(earned_leave_used,0) + ?
      WHERE username = ?
    `).run(d, d, username);
  }
}

// 1) dashboard stats
router.get("/principal/dashboard-stats", authenticateToken, authorizeRoles("principal"), (req, res) => {
  try {
    if (!ensurePrincipal(req, res)) return;

    const total_pending = db.prepare(`SELECT COUNT(*) c FROM leave_requests WHERE status='Pending'`).get().c;

    const byRole = db.prepare(`
      SELECT u.role, COUNT(*) c
      FROM leave_requests lr
      JOIN users u ON u.username = lr.user_username
      WHERE lr.status='Pending'
      GROUP BY u.role
    `).all();

    const roleMap = Object.fromEntries(byRole.map(x => [x.role, x.c]));

    const departments_with_pending = db.prepare(`
      SELECT DISTINCT u.department
      FROM leave_requests lr
      JOIN users u ON u.username = lr.user_username
      WHERE lr.status='Pending'
      ORDER BY u.department
    `).all().map(r => r.department);

    const recent_requests = db.prepare(`
      SELECT lr.*, u.full_name, u.email, u.department, u.role
      FROM leave_requests lr
      JOIN users u ON u.username = lr.user_username
      WHERE lr.status='Pending'
      ORDER BY lr.created_at DESC
      LIMIT 5
    `).all();

    return res.json({
      total_pending,
      hod_pending: roleMap.hod || 0,
      faculty_pending: roleMap.faculty || 0,
      registry_pending: roleMap.registry || 0,
      office_staff_pending: roleMap.officestaff || 0,
      departments_with_pending,
      recent_requests
    });
  } catch (e) {
    console.error("PRINCIPAL dashboard-stats error:", e);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// 2) dept chart
router.get("/principal/department-chart-data", authenticateToken, authorizeRoles("principal"), (req, res) => {
  try {
    if (!ensurePrincipal(req, res)) return;

    const rows = db.prepare(`
      SELECT u.department, COUNT(*) count
      FROM leave_requests lr
      JOIN users u ON u.username = lr.user_username
      WHERE lr.status='Pending'
      GROUP BY u.department
      ORDER BY count DESC
    `).all();

    res.json(rows);
  } catch (e) {
    console.error("PRINCIPAL department-chart-data error:", e);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// 3) leave type chart
router.get("/principal/leave-type-chart-data", authenticateToken, authorizeRoles("principal"), (req, res) => {
  try {
    if (!ensurePrincipal(req, res)) return;

    const rows = db.prepare(`
      SELECT COALESCE(leave_category, 'other') AS leave_category, COUNT(*) count
      FROM leave_requests
      WHERE status='Pending'
      GROUP BY COALESCE(leave_category, 'other')
      ORDER BY count DESC
    `).all();

    res.json(rows);
  } catch (e) {
    console.error("PRINCIPAL leave-type-chart-data error:", e);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// 4) all pending
router.get("/principal/all-pending", authenticateToken, authorizeRoles("principal"), (req, res) => {
  try {
    if (!ensurePrincipal(req, res)) return;

    const { search = "", department = "", role = "", leave_type = "", page = 1, pageSize = 20 } = req.query;
    const p = Math.max(1, Number(page));
    const ps = Math.max(1, Math.min(100, Number(pageSize)));
    const offset = (p - 1) * ps;

    const where = [`lr.status='Pending'`];
    const vals = [];

    if (search) {
      where.push(`(u.full_name LIKE ? OR u.email LIKE ? OR u.department LIKE ?)`);
      vals.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (department) {
      where.push(`u.department = ?`);
      vals.push(department);
    }
    if (role) {
      where.push(`u.role = ?`);
      vals.push(role);
    }
    if (leave_type) {
      where.push(`(COALESCE(lr.leave_category,'') = ? OR COALESCE(lr.special_leave_type,'') = ? OR COALESCE(lr.leave_type,'') = ?)`);
      vals.push(leave_type, leave_type, leave_type);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const total = db.prepare(`
      SELECT COUNT(*) c
      FROM leave_requests lr
      JOIN users u ON u.username = lr.user_username
      ${whereSql}
    `).get(...vals).c;

    const rows = db.prepare(`
      SELECT lr.*, u.full_name, u.email, u.department, u.role
      FROM leave_requests lr
      JOIN users u ON u.username = lr.user_username
      ${whereSql}
      ORDER BY lr.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...vals, ps, offset);

    res.json({ page: p, pageSize: ps, total, data: rows });
  } catch (e) {
    console.error("PRINCIPAL all-pending error:", e);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// 5) hod pending
router.get("/principal/hod-pending", authenticateToken, authorizeRoles("principal"), (req, res) => {
  try {
    if (!ensurePrincipal(req, res)) return;

    const rows = db.prepare(`
      SELECT lr.*, u.full_name, u.email, u.department, u.role
      FROM leave_requests lr
      JOIN users u ON u.username = lr.user_username
      WHERE lr.status='Pending' AND u.role='hod'
      ORDER BY lr.created_at DESC
    `).all();

    res.json(rows);
  } catch (e) {
    console.error("PRINCIPAL hod-pending error:", e);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// 6) approve hod
router.post("/principal/approve-hod/:requestId", authenticateToken, authorizeRoles("principal"), (req, res) => {
  try {
    if (!ensurePrincipal(req, res)) return;

    const id = Number(req.params.requestId);
    const { admin_comments } = req.body || {};

    const row = db.prepare(`
      SELECT lr.*, u.role, u.username, u.full_name, u.department
      FROM leave_requests lr
      JOIN users u ON u.username = lr.user_username
      WHERE lr.id = ? AND lr.status='Pending'
    `).get(id);

    if (!row) return res.status(404).json({ message: "Pending request not found" });
    if (row.role !== "hod") return res.status(400).json({ message: "This endpoint only approves HOD requests" });

    const tx = db.transaction(() => {
      db.prepare(`
        UPDATE leave_requests
        SET status='Approved',
            approved_at=CURRENT_TIMESTAMP,
            final_approver='Principal',
            admin_comments=?
        WHERE id=?
      `).run(admin_comments || null, id);

      deductLeaveBalance(row.user_username, (row.leave_category || "").toLowerCase(), parseDays(row));
    });
    tx();

    res.json({ message: "HOD leave approved" });
  } catch (e) {
    console.error("PRINCIPAL approve-hod error:", e);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// 7) reject hod
router.post("/principal/reject-hod/:requestId", authenticateToken, authorizeRoles("principal"), (req, res) => {
  try {
    if (!ensurePrincipal(req, res)) return;

    const id = Number(req.params.requestId);
    const { admin_comments } = req.body || {};
    if (!admin_comments || !String(admin_comments).trim()) {
      return res.status(400).json({ message: "Rejection reason is required" });
    }

    const row = db.prepare(`
      SELECT lr.*, u.role
      FROM leave_requests lr
      JOIN users u ON u.username = lr.user_username
      WHERE lr.id=? AND lr.status='Pending'
    `).get(id);

    if (!row) return res.status(404).json({ message: "Pending request not found" });
    if (row.role !== "hod") return res.status(400).json({ message: "This endpoint only rejects HOD requests" });

    db.prepare(`
      UPDATE leave_requests
      SET status='Rejected',
          final_approver='Principal',
          admin_comments=?
      WHERE id=?
    `).run(admin_comments, id);

    res.json({ message: "HOD leave rejected" });
  } catch (e) {
    console.error("PRINCIPAL reject-hod error:", e);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// 8) final approve (faculty/office/reg/hod)
// NOTE: OD letter generation REMOVED. OD file is uploaded by user as attachment.
router.post("/principal/final-approve/:requestId", authenticateToken, authorizeRoles("principal"), (req, res) => {
  try {
    if (!ensurePrincipal(req, res)) return;

    const id = Number(req.params.requestId);
    const { admin_comments } = req.body || {};

    const row = db.prepare(`
      SELECT lr.*, u.role, u.username, u.full_name, u.department
      FROM leave_requests lr
      JOIN users u ON u.username = lr.user_username
      WHERE lr.id=? AND lr.status='Pending'
    `).get(id);

    if (!row) return res.status(404).json({ message: "Pending request not found" });

    const tx = db.transaction(() => {
      db.prepare(`
        UPDATE leave_requests
        SET status='Approved',
            approved_at=CURRENT_TIMESTAMP,
            final_approver='Principal',
            admin_comments=?
        WHERE id=?
      `).run(admin_comments || null, id);

      // Vacation is auto-approved in vacation route; do not deduct here.
      if ((row.leave_category || "").toLowerCase() !== "vacation") {
        deductLeaveBalance(row.user_username, (row.leave_category || "").toLowerCase(), parseDays(row));
      }
    });
    tx();

    res.json({ message: "Leave finally approved" });
  } catch (e) {
    console.error("PRINCIPAL final-approve error:", e);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// 9) final reject
router.post("/principal/final-reject/:requestId", authenticateToken, authorizeRoles("principal"), (req, res) => {
  try {
    if (!ensurePrincipal(req, res)) return;

    const id = Number(req.params.requestId);
    const { admin_comments } = req.body || {};
    if (!admin_comments || !String(admin_comments).trim()) {
      return res.status(400).json({ message: "Rejection reason is required" });
    }

    const row = db.prepare(`
      SELECT lr.id
      FROM leave_requests lr
      WHERE lr.id=? AND lr.status='Pending'
    `).get(id);

    if (!row) return res.status(404).json({ message: "Pending request not found" });

    db.prepare(`
      UPDATE leave_requests
      SET status='Rejected',
          final_approver='Principal',
          admin_comments=?
      WHERE id=?
    `).run(admin_comments, id);

    res.json({ message: "Leave finally rejected" });
  } catch (e) {
    console.error("PRINCIPAL final-reject error:", e);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// 10) POST /api/principal/auto-approve-pending
router.post("/principal/auto-approve-pending", authenticateToken, authorizeRoles("principal"), (req, res) => {
  try {
    if (!ensurePrincipal(req, res)) return;

    const today = new Date().toISOString().slice(0, 10);

    const pendingRows = db.prepare(`
      SELECT lr.*, u.role
      FROM leave_requests lr
      JOIN users u ON u.username = lr.user_username
      WHERE lr.status = 'Pending'
        AND date(lr.start_date) <= date(?)
    `).all(today);

    const tx = db.transaction(() => {
      for (const row of pendingRows) {
        db.prepare(`
          UPDATE leave_requests
          SET status='Approved',
              approved_at=CURRENT_TIMESTAMP,
              final_approver='Auto-Approved'
          WHERE id=?
        `).run(row.id);

        if ((row.leave_category || "").toLowerCase() !== "vacation") {
          deductLeaveBalance(row.user_username, (row.leave_category || "").toLowerCase(), parseDays(row));
        }
      }
    });
    tx();

    return res.json({
      message: "Auto-approve run completed",
      auto_approved_count: pendingRows.length,
      run_date: today
    });
  } catch (e) {
    console.error("PRINCIPAL auto-approve-pending error:", e);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;