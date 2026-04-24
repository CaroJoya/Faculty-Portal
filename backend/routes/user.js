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
  
  // Check if account is deleted
  if (user.deleted_at) {
    return res.status(403).json({ message: "Account is deleted. Please restore your account first." });
  }

  const valid = bcrypt.compareSync(currentPassword, user.password_hash);
  if (!valid) return res.status(400).json({ message: "Current password is incorrect" });

  const newHash = bcrypt.hashSync(newPassword, 10);
  db.prepare("UPDATE users SET password_hash = ? WHERE username = ?").run(newHash, req.user.username);

  res.json({ message: "Password changed successfully" });
});

// ========== SOFT DELETE FEATURE ROUTES ==========

// POST /api/request-delete - Request account deletion (soft delete)
router.post("/request-delete", authenticateToken, (req, res) => {
  try {
    const now = new Date().toISOString();
    
    // Check if account is already deleted
    const user = db.prepare("SELECT deleted_at FROM users WHERE username = ?").get(req.user.username);
    if (user && user.deleted_at) {
      return res.status(400).json({ message: "Account is already deleted" });
    }
    
    db.prepare(`
      UPDATE users 
      SET delete_requested_at = ?, deleted_at = ?
      WHERE username = ?
    `).run(now, now, req.user.username);
    
    res.json({ 
      message: "Account deletion requested. Your account has been deactivated. You have 30 days to restore it before permanent deletion." 
    });
  } catch (error) {
    console.error("DELETE REQUEST ERROR:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// POST /api/restore-account - Restore a soft-deleted account
router.post("/restore-account", authenticateToken, (req, res) => {
  try {
    const user = db.prepare("SELECT deleted_at FROM users WHERE username = ?").get(req.user.username);
    
    if (!user || !user.deleted_at) {
      return res.status(400).json({ message: "Account is not deleted or does not exist" });
    }
    
    const deletedDate = new Date(user.deleted_at);
    const daysDeleted = Math.floor((Date.now() - deletedDate) / (1000 * 60 * 60 * 24));
    
    if (daysDeleted >= 30) {
      return res.status(400).json({ message: "Account has passed the 30-day recovery window and cannot be restored" });
    }
    
    db.prepare(`
      UPDATE users 
      SET deleted_at = NULL, delete_requested_at = NULL
      WHERE username = ?
    `).run(req.user.username);
    
    res.json({ message: "Account restored successfully. You can now log in normally." });
  } catch (error) {
    console.error("RESTORE ACCOUNT ERROR:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// GET /api/account-status - Check account deletion status
router.get("/account-status", authenticateToken, (req, res) => {
  try {
    const user = db.prepare(`
      SELECT username, deleted_at, delete_requested_at 
      FROM users WHERE username = ?
    `).get(req.user.username);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const isDeleted = !!user?.deleted_at;
    let daysUntilPermanent = null;
    
    if (isDeleted && user.deleted_at) {
      const deletedDate = new Date(user.deleted_at);
      const daysDeleted = Math.floor((Date.now() - deletedDate) / (1000 * 60 * 60 * 24));
      daysUntilPermanent = Math.max(0, 30 - daysDeleted);
    }
    
    res.json({
      isDeleted,
      deletedAt: user?.deleted_at || null,
      deleteRequestedAt: user?.delete_requested_at || null,
      daysUntilPermanent,
      canRestore: isDeleted && daysUntilPermanent > 0
    });
  } catch (error) {
    console.error("ACCOUNT STATUS ERROR:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;