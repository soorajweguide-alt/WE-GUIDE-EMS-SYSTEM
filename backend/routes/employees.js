const express = require('express');
const router = express.Router();
const { getDB } = require('../database/db');
const { generateSecureToken, buildQrPayload } = require('../utils/crypto');
const { generateQRCodeBase64, generateQRCodeSVG } = require('../utils/qrGenerator');

const BASE_URL = process.env.QR_BASE_URL || 'http://localhost:5000';

// ─── Helper: strip secure_token from output ───────────────────────────────────
function sanitize(emp) {
  if (!emp) return null;
  const { secure_token, ...rest } = emp;
  return rest;
}

// ─── GET /api/employees ────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  try {
    const db = getDB();
    const { search, department } = req.query;

    let sql = 'SELECT * FROM employees WHERE 1=1';
    const params = [];

    if (search) {
      sql += ` AND (name LIKE ? OR employee_id LIKE ? OR designation LIKE ? OR department LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }
    if (department) {
      sql += ' AND department = ?';
      params.push(department);
    }
    sql += ' ORDER BY created_at DESC';

    let list = db.prepare(sql).all(...params);

    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = db.prepare('SELECT * FROM attendance WHERE date = ?').all(today);

    const result = list.map(e => {
      const s = sanitize(e);
      const record = todayAttendance.find(a => a.employee_id === e.employee_id);
      s.present_today = !!record;
      if (record) {
        const scans = JSON.parse(record.scans || '[]');
        const isCheckIn = scans.length % 2 !== 0;
        s.attendance_status = isCheckIn ? 'Checked In' : 'Checked Out';
      } else {
        s.attendance_status = 'Pending';
      }
      return s;
    });

    res.json({ success: true, data: result, count: result.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch employees' });
  }
});

// ─── GET /api/employees/departments ───────────────────────────────────────────
router.get('/departments', (req, res) => {
  const db = getDB();
  const rows = db.prepare('SELECT DISTINCT department FROM employees ORDER BY department').all();
  res.json({ success: true, data: rows.map(r => r.department) });
});

// ─── GET /api/employees/:id ────────────────────────────────────────────────────
router.get('/:id', (req, res) => {
  const db = getDB();
  const emp = db.prepare('SELECT * FROM employees WHERE employee_id = ?').get(req.params.id);
  if (!emp) return res.status(404).json({ success: false, message: 'Employee not found' });
  res.json({ success: true, data: sanitize(emp) });
});

// ─── POST /api/employees ───────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const db = getDB();
    const {
      employee_id, name, designation, department,
      dob, age, gender, blood_group,
      address, phone, emergency_contact
    } = req.body;

    const required = { employee_id, name, designation, department, dob, age, gender, blood_group, address, phone, emergency_contact };
    const missing = Object.entries(required).filter(([, v]) => v === undefined || v === '');
    if (missing.length) {
      return res.status(400).json({ success: false, message: `Missing: ${missing.map(([k]) => k).join(', ')}` });
    }

    const existing = db.prepare('SELECT id FROM employees WHERE employee_id = ?').get(employee_id);
    if (existing) {
      return res.status(409).json({ success: false, message: 'Employee ID already exists' });
    }

    const secure_token = generateSecureToken();
    const github_url   = process.env.GITHUB_PAGES_URL || 'https://weguideai.github.io/employee-profiles';
    const profile_url  = `${github_url.replace(/\/$/, '')}/${name.trim()}.html`;
    const qrPayload    = buildQrPayload(secure_token, profile_url);
    const qr_data      = await generateQRCodeBase64(qrPayload);
    const now          = new Date().toISOString();

    db.prepare(`
      INSERT INTO employees
        (employee_id, name, designation, department, dob, age, gender, blood_group,
         address, phone, emergency_contact, secure_token, profile_url, qr_data, created_at, updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).run(employee_id, name, designation, department, dob, parseInt(age), gender, blood_group,
           address, phone, emergency_contact, secure_token, profile_url, qr_data, now, now);

    const newEmp = db.prepare('SELECT * FROM employees WHERE employee_id = ?').get(employee_id);
    res.status(201).json({ success: true, data: sanitize(newEmp), message: 'Employee created successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to create employee' });
  }
});

// ─── PUT /api/employees/:id ────────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const db = getDB();
    const emp = db.prepare('SELECT * FROM employees WHERE employee_id = ?').get(req.params.id);
    if (!emp) return res.status(404).json({ success: false, message: 'Employee not found' });

    const fields = ['name','designation','department','dob','age','gender','blood_group','address','phone','emergency_contact'];
    const updates = {};
    fields.forEach(f => {
      if (req.body[f] !== undefined) {
        updates[f] = f === 'age' ? parseInt(req.body[f]) : req.body[f];
      }
    });

    if (req.body.profile_url !== undefined && req.body.profile_url !== emp.profile_url) {
      updates.profile_url = req.body.profile_url;
      const qrPayload = buildQrPayload(emp.secure_token, req.body.profile_url);
      updates.qr_data = await generateQRCodeBase64(qrPayload);
    }

    updates.updated_at = new Date().toISOString();

    const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(', ');
    const values = Object.values(updates);
    db.prepare(`UPDATE employees SET ${setClauses} WHERE employee_id = ?`).run(...values, req.params.id);

    const updated = db.prepare('SELECT * FROM employees WHERE employee_id = ?').get(req.params.id);
    res.json({ success: true, data: sanitize(updated), message: 'Employee updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to update employee' });
  }
});

// ─── DELETE /api/employees/:id ─────────────────────────────────────────────────
router.delete('/:id', (req, res) => {
  try {
    const db = getDB();
    const info = db.prepare('DELETE FROM employees WHERE employee_id = ?').run(req.params.id);
    if (info.changes === 0) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    db.prepare('DELETE FROM attendance WHERE employee_id = ?').run(req.params.id);
    res.json({ success: true, message: 'Employee deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to delete employee' });
  }
});

// ─── GET /api/employees/:id/qr ─────────────────────────────────────────────────
router.get('/:id/qr', async (req, res) => {
  try {
    const db = getDB();
    const emp = db.prepare('SELECT * FROM employees WHERE employee_id = ?').get(req.params.id);
    if (!emp) return res.status(404).json({ success: false, message: 'Employee not found' });

    if (req.query.format === 'svg') {
      const svg = await generateQRCodeSVG(buildQrPayload(emp.secure_token, emp.profile_url));
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Content-Disposition', `attachment; filename="qr_${emp.employee_id}.svg"`);
      return res.send(svg);
    }

    res.json({ success: true, data: { qr_base64: emp.qr_data, employee_id: emp.employee_id, name: emp.name } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get QR' });
  }
});

// ─── GET /api/employees/:id/attendance ────────────────────────────────────────
router.get('/:id/attendance', (req, res) => {
  try {
    const db = getDB();
    const { month, year } = req.query;
    let sql = 'SELECT * FROM attendance WHERE employee_id = ?';
    const params = [req.params.id];

    if (month && year) {
      sql += ` AND strftime('%m', date) = ? AND strftime('%Y', date) = ?`;
      params.push(String(month).padStart(2, '0'), String(year));
    }
    sql += ' ORDER BY date DESC';

    const logs = db.prepare(sql).all(...params).map(r => ({
      ...r, scans: JSON.parse(r.scans || '[]')
    }));
    res.json({ success: true, data: logs, count: logs.length });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch attendance' });
  }
});

module.exports = router;
