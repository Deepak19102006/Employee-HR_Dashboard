import { initDB, query, getDBStatus, memoryStore } from './src/db/index.js';
import dotenv from 'dotenv';

dotenv.config();

async function viewDatabase() {
  await initDB();

  console.log('\n======================================================');
  console.log('📊 WorkPulse HRMS — Database Explorer');
  console.log('Engine:', getDBStatus().engine);
  console.log('Database:', getDBStatus().database);
  console.log('======================================================\n');

  try {
    // 1. Users
    const users = await query('SELECT id, emp_code, name, email, role, department, designation, status FROM users ORDER BY id ASC');
    console.log('👥 TABLE: users (' + (users.rows?.length || 0) + ' records)');
    console.table(users.rows || []);

    // 2. Salaries
    const salaries = await query('SELECT employee_id, basic_salary, hra, allowances, pf_deduction, tax_deduction, net_salary FROM salaries');
    console.log('\n💵 TABLE: salaries (' + (salaries.rows?.length || 0) + ' records)');
    console.table(salaries.rows || []);

    // 3. Attendance
    const attendance = await query('SELECT id, employee_id, date, clock_in, clock_out, work_hours, status FROM attendance ORDER BY date DESC LIMIT 10');
    console.log('\n⏱ TABLE: attendance (' + (attendance.rows?.length || 0) + ' records, showing recent)');
    console.table(attendance.rows || []);

    // 4. Leaves
    const leaves = await query('SELECT id, employee_id, leave_type, start_date, end_date, total_days, status, hr_remarks FROM leaves ORDER BY id DESC');
    console.log('\n📅 TABLE: leaves (' + (leaves.rows?.length || 0) + ' records)');
    console.table(leaves.rows || []);

    // 5. Payrolls
    const payrolls = await query('SELECT id, employee_id, month, year, present_days, gross_pay, total_deductions, net_pay, status FROM payrolls ORDER BY year DESC, month DESC');
    console.log('\n💳 TABLE: payrolls (' + (payrolls.rows?.length || 0) + ' records)');
    console.table(payrolls.rows || []);

    console.log('\n✔ All tables queried successfully.\n');
  } catch (err) {
    console.error('Error querying database:', err.message);
  } finally {
    process.exit(0);
  }
}

viewDatabase();
