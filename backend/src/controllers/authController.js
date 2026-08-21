const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getAuth, getDb } = require('../config/firebase');
const firestoreService = require('../services/firestoreService');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_study_planner_2026_x987';

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidPassword(password) {
  return typeof password === 'string' && password.length >= 6 && /[A-Za-z]/.test(password) && /[0-9]/.test(password);
}

exports.registerStudent = async (req, res) => {
  try {
    const { name, email, password, confirmPassword, phone, college, course, branch, year_of_study } = req.body;

    if (!name || !email || !password || !college || !course || !branch || !year_of_study) {
      return res.status(400).json({ error: 'All fields (Name, Email, Password, College, Course, Branch, Year of Study) are required.' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email. Please enter a valid email address.' });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({ error: 'Weak password. Password must be at least 6 characters long and contain both letters and numbers.' });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    const auth = getAuth();

    // 1. Check if email is already registered in Firestore
    const existingFsUser = await firestoreService.getUserByEmail(email).catch(() => null);
    if (existingFsUser) {
      return res.status(400).json({ error: 'Email already registered.' });
    }

    // 2. Check if email is already registered in Firebase Auth
    if (auth) {
      try {
        const existingAuthUser = await auth.getUserByEmail(email);
        if (existingAuthUser) {
          return res.status(400).json({ error: 'Email already registered.' });
        }
      } catch (authErr) {
        if (authErr.code !== 'auth/user-not-found') {
          console.error('Firebase Auth Check Error:', authErr);
        }
      }
    }

    let uid;
    let createdAuthUser = false;
    const profileData = { phone: phone || '', college, course, branch, year_of_study };
    const passwordHash = await bcrypt.hash(password, 10);

    if (auth) {
      try {
        const userRecord = await auth.createUser({
          email,
          password,
          displayName: name
        });
        uid = userRecord.uid;
        createdAuthUser = true;

        await auth.setCustomUserClaims(uid, { role: 'student' });
      } catch (fbAuthErr) {
        console.error('Firebase Auth Create User Error:', fbAuthErr);
        if (fbAuthErr.code === 'auth/email-already-exists') {
          return res.status(400).json({ error: 'Email already registered.' });
        }
        if (fbAuthErr.code === 'auth/invalid-email') {
          return res.status(400).json({ error: 'Invalid email.' });
        }
        if (fbAuthErr.code === 'auth/weak-password') {
          return res.status(400).json({ error: 'Weak password. Password must be at least 6 characters long and contain both letters and numbers.' });
        }
        return res.status(500).json({ error: `Firebase configuration error: ${fbAuthErr.message}` });
      }
    }

    try {
      if (uid) {
        await firestoreService.createUserWithUid(uid, { name, email, role: 'student', password: passwordHash }, profileData);
      } else {
        const createdUser = await firestoreService.createUser({ name, email, role: 'student', password: passwordHash }, profileData);
        uid = createdUser.id || createdUser.uid;
      }
    } catch (fsErr) {
      console.error('Firestore User Profile Creation Error:', fsErr);
      if (createdAuthUser && uid && auth) {
        try {
          await auth.deleteUser(uid);
        } catch (delErr) {
          console.error(`Failed to clean up Firebase Auth user ${uid}:`, delErr);
        }
      }
      return res.status(500).json({ error: `Firestore creation error: ${fsErr.message}` });
    }

    const token = jwt.sign(
      { id: uid, uid, email, role: 'student', name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      message: 'Student registered successfully in Cloud Firestore!',
      token,
      user: {
        id: uid,
        uid,
        name,
        email,
        role: 'student',
        status: 'active',
        profile: profileData
      }
    });
  } catch (err) {
    console.error('Registration Error:', err);
    return res.status(500).json({ error: err.message || 'Failed to register student due to a server error.' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await firestoreService.getUserByEmail(email);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (user.password || user.password_hash) {
      const targetPasswordHash = user.password || user.password_hash;
      const match = await bcrypt.compare(password, targetPasswordHash);
      if (!match) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }
    }

    const userId = user.id || user.uid;

    const token = jwt.sign(
      { id: userId, uid: userId, email: user.email, role: user.role || 'student', name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      message: 'Login successful!',
      token,
      user: {
        id: userId,
        uid: userId,
        name: user.name,
        email: user.email,
        role: user.role || 'student',
        profile: user.profile || null
      }
    });
  } catch (err) {
    console.error('Login Error:', err);
    return res.status(500).json({ error: 'Login failed due to a server error.' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await firestoreService.getUserById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User profile not found in Cloud Firestore.' });
    }

    return res.json({
      user
    });
  } catch (err) {
    console.error('Get Profile Error:', err);
    return res.status(500).json({ error: 'Failed to fetch profile from Cloud Firestore.' });
  }
};
