const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

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
      return res.status(400).json({ error: 'Please enter a valid email address format.' });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long and contain both letters and numbers.' });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    const existingUsers = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUsers && existingUsers.length > 0) {
      return res.status(400).json({ error: 'An account with this email address already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await db.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, passwordHash, 'student']
    );

    let userId = result.insertId;
    if (!userId) {
      const fetched = await db.query('SELECT id FROM users WHERE email = ?', [email]);
      userId = fetched[0]?.id;
    }

    await db.query(
      'INSERT INTO student_profiles (user_id, phone, college, course, branch, year_of_study) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, phone || '', college, course, branch, year_of_study]
    );

    const token = jwt.sign(
      { id: userId, email, role: 'student', name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      message: 'Student registered successfully!',
      token,
      user: {
        id: userId,
        name,
        email,
        role: 'student',
        profile: {
          phone: phone || '',
          college,
          course,
          branch,
          year_of_study
        }
      }
    });
  } catch (err) {
    console.error('Registration Error:', err);
    return res.status(500).json({ error: 'Failed to register student due to a server error.' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const users = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (!users || users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = users[0];
    const targetPasswordHash = user.password || user.password_hash;

    if (!targetPasswordHash) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const match = await bcrypt.compare(password, targetPasswordHash);

    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const profileRows = await db.query('SELECT * FROM student_profiles WHERE user_id = ?', [user.id]);
    const profile = profileRows && profileRows.length > 0 ? profileRows[0] : null;

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      message: 'Login successful!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile
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
    const users = await db.query('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [userId]);

    if (!users || users.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const user = users[0];
    const profileRows = await db.query('SELECT * FROM student_profiles WHERE user_id = ?', [userId]);
    const profile = profileRows && profileRows.length > 0 ? profileRows[0] : null;

    return res.json({
      user: {
        ...user,
        profile
      }
    });
  } catch (err) {
    console.error('Get Profile Error:', err);
    return res.status(500).json({ error: 'Failed to fetch profile.' });
  }
};
