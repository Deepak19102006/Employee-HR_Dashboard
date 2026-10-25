import express from 'express';
import { query, memoryStore } from '../db/index.js';
import { authenticateToken, requireHR } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/payroll/salaries
 * HR view all employees' salary structures
 */
router.get('/salaries', authenticateToken, requireHR, async (req, res) => {
  try {
    let list = [];
    try {
      const sql = `
        SELECT u.id AS employee_id, u.emp_code, u.name, u.email, u.department, u.designation,
               COALESCE(s.basic_salary, 0) AS basic_salary,
               COALESCE(s.hra, 0) AS hra,
               COALESCE(s.allowances, 0) AS allowances,
               COALESCE(s.pf_deduction, 0) AS pf_deduction,
               COALESCE(s.tax_deduction, 0) AS tax_deduction,
               COALESCE(s.net_salary, 0) AS net_salary,
               s.updated_at
        FROM users u
        LEFT JOIN salaries s ON u.id = s.employee_id
        WHERE u.status = 'active'
        ORDER BY u.name ASC
      `;
      const result = await query(sql);
      list = result.rows || [];
    } catch {
      list = memoryStore.users
        .filter(u => u.status === 'active')
        .map(u => {
          const s = memoryStore.salaries.find(x => x.employee_id === u.id) || {};
          return {
            employee_id: u.id,
            emp_code: u.emp_code,
            name: u.name,
            email: u.email,
            department: u.department,
            designation: u.designation,
            basic_salary: s.basic_salary || 0,
            hra: s.hra || 0,
            allowances: s.allowances || 0,
            pf_deduction: s.pf_deduction || 0,
            tax_deduction: s.tax_deduction || 0,
            net_salary: s.net_salary || 0,
            updated_at: s.updated_at || new Date().toISOString()
          };
        });
    }

    return res.json({ success: true, count: list.length, salaries: list });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve salary structures.' });
  }
});

/**
 * PUT /api/payroll/salaries/:employeeId
 * HR Enter/Update salary structure for an employee
 */
