const express = require('express');
const jwt = require('jsonwebtoken');
const admin = require('../config/firebase');
const { addUserToFirestore, getUserProfile } = require('../services/firestore');

const router = express.Router();

// Firebase-based registration (after Firebase Auth on frontend)
router.post('/firebase-register', async (req, res) => {
  try {
    const idToken = req.headers.authorization?.split(' ')[1];
    if (!idToken) return res.status(401).json({ error: 'No token provided' });

    // Verify Firebase ID token
    const decoded = await admin.auth().verifyIdToken(idToken);

    // Optionally, create user profile in Firestore if not exists
    await addUserToFirestore(decoded.uid, {
      email: decoded.email,
      displayName: req.body.displayName || decoded.name,
      createdAt: new Date().toISOString()
    });

    // Issue your own JWT
    const token = jwt.sign(
      { uid: decoded.uid, email: decoded.email, displayName: req.body.displayName || decoded.name },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        uid: decoded.uid,
        email: decoded.email,
        displayName: req.body.displayName || decoded.name
      }
    });
  } catch (error) {
    console.error('Error in firebase-register:', error);
    res.status(400).json({ error: error.message || 'Error in firebase-register' });
  }
});

// Firebase-based login (after Firebase Auth on frontend)
router.post('/firebase-login', async (req, res) => {
  try {
    const idToken = req.headers.authorization?.split(' ')[1];
    if (!idToken) return res.status(401).json({ error: 'No token provided' });

    // Verify Firebase ID token
    const decoded = await admin.auth().verifyIdToken(idToken);

    // Optionally, fetch user profile from Firestore
    const userData = await getUserProfile(decoded.uid);

    // Issue your own JWT
    const token = jwt.sign(
      { uid: decoded.uid, email: decoded.email, displayName: userData?.displayName || decoded.name },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        uid: decoded.uid,
        email: decoded.email,
        displayName: userData?.displayName || decoded.name
      }
    });
  } catch (error) {
    console.error('Error in firebase-login:', error);
    res.status(401).json({ error: error.message || 'Error in firebase-login' });
  }
});

// Verificar token
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ valid: false });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ valid: true, user: decoded });
  } catch (error) {
    res.status(401).json({ valid: false });
  }
});

module.exports = router;