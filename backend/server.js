const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const { initDatabase, db } = require("./database/init");

const authRoutes = require("./routes/auth");
const leaveRoutes = require("./routes/leave");
// const extraWorkRoutes = require("./routes/extraWork"); // REMOVED (compensation flow)
const userRoutes = require("./routes/user");
const hodRoutes = require("./routes/hod");
const registryRoutes = require("./routes/registry");
const headClerkRoutes = require("./routes/headclerk");
const principalRoutes = require("./routes/principal");
const uploadRoutes = require("./routes/upload");
const changePasswordRoutes = require("./routes/changePassword");
const passwordResetRoutes = require("./routes/passwordReset");
const vacationRoutes = require("./routes/vacation");
const overworkRoutes = require("./routes/overwork");
const letterRoutes = require("./routes/letter");

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Init DB + safe migrations + seed users
initDatabase();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    credentials: true
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(uploadDir));

// Health
app.get("/api/health", (req, res) => {
  res.json({ ok: true, message: "Faculty Leave Portal API running" });
});

// Routes
app.use("/api", authRoutes);
app.use("/api", userRoutes);
app.use("/api", leaveRoutes);
// app.use("/api", extraWorkRoutes); // REMOVED
app.use("/api", hodRoutes);
app.use("/api", registryRoutes);
app.use("/api", headClerkRoutes);
app.use("/api", principalRoutes);
app.use("/api", uploadRoutes);
app.use("/api", changePasswordRoutes);
app.use("/api", passwordResetRoutes);
app.use("/api", vacationRoutes);
app.use("/api", overworkRoutes);
app.use("/api", letterRoutes);

// Optional fallback auto-approve every 6 hours (in addition to manual endpoint)
setInterval(() => {
  try {
    const today = new Date().toISOString().slice(0, 10);

    const pendingRows = db.prepare(`
      SELECT *
      FROM leave_requests
      WHERE status = 'Pending'
        AND date(start_date) <= date(?)
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

        // leave deduction (skip vacation)
        if ((row.leave_category || "").toLowerCase() === "medical") {
          db.prepare(`
            UPDATE users
            SET medical_leave_left = MAX(0, COALESCE(medical_leave_left,0) - ?),
                medical_leave_used = COALESCE(medical_leave_used,0) + ?
            WHERE username=?
          `).run(Number(row.duration_days || 1), Number(row.duration_days || 1), row.user_username);
        } else if ((row.leave_category || "").toLowerCase() === "casual") {
          db.prepare(`
            UPDATE users
            SET casual_leave_left = MAX(0, COALESCE(casual_leave_left,0) - ?),
                casual_leave_used = COALESCE(casual_leave_used,0) + ?
            WHERE username=?
          `).run(Number(row.duration_days || 1), Number(row.duration_days || 1), row.user_username);
        } else if ((row.leave_category || "").toLowerCase() === "earned") {
          db.prepare(`
            UPDATE users
            SET earned_leave_left = MAX(0, COALESCE(earned_leave_left,0) - ?),
                earned_leave_used = COALESCE(earned_leave_used,0) + ?
            WHERE username=?
          `).run(Number(row.duration_days || 1), Number(row.duration_days || 1), row.user_username);
        }
      }
    });
    tx();
  } catch (e) {
    console.error("Auto-approve interval error:", e);
  }
}, 6 * 60 * 60 * 1000);

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err);
  res.status(500).json({ message: "Internal Server Error" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});