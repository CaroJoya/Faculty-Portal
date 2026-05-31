const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
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
    
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password required' });
    }

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check for deleted account
    if (user.deleted_at) {
      return res.status(401).json({ message: 'Account has been deleted. Please restore your account first.' });
    }

    if (!user.password_hash) {
      console.error('LOGIN ERROR: password_hash missing for user:', username);
      return res.status(500).json({ message: 'Internal Server Error' });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!process.env.JWT_SECRET) {
      console.error('LOGIN ERROR: JWT_SECRET missing');
      return res.status(500).json({ message: 'Server misconfiguration' });
    }

    const payload = {
      username: user.username,
      role: user.role,
      full_name: user.full_name,
      department: user.department
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: payload
    });
  } catch (error) {
    console.error('LOGIN ERROR:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};