const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('./firebase');

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
    const db = getDb();
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password required' });
    }

    // Query Firestore for user by username
    const usersRef = db.collection('users');
    const userSnapshot = await usersRef.where('username', '==', username).limit(1).get();

    if (userSnapshot.empty) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const userDoc = userSnapshot.docs[0];
    const user = userDoc.data();

    // Check if account is deleted
    if (user.deleted_at) {
      return res.status(401).json({ message: 'Account has been deleted. Please restore your account first.' });
    }

    // Check password hash exists
    if (!user.password_hash) {
      console.error('LOGIN ERROR: password_hash missing for user:', username);
      return res.status(500).json({ message: 'Internal Server Error' });
    }

    // Verify password
    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check JWT_SECRET is set
    if (!process.env.JWT_SECRET) {
      console.error('LOGIN ERROR: JWT_SECRET missing');
      return res.status(500).json({ message: 'Server misconfiguration' });
    }

    // Create JWT token
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