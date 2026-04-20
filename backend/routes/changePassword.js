const express = require("express");
const bcrypt = require("bcryptjs");
const { authenticateToken } = require("../middleware/auth");
const { db } = require("../database/init");

const router = express.Router();

router.post("/change-password", authenticateToken, async (req, res) => {
  try {
    const { current_password, new_password } = req.body || {};
    if (!current_password || !new_password) {
      return res.status(400).json({ message: "current_password and new_password are required" });
    }
    if (String(new_password).length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const user = db.prepare("SELECT username, password FROM users WHERE username = ?").get(req.user.username);
    if (!user) return res.status(404).json({ message: "User not found" });

    const ok = await bcrypt.compare(current_password, user.password);
    if (!ok) return res.status(400).json({ message: "Current password is incorrect" });

    const hash = await bcrypt.hash(new_password, 10);
    db.prepare("UPDATE users SET password = ? WHERE username = ?").run(hash, req.user.username);

    return res.json({ message: "Password changed successfully" });
  } catch (e) {
    console.error("change-password error:", e);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;