const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { db } = require("../database/init");
const { authenticateToken } = require("../middleware/auth");
require("dotenv").config();

const router = express.Router();

// POST /api/register
router.post("/register", (req, res) => {
  try {
    const {
      username,
      password,
      email,
      full_name,
      department,
      designation,
      role,
      phone_number,
      date_of_joining
    } = req.body;

    if (!username || !password || !email || !full_name || !department || !role) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const validRoles = ["faculty", "hod", "principal", "registry", "headclerk", "officestaff"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role value" });
    }

    const existing = db
      .prepare("SELECT username, email FROM users WHERE username = ? OR email = ?")
      .get(username, email);

    if (existing) {
      return res.status(409).json({ message: "Username or email already exists" });
    }

    const password_hash = bcrypt.hashSync(password, 10);

    db.prepare(`
      INSERT INTO users (
        username, password_hash, email, full_name, department, designation, role, phone_number,
        is_hod, is_registry, is_principal, managed_department, date_of_joining
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      username,
      password_hash,
      email,
      full_name,
      department,
      designation || "Faculty",
      role,
      phone_number || null,
      role === "hod" ? 1 : 0,
      role === "registry" ? 1 : 0,
      role === "principal" ? 1 : 0,
      role === "hod" ? department : null,
      date_of_joining || null
    );

    return res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// POST /api/login
router.post("/login", (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password required" });
    }

    const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    // CHECK FOR DELETED ACCOUNT - THIS IS THE IMPORTANT PART
    if (user.deleted_at) {
      return res.status(401).json({ message: "Account has been deleted. Please restore your account first." });
    }

    if (!user.password_hash) {
      console.error("LOGIN ERROR: password_hash missing for user:", username);
      return res.status(500).json({ message: "Internal Server Error" });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    if (!process.env.JWT_SECRET) {
      console.error("LOGIN ERROR: JWT_SECRET missing");
      return res.status(500).json({ message: "Server misconfiguration" });
    }

    const payload = {
      username: user.username,
      role: user.role,
      full_name: user.full_name,
      department: user.department
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "24h" });

    return res.json({
      message: "Login successful",
      token,
      user: payload
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// GET /api/me
router.get("/me", authenticateToken, (req, res) => {
  try {
    const user = db.prepare("SELECT * FROM users WHERE username = ?").get(req.user.username);
    if (!user) return res.status(404).json({ message: "User not found" });

    delete user.password_hash;
    return res.json(user);
  } catch (error) {
    console.error("ME ERROR:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// POST /api/forgot-password
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = db.prepare("SELECT username, email, full_name FROM users WHERE email = ?").get(email);
    
    // Always return success for security (don't reveal if email exists)
    if (!user) {
      return res.json({ message: "If your email is registered, you will receive reset instructions." });
    }

    // Generate secure random token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry

    // Delete any existing unused tokens for this user
    db.prepare("DELETE FROM password_reset_tokens WHERE user_username = ? AND used = 0").run(user.username);

    // Store new token
    db.prepare(`
      INSERT INTO password_reset_tokens (user_username, token, expires_at)
      VALUES (?, ?, ?)
    `).run(user.username, token, expiresAt.toISOString());

    // Send email (you'll need to implement this or use existing emailService)
    const resetLink = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${token}`;
    
    // You can use your existing email service here
    console.log("Password reset link:", resetLink);
    // await sendPasswordResetEmail(user, resetLink);

    return res.json({ message: "If your email is registered, you will receive reset instructions." });
  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// POST /api/reset-password
router.post("/reset-password", async (req, res) => {
  try {
    const { token, new_password, confirm_password } = req.body;

    if (!token || !new_password || !confirm_password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (new_password !== confirm_password) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // Find valid token
    const resetEntry = db.prepare(`
      SELECT * FROM password_reset_tokens 
      WHERE token = ? AND used = 0 AND expires_at > datetime('now')
    `).get(token);

    if (!resetEntry) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    // Hash new password
    const hashedPassword = bcrypt.hashSync(new_password, 10);

    // Update user's password
    db.prepare("UPDATE users SET password_hash = ? WHERE username = ?").run(hashedPassword, resetEntry.user_username);

    // Mark token as used
    db.prepare("UPDATE password_reset_tokens SET used = 1 WHERE id = ?").run(resetEntry.id);

    return res.json({ message: "Password reset successful. Please login with your new password." });
  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// DEBUG ONLY: reset user password quickly
// Remove this route in production.
router.post("/debug-reset-user-password", (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "username and password required" });
    }

    const existing = db.prepare("SELECT username FROM users WHERE username = ?").get(username);
    if (!existing) return res.status(404).json({ message: "User not found" });

    const hash = bcrypt.hashSync(password, 10);
    db.prepare("UPDATE users SET password_hash = ? WHERE username = ?").run(hash, username);

    return res.json({ message: `Password reset successful for ${username}` });
  } catch (error) {
    console.error("DEBUG RESET ERROR:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;