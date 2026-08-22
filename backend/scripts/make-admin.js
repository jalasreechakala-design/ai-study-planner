/**
 * Script: make-admin.js
 * Usage: node backend/scripts/make-admin.js <user-email>
 * Example: node backend/scripts/make-admin.js admin@example.com
 *
 * Description:
 * Grants the 'admin' role to an existing Firebase user account by:
 * 1. Setting Firebase Auth Custom User Claim { role: 'admin' }
 * 2. Updating the Cloud Firestore document at users/{uid} with role: 'admin'
 */

const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { getAuth, getDb } = require('../src/config/firebase');

async function makeAdmin() {
  const email = process.argv[2];

  if (!email) {
    console.error('❌ Error: Please provide an email address.');
    console.log('Usage: node backend/scripts/make-admin.js <user-email>');
    process.exit(1);
  }

  const auth = getAuth();
  const db = getDb();

  if (!auth) {
    console.error('❌ Error: Firebase Auth Admin SDK is not initialized.');
    console.error('Please verify your firebase-service-account.json or environment variables in backend/.env');
    process.exit(1);
  }

  try {
    console.log(`🔍 Looking up Firebase user by email: ${email}...`);
    const userRecord = await auth.getUserByEmail(email);
    const uid = userRecord.uid;

    console.log(`✅ Found Firebase User! UID: ${uid}`);

    // 1. Set Custom User Claim
    console.log('🔐 Setting Firebase Custom Claim role="admin"...');
    await auth.setCustomUserClaims(uid, { role: 'admin' });
    console.log('✅ Firebase Custom Claim updated successfully!');

    // 2. Update Firestore User Profile
    if (db) {
      console.log('📁 Updating Cloud Firestore user profile role="admin"...');
      await db.collection('users').doc(uid).set({
        role: 'admin',
        updatedAt: new Date().toISOString()
      }, { merge: true });
      console.log('✅ Cloud Firestore user profile updated successfully!');
    }

    console.log('=======================================================');
    console.log(`🎉 SUCCESS: User ${email} (UID: ${uid}) is now an ADMIN!`);
    console.log('You can now log in using the Admin Login page.');
    console.log('=======================================================');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to assign Admin role:', err.message);
    process.exit(1);
  }
}

makeAdmin();
