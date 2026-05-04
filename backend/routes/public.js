const express = require('express');
const router = express.Router();
const { getDB } = require('../database/db');

// ─── GET /api/public/profile/:token ───────────────────────────────────────────
router.get('/profile/:token', (req, res) => {
  try {
    const db = getDB();
    const emp = db.prepare('SELECT * FROM employees WHERE secure_token = ?').get(req.params.token);
    if (!emp) return res.status(404).json({ success: false, message: 'Profile not found' });

    res.json({
      success: true,
      data: {
        name: emp.name,
        designation: emp.designation,
        department: emp.department,
        dob: emp.dob,
        gender: emp.gender,
        phone: emp.phone,
        emergency_contact: emp.emergency_contact,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load profile' });
  }
});

module.exports = router;
