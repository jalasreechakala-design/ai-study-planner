const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Ensure backend .env is loaded from backend root directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

let db = null;
let auth = null;
let isInitialized = false;

function initFirebase() {
  if (isInitialized) return { db, auth, admin };

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const googleAppCreds = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  let credential = null;

  // Search candidate paths for service account JSON
  const candidatePaths = [
    serviceAccountPath ? path.resolve(serviceAccountPath) : null,
    serviceAccountPath ? path.resolve(__dirname, '../../', serviceAccountPath) : null,
    path.resolve(__dirname, '../../firebase-service-account.json'),
    path.resolve('./firebase-service-account.json'),
    googleAppCreds ? path.resolve(googleAppCreds) : null
  ].filter(Boolean);

  const foundPath = candidatePaths.find(p => fs.existsSync(p));

  const createCert = (account) => {
    if (typeof admin.cert === 'function') return admin.cert(account);
    if (admin.credential && typeof admin.credential.cert === 'function') return admin.credential.cert(account);
    return null;
  };

  const createAppDefault = () => {
    if (typeof admin.applicationDefault === 'function') return admin.applicationDefault();
    if (admin.credential && typeof admin.credential.applicationDefault === 'function') return admin.credential.applicationDefault();
    return null;
  };

  try {
    if (foundPath) {
      const serviceAccount = JSON.parse(fs.readFileSync(foundPath, 'utf8'));
      credential = createCert(serviceAccount);
      console.log(`🔑 Loaded Firebase Service Account from: ${foundPath}`);
    } else if (projectId && clientEmail && privateKey) {
      let cleanedKey = privateKey.trim();
      if (cleanedKey.startsWith('"') && cleanedKey.endsWith('"')) {
        cleanedKey = cleanedKey.substring(1, cleanedKey.length - 1);
      }
      cleanedKey = cleanedKey.replace(/\\n/g, '\n');

      credential = createCert({
        projectId,
        clientEmail,
        privateKey: cleanedKey
      });
    } else {
      // Try application default credentials if available
      try {
        credential = createAppDefault();
      } catch (adcErr) {
        credential = null;
      }
    }

    if (credential) {
      const apps = admin.getApps ? admin.getApps() : [];
      if (apps.length === 0) {
        admin.initializeApp({
          credential,
          projectId: projectId || undefined
        });
      }
      
      const { getFirestore } = require('firebase-admin/firestore');
      const { getAuth: getAdminAuth } = require('firebase-admin/auth');

      db = typeof admin.firestore === 'function' ? admin.firestore() : getFirestore();
      auth = typeof admin.auth === 'function' ? admin.auth() : getAdminAuth();
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
