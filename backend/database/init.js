const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const Database = require("better-sqlite3");
require("dotenv").config();

const dbPath = path.resolve(process.env.DB_PATH || path.join(__dirname, "faculty_leave.db"));
// Ensure db directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);
console.log("Using DB file:", dbPath);

function hasColumn(table, column) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  return cols.some(c => c.name === column);
}

function tableExists(table) {
  const row = db.prepare(`
    SELECT name FROM sqlite_master
    WHERE type='table' AND name=?
  `).get(table);
  return !!row;
}

function createTables() {
  db.pragma("foreign_keys = ON");

  // users
  db.prepare(`
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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  // leave_requests
  db.prepare(`
    CREATE TABLE IF NOT EXISTS leave_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_username TEXT,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      reason TEXT NOT NULL,
      status TEXT DEFAULT 'Pending',
      leave_type TEXT DEFAULT 'full_day',
      leave_category TEXT DEFAULT 'casual',
      special_leave_type TEXT DEFAULT 'regular',
      attachment_path TEXT,
      hod_approved BOOLEAN DEFAULT 0,
      hod_comments TEXT,
      hod_approved_by TEXT,
      hod_approved_at DATETIME,
      final_approver TEXT,
      admin_comments TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      approved_at DATETIME,
      FOREIGN KEY (user_username) REFERENCES users(username)
    )
  `).run();

  // extra_work_days (existing legacy structure)
  db.prepare(`
    CREATE TABLE IF NOT EXISTS extra_work_days (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_username TEXT,
      work_date DATE NOT NULL,
      reason TEXT,
      work_type TEXT DEFAULT 'holiday',
      hours_worked REAL DEFAULT 8.0,
      hours REAL,
      attachment_path TEXT,
      status TEXT DEFAULT 'pending',
      approved_by TEXT,
      approved_at DATETIME,
      approver_username TEXT,
      approver_comments TEXT,
      comments TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_username) REFERENCES users(username)
    )
  `).run();

  // leave_conversions (existing legacy structure)
  db.prepare(`
    CREATE TABLE IF NOT EXISTS leave_conversions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      extra_work_day_id INTEGER,
      leave_request_id INTEGER,
      user_username TEXT,
      extra_work_id INTEGER,
      hours_used REAL,
      earned_days REAL,
      status TEXT DEFAULT 'pending',
      approved_by TEXT,
      approved_at DATETIME,
      approver_username TEXT,
      approver_comments TEXT,
      comments TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (extra_work_day_id) REFERENCES extra_work_days(id),
      FOREIGN KEY (leave_request_id) REFERENCES leave_requests(id)
    )
  `).run();

  // holiday
  db.prepare(`
    CREATE TABLE IF NOT EXISTS holiday (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date DATE UNIQUE NOT NULL,
      name TEXT NOT NULL,
      type TEXT DEFAULT 'institute'
    )
  `).run();

  // attendance
  db.prepare(`
    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_username TEXT,
      date DATE NOT NULL,
      status TEXT DEFAULT 'present',
      remarks TEXT,
      marked_by TEXT,
      FOREIGN KEY (user_username) REFERENCES users(username)
    )
  `).run();

  // legacy vacation_periods (kept for compatibility; not removed abruptly)
  db.prepare(`
    CREATE TABLE IF NOT EXISTS vacation_periods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      period_name TEXT NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      is_active BOOLEAN DEFAULT 1
    )
  `).run();

  // new summer/winter periods
  db.prepare(`
    CREATE TABLE IF NOT EXISTS summer_winter_vacation (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vacation_type TEXT NOT NULL, -- Summer Vacation / Winter Vacation
      year INTEGER NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      total_days INTEGER DEFAULT 40,
      paid_leave_quota REAL NOT NULL, -- 27 (Summer), 21 (Winter)
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  // vacation calculations
  db.prepare(`
    CREATE TABLE IF NOT EXISTS faculty_vacation_calculation (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      faculty_id TEXT NOT NULL,
      period_id INTEGER NOT NULL,
      vacation_type TEXT NOT NULL,
      quota_days REAL NOT NULL,
      used_days REAL NOT NULL,
      remaining_days REAL NOT NULL,
      earned_leaves REAL NOT NULL,
      calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
}

function runSafeMigrations() {
  // leave_requests new columns
  if (!hasColumn("leave_requests", "duration_days")) {
    db.prepare(`ALTER TABLE leave_requests ADD COLUMN duration_days REAL`).run();
    console.log("Migration: added leave_requests.duration_days");
  }
  if (!hasColumn("leave_requests", "letter_path")) {
    db.prepare(`ALTER TABLE leave_requests ADD COLUMN letter_path TEXT`).run();
    console.log("Migration: added leave_requests.letter_path");
  }

  // ensure attendance has marked_by
  if (!hasColumn("attendance", "marked_by")) {
    db.prepare(`ALTER TABLE attendance ADD COLUMN marked_by TEXT`).run();
    console.log("Migration: added attendance.marked_by");
  }

  // extra_work_days compatibility columns
  if (!hasColumn("extra_work_days", "hours")) {
    db.prepare(`ALTER TABLE extra_work_days ADD COLUMN hours REAL`).run();
    console.log("Migration: added extra_work_days.hours");
  }
  if (!hasColumn("extra_work_days", "attachment_path")) {
    db.prepare(`ALTER TABLE extra_work_days ADD COLUMN attachment_path TEXT`).run();
    console.log("Migration: added extra_work_days.attachment_path");
  }
  if (!hasColumn("extra_work_days", "approver_username")) {
    db.prepare(`ALTER TABLE extra_work_days ADD COLUMN approver_username TEXT`).run();
    console.log("Migration: added extra_work_days.approver_username");
  }
  if (!hasColumn("extra_work_days", "approver_comments")) {
    db.prepare(`ALTER TABLE extra_work_days ADD COLUMN approver_comments TEXT`).run();
    console.log("Migration: added extra_work_days.approver_comments");
  }

  // leave_conversions compatibility columns
  if (!hasColumn("leave_conversions", "user_username")) {
    db.prepare(`ALTER TABLE leave_conversions ADD COLUMN user_username TEXT`).run();
    console.log("Migration: added leave_conversions.user_username");
  }
  if (!hasColumn("leave_conversions", "hours_used")) {
    db.prepare(`ALTER TABLE leave_conversions ADD COLUMN hours_used REAL`).run();
    console.log("Migration: added leave_conversions.hours_used");
  }
  if (!hasColumn("leave_conversions", "earned_days")) {
    db.prepare(`ALTER TABLE leave_conversions ADD COLUMN earned_days REAL`).run();
    console.log("Migration: added leave_conversions.earned_days");
  }
  if (!hasColumn("leave_conversions", "approver_username")) {
    db.prepare(`ALTER TABLE leave_conversions ADD COLUMN approver_username TEXT`).run();
    console.log("Migration: added leave_conversions.approver_username");
  }
  if (!hasColumn("leave_conversions", "approver_comments")) {
    db.prepare(`ALTER TABLE leave_conversions ADD COLUMN approver_comments TEXT`).run();
    console.log("Migration: added leave_conversions.approver_comments");
  }

  // ensure new tables exist (for older DBs)
  if (!tableExists("summer_winter_vacation")) {
    db.prepare(`
      CREATE TABLE summer_winter_vacation (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vacation_type TEXT NOT NULL,
        year INTEGER NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        total_days INTEGER DEFAULT 40,
        paid_leave_quota REAL NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
    console.log("Migration: created summer_winter_vacation");
  }

  if (!tableExists("faculty_vacation_calculation")) {
    db.prepare(`
      CREATE TABLE faculty_vacation_calculation (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        faculty_id TEXT NOT NULL,
        period_id INTEGER NOT NULL,
        vacation_type TEXT NOT NULL,
        quota_days REAL NOT NULL,
        used_days REAL NOT NULL,
        remaining_days REAL NOT NULL,
        earned_leaves REAL NOT NULL,
        calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
    console.log("Migration: created faculty_vacation_calculation");
  }
}

function seedDefaultUsers() {
  const users = [
    ["office_staff", "password123", "officestaff", "Office Staff", "Office"],
    ["head_clerk", "office123", "headclerk", "Head Clerk", "Office"],
    ["registry_office", "password123", "registry", "Registry Officer", "Office"],
    ["principal", "principal123", "principal", "Principal", "Administration"],
    ["hod_computer", "password123", "hod", "Dr. Sharvari Govilkar", "Computer Engineering"],
    ["hod_mechanical", "password123", "hod", "Dr. Sandeep Joshi", "Mechanical Engineering"],
    ["hod_automobile", "password123", "hod", "Dr. Amey Marathe", "Automobile Engineering"],
    ["hod_ecs", "password123", "hod", "Dr. Monika Bhagwat", "Electronics & Computer Science"],
    ["hod_extc", "password123", "hod", "Dr. Avinash Vaidya", "Electronics & Telecommunication"],
    ["hod_applied", "password123", "hod", "Dr. Arun Pillai", "Applied Science & Humanities"],
    ["hod_it", "password123", "hod", "Dr. Prashant Nitnaware", "Information Technology"],
    ["neha.ashok", "password123", "faculty", "Prof. Neha Ashok", "Computer Engineering"],
    ["rashmi.gourkar", "password123", "faculty", "Prof. Rashmi Gourkar", "Computer Engineering"],
    ["sangeetha.selvan", "password123", "faculty", "Prof. Sangeetha Selvan", "Computer Engineering"]
  ];

  const existsStmt = db.prepare("SELECT username FROM users WHERE username = ?");
  const insertStmt = db.prepare(`
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
    const found = existsStmt.get(username);
    if (found) continue;

    const hash = bcrypt.hashSync(plainPassword, 10);

    const userData = {
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
    };

    insertStmt.run(userData);
  }
}

function initDatabase() {
  try {
    createTables();
    runSafeMigrations(); // IMPORTANT: safe permanent schema updates
    seedDefaultUsers();

    const totalUsers = db.prepare("SELECT COUNT(*) as c FROM users").get().c;
    console.log("Database initialized successfully.");
    console.log("Total users in DB:", totalUsers);
  } catch (err) {
    console.error("DB INIT ERROR:", err);
    throw err;
  }
}

module.exports = {
  db,
  initDatabase
};