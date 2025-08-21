// This file is just to test Firestore functionality
const express = require('express');
const admin = require('../config/firebase');
const router = express.Router();

router.post('/test-firestore', async (req, res) => {
  try {
    await admin.firestore().collection('test').add({ hello: 'world', time: Date.now() });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;