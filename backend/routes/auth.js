const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
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