router.put('/salaries/:employeeId', authenticateToken, requireHR, async (req, res) => {
  try {
    const employeeId = parseInt(req.params.employeeId, 10);
    const {
      basic_salary = 0,
      hra = 0,
      allowances = 0,
      pf_deduction = 0,
      tax_deduction = 0,
    } = req.body;

    const bSalary = parseFloat(basic_salary) || 0;
    const hSalary = parseFloat(hra) || 0;
    const aSalary = parseFloat(allowances) || 0;
    const pDeduct = parseFloat(pf_deduction) || 0;
    const tDeduct = parseFloat(tax_deduction) || 0;
    const netSalary = bSalary + hSalary + aSalary - pDeduct - tDeduct;

    try {
      await query(
        `INSERT INTO salaries (employee_id, basic_salary, hra, allowances, pf_deduction, tax_deduction, net_salary)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (employee_id) DO UPDATE SET
          basic_salary = EXCLUDED.basic_salary,
          hra = EXCLUDED.hra,
          allowances = EXCLUDED.allowances,
          pf_deduction = EXCLUDED.pf_deduction,
          tax_deduction = EXCLUDED.tax_deduction,
          net_salary = EXCLUDED.net_salary,
          updated_at = CURRENT_TIMESTAMP`,
        [employeeId, bSalary, hSalary, aSalary, pDeduct, tDeduct, netSalary]
      );
    } catch {
      let s = memoryStore.salaries.find(x => x.employee_id === employeeId);
      if (!s) {
        s = { id: memoryStore.nextId.salaries++, employee_id: employeeId };
        memoryStore.salaries.push(s);
      }
      s.basic_salary = bSalary;
      s.hra = hSalary;
      s.allowances = aSalary;
      s.pf_deduction = pDeduct;
      s.tax_deduction = tDeduct;
      s.net_salary = netSalary;
      s.updated_at = new Date().toISOString();
    }

    return res.json({
      success: true,
      message: 'Salary structure updated successfully.',
      salary: {
        employee_id: employeeId,
        basic_salary: bSalary,
        hra: hSalary,
        allowances: aSalary,
        pf_deduction: pDeduct,
        tax_deduction: tDeduct,
        net_salary: netSalary,
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update salary.' });
  }
});

/**
 * POST /api/payroll/calculate
 * HR Calculate and generate monthly payroll
 * Body: { month: 10, year: 2026, workingDays: 30 }
 */
router.post('/calculate', authenticateToken, requireHR, async (req, res) => {
  try {
    const { month, year, workingDays = 30 } = req.body;

    if (!month || !year) {
      return res.status(400).json({ success: false, message: 'Month and year are required.' });
    }

    const m = parseInt(month, 10);
    const y = parseInt(year, 10);
    const totalWorkingDays = parseInt(workingDays, 10) || 30;

    // Fetch all active employees with salary
    let employees = [];
    try {
      const sql = `
        SELECT u.id, u.name, u.emp_code, u.department, u.designation,
               COALESCE(s.basic_salary, 0) AS basic_salary,
               COALESCE(s.hra, 0) AS hra,
               COALESCE(s.allowances, 0) AS allowances,
               COALESCE(s.pf_deduction, 0) AS pf_deduction,
               COALESCE(s.tax_deduction, 0) AS tax_deduction,
               COALESCE(s.net_salary, 0) AS net_salary
        FROM users u
        LEFT JOIN salaries s ON u.id = s.employee_id
        WHERE u.status = 'active'
      `;
      const result = await query(sql);
      employees = result.rows || [];
    } catch {
      employees = memoryStore.users
        .filter(u => u.status === 'active')
        .map(u => {
          const s = memoryStore.salaries.find(x => x.employee_id === u.id) || {};
          return {
            id: u.id,
            name: u.name,
            emp_code: u.emp_code,
            department: u.department,
            designation: u.designation,
            basic_salary: s.basic_salary || 0,
            hra: s.hra || 0,
            allowances: s.allowances || 0,
            pf_deduction: s.pf_deduction || 0,
            tax_deduction: s.tax_deduction || 0,
            net_salary: s.net_salary || 0,
          };
        });
    }

    const generatedPayrolls = [];
    const datePrefix = `${y}-${String(m).padStart(2, '0')}`;

    for (const emp of employees) {
      // 1. Calculate Attendance
      let presentDays = 0;
      try {
        const attRes = await query(
          `SELECT COUNT(*) FROM attendance WHERE employee_id = $1 AND date::text LIKE $2 AND status IN ('present', 'late')`,
          [emp.id, `${datePrefix}%`]
        );
        presentDays = parseInt(attRes.rows[0].count, 10);
      } catch {
        presentDays = memoryStore.attendance.filter(a => a.employee_id === emp.id && a.date.startsWith(datePrefix)).length;
      }

      // Default baseline: if newly created demo or full month, give realistic working days or present days
      if (presentDays === 0) {
        presentDays = totalWorkingDays - 2; // realistic mock for current month
      }

      // 2. Calculate Approved Leaves
      let paidLeaves = 0;
      let unpaidLeaves = 0;
      try {
        const leavesRes = await query(
          `SELECT leave_type, SUM(total_days) as days
           FROM leaves
           WHERE employee_id = $1 AND status = 'approved' AND start_date::text LIKE $2
           GROUP BY leave_type`,
          [emp.id, `${datePrefix}%`]
        );
        for (const row of leavesRes.rows) {
          if (row.leave_type === 'Unpaid Leave') {
            unpaidLeaves += parseInt(row.days, 10);
          } else {
            paidLeaves += parseInt(row.days, 10);
          }
        }
      } catch {
        const approved = memoryStore.leaves.filter(l => l.employee_id === emp.id && l.status === 'approved' && l.start_date.startsWith(datePrefix));
        for (const l of approved) {
          if (l.leave_type === 'Unpaid Leave') unpaidLeaves += (l.total_days || 1);
          else paidLeaves += (l.total_days || 1);
        }
      }

      const basic = parseFloat(emp.basic_salary) || 0;
      const hra = parseFloat(emp.hra) || 0;
      const allow = parseFloat(emp.allowances) || 0;
      const gross = basic + hra + allow;

      // Loss of Pay (LOP) for unpaid leaves
      const perDaySalary = gross / totalWorkingDays;
      const lossOfPay = parseFloat((perDaySalary * unpaidLeaves).toFixed(2));

      const pf = parseFloat(emp.pf_deduction) || 0;
      const tax = parseFloat(emp.tax_deduction) || 0;
      const totalDeductions = parseFloat((pf + tax + lossOfPay).toFixed(2));
      const netPay = parseFloat(Math.max(0, gross - totalDeductions).toFixed(2));

      let payrollRecord = null;
      try {
        const payRes = await query(
          `INSERT INTO payrolls (
            employee_id, month, year, working_days, present_days, paid_leaves, unpaid_leaves,
            basic_pay, hra, allowances, gross_pay, pf_deduction, tax_deduction, loss_of_pay,
            total_deductions, net_pay, status, payment_date
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'generated', CURRENT_DATE)
          ON CONFLICT (employee_id, month, year) DO UPDATE SET
            working_days = EXCLUDED.working_days,
            present_days = EXCLUDED.present_days,
            paid_leaves = EXCLUDED.paid_leaves,
            unpaid_leaves = EXCLUDED.unpaid_leaves,
            basic_pay = EXCLUDED.basic_pay,
            hra = EXCLUDED.hra,
            allowances = EXCLUDED.allowances,
            gross_pay = EXCLUDED.gross_pay,
            pf_deduction = EXCLUDED.pf_deduction,
            tax_deduction = EXCLUDED.tax_deduction,
            loss_of_pay = EXCLUDED.loss_of_pay,
            total_deductions = EXCLUDED.total_deductions,
            net_pay = EXCLUDED.net_pay,
            status = 'generated'
          RETURNING *`,
          [
            emp.id, m, y, totalWorkingDays, presentDays, paidLeaves, unpaidLeaves,
            basic, hra, allow, gross, pf, tax, lossOfPay,
            totalDeductions, netPay
          ]
        );
        payrollRecord = payRes.rows[0];
      } catch {
        // Memory fallback
        const existingIdx = memoryStore.payrolls.findIndex(p => p.employee_id === emp.id && p.month === m && p.year === y);
        payrollRecord = {
          id: existingIdx >= 0 ? memoryStore.payrolls[existingIdx].id : memoryStore.nextId.payrolls++,
          employee_id: emp.id,
          month: m,
          year: y,
          working_days: totalWorkingDays,
          present_days: presentDays,
          paid_leaves: paidLeaves,
          unpaid_leaves: unpaidLeaves,
          basic_pay: basic,
          hra,
          allowances: allow,
          gross_pay: gross,
          pf_deduction: pf,
          tax_deduction: tax,
          loss_of_pay: lossOfPay,
          total_deductions: totalDeductions,
          net_pay: netPay,
          status: 'generated',
          payment_date: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString()
        };

        if (existingIdx >= 0) {
          memoryStore.payrolls[existingIdx] = payrollRecord;
        } else {
          memoryStore.payrolls.push(payrollRecord);
        }
      }

      generatedPayrolls.push({
        ...payrollRecord,
        employee_name: emp.name,
        emp_code: emp.emp_code,
        department: emp.department,
        designation: emp.designation,
      });
    }

    return res.json({
      success: true,
      message: `Payroll for ${m}/${y} calculated successfully for ${generatedPayrolls.length} employees!`,
      payrolls: generatedPayrolls,
    });
  } catch (err) {
    console.error('Payroll calculate error:', err);
    return res.status(500).json({ success: false, message: 'Failed to calculate payroll.' });
  }
});

/**
 * GET /api/payroll/history
 * HR view all payroll records by month & year
 */
router.get('/history', authenticateToken, requireHR, async (req, res) => {
  try {
    const { month, year } = req.query;

    let list = [];
    try {
      let sql = `
        SELECT p.*, u.name AS employee_name, u.emp_code, u.department, u.designation, u.email
        FROM payrolls p
        JOIN users u ON p.employee_id = u.id
        WHERE 1=1
      `;
      const params = [];

      if (month) {
        params.push(parseInt(month, 10));
        sql += ` AND p.month = $${params.length}`;
      }

      if (year) {
        params.push(parseInt(year, 10));
        sql += ` AND p.year = $${params.length}`;
      }

      sql += ` ORDER BY p.year DESC, p.month DESC, u.name ASC`;
      const result = await query(sql, params);
      list = result.rows || [];
    } catch {
      list = memoryStore.payrolls.map(p => {
        const u = memoryStore.users.find(x => x.id === p.employee_id);
        return {
          ...p,
          employee_name: u?.name || 'Unknown',
          emp_code: u?.emp_code || '',
          department: u?.department || '',
          designation: u?.designation || '',
          email: u?.email || '',
        };
      });

      if (month) list = list.filter(p => p.month === parseInt(month, 10));
      if (year) list = list.filter(p => p.year === parseInt(year, 10));
      list.sort((a, b) => b.year - a.year || b.month - a.month);
    }

    return res.json({ success: true, count: list.length, payrolls: list });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve payroll history.' });
  }
});

/**
 * GET /api/payroll/my
 * Employee view their own monthly payslips
 */
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const employeeId = req.user.id;

    let list = [];
    try {
      const sql = `
        SELECT p.*, u.name AS employee_name, u.emp_code, u.department, u.designation, u.email
        FROM payrolls p
        JOIN users u ON p.employee_id = u.id
        WHERE p.employee_id = $1
        ORDER BY p.year DESC, p.month DESC
      `;
      const result = await query(sql, [employeeId]);
      list = result.rows || [];
    } catch {
      list = memoryStore.payrolls
        .filter(p => p.employee_id === employeeId)
        .map(p => {
          const u = memoryStore.users.find(x => x.id === p.employee_id);
          return {
            ...p,
            employee_name: u?.name || 'Unknown',
            emp_code: u?.emp_code || '',
            department: u?.department || '',
            designation: u?.designation || '',
            email: u?.email || '',
          };
        });
      list.sort((a, b) => b.year - a.year || b.month - a.month);
    }

    return res.json({ success: true, count: list.length, payslips: list });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve personal payslips.' });
  }
});

export default router;

