/**
 * migrate_json_to_sqlite.js
 * Run once: node migrate_json_to_sqlite.js
 * Imports all data from weguide.json into the SQLite database.
 */

const path = require('path');
const fs   = require('fs');
const { initDB, getDB } = require('./database/db');

const JSON_FILE = path.resolve('./database/weguide.json');

if (!fs.existsSync(JSON_FILE)) {
  console.log('⚠️  No weguide.json found – nothing to migrate.');
  process.exit(0);
}

const json = JSON.parse(fs.readFileSync(JSON_FILE, 'utf-8'));
initDB();
const db = getDB();

// ── Migrate employees ─────────────────────────────────────────────────────────
const insertEmp = db.prepare(`
  INSERT OR IGNORE INTO employees
    (employee_id, name, designation, department, dob, age, gender, blood_group,
     address, phone, emergency_contact, secure_token, profile_url, qr_data, created_at, updated_at)
  VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
`);

let empCount = 0;
const migrateEmps = db.transaction(() => {
  for (const e of (json.employees || [])) {
    insertEmp.run(
      e.employee_id, e.name, e.designation, e.department,
      e.dob, e.age, e.gender, e.blood_group,
      e.address, e.phone, e.emergency_contact,
      e.secure_token, e.profile_url, e.qr_data,
      e.created_at || new Date().toISOString(),
      e.updated_at || new Date().toISOString()
    );
    empCount++;
  }
});
migrateEmps();
console.log(`✅ Migrated ${empCount} employees`);

// ── Migrate attendance ────────────────────────────────────────────────────────
const insertAtt = db.prepare(`
  INSERT OR IGNORE INTO attendance
    (employee_id, date, time_in, time_out, scans, marked_by)
  VALUES (?,?,?,?,?,?)
`);

let attCount = 0;
const migrateAtt = db.transaction(() => {
  for (const a of (json.attendance || [])) {
    const scans = a.scans ? JSON.stringify(a.scans) : JSON.stringify([a.time_in].filter(Boolean));
    insertAtt.run(
      a.employee_id, a.date, a.time_in || null, a.time_out || null,
      scans, a.marked_by || 'QR_SCANNER'
    );
    attCount++;
  }
});
migrateAtt();
console.log(`✅ Migrated ${attCount} attendance records`);
console.log('\n🎉 Migration complete! SQLite database is ready.');
console.log('   You can now delete weguide.json if you wish.\n');
