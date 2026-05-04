const express = require('express');
const router = express.Router();
const { getDB } = require('../database/db');

// ─── POST /api/attendance/scan ────────────────────────────────────────────────
router.post('/scan', (req, res) => {
  try {
    const db = getDB();
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, message: 'Token required' });

    // Match by secure_token first, then employee_id, then name
    let employee = db.prepare('SELECT * FROM employees WHERE secure_token = ?').get(token);

    if (!employee) {
      let cleanToken = decodeURIComponent(token).trim();
      if (cleanToken.toLowerCase().endsWith('.html')) cleanToken = cleanToken.slice(0, -5);
      const cName = cleanToken.toLowerCase();

      // Try employee_id match
      employee = db.prepare('SELECT * FROM employees WHERE LOWER(employee_id) = ?').get(cName);

      // Try name match
      if (!employee) {
        const all = db.prepare('SELECT * FROM employees').all();
        employee = all.find(e => {
          const eName = (e.name || '').toLowerCase();
          return eName === cName || eName.replace(/ /g, '_') === cName || eName.replace(/ /g, '') === cName;
        });
      }
    }

    if (!employee) return res.status(404).json({ success: false, message: 'Invalid QR token' });

    const today  = new Date().toISOString().split('T')[0];
    const timeIn = new Date().toLocaleTimeString('en-IN', { hour12: true });

    const existing = db.prepare('SELECT * FROM attendance WHERE employee_id = ? AND date = ?').get(employee.employee_id, today);

    if (existing) {
      const scans = JSON.parse(existing.scans || '[]');
      scans.push(timeIn);
      const isCheckIn = scans.length % 2 !== 0;
      const newTimeOut = isCheckIn ? existing.time_out : timeIn;

      db.prepare('UPDATE attendance SET scans = ?, time_out = ? WHERE employee_id = ? AND date = ?')
        .run(JSON.stringify(scans), newTimeOut, employee.employee_id, today);

      return res.json({
        success: true,
        action: isCheckIn ? 'check_in' : 'check_out',
        message: `${isCheckIn ? 'Check-in' : 'Check-out'} recorded for ${employee.name}`,
        data: {
          name: employee.name,
          employee_id: employee.employee_id,
          designation: employee.designation,
          department: employee.department,
          time_in: existing.time_in,
          time_out: newTimeOut,
          date: today,
        }
      });
    }

    // New attendance record for today
    db.prepare(`
      INSERT INTO attendance (employee_id, date, time_in, time_out, scans, marked_by)
      VALUES (?, ?, ?, NULL, ?, 'QR_SCANNER')
    `).run(employee.employee_id, today, timeIn, JSON.stringify([timeIn]));

    res.json({
      success: true,
      action: 'check_in',
      message: `Check-in recorded for ${employee.name}`,
      data: {
        name: employee.name,
        employee_id: employee.employee_id,
        designation: employee.designation,
        department: employee.department,
        time_in: timeIn,
        time_out: null,
        date: today,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to mark attendance' });
  }
});

// ─── GET /api/attendance ──────────────────────────────────────────────────────
router.get('/', (req, res) => {
  try {
    const db = getDB();
    const { date, employee_id } = req.query;

    let sql = `
      SELECT a.*, e.name, e.designation, e.department
      FROM attendance a
      LEFT JOIN employees e ON e.employee_id = a.employee_id
      WHERE 1=1
    `;
    const params = [];

    if (date)        { sql += ' AND a.date = ?';        params.push(date); }
    if (employee_id) { sql += ' AND a.employee_id = ?'; params.push(employee_id); }
    sql += ' ORDER BY a.date DESC, a.id DESC';

    const records = db.prepare(sql).all(...params).map(r => ({
      ...r, scans: JSON.parse(r.scans || '[]')
    }));

    res.json({ success: true, data: records, count: records.length });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch attendance' });
  }
});

// ─── GET /api/attendance/today ────────────────────────────────────────────────
router.get('/today', (req, res) => {
  try {
    const db = getDB();
    const today = new Date().toISOString().split('T')[0];

    const records = db.prepare(`
      SELECT a.*, e.name, e.designation, e.department
      FROM attendance a
      LEFT JOIN employees e ON e.employee_id = a.employee_id
      WHERE a.date = ?
      ORDER BY a.time_in ASC
    `).all(today).map(r => ({ ...r, scans: JSON.parse(r.scans || '[]') }));

    res.json({
      success: true,
      data: records,
      count: records.length,
      total_employees: db.prepare('SELECT COUNT(*) as c FROM employees').get().c,
      date: today,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch today attendance' });
  }
});

// ─── GET /api/attendance/stats ────────────────────────────────────────────────
router.get('/stats', (req, res) => {
  try {
    const db = getDB();
    const today = new Date().toISOString().split('T')[0];
    const month = today.substring(0, 7);

    const totalEmployees = db.prepare('SELECT COUNT(*) as c FROM employees').get().c;
    const todayPresent   = db.prepare('SELECT COUNT(*) as c FROM attendance WHERE date = ?').get(today).c;
    const totalLogs      = db.prepare('SELECT COUNT(*) as c FROM attendance').get().c;
    const monthLogs      = db.prepare("SELECT COUNT(*) as c FROM attendance WHERE date LIKE ?").get(`${month}%`).c;

    res.json({
      success: true,
      data: {
        total_employees: totalEmployees,
        today_present: todayPresent,
        today_absent: totalEmployees - todayPresent,
        total_logs: totalLogs,
        this_month_logs: monthLogs,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
});

module.exports = router;
