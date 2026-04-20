const express = require("express");
const bcrypt = require("bcryptjs");
const { db } = require("../database/init");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// POST /api/change-password
router.post("/change-password", authenticateToken, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "currentPassword and newPassword are required" });
  }

  const user = db.prepare("SELECT * FROM users WHERE username = ?").get(req.user.username);
  if (!user) return res.status(404).json({ message: "User not found" });

  const valid = bcrypt.compareSync(currentPassword, user.password_hash);
  if (!valid) return res.status(400).json({ message: "Current password is incorrect" });

  const newHash = bcrypt.hashSync(newPassword, 10);
  db.prepare("UPDATE users SET password_hash = ? WHERE username = ?").run(newHash, req.user.username);

  res.json({ message: "Password changed successfully" });
});

module.exports = router;