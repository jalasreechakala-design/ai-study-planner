const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

let db = null;
let auth = null;
let isInitialized = false;

function initFirebase() {
  if (isInitialized) return { db, auth };

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  let credential = null;

  try {
    if (serviceAccountPath && fs.existsSync(path.resolve(serviceAccountPath))) {
      const serviceAccount = JSON.parse(fs.readFileSync(path.resolve(serviceAccountPath), 'utf8'));
      credential = admin.credential.cert(serviceAccount);
    } else if (projectId && clientEmail && privateKey) {
      if (privateKey.includes('\\n')) {
        privateKey = privateKey.replace(/\\n/g, '\n');
      }
      credential = admin.credential.cert({
        projectId,
        clientEmail,
        privateKey
      });
    } else {
      // Try application default credentials if available
      try {
        credential = admin.credential.applicationDefault();
      } catch (adcErr) {
        credential = null;
      }
    }

    if (credential) {
      admin.initializeApp({
        credential,
        projectId: projectId || undefined
      });
      db = admin.firestore();
      auth = admin.auth();
      isInitialized = true;
      console.log('✅ Firebase Admin SDK initialized successfully.');
    } else {
      console.log('⚠️ Firebase credentials not found in env. Initialized in mock/emulator ready mode.');
    }
  } catch (err) {
    console.error('❌ Error initializing Firebase Admin SDK:', err.message);
  }

  return { db, auth, admin };
}

initFirebase();

module.exports = {
  admin,
  getDb: () => db,
  getAuth: () => auth,
  initFirebase
};
