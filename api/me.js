const jwt = require('jsonwebtoken');
const { getDB, initDatabase } = require('./config');

function authenticateToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw { status: 401, message: 'Unauthorized: Missing token' };
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    throw { status: 401, message: 'Unauthorized: Invalid token' };
  }
}

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

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    initDatabase();
    const db = getDB();

    const user = authenticateToken(req);
    
    const userData = db.prepare('SELECT * FROM users WHERE username = ?').get(user.username);
    
    if (!userData) {
      return res.status(404).json({ message: 'User not found' });
    }

    delete userData.password_hash;
    return res.json(userData);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    console.error('ME ERROR:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};