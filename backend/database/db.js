const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_DIR = process.env.USER_DATA_PATH ? path.join(process.env.USER_DATA_PATH, 'database') : path.resolve('./database');
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

const DB_FILE = path.join(DB_DIR, 'weguide.db');

let db;

function initDB() {
  db = new Database(DB_FILE);

  // Enable WAL mode for better performance
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS employees (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id       TEXT UNIQUE NOT NULL,
      name              TEXT NOT NULL,
      designation       TEXT,
      department        TEXT,
      dob               TEXT,
      age               INTEGER,
      gender            TEXT,
      blood_group       TEXT,
      address           TEXT,
      phone             TEXT,
      emergency_contact TEXT,
      secure_token      TEXT UNIQUE,
      profile_url       TEXT,
      qr_data           TEXT,
      created_at        TEXT,
      updated_at        TEXT
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id TEXT NOT NULL,
      date        TEXT NOT NULL,
      time_in     TEXT,
      time_out    TEXT,
      scans       TEXT DEFAULT '[]',
      marked_by   TEXT DEFAULT 'QR_SCANNER',
      UNIQUE(employee_id, date)
    );
  `);

  console.log('✅ SQLite database ready at', DB_FILE);
  return db;
}

function getDB() {
  if (!db) throw new Error('DB not initialised – call initDB() first');
  return db;
}

module.exports = { initDB, getDB };
