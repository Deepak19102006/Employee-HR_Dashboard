import express from 'express';
import { query, memoryStore, getDBStatus } from '../db/index.js';
import { authenticateToken, requireHR } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/dashboard/status
 * Public database & server status check
 */
router.get('/status', (req, res) => {
  return res.json({
    success: true,
    server: 'Running',
    database: getDBStatus(),
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /api/dashboard/hr-stats
 * High-level overview statistics for HR Dashboard
 */
router.get('/hr-stats', authenticateToken, requireHR, async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];

    let totalEmployees = 0;
    let presentToday = 0;
    let pendingLeaves = 0;
    let totalPayroll = 0;
    let departmentStats = [];

    try {
      // 1. Total active employees
      const empRes = await query(`SELECT COUNT(*) FROM users WHERE status = 'active' AND role != 'hr'`);
      totalEmployees = parseInt(empRes.rows[0].count, 10);

      // 2. Attendance today
      const attRes = await query(
        `SELECT COUNT(*) FROM attendance WHERE date = $1 AND status IN ('present', 'late')`,
        [todayStr]
      );
      presentToday = parseInt(attRes.rows[0].count, 10);

      // 3. Pending leaves
      const leaveRes = await query(`SELECT COUNT(*) FROM leaves WHERE status = 'pending'`);
      pendingLeaves = parseInt(leaveRes.rows[0].count, 10);

      // 4. Total Monthly Payroll estimated
      const salaryRes = await query(`SELECT COALESCE(SUM(net_salary), 0) as total FROM salaries`);
      totalPayroll = parseFloat(salaryRes.rows[0].total);

      // 5. Department breakdown
      const deptRes = await query(`
        SELECT department, COUNT(*) as count
        FROM users
        WHERE status = 'active' AND role != 'hr'
        GROUP BY department
      `);
      departmentStats = deptRes.rows;
    } catch {
      // Memory fallback
      const activeEmps = memoryStore.users.filter(u => u.status === 'active' && u.role !== 'hr');
      totalEmployees = activeEmps.length;
      presentToday = memoryStore.attendance.filter(a => a.date === todayStr && ['present', 'late'].includes(a.status)).length;
      pendingLeaves = memoryStore.leaves.filter(l => l.status === 'pending').length;
      totalPayroll = memoryStore.salaries.reduce((sum, s) => sum + (s.net_salary || 0), 0);

      const deptMap = {};
      for (const u of activeEmps) {
        deptMap[u.department] = (deptMap[u.department] || 0) + 1;
      }
      departmentStats = Object.keys(deptMap).map(k => ({ department: k, count: deptMap[k] }));
    }

    return res.json({
      success: true,
      stats: {
        totalEmployees,
        presentToday,
        absentToday: Math.max(0, totalEmployees - presentToday),
        pendingLeaves,
        totalPayroll,
        attendanceRate: totalEmployees > 0 ? Math.round((presentToday / totalEmployees) * 100) : 0,
        departments: departmentStats,
      }
    });
  } catch (err) {
    console.error('HR stats error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve HR statistics.' });
  }
});

export default router;

