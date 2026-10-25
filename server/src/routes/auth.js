import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query, memoryStore } from '../db/index.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_hr_jwt_key_2026_xyz123';

/**
 * POST /api/auth/login
 * Body: { email, password, role }
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    // Lookup user in DB
    let user = null;
    let fromDb = false;

    try {
      const dbRes = await query(`SELECT * FROM users WHERE LOWER(email) = LOWER($1)`, [email.trim()]);
      if (dbRes.rows && dbRes.rows.length > 0) {
        user = dbRes.rows[0];
        fromDb = true;
      }
    } catch {
      // Memory fallback
    }

    if (!user) {
      user = memoryStore.users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Role check (if specified)
    if (role && user.role !== role) {
      return res.status(401).json({
        success: false,
        message: `Account found, but role is "${user.role.toUpperCase()}". Please switch to the ${user.role.toUpperCase()} login tab.`
      });
    }

    // Verify status
    if (user.status === 'inactive') {
      return res.status(403).json({ success: false, message: 'Your account is deactivated. Contact HR.' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const safeUser = {
      id: user.id,
      emp_code: user.emp_code,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      designation: user.designation,
      phone: user.phone,
      joining_date: user.joining_date,
      status: user.status,
    };

    return res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: safeUser,
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Server error during login.' });
  }
});

/**
 * POST /api/auth/register-employee
 * First-time employee registration & password setup
 * Body: { email, password }
 */
router.post('/register-employee', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    if (password.length < 4) {
      return res.status(400).json({ success: false, message: 'Password must be at least 4 characters long.' });
    }

    const emailClean = email.trim().toLowerCase();

    // 1. Verify if employee was already added by HR
    let user = null;
    try {
      const dbRes = await query(`SELECT * FROM users WHERE LOWER(email) = LOWER($1)`, [emailClean]);
      if (dbRes.rows && dbRes.rows.length > 0) {
        user = dbRes.rows[0];
      }
    } catch {}

    if (!user) {
      user = memoryStore.users.find(u => u.email.toLowerCase() === emailClean);
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: `No employee record found for "${emailClean}". Please ask your HR manager to add you to the employee directory first.`
      });
    }

    // Role check: HR accounts cannot self-register here
    if (user.role === 'hr') {
      return res.status(403).json({
        success: false,
        message: 'HR Administrator accounts cannot register here. Please use the HR Admin login tab.'
      });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({
        success: false,
        message: 'Your employee profile is currently marked inactive. Please contact HR.'
      });
    }

    // 2. Hash the new password and update in database
    const passwordHash = await bcrypt.hash(password, 10);

    try {
      await query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [passwordHash, user.id]);
    } catch {}

    // Update in memory fallback as well
    const memUser = memoryStore.users.find(u => u.id === user.id);
    if (memUser) {
      memUser.password_hash = passwordHash;
    }

    // 3. Generate JWT token for immediate seamless login
    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const safeUser = {
      id: user.id,
      emp_code: user.emp_code,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      designation: user.designation,
      phone: user.phone,
      joining_date: user.joining_date,
      status: user.status,
    };

    return res.status(200).json({
      success: true,
      message: `Welcome, ${user.name}! Your password has been set successfully.`,
      token,
      user: safeUser,
    });
  } catch (err) {
    console.error('Register employee error:', err);
    return res.status(500).json({ success: false, message: 'Server error during employee registration.' });
  }
});

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch user details with salary
    let userWithSalary = null;
    try {
      const q = `
        SELECT u.id, u.emp_code, u.name, u.email, u.role, u.department, u.designation,
               u.phone, u.joining_date, u.status, u.created_at,
               s.basic_salary, s.hra, s.allowances, s.pf_deduction, s.tax_deduction, s.net_salary
        FROM users u
        LEFT JOIN salaries s ON u.id = s.employee_id
        WHERE u.id = $1
      `;
      const resDb = await query(q, [userId]);
      if (resDb.rows && resDb.rows.length > 0) {
        userWithSalary = resDb.rows[0];
      }
    } catch {
      const u = memoryStore.users.find(x => x.id === userId);
      const s = memoryStore.salaries.find(x => x.employee_id === userId) || {};
      if (u) {
        userWithSalary = { ...u, ...s };
        delete userWithSalary.password_hash;
      }
    }

    if (!userWithSalary) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.json({
      success: true,
      user: userWithSalary,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch user profile.' });
  }
});

export default router;

