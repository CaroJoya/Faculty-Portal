const bcrypt = require('bcryptjs');
const { getDB, initDatabase } = require('./config');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    initDatabase();
    const db = getDB();

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
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const validRoles = ['faculty', 'hod', 'principal', 'registry', 'headclerk', 'officestaff'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role value' });
    }

    const existing = db
      .prepare('SELECT username, email FROM users WHERE username = ? OR email = ?')
      .get(username, email);

    if (existing) {
      return res.status(409).json({ message: 'Username or email already exists' });
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
      designation || 'Faculty',
      role,
      phone_number || null,
      role === 'hod' ? 1 : 0,
      role === 'registry' ? 1 : 0,
      role === 'principal' ? 1 : 0,
      role === 'hod' ? department : null,
      date_of_joining || null
    );

    return res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('REGISTER ERROR:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};