import express from 'express';
import bcrypt from 'bcryptjs';
import { query, memoryStore } from '../db/index.js';
import { authenticateToken, requireHR } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/employees
 * List all employees with salary details (HR only)
 */
router.get('/', authenticateToken, requireHR, async (req, res) => {
  try {
    const { search, department, status } = req.query;

    let users = [];
    try {
      let sql = `
        SELECT u.id, u.emp_code, u.name, u.email, u.role, u.department, u.designation,
               u.phone, u.joining_date, u.status, u.created_at,
               s.basic_salary, s.hra, s.allowances, s.pf_deduction, s.tax_deduction, s.net_salary
        FROM users u
        LEFT JOIN salaries s ON u.id = s.employee_id
        WHERE 1=1
      `;
      const params = [];

      if (department) {
        params.push(department);
        sql += ` AND LOWER(u.department) = LOWER($${params.length})`;
      }

      if (status) {
        params.push(status);
        sql += ` AND u.status = $${params.length}`;
      }

      if (search) {
        params.push(`%${search.toLowerCase()}%`);
        sql += ` AND (LOWER(u.name) LIKE $${params.length} OR LOWER(u.email) LIKE $${params.length} OR LOWER(u.emp_code) LIKE $${params.length} OR LOWER(u.designation) LIKE $${params.length})`;
      }

      sql += ` ORDER BY u.id DESC`;
      const result = await query(sql, params);
      users = result.rows || [];
    } catch {
      // Memory fallback
      users = memoryStore.users.map(u => {
        const s = memoryStore.salaries.find(x => x.employee_id === u.id) || {};
        const { password_hash, ...safe } = u;
        return { ...safe, ...s };
      });

      if (department) {
        users = users.filter(u => u.department?.toLowerCase() === department.toLowerCase());
      }
      if (status) {
        users = users.filter(u => u.status === status);
      }
      if (search) {
        const q = search.toLowerCase();
        users = users.filter(u =>
          u.name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.emp_code?.toLowerCase().includes(q) ||
          u.designation?.toLowerCase().includes(q)
        );
      }
    }

    return res.json({ success: true, count: users.length, employees: users });
  } catch (err) {
    console.error('Fetch employees error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve employees list.' });
  }
});

/**
 * GET /api/employees/:id
 * Get single employee profile
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const targetId = parseInt(req.params.id, 10);

    // If not HR, employee can only view themselves
    if (req.user.role !== 'hr' && req.user.id !== targetId) {
      return res.status(403).json({ success: false, message: 'Access denied: You can only view your own profile.' });
    }

    let userWithSalary = null;
    try {
      const sql = `
        SELECT u.id, u.emp_code, u.name, u.email, u.role, u.department, u.designation,
               u.phone, u.joining_date, u.status, u.created_at,
               s.basic_salary, s.hra, s.allowances, s.pf_deduction, s.tax_deduction, s.net_salary
        FROM users u
        LEFT JOIN salaries s ON u.id = s.employee_id
        WHERE u.id = $1
      `;
      const resDb = await query(sql, [targetId]);
      if (resDb.rows && resDb.rows.length > 0) {
        userWithSalary = resDb.rows[0];
      }
    } catch {
      const u = memoryStore.users.find(x => x.id === targetId);
      const s = memoryStore.salaries.find(x => x.employee_id === targetId) || {};
      if (u) {
        userWithSalary = { ...u, ...s };
        delete userWithSalary.password_hash;
      }
    }

    if (!userWithSalary) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }

    return res.json({ success: true, employee: userWithSalary });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch employee.' });
  }
});

/**
 * POST /api/employees
 * Add a new employee (HR only)
 */
