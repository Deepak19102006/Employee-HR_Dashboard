import jwt from 'jsonwebtoken';
import { query, memoryStore } from '../db/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_hr_jwt_key_2026_xyz123';

/**
 * Middleware: Verify JWT and attach user object
 */
export async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access denied: Authentication token required.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Fetch user details from DB or memoryStore
    let user = null;
    try {
      const result = await query(`SELECT id, emp_code, name, email, role, department, designation, phone, joining_date, status FROM users WHERE id = $1`, [decoded.id]);
      if (result.rows && result.rows.length > 0) {
        user = result.rows[0];
      }
    } catch {
      // Memory fallback lookup
      user = memoryStore.users.find(u => u.id === decoded.id);
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid session or user not found.' });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Contact HR.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Invalid or expired authentication token.' });
  }
}

/**
 * Middleware: Require HR role
 */
export function requireHR(req, res, next) {
  if (!req.user || req.user.role !== 'hr') {
    return res.status(403).json({ success: false, message: 'Forbidden: Access restricted to HR administrators only.' });
  }
  next();
}

/**
 * Middleware: Require Employee role
 */
export function requireEmployee(req, res, next) {
  if (!req.user || req.user.role !== 'employee') {
    return res.status(403).json({ success: false, message: 'Forbidden: Access restricted to employee accounts.' });
  }
  next();
}

