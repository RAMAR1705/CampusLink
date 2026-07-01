import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from './db.js';
import { authenticateToken, requireRole, JWT_SECRET } from './middleware.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadDir));

// Multer storage configuration for resumes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'resume-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// ==========================================
// 1. AUTHENTICATION ENDPOINTS
// ==========================================

app.post('/api/auth/register', async (req, res) => {
  const { email, password, role, name, extraData } = req.body;

  if (!email || !password || !role || !name) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const existingUser = await query.get('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hash = await bcrypt.hash(password, 10);
    const userResult = await query.run(
      'INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)',
      [email, hash, role]
    );
    const userId = userResult.lastID;

    if (role === 'student') {
      const rollNumber = extraData?.rollNumber || 'STU' + Math.floor(Math.random() * 100000);
      const branch = extraData?.branch || 'CSE';
      const cgpa = extraData?.cgpa || 0.0;
      const backlogs = extraData?.backlogs || 0;
      const graduationYear = extraData?.graduationYear || new Date().getFullYear() + 1;

      await query.run(
        `INSERT INTO students (user_id, name, roll_number, branch, cgpa, backlogs, skills, graduation_year) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, name, rollNumber, branch, cgpa, backlogs, '', graduationYear]
      );
    } else if (role === 'company') {
      const industry = extraData?.industry || '';
      const website = extraData?.website || '';
      const description = extraData?.description || '';
      
      await query.run(
        `INSERT INTO companies (user_id, name, industry, website, description, is_approved) 
         VALUES (?, ?, ?, ?, ?, 0)`, // Pending approval by default
        [userId, name, industry, website, description]
      );
    }

    res.status(201).json({ message: 'User registered successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Missing email or password' });
  }

  try {
    const user = await query.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    let profile = null;
    if (user.role === 'student') {
      profile = await query.get('SELECT * FROM students WHERE user_id = ?', [user.id]);
    } else if (user.role === 'company') {
      profile = await query.get('SELECT * FROM companies WHERE user_id = ?', [user.id]);
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
      expiresIn: '1d'
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      },
      profile
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during login' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await query.get('SELECT id, email, role, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!user) return res.status(404).json({ message: 'User not found' });

    let profile = null;
    if (user.role === 'student') {
      profile = await query.get('SELECT * FROM students WHERE user_id = ?', [user.id]);
    } else if (user.role === 'company') {
      profile = await query.get('SELECT * FROM companies WHERE user_id = ?', [user.id]);
    }

    res.json({ user, profile });
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching profile' });
  }
});

// ==========================================
// 2. STUDENT PORTAL ENDPOINTS
// ==========================================

app.put('/api/student/profile', authenticateToken, requireRole(['student']), async (req, res) => {
  const { name, branch, rollNumber, cgpa, backlogs, skills, graduationYear } = req.body;
  try {
    await query.run(
      `UPDATE students 
       SET name = ?, branch = ?, roll_number = ?, cgpa = ?, backlogs = ?, skills = ?, graduation_year = ? 
       WHERE user_id = ?`,
      [name, branch, rollNumber, cgpa, backlogs, skills, graduationYear, req.user.id]
    );
    const updated = await query.get('SELECT * FROM students WHERE user_id = ?', [req.user.id]);
    res.json({ message: 'Profile updated successfully', profile: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update student profile' });
  }
});

app.post('/api/student/upload-resume', authenticateToken, requireRole(['student']), upload.single('resume'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const fileUrl = `/uploads/${req.file.filename}`;
  try {
    await query.run('UPDATE students SET resume_url = ? WHERE user_id = ?', [fileUrl, req.user.id]);
    res.json({ message: 'Resume uploaded successfully', resumeUrl: fileUrl });
  } catch (err) {
    res.status(500).json({ message: 'Failed to save resume path' });
  }
});

app.get('/api/student/drives', authenticateToken, requireRole(['student']), async (req, res) => {
  try {
    const student = await query.get('SELECT * FROM students WHERE user_id = ?', [req.user.id]);
    if (!student) return res.status(404).json({ message: 'Student profile not found' });

    const drives = await query.all(`
      SELECT d.*, c.name as company_name, c.industry as company_industry,
             a.status as application_status, a.applied_at, a.feedback
      FROM drives d
      JOIN companies c ON d.company_id = c.id
      LEFT JOIN applications a ON d.id = a.drive_id AND a.student_id = ?
      WHERE d.status = 'active'
    `, [student.id]);

    const processedDrives = drives.map(drive => {
      const allowed = JSON.parse(drive.allowed_branches || '[]');
      const branchMatch = allowed.length === 0 || allowed.includes(student.branch);
      const cgpaMatch = student.cgpa >= drive.min_cgpa;
      const backlogMatch = student.backlogs <= drive.max_backlogs;
      const isEligible = branchMatch && cgpaMatch && backlogMatch;

      return {
        ...drive,
        isEligible,
        eligibilityDetails: {
          branchMatch,
          cgpaMatch,
          backlogMatch
        }
      };
    });

    res.json(processedDrives);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load drives' });
  }
});

app.post('/api/student/apply', authenticateToken, requireRole(['student']), async (req, res) => {
  const { driveId } = req.body;
  try {
    const student = await query.get('SELECT * FROM students WHERE user_id = ?', [req.user.id]);
    const drive = await query.get('SELECT * FROM drives WHERE id = ?', [driveId]);

    if (!student || !drive) {
      return res.status(404).json({ message: 'Student or Drive not found' });
    }

    if (!student.resume_url) {
      return res.status(400).json({ message: 'Please upload your resume before applying' });
    }

    const allowed = JSON.parse(drive.allowed_branches || '[]');
    const branchMatch = allowed.length === 0 || allowed.includes(student.branch);
    const cgpaMatch = student.cgpa >= drive.min_cgpa;
    const backlogMatch = student.backlogs <= drive.max_backlogs;

    if (!branchMatch || !cgpaMatch || !backlogMatch) {
      return res.status(400).json({ message: 'You are not eligible for this drive' });
    }

    await query.run(
      'INSERT INTO applications (student_id, drive_id, status) VALUES (?, ?, ?)',
      [student.id, driveId, 'applied']
    );

    // Create system notification for student
    await query.run(
      'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
      [req.user.id, `Successfully applied to ${drive.title} (${drive.role_title})`]
    );

    res.json({ message: 'Application submitted successfully' });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint')) {
      return res.status(400).json({ message: 'You have already applied to this drive' });
    }
    res.status(500).json({ message: 'Application submission failed' });
  }
});

app.get('/api/student/notifications', authenticateToken, async (req, res) => {
  try {
    const notifications = await query.all(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

app.post('/api/student/notifications/read', authenticateToken, async (req, res) => {
  try {
    await query.run('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [req.user.id]);
    res.json({ message: 'Notifications marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update notifications' });
  }
});

// ==========================================
// 3. COMPANY PORTAL ENDPOINTS
// ==========================================

app.put('/api/company/profile', authenticateToken, requireRole(['company']), async (req, res) => {
  const { name, industry, website, description } = req.body;
  try {
    await query.run(
      `UPDATE companies 
       SET name = ?, industry = ?, website = ?, description = ? 
       WHERE user_id = ?`,
      [name, industry, website, description, req.user.id]
    );
    const updated = await query.get('SELECT * FROM companies WHERE user_id = ?', [req.user.id]);
    res.json({ message: 'Profile updated successfully', profile: updated });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update company profile' });
  }
});

app.post('/api/company/drives', authenticateToken, requireRole(['company']), async (req, res) => {
  const { title, job_description, role_title, package_lpa, min_cgpa, max_backlogs, allowed_branches, drive_date } = req.body;
  try {
    const company = await query.get('SELECT * FROM companies WHERE user_id = ?', [req.user.id]);
    if (!company) return res.status(404).json({ message: 'Company profile not found' });
    if (!company.is_approved) {
      return res.status(403).json({ message: 'Your account is pending admin approval. You cannot create job drives yet.' });
    }

    const branchesStr = JSON.stringify(allowed_branches || []);
    await query.run(
      `INSERT INTO drives (company_id, title, job_description, role_title, package_lpa, min_cgpa, max_backlogs, allowed_branches, drive_date, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
      [company.id, title, job_description, role_title, package_lpa, min_cgpa, max_backlogs, branchesStr, drive_date]
    );

    res.status(201).json({ message: 'Placement drive created successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create placement drive' });
  }
});

app.get('/api/company/drives', authenticateToken, requireRole(['company']), async (req, res) => {
  try {
    const company = await query.get('SELECT id FROM companies WHERE user_id = ?', [req.user.id]);
    if (!company) return res.status(404).json({ message: 'Company not found' });

    const drives = await query.all('SELECT * FROM drives WHERE company_id = ? ORDER BY id DESC', [company.id]);
    res.json(drives);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch drives' });
  }
});

app.get('/api/company/drives/:id/applicants', authenticateToken, requireRole(['company']), async (req, res) => {
  const driveId = req.params.id;
  try {
    const company = await query.get('SELECT id FROM companies WHERE user_id = ?', [req.user.id]);
    const drive = await query.get('SELECT id FROM drives WHERE id = ? AND company_id = ?', [driveId, company.id]);
    if (!drive) return res.status(403).json({ message: 'Access denied to this drive information' });

    const applicants = await query.all(`
      SELECT a.id as application_id, a.status, a.applied_at, a.feedback,
             s.name as student_name, s.roll_number, s.branch, s.cgpa, s.backlogs, s.resume_url, s.skills, s.graduation_year,
             s.user_id as student_user_id
      FROM applications a
      JOIN students s ON a.student_id = s.id
      WHERE a.drive_id = ?
    `, [driveId]);

    res.json(applicants);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load applicants' });
  }
});

app.post('/api/company/applications/:id/status', authenticateToken, requireRole(['company']), async (req, res) => {
  const applicationId = req.params.id;
  const { status, feedback } = req.body; // 'shortlisted', 'selected', 'rejected'
  try {
    const appInfo = await query.get(`
      SELECT a.*, s.user_id as student_user_id, d.title as drive_title, d.role_title
      FROM applications a
      JOIN students s ON a.student_id = s.id
      JOIN drives d ON a.drive_id = d.id
      WHERE a.id = ?
    `, [applicationId]);

    if (!appInfo) return res.status(404).json({ message: 'Application not found' });

    await query.run(
      'UPDATE applications SET status = ?, feedback = ? WHERE id = ?',
      [status, feedback || '', applicationId]
    );

    // Notify the student
    const notifMsg = `Your application for ${appInfo.drive_title} (${appInfo.role_title}) has been updated to: ${status.toUpperCase()}.`;
    await query.run(
      'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
      [appInfo.student_user_id, notifMsg]
    );

    res.json({ message: 'Candidate status updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update application status' });
  }
});

// ==========================================
// 4. ADMIN PORTAL ENDPOINTS
// ==========================================

app.get('/api/admin/companies', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const companies = await query.all(`
      SELECT c.*, u.email 
      FROM companies c
      JOIN users u ON c.user_id = u.id
      ORDER BY c.id DESC
    `);
    res.json(companies);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch companies list' });
  }
});

