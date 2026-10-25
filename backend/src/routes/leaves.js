import express from 'express';
import { query, memoryStore } from '../db/index.js';
import { authenticateToken, requireHR } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/leaves/my
 * Employee view their own leave requests & balances
 */
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const employeeId = req.user.id;

    let leaves = [];
    try {
      const result = await query(
        `SELECT * FROM leaves WHERE employee_id = $1 ORDER BY created_at DESC`,
        [employeeId]
      );
      leaves = result.rows || [];
    } catch {
      leaves = memoryStore.leaves.filter(l => l.employee_id === employeeId);
      leaves.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    // Calculate balances
    const approvedSick = leaves
      .filter(l => l.status === 'approved' && l.leave_type === 'Sick Leave')
      .reduce((acc, curr) => acc + (curr.total_days || 1), 0);

    const approvedCasual = leaves
      .filter(l => l.status === 'approved' && l.leave_type === 'Casual Leave')
      .reduce((acc, curr) => acc + (curr.total_days || 1), 0);

    const approvedPaid = leaves
      .filter(l => l.status === 'approved' && l.leave_type === 'Paid Leave')
      .reduce((acc, curr) => acc + (curr.total_days || 1), 0);

    const balances = {
      sick: { total: 10, used: approvedSick, remaining: Math.max(0, 10 - approvedSick) },
      casual: { total: 12, used: approvedCasual, remaining: Math.max(0, 12 - approvedCasual) },
      paid: { total: 15, used: approvedPaid, remaining: Math.max(0, 15 - approvedPaid) },
    };

    return res.json({
      success: true,
      leaves,
      balances,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve leaves.' });
  }
});

/**
 * POST /api/leaves/apply
 * Employee request a leave
 */
router.post('/apply', authenticateToken, async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { leave_type, start_date, end_date, total_days, reason } = req.body;

    if (!leave_type || !start_date || !end_date || !reason) {
      return res.status(400).json({ success: false, message: 'All fields (leave type, start date, end date, reason) are required.' });
    }

    // Calculate total days if not provided
    let days = total_days ? parseInt(total_days, 10) : 1;
    if (!total_days) {
      const d1 = new Date(start_date);
      const d2 = new Date(end_date);
      const diffTime = Math.abs(d2 - d1);
      days = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
    }

    let createdLeave = null;
    try {
      const insertRes = await query(
        `INSERT INTO leaves (employee_id, leave_type, start_date, end_date, total_days, reason, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'pending') RETURNING *`,
        [employeeId, leave_type, start_date, end_date, days, reason]
      );
      createdLeave = insertRes.rows[0];
    } catch {
      createdLeave = {
        id: memoryStore.nextId.leaves++,
        employee_id: employeeId,
        leave_type,
        start_date,
        end_date,
        total_days: days,
        reason,
        status: 'pending',
        hr_remarks: null,
        created_at: new Date().toISOString()
      };
      memoryStore.leaves.push(createdLeave);
    }

    return res.status(201).json({
      success: true,
      message: 'Leave application submitted successfully! Pending HR approval.',
      leave: createdLeave,
    });
  } catch (err) {
    console.error('Leave apply error:', err);
    return res.status(500).json({ success: false, message: 'Failed to submit leave application.' });
  }
});

/**
 * GET /api/leaves/all
 * HR view all leaves across company
 */
router.get('/all', authenticateToken, requireHR, async (req, res) => {
  try {
    const { status, leave_type, department } = req.query;

    let leaves = [];
    try {
      let sql = `
        SELECT l.*, u.name AS employee_name, u.emp_code, u.department, u.designation, u.email
        FROM leaves l
        JOIN users u ON l.employee_id = u.id
        WHERE 1=1
      `;
      const params = [];

      if (status && status !== 'all') {
        params.push(status);
        sql += ` AND l.status = $${params.length}`;
      }

      if (leave_type) {
        params.push(leave_type);
        sql += ` AND l.leave_type = $${params.length}`;
      }

      if (department) {
        params.push(department);
        sql += ` AND LOWER(u.department) = LOWER($${params.length})`;
      }

      sql += ` ORDER BY l.created_at DESC`;
      const result = await query(sql, params);
      leaves = result.rows || [];
    } catch {
      // Memory fallback
      leaves = memoryStore.leaves.map(l => {
        const u = memoryStore.users.find(x => x.id === l.employee_id);
        return {
          ...l,
          employee_name: u?.name || 'Unknown',
          emp_code: u?.emp_code || '',
          department: u?.department || '',
          designation: u?.designation || '',
          email: u?.email || '',
        };
      });

      if (status && status !== 'all') {
        leaves = leaves.filter(l => l.status === status);
      }
      if (leave_type) {
        leaves = leaves.filter(l => l.leave_type === leave_type);
      }
      if (department) {
        leaves = leaves.filter(l => l.department.toLowerCase() === department.toLowerCase());
      }
      leaves.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    return res.json({ success: true, count: leaves.length, leaves });
  } catch (err) {
    console.error('Fetch all leaves error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve leaves.' });
  }
});

/**
 * PUT /api/leaves/:id/status
 * HR Approve / Reject leave
 * Body: { status: 'approved' | 'rejected', hr_remarks }
 */
router.put('/:id/status', authenticateToken, requireHR, async (req, res) => {
  try {
    const leaveId = parseInt(req.params.id, 10);
    const { status, hr_remarks = '' } = req.body;

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be approved or rejected.' });
    }

    const hrId = req.user.id;
    let updated = null;

    try {
      const updateRes = await query(
        `UPDATE leaves
         SET status = $1, hr_remarks = $2, reviewed_by = $3, reviewed_at = CURRENT_TIMESTAMP
         WHERE id = $4 RETURNING *`,
        [status, hr_remarks, hrId, leaveId]
      );
      if (updateRes.rows && updateRes.rows.length > 0) {
        updated = updateRes.rows[0];
      }
    } catch {
      // Memory fallback
      const target = memoryStore.leaves.find(l => l.id === leaveId);
      if (target) {
        target.status = status;
        target.hr_remarks = hr_remarks;
        target.reviewed_by = hrId;
        target.reviewed_at = new Date().toISOString();
        updated = target;
      }
    }

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Leave request not found.' });
    }

    return res.json({
      success: true,
      message: `Leave request has been ${status.toUpperCase()}!`,
      leave: updated,
    });
  } catch (err) {
    console.error('Update leave status error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update leave status.' });
  }
});

export default router;

