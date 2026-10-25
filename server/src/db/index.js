import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'hr_dashboard_db',
};

let pool = null;
let isConnectedToPostgres = false;

// In-Memory store for instant zero-config fallback if PostgreSQL credentials need configuration
const memoryStore = {
  users: [],
  salaries: [],
  attendance: [],
  leaves: [],
  payrolls: [],
  nextId: {
    users: 1,
    salaries: 1,
    attendance: 1,
    leaves: 1,
    payrolls: 1,
  }
};

/**
 * Initialize connection pool & bootstrap schema
 */
export async function initDB() {
  console.log(`[DB] Attempting PostgreSQL connection to ${dbConfig.user}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}...`);

  // Step 1: Check if hr_dashboard_db exists, create if missing
  try {
    const adminPool = new Pool({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      database: 'postgres',
      connectionTimeoutMillis: 3000,
    });

    const checkRes = await adminPool.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbConfig.database]
    );

    if (checkRes.rowCount === 0) {
      console.log(`[DB] Database "${dbConfig.database}" does not exist. Creating it now...`);
      await adminPool.query(`CREATE DATABASE "${dbConfig.database}"`);
      console.log(`[DB] Database "${dbConfig.database}" created successfully.`);
    }
    await adminPool.end();
  } catch (err) {
    console.warn(`[DB Admin Notice] Could not create database automatically (${err.message}). Connecting directly...`);
  }

  // Step 2: Connect to target database
  try {
    pool = new Pool({
      ...dbConfig,
      connectionTimeoutMillis: 4000,
      max: 20,
    });

    // Test connection
    const client = await pool.connect();
    client.release();
    isConnectedToPostgres = true;
    console.log(`\x1b[32m✔ [DB] Successfully connected to PostgreSQL database "${dbConfig.database}"!\x1b[0m`);

    // Run schema
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    await pool.query(schemaSql);
    console.log('✔ [DB] PostgreSQL tables and indexes verified.');

    // Seed data
    await seedPostgresData();
  } catch (err) {
    console.warn(`\x1b[33m⚠ [DB Warning] PostgreSQL connection failed: ${err.message}\x1b[0m`);
    console.warn(`\x1b[33mℹ [DB Info] Switching to High-Performance In-Memory store so app runs without interruptions.\x1b[0m`);
    console.warn(`\x1b[36m👉 TIP: Update your PostgreSQL password in server/.env (DB_PASSWORD=your_password) to persist directly to PostgreSQL.\x1b[0m`);
    isConnectedToPostgres = false;
    await seedMemoryData();
  }
}

/**
 * Query executor - routes to PostgreSQL or fallback
 */
export async function query(text, params = []) {
  if (isConnectedToPostgres && pool) {
    return pool.query(text, params);
  }
  return executeMemoryQuery(text, params);
}

export function getDBStatus() {
  return {
    engine: isConnectedToPostgres ? 'PostgreSQL' : 'In-Memory DB (PostgreSQL Fallback)',
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database,
    user: dbConfig.user,
    connected: true,
  };
}

/**
 * Initial Seed Data for PostgreSQL
 */