router.post('/', authenticateToken, requireHR, async (req, res) => {
  try {
    const {
      name,
      email,
      password = 'emp123',
      role = 'employee',
      department = 'General',
      designation = 'Staff Member',
      phone = '',
      joining_date = new Date().toISOString().split('T')[0],
      basic_salary = 40000,
      hra = 16000,
      allowances = 5000,
      pf_deduction = 4800,
      tax_deduction = 2500,
    } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required.' });
    }

    const emailClean = email.trim().toLowerCase();

    // Check duplicate email
    try {
      const exist = await query(`SELECT id FROM users WHERE LOWER(email) = LOWER($1)`, [emailClean]);
      if (exist.rows && exist.rows.length > 0) {
        return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
      }
    } catch {
      if (memoryStore.users.some(u => u.email.toLowerCase() === emailClean)) {
        return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
      }
    }

    // Auto-generate employee code if not provided
    const randomCode = `EMP${Math.floor(100 + Math.random() * 900)}`;
    const emp_code = req.body.emp_code || randomCode;

    const passwordHash = await bcrypt.hash(password, 10);

    const bSalary = parseFloat(basic_salary) || 0;
    const hSalary = parseFloat(hra) || 0;
    const aSalary = parseFloat(allowances) || 0;
    const pDeduct = parseFloat(pf_deduction) || 0;
    const tDeduct = parseFloat(tax_deduction) || 0;
    const netSalary = bSalary + hSalary + aSalary - pDeduct - tDeduct;

    let newEmployee = null;

    try {
      const userRes = await query(
        `INSERT INTO users (emp_code, name, email, password_hash, role, department, designation, phone, joining_date, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active') RETURNING *`,
        [emp_code, name.trim(), emailClean, passwordHash, role, department, designation, phone, joining_date]
      );
      const createdUser = userRes.rows[0];

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
        [createdUser.id, bSalary, hSalary, aSalary, pDeduct, tDeduct, netSalary]
      );

      delete createdUser.password_hash;
      newEmployee = {
        ...createdUser,
        basic_salary: bSalary,
        hra: hSalary,
        allowances: aSalary,
        pf_deduction: pDeduct,
        tax_deduction: tDeduct,
        net_salary: netSalary,
      };
    } catch (err) {
      // Memory store fallback
      const u = {
        id: memoryStore.nextId.users++,
        emp_code,
        name: name.trim(),
        email: emailClean,
        password_hash: passwordHash,
        role,
        department,
        designation,
        phone,
        joining_date,
        status: 'active',
        created_at: new Date().toISOString()
      };
      memoryStore.users.push(u);

      const s = {
        id: memoryStore.nextId.salaries++,
        employee_id: u.id,
        basic_salary: bSalary,
        hra: hSalary,
        allowances: aSalary,
        pf_deduction: pDeduct,
        tax_deduction: tDeduct,
        net_salary: netSalary,
        updated_at: new Date().toISOString()
      };
      memoryStore.salaries.push(s);

      newEmployee = { ...u, ...s };
      delete newEmployee.password_hash;
    }

    return res.status(201).json({
      success: true,
      message: 'Employee successfully created!',
      employee: newEmployee,
    });
  } catch (err) {
    console.error('Create employee error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create employee.' });
  }
});

/**
 * PUT /api/employees/:id
 * Update employee details & salary (HR only)
 */
router.put('/:id', authenticateToken, requireHR, async (req, res) => {
  try {
    const targetId = parseInt(req.params.id, 10);
    const {
      name,
      department,
      designation,
      phone,
      status,
      basic_salary,
      hra,
      allowances,
      pf_deduction,
      tax_deduction
    } = req.body;

    const bSalary = parseFloat(basic_salary) || 0;
    const hSalary = parseFloat(hra) || 0;
    const aSalary = parseFloat(allowances) || 0;
    const pDeduct = parseFloat(pf_deduction) || 0;
    const tDeduct = parseFloat(tax_deduction) || 0;
    const netSalary = bSalary + hSalary + aSalary - pDeduct - tDeduct;

    try {
      await query(
        `UPDATE users
         SET name = COALESCE($1, name),
             department = COALESCE($2, department),
             designation = COALESCE($3, designation),
             phone = COALESCE($4, phone),
             status = COALESCE($5, status)
         WHERE id = $6`,
        [name, department, designation, phone, status, targetId]
      );

      if (basic_salary !== undefined) {
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
          [targetId, bSalary, hSalary, aSalary, pDeduct, tDeduct, netSalary]
        );
      }
    } catch {
      // Memory fallback
      const u = memoryStore.users.find(x => x.id === targetId);
      if (u) {
        if (name) u.name = name;
        if (department) u.department = department;
        if (designation) u.designation = designation;
        if (phone !== undefined) u.phone = phone;
        if (status) u.status = status;
      }

      let s = memoryStore.salaries.find(x => x.employee_id === targetId);
      if (!s) {
        s = { id: memoryStore.nextId.salaries++, employee_id: targetId };
        memoryStore.salaries.push(s);
      }
      if (basic_salary !== undefined) {
        s.basic_salary = bSalary;
        s.hra = hSalary;
        s.allowances = aSalary;
        s.pf_deduction = pDeduct;
        s.tax_deduction = tDeduct;
        s.net_salary = netSalary;
        s.updated_at = new Date().toISOString();
      }
    }

    return res.json({ success: true, message: 'Employee updated successfully.' });
  } catch (err) {
    console.error('Update employee error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update employee.' });
  }
});

export default router;