app.post('/api/admin/companies/:id/approve', authenticateToken, requireRole(['admin']), async (req, res) => {
  const companyId = req.params.id;
  const { approve } = req.body; // Boolean
  try {
    const company = await query.get('SELECT * FROM companies WHERE id = ?', [companyId]);
    if (!company) return res.status(404).json({ message: 'Company not found' });

    const isApprovedVal = approve ? 1 : 0;
    await query.run('UPDATE companies SET is_approved = ? WHERE id = ?', [isApprovedVal, companyId]);

    // Send notification to company owner
    const statusMsg = approve 
      ? 'Your company account has been APPROVED by the administrator. You can now post jobs.'
      : 'Your company approval status has been updated to PENDING.';
    await query.run(
      'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
      [company.user_id, statusMsg]
    );

    res.json({ message: `Company status updated to ${approve ? 'Approved' : 'Pending'}` });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update company approval status' });
  }
});

app.get('/api/admin/students', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const students = await query.all(`
      SELECT s.*, u.email 
      FROM students s
      JOIN users u ON s.user_id = u.id
      ORDER BY s.roll_number ASC
    `);
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch students list' });
  }
});

app.get('/api/admin/drives', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const drives = await query.all(`
      SELECT d.*, c.name as company_name 
      FROM drives d
      JOIN companies c ON d.company_id = c.id
      ORDER BY d.id DESC
    `);
    res.json(drives);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch drives list' });
  }
});

