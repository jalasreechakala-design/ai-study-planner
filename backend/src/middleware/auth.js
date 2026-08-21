const jwt = require('jsonwebtoken');
const { getAuth, getDb } = require('../config/firebase');

async function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];

  if (!authHeader) {
    return res.status(401).json({ error: 'Access denied. No authorization token provided.' });
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;

  try {
    const firebaseAuth = getAuth();
    if (firebaseAuth) {
      const decoded = await firebaseAuth.verifyIdToken(token).catch(() => null);
      if (decoded) {
        const db = getDb();
        let role = 'student';

        if (db) {
          try {
            const userDoc = await db.collection('users').doc(decoded.uid).get();
            if (userDoc.exists) {
              role = userDoc.data().role || 'student';
            }
          } catch (dbErr) {
            console.warn('Unable to read Firebase user role for token verification:', dbErr.message);
          }
        }

        req.user = {
          id: decoded.uid,
          uid: decoded.uid,
          email: decoded.email || null,
          role,
          name: decoded.name || decoded.email || 'User'
        };
        return next();
      }
    }
  } catch (firebaseErr) {
    console.warn('Firebase ID token verification failed, falling back to JWT:', firebaseErr.message);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_study_planner_2026_x987');
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Authorization error: Admin privileges required.' });
    }
    next();
  };
}

module.exports = {
  verifyToken,
  requireRole
};
