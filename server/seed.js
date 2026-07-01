import bcrypt from 'bcryptjs';
import { query, dbReady } from './db.js';

async function seedData() {
  console.log('Seeding mock placement database...');

  try {
    // Wait deterministically for database tables to be initialized
    await dbReady;

    // Enable foreign keys
    await query.run('PRAGMA foreign_keys = ON');

    // Clear existing dynamic seed data to prevent duplicate unique key violations
    await query.run('DELETE FROM students WHERE roll_number IN (?, ?)', ['22CSE045', '22ECE012']);
    await query.run('DELETE FROM companies WHERE name IN (?, ?)', ['Stripe Inc.', 'Atlassian']);
    await query.run('DELETE FROM users WHERE email IN (?, ?, ?, ?)', [
      'jane.doe@college.edu',
      'john.smith@college.edu',
      'hiring@stripe.com',
      'careers@atlassian.com'
    ]);

    const pwHash = await bcrypt.hash('password123', 10);

    // 1. Create Students
    const resS1 = await query.run(
      'INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)',
      ['jane.doe@college.edu', pwHash, 'student']
    );
    await query.run(
      `INSERT INTO students (user_id, name, roll_number, branch, cgpa, backlogs, skills, graduation_year, resume_url) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [resS1.lastID, 'Jane Doe', '22CSE045', 'CSE', 9.1, 0, 'React, Node.js, SQLite, Python', 2027, '/uploads/mock-resume.pdf']
    );

    const resS2 = await query.run(
      'INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)',
      ['john.smith@college.edu', pwHash, 'student']
    );
    await query.run(
      `INSERT INTO students (user_id, name, roll_number, branch, cgpa, backlogs, skills, graduation_year) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [resS2.lastID, 'John Smith', '22ECE012', 'ECE', 7.2, 1, 'C++, Embedded Systems, Verilog', 2027]
    );

    // 2. Create Companies (Stripe approved, Atlassian pending)
    const resC1 = await query.run(
      'INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)',
      ['hiring@stripe.com', pwHash, 'company']
    );
    const stripeResult = await query.run(
      `INSERT INTO companies (user_id, name, industry, website, description, is_approved) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [resC1.lastID, 'Stripe Inc.', 'Fintech', 'https://stripe.com', 'Stripe builds financial infrastructure for the internet.', 1]
    );

    const resC2 = await query.run(
      'INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)',
      ['careers@atlassian.com', pwHash, 'company']
    );
    await query.run(
      `INSERT INTO companies (user_id, name, industry, website, description, is_approved) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [resC2.lastID, 'Atlassian', 'Collaboration Software', 'https://atlassian.com', 'Atlassian makes tools like Jira and Confluence.', 0]
    );

    // 3. Create Drives for approved company (Stripe)
    const stripeId = stripeResult.lastID;
    const branchesJson = JSON.stringify(['CSE', 'ECE']);
    
    const driveResult1 = await query.run(
      `INSERT INTO drives (company_id, title, job_description, role_title, package_lpa, min_cgpa, max_backlogs, allowed_branches, drive_date, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        stripeId,
        'Stripe Graduate Software Engineer Intake 2026',
        'Looking for outstanding frontend and full-stack engineering graduates to join our infrastructure teams.',
        'Software Engineer',
        18.5,
        8.0,
        0,
        branchesJson,
        '2026-08-15',
        'active'
      ]
    );

    const driveResult2 = await query.run(
      `INSERT INTO drives (company_id, title, job_description, role_title, package_lpa, min_cgpa, max_backlogs, allowed_branches, drive_date, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        stripeId,
        'Stripe Systems Reliability Internships',
        'Systems role focused on automation, infrastructure orchestration, and cloud observability.',
        'SRE Intern',
        12.0,
        7.0,
        2,
        branchesJson,
        '2026-09-01',
        'active'
      ]
    );

    // 4. Create an Application for Jane on Stripe SRE Intern
    const studentJane = await query.get('SELECT id FROM students WHERE name = ?', ['Jane Doe']);
    await query.run(
      'INSERT INTO applications (student_id, drive_id, status, feedback) VALUES (?, ?, ?, ?)',
      [studentJane.id, driveResult2.lastID, 'shortlisted', 'Excellent profile and resume details. Shortlisted for interview round.']
    );

    // 5. Create some notifications
    const janeUser = await query.get('SELECT id FROM users WHERE email = ?', ['jane.doe@college.edu']);
    await query.run(
      'INSERT INTO notifications (user_id, message, is_read) VALUES (?, ?, ?)',
      [janeUser.id, 'Welcome to the college placement portal!', 1]
    );
    await query.run(
      'INSERT INTO notifications (user_id, message, is_read) VALUES (?, ?, ?)',
      [janeUser.id, 'Your application for Stripe Systems Reliability Internships has been SHORTLISTED.', 0]
    );

    console.log('Seed operations finished successfully!');
  } catch (err) {
    console.error('Error seeding data:', err);
  }
}

seedData();
