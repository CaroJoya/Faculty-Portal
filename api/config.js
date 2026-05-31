require('dotenv').config();
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

// Use tmp or /tmp for Vercel (ephemeral file system)
const tmpDir = process.env.VERCEL ? '/tmp' : path.join(process.cwd(), 'backend', 'data');
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir, { recursive: true });
}

const dbPath = path.join(tmpDir, 'faculty_leave.db');

let db = null;
let isInitialized = false;

function getDB() {
  if (!db) {
    db = new Database(dbPath);
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function hasColumn(db, table, column) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  return cols.some(c => c.name === column);
}

function tableExists(db, table) {
  const row = db.prepare(`
    SELECT name FROM sqlite_master
    WHERE type='table' AND name=?
  `).get(table);
  return !!row;
}

function initDatabase() {
  if (isInitialized) return;
  
  const database = getDB();
  
  try {
    // Create tables
    database.prepare(`
      CREATE TABLE IF NOT EXISTS users (
        username TEXT PRIMARY KEY,
        password_hash TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        full_name TEXT NOT NULL,
        department TEXT NOT NULL,
        designation TEXT DEFAULT 'Faculty',
        role TEXT NOT NULL,
        phone_number TEXT,
        is_hod BOOLEAN DEFAULT 0,
        is_registry BOOLEAN DEFAULT 0,
        is_principal BOOLEAN DEFAULT 0,
        managed_department TEXT,
        date_of_joining DATE,
        medical_leave_total REAL DEFAULT 10,
        medical_leave_used REAL DEFAULT 0,
        medical_leave_left REAL DEFAULT 10,
        casual_leave_total REAL DEFAULT 10,
        casual_leave_used REAL DEFAULT 0,
        casual_leave_left REAL DEFAULT 10,
        earned_leave_total REAL DEFAULT 0,
        earned_leave_used REAL DEFAULT 0,
        earned_leave_left REAL DEFAULT 0,
        od_leave_count INTEGER DEFAULT 0,
        extended_medical_count INTEGER DEFAULT 0,
        maternity_paternity_total INTEGER DEFAULT 180,
        maternity_paternity_used INTEGER DEFAULT 0,
        maternity_paternity_left INTEGER DEFAULT 180,
        overwork_hours REAL DEFAULT 0,
        pending_overwork_hours REAL DEFAULT 0,
        summer_vacation_earned REAL DEFAULT 0,
        winter_vacation_earned REAL DEFAULT 0,
        total_vacation_earned REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        deleted_at DATETIME,
        delete_requested_at DATETIME,
        deleted_by TEXT,
        restored_at DATETIME,
        restored_by TEXT
      )
    `).run();

    database.prepare(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_username TEXT NOT NULL,
        token TEXT NOT NULL UNIQUE,
        expires_at DATETIME NOT NULL,
        used BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_username) REFERENCES users(username)
      )
    `).run();

    // Add columns if they don't exist
    if (!hasColumn(database, 'users', 'deleted_at')) {
      database.prepare(`ALTER TABLE users ADD COLUMN deleted_at DATETIME`).run();
    }
    if (!hasColumn(database, 'users', 'delete_requested_at')) {
      database.prepare(`ALTER TABLE users ADD COLUMN delete_requested_at DATETIME`).run();
    }
    if (!hasColumn(database, 'users', 'deleted_by')) {
      database.prepare(`ALTER TABLE users ADD COLUMN deleted_by TEXT`).run();
    }
    if (!hasColumn(database, 'users', 'restored_at')) {
      database.prepare(`ALTER TABLE users ADD COLUMN restored_at DATETIME`).run();
    }
    if (!hasColumn(database, 'users', 'restored_by')) {
      database.prepare(`ALTER TABLE users ADD COLUMN restored_by TEXT`).run();
    }

    // Seed default users
    const users = [
      ["office_staff", "password123", "officestaff", "Office Staff", "Office"],
      ["head_clerk", "office123", "headclerk", "Head Clerk", "Office"],
      ["registry_office", "password123", "registry", "Registry Officer", "Office"],
      ["principal", "principal123", "principal", "Principal", "Administration"],
      ["hod_computer", "password123", "hod", "Dr. Sharvari Govilkar", "Computer Engineering"],
      ["shrushti", "password123", "faculty", "Shrushti", "Computer Engineering"],
      ["neha.ashok", "password123", "faculty", "Prof. Neha Ashok", "Computer Engineering"]
    ];

    const existsStmt = database.prepare("SELECT username FROM users WHERE username = ?");
    const insertStmt = database.prepare(`
      INSERT INTO users (
        username, password_hash, email, full_name, department, role, designation,
        is_hod, is_registry, is_principal, managed_department
      )
      VALUES (
        @username, @password_hash, @email, @full_name, @department, @role, 'Faculty',
        @is_hod, @is_registry, @is_principal, @managed_department
      )
    `);

    for (const [username, plainPassword, role, full_name, department] of users) {
      if (existsStmt.get(username)) continue;
      
      const hash = bcrypt.hashSync(plainPassword, 10);
      insertStmt.run({
        username,
        password_hash: hash,
        email: `${username}@faculty-portal.local`,
        full_name,
        department,
        role,
        is_hod: role === "hod" ? 1 : 0,
        is_registry: role === "registry" ? 1 : 0,
        is_principal: role === "principal" ? 1 : 0,
        managed_department: role === "hod" ? department : null
      });
    }

    isInitialized = true;
    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Database initialization error:', err);
    throw err;
  }
}

module.exports = {
  getDB,
  initDatabase
};