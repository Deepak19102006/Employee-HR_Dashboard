import express from 'express';
import { query, memoryStore } from '../db/index.js';
import { authenticateToken, requireHR } from '../middleware/auth.js';

const router = express.Router();

// Helper: Format Time HH:MM:SS
function getCurrentTimeString() {
  const now = new Date();
  return now.toTimeString().split(' ')[0]; // 'HH:MM:SS'
}

// Helper: Calculate hours between two time strings (HH:MM:SS)
function calculateHours(clockIn, clockOut) {
  if (!clockIn || !clockOut) return 0;
  const [h1, m1, s1] = clockIn.split(':').map(Number);
  const [h2, m2, s2] = clockOut.split(':').map(Number);
  const start = h1 * 3600 + m1 * 60 + (s1 || 0);
  const end = h2 * 3600 + m2 * 60 + (s2 || 0);
  if (end <= start) return 0;
  const hours = (end - start) / 3600;
  return parseFloat(hours.toFixed(2));
}

/**
 * GET /api/attendance/today
 * Check today's attendance status for the logged-in employee
 */
router.get('/today', authenticateToken, async (req, res) => {
  try {
    const employeeId = req.user.id;
    const todayStr = new Date().toISOString().split('T')[0];

    let record = null;
    try {
      const result = await query(
        `SELECT * FROM attendance WHERE employee_id = $1 AND date = $2`,
        [employeeId, todayStr]
      );
      if (result.rows && result.rows.length > 0) {
        record = result.rows[0];
      }
    } catch {
      record = memoryStore.attendance.find(a => a.employee_id === employeeId && a.date === todayStr);
    }

    return res.json({
      success: true,
      hasClockedIn: !!record,
      hasClockedOut: !!(record && record.clock_out),
      record: record || null,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch today attendance.' });
  }
});

/**
 * POST /api/attendance/clock-in
 * Employee Clock In
 */
router.post('/clock-in', authenticateToken, async (req, res) => {
  try {
    const employeeId = req.user.id;
    const todayStr = new Date().toISOString().split('T')[0];
    const currentTime = getCurrentTimeString();
    const { notes = 'Self clock-in' } = req.body;

    // Check if after 9:30 AM -> status 'late', otherwise 'present'
    const [hours, minutes] = currentTime.split(':').map(Number);
    const status = (hours > 9 || (hours === 9 && minutes > 30)) ? 'late' : 'present';

    let record = null;
    try {
      // Check existing
      const existing = await query(
        `SELECT id FROM attendance WHERE employee_id = $1 AND date = $2`,
        [employeeId, todayStr]
      );
      if (existing.rows && existing.rows.length > 0) {
        return res.status(400).json({ success: false, message: 'You have already clocked in for today!' });
      }

      const insertRes = await query(
        `INSERT INTO attendance (employee_id, date, clock_in, status, notes)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [employeeId, todayStr, currentTime, status, notes]
      );
      record = insertRes.rows[0];
    } catch {
      // Memory fallback
      const exists = memoryStore.attendance.find(a => a.employee_id === employeeId && a.date === todayStr);
      if (exists) {
        return res.status(400).json({ success: false, message: 'You have already clocked in for today!' });
      }

      record = {
        id: memoryStore.nextId.attendance++,
        employee_id: employeeId,
        date: todayStr,
        clock_in: currentTime,
        clock_out: null,
        work_hours: 0,
        status,
        notes,
        created_at: new Date().toISOString()
      };
      memoryStore.attendance.push(record);
    }

    return res.status(201).json({
      success: true,
      message: `Clocked in successfully at ${currentTime}! Status: ${status.toUpperCase()}`,
      record,
    });
  } catch (err) {
    console.error('Clock in error:', err);
    return res.status(500).json({ success: false, message: 'Failed to record clock-in.' });
  }
});

/**
 * POST /api/attendance/clock-out
 * Employee Clock Out
 */
router.post('/clock-out', authenticateToken, async (req, res) => {
  try {
    const employeeId = req.user.id;
    const todayStr = new Date().toISOString().split('T')[0];
    const currentTime = getCurrentTimeString();

    let existing = null;
    try {
      const checkRes = await query(
        `SELECT * FROM attendance WHERE employee_id = $1 AND date = $2`,
        [employeeId, todayStr]
      );
      if (!checkRes.rows || checkRes.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'You must clock in first before clocking out.' });
      }
      existing = checkRes.rows[0];

      if (existing.clock_out) {
        return res.status(400).json({ success: false, message: 'You have already clocked out for today.' });
      }

      const workHours = calculateHours(existing.clock_in, currentTime);

      const updateRes = await query(
        `UPDATE attendance
         SET clock_out = $1, work_hours = $2
         WHERE id = $3 RETURNING *`,
        [currentTime, workHours, existing.id]
      );
      existing = updateRes.rows[0];
    } catch {
      // Memory fallback
      existing = memoryStore.attendance.find(a => a.employee_id === employeeId && a.date === todayStr);
      if (!existing) {
        return res.status(400).json({ success: false, message: 'You must clock in first before clocking out.' });
      }
      if (existing.clock_out) {
        return res.status(400).json({ success: false, message: 'You have already clocked out for today.' });
      }

      existing.clock_out = currentTime;
      existing.work_hours = calculateHours(existing.clock_in, currentTime);
    }

    return res.json({
      success: true,
      message: `Clocked out successfully at ${currentTime}. Total hours worked: ${existing.work_hours} hrs.`,
      record: existing,
    });
  } catch (err) {
    console.error('Clock out error:', err);
    return res.status(500).json({ success: false, message: 'Failed to record clock-out.' });
  }
});

/**
 * GET /api/attendance/my
 * Employee view their own attendance history
 */
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { month, year } = req.query;

    let list = [];
    try {
      let sql = `SELECT * FROM attendance WHERE employee_id = $1`;
      const params = [employeeId];

      if (month && year) {
        params.push(`${year}-${String(month).padStart(2, '0')}%`);
        sql += ` AND date::text LIKE $${params.length}`;
      }

      sql += ` ORDER BY date DESC`;
      const result = await query(sql, params);
      list = result.rows || [];
    } catch {
      list = memoryStore.attendance.filter(a => a.employee_id === employeeId);
      list.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    return res.json({ success: true, count: list.length, attendance: list });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch personal attendance.' });
  }
});

/**
 * GET /api/attendance/all
 * HR Monitor: view all employee attendance with filters (date, department)
 */
router.get('/all', authenticateToken, requireHR, async (req, res) => {
  try {
    const { date, department, search } = req.query;
    const selectedDate = date || new Date().toISOString().split('T')[0];

    let records = [];
    try {
      let sql = `
        SELECT a.id, a.employee_id, a.date, a.clock_in, a.clock_out, a.work_hours, a.status, a.notes,
               u.name AS employee_name, u.emp_code, u.department, u.designation
        FROM attendance a
        JOIN users u ON a.employee_id = u.id
        WHERE 1=1
      `;
      const params = [];

      if (date) {
        params.push(date);
        sql += ` AND a.date = $${params.length}`;
      }

      if (department) {
        params.push(department);
        sql += ` AND LOWER(u.department) = LOWER($${params.length})`;
      }

      if (search) {
        params.push(`%${search.toLowerCase()}%`);
        sql += ` AND (LOWER(u.name) LIKE $${params.length} OR LOWER(u.emp_code) LIKE $${params.length})`;
      }

      sql += ` ORDER BY a.date DESC, a.clock_in DESC`;
      const result = await query(sql, params);
      records = result.rows || [];
    } catch {
      // Memory fallback
      records = memoryStore.attendance.map(a => {
        const u = memoryStore.users.find(x => x.id === a.employee_id);
        return {
          ...a,
          employee_name: u?.name || 'Unknown',
          emp_code: u?.emp_code || '',
          department: u?.department || '',
          designation: u?.designation || '',
        };
      });

      if (date) {
        records = records.filter(r => r.date === date);
      }
      if (department) {
        records = records.filter(r => r.department.toLowerCase() === department.toLowerCase());
      }
      if (search) {
        const q = search.toLowerCase();
        records = records.filter(r => r.employee_name.toLowerCase().includes(q) || r.emp_code.toLowerCase().includes(q));
      }
      records.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    return res.json({
      success: true,
      date: selectedDate,
      count: records.length,
      attendance: records,
    });
  } catch (err) {
    console.error('Fetch all attendance error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve attendance logs.' });
  }
});

export default router;