app.get('/api/admin/analytics', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const totalStudents = await query.get('SELECT COUNT(*) as count FROM students');
    const totalCompanies = await query.get('SELECT COUNT(*) as count FROM companies');
    const totalDrives = await query.get('SELECT COUNT(*) as count FROM drives');
    const totalApplications = await query.get('SELECT COUNT(*) as count FROM applications');

    const placedStudents = await query.get(`
      SELECT COUNT(DISTINCT student_id) as count 
      FROM applications 
      WHERE status = 'selected'
    `);

    // Placements by branch
    const branchPlacements = await query.all(`
      SELECT s.branch, COUNT(DISTINCT s.id) as placed_count
      FROM students s
      JOIN applications a ON s.id = a.student_id
      WHERE a.status = 'selected'
      GROUP BY s.branch
    `);

    // Total students by branch
    const branchTotals = await query.all(`
      SELECT branch, COUNT(*) as total_count
      FROM students
      GROUP BY branch
    `);

    // Job offers breakdown by company
    const companyHires = await query.all(`
      SELECT c.name as company_name, COUNT(*) as hires_count
      FROM applications a
      JOIN drives d ON a.drive_id = d.id
      JOIN companies c ON d.company_id = c.id
      WHERE a.status = 'selected'
      GROUP BY c.id
    `);

    res.json({
      summary: {
        totalStudents: totalStudents.count,
        totalCompanies: totalCompanies.count,
        totalDrives: totalDrives.count,
        totalApplications: totalApplications.count,
        placedStudents: placedStudents.count,
        placementRate: totalStudents.count > 0 ? ((placedStudents.count / totalStudents.count) * 100).toFixed(1) : 0
      },
      branchStats: {
        placements: branchPlacements,
        totals: branchTotals
      },
      companyHires
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to generate analytics' });
  }
});

// Serve frontend static assets in production
const clientDistDir = path.join(__dirname, '../client/dist');
app.use(express.static(clientDistDir));

// Catch-all route to serve React's index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDistDir, 'index.html'));
});

// Start backend server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Express server running on http://localhost:${PORT}`);
});
