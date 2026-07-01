import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'placement.db');

let resolveDbReady;
let rejectDbReady;
export const dbReady = new Promise((resolve, reject) => {
  resolveDbReady = resolve;
  rejectDbReady = reject;
});

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
    rejectDbReady(err);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
    initDb();
  }
});

// Helper wrapper to use async/await with SQLite
export const query = {
  run: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  },
  get: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },
  all: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
};

async function initDb() {
  try {
    // Enable foreign key support in SQLite
    await query.run('PRAGMA foreign_keys = ON');

    // 1. Users table
    await query.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('student', 'company', 'admin')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Students table
    await query.run(`
      CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE NOT NULL,
        name TEXT NOT NULL,
        roll_number TEXT UNIQUE NOT NULL,
        branch TEXT NOT NULL,
        cgpa REAL NOT NULL,
        backlogs INTEGER NOT NULL DEFAULT 0,
        resume_url TEXT,
        skills TEXT,
        graduation_year INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);

    // 3. Companies table
    await query.run(`
      CREATE TABLE IF NOT EXISTS companies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE NOT NULL,
        name TEXT NOT NULL,
        industry TEXT,
        website TEXT,
        description TEXT,
        is_approved INTEGER NOT NULL DEFAULT 0, -- 0 = pending, 1 = approved
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);

    // 4. Drives table
    await query.run(`
      CREATE TABLE IF NOT EXISTS drives (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        job_description TEXT NOT NULL,
        role_title TEXT NOT NULL,
        package_lpa REAL NOT NULL,
        min_cgpa REAL NOT NULL,
        max_backlogs INTEGER NOT NULL,
        allowed_branches TEXT NOT NULL, -- JSON array of strings
        drive_date TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('draft', 'active', 'closed')) DEFAULT 'active',
        FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE
      )
    `);

    // 5. Applications table
    await query.run(`
      CREATE TABLE IF NOT EXISTS applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        drive_id INTEGER NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('applied', 'shortlisted', 'rejected', 'selected')) DEFAULT 'applied',
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        feedback TEXT,
        UNIQUE(student_id, drive_id),
        FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE,
        FOREIGN KEY (drive_id) REFERENCES drives (id) ON DELETE CASCADE
      )
    `);

    // 6. Notifications table
    await query.run(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        message TEXT NOT NULL,
        is_read INTEGER NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);

    // Create a default admin account if not exists
    const adminEmail = 'admin@college.edu';
    const existingAdmin = await query.get('SELECT * FROM users WHERE email = ?', [adminEmail]);
    if (!existingAdmin) {
      const hash = await bcrypt.hash('admin123', 10);
      await query.run(
        'INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)',
        [adminEmail, hash, 'admin']
      );
      console.log('Default admin user created: admin@college.edu / admin123');
    }

    console.log('Database tables verified/created successfully.');
    resolveDbReady();
  } catch (err) {
    console.error('Error initializing tables:', err);
    rejectDbReady(err);
  }
}

export default db;
