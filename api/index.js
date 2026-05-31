const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../backend/uploads')));

// Import routes
const leaveRoutes = require('../backend/routes/leave');
const hodRoutes = require('../backend/routes/hod');
const principalRoutes = require('../backend/routes/principal');
const registryRoutes = require('../backend/routes/registry');
const authRoutes = require('../backend/routes/auth');

// Initialize database
const { initDatabase } = require('../backend/database/init');
initDatabase();

// Use routes
app.use('/api', leaveRoutes);
app.use('/api', hodRoutes);
app.use('/api', principalRoutes);
app.use('/api', registryRoutes);
app.use('/api', authRoutes);

// Test endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running!' });
});

// Serve frontend
app.use(express.static(path.join(__dirname, '../frontend/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;