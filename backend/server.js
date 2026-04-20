const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const { initDatabase } = require("./database/init");

const authRoutes = require("./routes/auth");
const leaveRoutes = require("./routes/leave");
const extraWorkRoutes = require("./routes/extraWork");
const userRoutes = require("./routes/user");
const hodRoutes = require("./routes/hod"); // NEW
const registryRoutes = require("./routes/registry");
const headClerkRoutes = require("./routes/headclerk");
const principalRoutes = require("./routes/principal");
const uploadRoutes = require("./routes/upload");
const changePasswordRoutes = require("./routes/changePassword");
const passwordResetRoutes = require("./routes/passwordReset");
const vacationRoutes = require("./routes/vacation");
const overworkRoutes = require("./routes/overwork");

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Init DB + seed users
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
app.use("/api", extraWorkRoutes);
app.use("/api", hodRoutes); // NEW
app.use("/api", registryRoutes);
app.use("/api", headClerkRoutes);
app.use("/api", principalRoutes);
app.use("/api", uploadRoutes);
app.use("/api", changePasswordRoutes);
app.use("/api", passwordResetRoutes);
app.use("/api", vacationRoutes);
app.use("/api", overworkRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err);
  res.status(500).json({ message: "Internal Server Error" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});