const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { db } = require("../database/init");
const { sendPasswordResetEmail } = require("../utils/emailService");

const router = express.Router();

// POST /api/forgot-password
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = db.prepare("SELECT username, email, full_name FROM users WHERE email = ?").get(email);

    // Always return generic response
    if (!user) return res.json({ message: "If this email exists, reset instructions were sent." });

    const token = jwt.sign(
      { username: user.username, purpose: "password_reset" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    await sendPasswordResetEmail(user, token);

    return res.json({ message: "If this email exists, reset instructions were sent." });
  } catch (e) {
    console.error("forgot-password error:", e);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// POST /api/reset-password
router.post("/reset-password", async (req, res) => {
  try {
    const { token, new_password, confirm_password } = req.body || {};
    if (!token || !new_password || !confirm_password) {
      return res.status(400).json({ message: "token, new_password, confirm_password are required" });
    }
    if (new_password !== confirm_password) {
      return res.status(400).json({ message: "Passwords do not match" });
    }
    if (String(new_password).length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.purpose !== "password_reset") {
      return res.status(400).json({ message: "Invalid reset token" });
    }

    const user = db.prepare("SELECT username FROM users WHERE username = ?").get(decoded.username);
    if (!user) return res.status(404).json({ message: "User not found" });

    const hash = await bcrypt.hash(new_password, 10);
    db.prepare("UPDATE users SET password = ? WHERE username = ?").run(hash, decoded.username);

    return res.json({ message: "Password reset successful" });
  } catch (e) {
    if (e.name === "TokenExpiredError") return res.status(400).json({ message: "Reset token expired" });
    console.error("reset-password error:", e);
    return res.status(400).json({ message: "Invalid or expired token" });
  }
});

module.exports = router;