async function seedPostgresData() {
  const hrCount = await pool.query(`SELECT COUNT(*) FROM users WHERE role = 'hr'`);
  if (parseInt(hrCount.rows[0].count, 10) > 0) {
    return; // Already seeded
  }

  console.log('[DB] Seeding initial HR and Employee records in PostgreSQL...');

  const passwordHash = await bcrypt.hash('admin123', 10);
  const empHash = await bcrypt.hash('emp123', 10);

  // 1. Create HR User
  const hrRes = await pool.query(
    `INSERT INTO users (emp_code, name, email, password_hash, role, department, designation, phone, joining_date, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
    ['HR001', 'Sarah Jenkins', 'hr@company.com', passwordHash, 'hr', 'Human Resources', 'HR Director', '+1 (555) 019-2834', '2023-01-15', 'active']
  );

  await pool.query(
    `INSERT INTO salaries (employee_id, basic_salary, hra, allowances, pf_deduction, tax_deduction, net_salary)
     VALUES ($1, 65000, 26000, 10000, 7800, 4500, 88700)`,
    [hrRes.rows[0].id]
  );

  // 2. Create Employees
  const employees = [
    {
      code: 'EMP101',
      name: 'Alex Rivera',
      email: 'alex@company.com',
      dept: 'Engineering',
      desig: 'Senior Full Stack Engineer',
      phone: '+1 (555) 012-3456',
      date: '2023-06-12',
      basic: 50000,
      hra: 20000,
      allowances: 8000,
      pf: 6000,
      tax: 3500,
      net: 68500,
    },
    {
      code: 'EMP102',
      name: 'John Doe',
      email: 'john@company.com',
      dept: 'Product Design',
      desig: 'Lead UI/UX Designer',
      phone: '+1 (555) 018-7654',
      date: '2023-09-01',
      basic: 42000,
      hra: 16800,
      allowances: 6000,
      pf: 5040,
      tax: 2800,
      net: 56960,
    },
    {
      code: 'EMP103',
      name: 'Priya Sharma',
      email: 'priya@company.com',
      dept: 'Marketing',
      desig: 'Growth Marketing Manager',
      phone: '+1 (555) 014-9988',
      date: '2024-02-10',
      basic: 38000,
      hra: 15200,
      allowances: 5000,
      pf: 4560,
      tax: 2400,
      net: 51240,
    },
    {
      code: 'EMP104',
      name: 'Michael Chen',
      email: 'michael@company.com',
      dept: 'Finance',
      desig: 'Financial Analyst',
      phone: '+1 (555) 016-4433',
      date: '2024-04-18',
      basic: 35000,
      hra: 14000,
      allowances: 4500,
      pf: 4200,
      tax: 2200,
      net: 47100,
    }
  ];

  const empIds = [];
  for (const emp of employees) {
    const res = await pool.query(
      `INSERT INTO users (emp_code, name, email, password_hash, role, department, designation, phone, joining_date, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      [emp.code, emp.name, emp.email, empHash, 'employee', emp.dept, emp.desig, emp.phone, emp.date, 'active']
    );
    const empId = res.rows[0].id;
    empIds.push(empId);

    await pool.query(
      `INSERT INTO salaries (employee_id, basic_salary, hra, allowances, pf_deduction, tax_deduction, net_salary)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [empId, emp.basic, emp.hra, emp.allowances, emp.pf, emp.tax, emp.net]
    );
  }

  // Seed sample attendance for today & yesterday
  const todayStr = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  // John Doe clocked in today
  await pool.query(
    `INSERT INTO attendance (employee_id, date, clock_in, clock_out, work_hours, status, notes)
     VALUES ($1, $2, '09:05:00', NULL, 0, 'present', 'Clocked in from Office')
     ON CONFLICT DO NOTHING`,
    [empIds[1], todayStr]
  );

  // Alex Rivera clocked in and clocked out yesterday
  await pool.query(
    `INSERT INTO attendance (employee_id, date, clock_in, clock_out, work_hours, status, notes)
     VALUES ($1, $2, '08:55:00', '17:30:00', 8.58, 'present', 'Regular workday completed')
     ON CONFLICT DO NOTHING`,
    [empIds[0], yesterdayStr]
  );

  // Seed Leaves
  await pool.query(
    `INSERT INTO leaves (employee_id, leave_type, start_date, end_date, total_days, reason, status, hr_remarks)
     VALUES ($1, 'Sick Leave', CURRENT_DATE + INTERVAL '2 day', CURRENT_DATE + INTERVAL '3 day', 2, 'Doctor consultation and recovery', 'pending', NULL)`,
    [empIds[0]]
  );

  console.log('✔ [DB] Seed data populated successfully.');
}

/**
 * Seed for Memory fallback
 */
async function seedMemoryData() {
  const passwordHash = await bcrypt.hash('admin123', 10);
  const empHash = await bcrypt.hash('emp123', 10);

  // HR
  const hrUser = {
    id: memoryStore.nextId.users++,
    emp_code: 'HR001',
    name: 'Sarah Jenkins',
    email: 'hr@company.com',
    password_hash: passwordHash,
    role: 'hr',
    department: 'Human Resources',
    designation: 'HR Director',
    phone: '+1 (555) 019-2834',
    joining_date: '2023-01-15',
    status: 'active',
    created_at: new Date().toISOString()
  };
  memoryStore.users.push(hrUser);

  memoryStore.salaries.push({
    id: memoryStore.nextId.salaries++,
    employee_id: hrUser.id,
    basic_salary: 65000,
    hra: 26000,
    allowances: 10000,
    pf_deduction: 7800,
    tax_deduction: 4500,
    net_salary: 88700,
    updated_at: new Date().toISOString()
  });

  const emps = [
    { code: 'EMP101', name: 'Alex Rivera', email: 'alex@company.com', dept: 'Engineering', desig: 'Senior Full Stack Engineer', phone: '+1 (555) 012-3456', date: '2023-06-12', basic: 50000, hra: 20000, allowances: 8000, pf: 6000, tax: 3500, net: 68500 },
    { code: 'EMP102', name: 'John Doe', email: 'john@company.com', dept: 'Product Design', desig: 'Lead UI/UX Designer', phone: '+1 (555) 018-7654', date: '2023-09-01', basic: 42000, hra: 16800, allowances: 6000, pf: 5040, tax: 2800, net: 56960 },
    { code: 'EMP103', name: 'Priya Sharma', email: 'priya@company.com', dept: 'Marketing', desig: 'Growth Marketing Manager', phone: '+1 (555) 014-9988', date: '2024-02-10', basic: 38000, hra: 15200, allowances: 5000, pf: 4560, tax: 2400, net: 51240 },
    { code: 'EMP104', name: 'Michael Chen', email: 'michael@company.com', dept: 'Finance', desig: 'Financial Analyst', phone: '+1 (555) 016-4433', date: '2024-04-18', basic: 35000, hra: 14000, allowances: 4500, pf: 4200, tax: 2200, net: 47100 }
  ];

  for (const emp of emps) {
    const u = {
      id: memoryStore.nextId.users++,
      emp_code: emp.code,
      name: emp.name,
      email: emp.email,
      password_hash: empHash,
      role: 'employee',
      department: emp.dept,
      designation: emp.desig,
      phone: emp.phone,
      joining_date: emp.date,
      status: 'active',
      created_at: new Date().toISOString()
    };
    memoryStore.users.push(u);

    memoryStore.salaries.push({
      id: memoryStore.nextId.salaries++,
      employee_id: u.id,
      basic_salary: emp.basic,
      hra: emp.hra,
      allowances: emp.allowances,
      pf_deduction: emp.pf,
      tax_deduction: emp.tax,
      net_salary: emp.net,
      updated_at: new Date().toISOString()
    });
  }

  // Today attendance
  const todayStr = new Date().toISOString().split('T')[0];
  memoryStore.attendance.push({
    id: memoryStore.nextId.attendance++,
    employee_id: 3, // John Doe
    date: todayStr,
    clock_in: '09:05:00',
    clock_out: null,
    work_hours: 0,
    status: 'present',
    notes: 'Clocked in via dashboard',
    created_at: new Date().toISOString()
  });

  memoryStore.leaves.push({
    id: memoryStore.nextId.leaves++,
    employee_id: 2, // Alex
    leave_type: 'Sick Leave',
    start_date: '2026-10-28',
    end_date: '2026-10-29',
    total_days: 2,
    reason: 'Doctor consultation & rest',
    status: 'pending',
    hr_remarks: null,
    created_at: new Date().toISOString()
  });

  memoryStore.leaves.push({
    id: memoryStore.nextId.leaves++,
    employee_id: 3, // John
    leave_type: 'Casual Leave',
    start_date: '2026-10-20',
    end_date: '2026-10-21',
    total_days: 2,
    reason: 'Personal family matter',
    status: 'approved',
    hr_remarks: 'Approved. Enjoy!',
    created_at: new Date().toISOString()
  });
}

/**
 * Universal In-Memory SQL Simulator for Instant Zero-Config Execution
 */
async function executeMemoryQuery(text, params = []) {
  const clean = text.trim();

  // 1. SELECT COUNT queries
  if (/SELECT COUNT\(\*\)/i.test(clean)) {
    if (/FROM users/i.test(clean)) {
      let rows = memoryStore.users;
      if (/role != 'hr'/i.test(clean)) rows = rows.filter(u => u.role !== 'hr');
      if (/role = 'hr'/i.test(clean)) rows = rows.filter(u => u.role === 'hr');
      if (/status = 'active'/i.test(clean)) rows = rows.filter(u => u.status === 'active');
      return { rows: [{ count: rows.length }], rowCount: 1 };
    }
    if (/FROM attendance/i.test(clean)) {
      let rows = memoryStore.attendance;
      if (params.length > 0) {
        if (/employee_id = \$1/i.test(clean)) {
          rows = rows.filter(a => a.employee_id === parseInt(params[0], 10));
        } else if (/date = \$1/i.test(clean)) {
          rows = rows.filter(a => a.date === params[0]);
        }
      }
      return { rows: [{ count: rows.length }], rowCount: 1 };
    }
    if (/FROM leaves/i.test(clean)) {
      let rows = memoryStore.leaves;
      if (/status = 'pending'/i.test(clean)) rows = rows.filter(l => l.status === 'pending');
      return { rows: [{ count: rows.length }], rowCount: 1 };
    }
  }

  // 2. SELECT SUM(net_salary)
  if (/SUM\(net_salary\)/i.test(clean)) {
    const total = memoryStore.salaries.reduce((sum, s) => sum + (s.net_salary || 0), 0);
    return { rows: [{ total }], rowCount: 1 };
  }

  // 3. Department aggregation
  if (/SELECT department, COUNT\(\*\)/i.test(clean)) {
    const activeEmps = memoryStore.users.filter(u => u.status === 'active' && u.role !== 'hr');
    const deptMap = {};
    for (const u of activeEmps) {
      deptMap[u.department] = (deptMap[u.department] || 0) + 1;
    }
    const rows = Object.keys(deptMap).map(k => ({ department: k, count: deptMap[k] }));
    return { rows, rowCount: rows.length };
  }

  // 4. Single User by ID (used by auth middleware, getProfile, etc.)
  if (/FROM users/i.test(clean) && /WHERE (u\.)?id = \$1/i.test(clean)) {
    const u = memoryStore.users.find(x => x.id === parseInt(params[0], 10));
    if (!u) return { rows: [], rowCount: 0 };
    const s = memoryStore.salaries.find(x => x.employee_id === u.id) || {};
    return { rows: [{ ...u, ...s }], rowCount: 1 };
  }

  // 5. Single User by Email
  if (/FROM users/i.test(clean) && /WHERE.*email/i.test(clean)) {
    const emailVal = params[0]?.toLowerCase();
    const u = memoryStore.users.find(x => x.email.toLowerCase() === emailVal);
    return { rows: u ? [u] : [], rowCount: u ? 1 : 0 };
  }

  // 5b. Salaries list
  if (/FROM salaries/i.test(clean) && !/WHERE/i.test(clean)) {
    return { rows: memoryStore.salaries, rowCount: memoryStore.salaries.length };
  }

  // 6. Users List with Salaries
  if (/FROM users/i.test(clean)) {
    let list = memoryStore.users.map(u => {
      const s = memoryStore.salaries.find(x => x.employee_id === u.id) || {};
      const { password_hash, ...safe } = u;
      return { ...safe, ...s };
    });
    return { rows: list, rowCount: list.length };
  }

  // 7. Attendance queries
  if (/FROM attendance/i.test(clean)) {
    let list = [...memoryStore.attendance];
    if (params.length === 2 && /employee_id = \$1 AND date = \$2/i.test(clean)) {
      const att = list.find(a => a.employee_id === parseInt(params[0], 10) && a.date === params[1]);
      return { rows: att ? [att] : [], rowCount: att ? 1 : 0 };
    }
    if (params.length === 1 && /employee_id = \$1/i.test(clean)) {
      list = list.filter(a => a.employee_id === parseInt(params[0], 10));
    }
    const enriched = list.map(a => {
      const u = memoryStore.users.find(x => x.id === a.employee_id);
      return {
        ...a,
        employee_name: u?.name || 'Unknown',
        emp_code: u?.emp_code || '',
        department: u?.department || '',
      };
    });
    return { rows: enriched, rowCount: enriched.length };
  }

  // 8. INSERT INTO attendance
  if (/INSERT INTO attendance/i.test(clean)) {
    // params: [employeeId, todayStr, currentTime, status, notes]
    const rec = {
      id: memoryStore.nextId.attendance++,
      employee_id: parseInt(params[0], 10),
      date: params[1],
      clock_in: params[2],
      clock_out: null,
      work_hours: 0,
      status: params[3] || 'present',
      notes: params[4] || '',
      created_at: new Date().toISOString()
    };
    memoryStore.attendance.push(rec);
    return { rows: [rec], rowCount: 1 };
  }

  // 9. UPDATE attendance (clock-out)
  if (/UPDATE attendance/i.test(clean)) {
    // params: [clock_out, work_hours, id]
    const rec = memoryStore.attendance.find(a => a.id === parseInt(params[2], 10));
    if (rec) {
      rec.clock_out = params[0];
      rec.work_hours = params[1];
    }
    return { rows: rec ? [rec] : [], rowCount: rec ? 1 : 0 };
  }

  // 10. Leaves queries
  if (/FROM leaves/i.test(clean)) {
    let list = [...memoryStore.leaves];
    if (params.length >= 1 && /employee_id = \$1/i.test(clean)) {
      list = list.filter(l => l.employee_id === parseInt(params[0], 10));
    }
    const enriched = list.map(l => {
      const u = memoryStore.users.find(x => x.id === l.employee_id);
      return {
        ...l,
        employee_name: u?.name || 'Unknown',
        emp_code: u?.emp_code || '',
        department: u?.department || '',
      };
    });
    return { rows: enriched, rowCount: enriched.length };
  }

  // 11. INSERT INTO leaves
  if (/INSERT INTO leaves/i.test(clean)) {
    const rec = {
      id: memoryStore.nextId.leaves++,
      employee_id: parseInt(params[0], 10),
      leave_type: params[1],
      start_date: params[2],
      end_date: params[3],
      total_days: parseInt(params[4], 10),
      reason: params[5],
      status: 'pending',
      hr_remarks: null,
      created_at: new Date().toISOString()
    };
    memoryStore.leaves.push(rec);
    return { rows: [rec], rowCount: 1 };
  }

  // 12. UPDATE leaves
  if (/UPDATE leaves/i.test(clean)) {
    const leaveId = parseInt(params[3], 10);
    const rec = memoryStore.leaves.find(l => l.id === leaveId);
    if (rec) {
      rec.status = params[0];
      rec.hr_remarks = params[1];
      rec.reviewed_by = parseInt(params[2], 10);
      rec.reviewed_at = new Date().toISOString();
    }
    return { rows: rec ? [rec] : [], rowCount: rec ? 1 : 0 };
  }

  // 13. Payrolls queries
  if (/FROM payrolls/i.test(clean)) {
    let list = [...memoryStore.payrolls];
    if (params.length >= 1 && /employee_id = \$1/i.test(clean)) {
      list = list.filter(p => p.employee_id === parseInt(params[0], 10));
    }
    const enriched = list.map(p => {
      const u = memoryStore.users.find(x => x.id === p.employee_id);
      return {
        ...p,
        employee_name: u?.name || 'Unknown',
        emp_code: u?.emp_code || '',
        department: u?.department || '',
      };
    });
    return { rows: enriched, rowCount: enriched.length };
  }

  // 14. INSERT INTO payrolls
  if (/INSERT INTO payrolls/i.test(clean)) {
    const empId = parseInt(params[0], 10);
    const month = parseInt(params[1], 10);
    const year = parseInt(params[2], 10);

    const rec = {
      id: memoryStore.nextId.payrolls++,
      employee_id: empId,
      month,
      year,
      working_days: params[3],
      present_days: params[4],
      paid_leaves: params[5],
      unpaid_leaves: params[6],
      basic_pay: params[7],
      hra: params[8],
      allowances: params[9],
      gross_pay: params[10],
      pf_deduction: params[11],
      tax_deduction: params[12],
      loss_of_pay: params[13],
      total_deductions: params[14],
      net_pay: params[15],
      status: 'generated',
      payment_date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString()
    };
    const existing = memoryStore.payrolls.findIndex(p => p.employee_id === empId && p.month === month && p.year === year);
    if (existing >= 0) memoryStore.payrolls[existing] = rec;
    else memoryStore.payrolls.push(rec);
    return { rows: [rec], rowCount: 1 };
  }

  // 15. UPDATE users (e.g. password update or profile edit)
  if (/UPDATE users/i.test(clean)) {
    if (/password_hash/i.test(clean)) {
      const u = memoryStore.users.find(x => x.id === parseInt(params[1], 10));
      if (u) {
        u.password_hash = params[0];
      }
      return { rows: u ? [u] : [], rowCount: u ? 1 : 0 };
    }
  }

  return { rows: [], rowCount: 0 };
}

export { memoryStore };

