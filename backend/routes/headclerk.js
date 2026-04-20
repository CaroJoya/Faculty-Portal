const express = require("express");
const { db } = require("../database/init");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");

const router = express.Router();

function ensureHeadClerk(req, res) {
  const user = db.prepare("SELECT username, role FROM users WHERE username = ?").get(req.user.username);
  if (!user || user.role !== "headclerk") {
    res.status(403).json({ message: "Only Head Clerk can access this endpoint" });
    return null;
  }
  return user;
}

function monthRange(year, month) {
  const m = String(month).padStart(2, "0");
  const start = `${year}-${m}-01`;
  const end = db.prepare(`SELECT date(?, '+1 month', '-1 day') as d`).get(start).d;
  return { start, end };
}

// 1) GET /api/headclerk/attendance/calendar
router.get("/headclerk/attendance/calendar", authenticateToken, authorizeRoles("headclerk"), (req, res) => {
  try {
    const hc = ensureHeadClerk(req, res);
    if (!hc) return;

    const { department, faculty_id, month, year } = req.query;
    if (!month || !year) return res.status(400).json({ message: "month and year are required" });

    const { start, end } = monthRange(Number(year), Number(month));

    let facultySql = `SELECT username, full_name, department FROM users WHERE role IN ('faculty','hod','registry','officestaff')`;
    const params = [];
    if (department) {
      facultySql += ` AND department = ?`;
      params.push(department);
    }
    facultySql += ` ORDER BY full_name ASC`;

    const faculty = db.prepare(facultySql).all(...params);

    let attendance = [];
    if (faculty_id) {
      attendance = db.prepare(`
        SELECT * FROM attendance
        WHERE user_username = ?
          AND date BETWEEN ? AND ?
        ORDER BY date ASC
      `).all(faculty_id, start, end);
    }

    const leaveRecords = db.prepare(`
      SELECT lr.id, lr.user_username, lr.start_date, lr.end_date, lr.status, lr.leave_category, lr.leave_type, u.full_name
      FROM leave_requests lr
      JOIN users u ON u.username = lr.user_username
      WHERE lr.status = 'Approved'
        AND lr.start_date <= ?
        AND lr.end_date >= ?
        ${department ? "AND u.department = ?" : ""}
        ${faculty_id ? "AND u.username = ?" : ""}
      ORDER BY lr.start_date ASC
    `).all(
      end,
      start,
      ...(department ? [department] : []),
      ...(faculty_id ? [faculty_id] : [])
    );

    return res.json({ faculty, attendance, leaveRecords, month: Number(month), year: Number(year) });
  } catch (e) {
    console.error("HEADCLERK attendance/calendar error:", e);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// 2) POST /api/headclerk/attendance/mark
router.post("/headclerk/attendance/mark", authenticateToken, authorizeRoles("headclerk"), (req, res) => {
  try {
    const hc = ensureHeadClerk(req, res);
    if (!hc) return;

    const { faculty_id, date, status, remarks } = req.body;
    if (!faculty_id || !date || !status) {
      return res.status(400).json({ message: "faculty_id, date, status are required" });
    }
    if (!["Present", "Absent", "Half Day"].includes(status)) {
      return res.status(400).json({ message: "Invalid attendance status" });
    }

    const existsUser = db.prepare("SELECT username FROM users WHERE username = ?").get(faculty_id);
    if (!existsUser) return res.status(404).json({ message: "Faculty not found" });

    const exists = db.prepare("SELECT id FROM attendance WHERE user_username = ? AND date = ?").get(faculty_id, date);
    if (exists) {
      db.prepare(`
        UPDATE attendance
        SET status = ?, remarks = ?, marked_by = ?
        WHERE id = ?
      `).run(status, remarks || null, req.user.username, exists.id);
    } else {
      db.prepare(`
        INSERT INTO attendance (user_username, date, status, remarks, marked_by)
        VALUES (?, ?, ?, ?, ?)
      `).run(faculty_id, date, status, remarks || null, req.user.username);
    }

    return res.json({ message: "Attendance saved successfully" });
  } catch (e) {
    console.error("HEADCLERK attendance/mark error:", e);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// NOTE: Upload attendance endpoint removed as requested.

// 3) GET /api/headclerk/vacation/periods (legacy compatibility)
router.get("/headclerk/vacation/periods", authenticateToken, authorizeRoles("headclerk"), (req, res) => {
  try {
    const hc = ensureHeadClerk(req, res);
    if (!hc) return;

    const active = db.prepare(`
      SELECT * FROM vacation_periods
      WHERE is_active = 1
      ORDER BY id DESC
      LIMIT 1
    `).get();

    return res.json({ active_period: active || null });
  } catch (e) {
    console.error("HEADCLERK vacation/periods error:", e);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// 4) GET /api/headclerk/summer-winter/current
router.get("/headclerk/summer-winter/current", authenticateToken, authorizeRoles("headclerk"), (req, res) => {
  try {
    const hc = ensureHeadClerk(req, res);
    if (!hc) return;

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

    return res.json({ summer: summer || null, winter: winter || null });
  } catch (e) {
    console.error("HEADCLERK summer-winter/current error:", e);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// 5) POST /api/headclerk/summer-winter/set
router.post("/headclerk/summer-winter/set", authenticateToken, authorizeRoles("headclerk"), (req, res) => {
  try {
    const hc = ensureHeadClerk(req, res);
    if (!hc) return;

    const { vacation_type, year, start_date, end_date } = req.body;
    if (!vacation_type || !year || !start_date || !end_date) {
      return res.status(400).json({ message: "vacation_type, year, start_date, end_date are required" });
    }

    const normalizedType = String(vacation_type).trim();
    if (!["Summer Vacation", "Winter Vacation"].includes(normalizedType)) {
      return res.status(400).json({ message: "vacation_type must be Summer Vacation or Winter Vacation" });
    }

    const totalDays = db.prepare(`SELECT (julianday(?) - julianday(?) + 1) AS d`).get(end_date, start_date).d;
    if (Number(totalDays) !== 40) return res.status(400).json({ message: "Total days must be exactly 40" });

    // Fixed quotas as per requirement
    const paid_leave_quota = normalizedType === "Summer Vacation" ? 27 : 21;

    db.prepare(`
      UPDATE summer_winter_vacation
      SET is_active = 0
      WHERE vacation_type = ?
    `).run(normalizedType);

    db.prepare(`
      INSERT INTO summer_winter_vacation (vacation_type, year, start_date, end_date, total_days, paid_leave_quota, is_active)
      VALUES (?, ?, ?, ?, 40, ?, 1)
    `).run(normalizedType, year, start_date, end_date, paid_leave_quota);

    return res.json({
      message: "Summer/Winter vacation period saved successfully",
      vacation_type: normalizedType,
      paid_leave_quota
    });
  } catch (e) {
    console.error("HEADCLERK summer-winter/set error:", e);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// 6) GET /api/headclerk/vacation/faculty-status (all eligible employees + summer/winter usage)
router.get("/headclerk/vacation/faculty-status", authenticateToken, authorizeRoles("headclerk"), (req, res) => {
  try {
    const hc = ensureHeadClerk(req, res);
    if (!hc) return;

    const users = db.prepare(`
      SELECT username, full_name, department, role
      FROM users
      WHERE role IN ('faculty','hod','registry','officestaff')
      ORDER BY full_name
    `).all();

    const summer = db.prepare(`
      SELECT * FROM summer_winter_vacation
      WHERE vacation_type='Summer Vacation' AND is_active=1
      ORDER BY id DESC LIMIT 1
    `).get();

    const winter = db.prepare(`
      SELECT * FROM summer_winter_vacation
      WHERE vacation_type='Winter Vacation' AND is_active=1
      ORDER BY id DESC LIMIT 1
    `).get();

    const data = users.map((u) => {
      let summer_used = 0;
      let winter_used = 0;

      if (summer) {
        summer_used = Number(
          db.prepare(`
            SELECT COALESCE(SUM(duration_days),0) d
            FROM leave_requests
            WHERE user_username = ?
              AND leave_category = 'vacation'
              AND special_leave_type = 'Summer Vacation'
              AND status = 'Approved'
              AND start_date >= ?
              AND end_date <= ?
          `).get(u.username, summer.start_date, summer.end_date).d
        );
      }

      if (winter) {
        winter_used = Number(
          db.prepare(`
            SELECT COALESCE(SUM(duration_days),0) d
            FROM leave_requests
            WHERE user_username = ?
              AND leave_category = 'vacation'
              AND special_leave_type = 'Winter Vacation'
              AND status = 'Approved'
              AND start_date >= ?
              AND end_date <= ?
          `).get(u.username, winter.start_date, winter.end_date).d
        );
      }

      return {
        username: u.username,
        full_name: u.full_name,
        department: u.department,
        role: u.role,
        summer_quota: 27,
        summer_used,
        summer_remaining: Math.max(0, 27 - summer_used),
        winter_quota: 21,
        winter_used,
        winter_remaining: Math.max(0, 21 - winter_used)
      };
    });

    return res.json(data);
  } catch (e) {
    console.error("HEADCLERK vacation/faculty-status error:", e);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// 7) GET /api/headclerk/vacation/calendar
router.get("/headclerk/vacation/calendar", authenticateToken, authorizeRoles("headclerk"), (req, res) => {
  try {
    const hc = ensureHeadClerk(req, res);
    if (!hc) return;

    const { department, faculty_id, month, year } = req.query;
    if (!month || !year) return res.status(400).json({ message: "month and year are required" });

    const { start, end } = monthRange(Number(year), Number(month));

    const rows = db.prepare(`
      SELECT lr.id, lr.user_username, lr.start_date, lr.end_date, lr.reason, lr.special_leave_type, u.full_name, u.department
      FROM leave_requests lr
      JOIN users u ON u.username = lr.user_username
      WHERE lr.status = 'Approved'
        AND lr.leave_category = 'vacation'
        AND lr.start_date <= ?
        AND lr.end_date >= ?
        ${department ? "AND u.department = ?" : ""}
        ${faculty_id ? "AND u.username = ?" : ""}
      ORDER BY u.full_name, lr.start_date
    `).all(end, start, ...(department ? [department] : []), ...(faculty_id ? [faculty_id] : []));

    return res.json(rows);
  } catch (e) {
    console.error("HEADCLERK vacation/calendar error:", e);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// 8) GET /api/headclerk/faculty/by-department
router.get("/headclerk/faculty/by-department", authenticateToken, authorizeRoles("headclerk"), (req, res) => {
  try {
    const hc = ensureHeadClerk(req, res);
    if (!hc) return;

    const { department } = req.query;

    const rows = db.prepare(`
      SELECT username, full_name, department
      FROM users
      WHERE role IN ('faculty','hod','registry','officestaff')
      ${department ? "AND department = ?" : ""}
      ORDER BY full_name
    `).all(...(department ? [department] : []));

    return res.json(rows);
  } catch (e) {
    console.error("HEADCLERK faculty/by-department error:", e);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;