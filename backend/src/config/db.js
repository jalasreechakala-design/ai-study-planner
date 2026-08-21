const path = require('path');
const dotenv = require('dotenv');
const { initFirebase, getDb } = require('./firebase');

// Ensure backend .env is loaded
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function initDB() {
  initFirebase();
  const firestoreDb = getDb();

  if (firestoreDb) {
    console.log(`=======================================================`);
    console.log(`🔥 Connected successfully to Cloud Firestore!`);
    console.log(`=======================================================`);
  } else {
    console.warn(`=======================================================`);
    console.warn(`⚠️ Warning: Cloud Firestore Admin SDK is not initialized.`);
    console.warn(`=======================================================`);
  }

  return true;
}

async function query(sql, params = []) {
  throw new Error('MySQL and Local JSON Fallback storage have been permanently removed. All CRUD operations must use Cloud Firestore via firestoreService.');
}

module.exports = {
  initDB,
  query,
  pool: null
};
