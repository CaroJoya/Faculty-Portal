const jwt = require('jsonwebtoken');
const { getDb } = require('./firebase');

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
    const db = getDb();

    // Verify JWT token from Authorization header
    const user = authenticateToken(req);

    // Query Firestore for user data
    const usersRef = db.collection('users');
    const userSnapshot = await usersRef.where('username', '==', user.username).limit(1).get();

    if (userSnapshot.empty) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userData = userSnapshot.docs[0].data();
    
    // Don't send password hash to client
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