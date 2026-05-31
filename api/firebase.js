const admin = require('firebase-admin');

let db = null;
let auth = null;
let initialized = false;

function initializeFirebase() {
  if (initialized) return;

  try {
    // Create service account object from environment variables
    const serviceAccount = {
      type: 'service_account',
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
    };

    // Initialize Firebase Admin SDK
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

    db = admin.firestore();
    auth = admin.auth();
    initialized = true;

    console.log('✓ Firebase initialized successfully');
  } catch (error) {
    console.error('✗ Firebase initialization failed:', error.message);
    throw error;
  }
}

function getDb() {
  if (!db) initializeFirebase();
  return db;
}

function getAuth() {
  if (!auth) initializeFirebase();
  return auth;
}

module.exports = {
  initializeFirebase,
  getDb,
  getAuth
};