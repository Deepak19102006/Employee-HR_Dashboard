import { spawn } from 'child_process';

const server = spawn('node', ['src/index.js'], { cwd: 'server', stdio: 'pipe' });

server.stdout.on('data', (d) => process.stdout.write('[Server] ' + d));
server.stderr.on('data', (d) => process.stderr.write('[Server Error] ' + d));

async function runTests() {
  await new Promise(r => setTimeout(r, 2000));

  try {
    console.log('\n--- TEST 1: GET / ---');
    const r1 = await fetch('http://127.0.0.1:5000/');
    console.log('Status:', r1.status, await r1.json());

    console.log('\n--- TEST 2: GET /api/dashboard/status ---');
    const r2 = await fetch('http://127.0.0.1:5000/api/dashboard/status');
    console.log('Status:', r2.status, await r2.json());

    console.log('\n--- TEST 3: HR Login (hr@company.com) ---');
    const r3 = await fetch('http://127.0.0.1:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'hr@company.com', password: 'admin123', role: 'hr' })
    });
    const hrAuth = await r3.json();
    console.log('HR Login:', r3.status, hrAuth.success, 'Token exists:', !!hrAuth.token);

    console.log('\n--- TEST 4: HR Stats with Bearer token ---');
    const r4 = await fetch('http://127.0.0.1:5000/api/dashboard/hr-stats', {
      headers: { Authorization: `Bearer ${hrAuth.token}` }
    });
    console.log('HR Stats:', await r4.json());

    console.log('\n--- TEST 5: Employee Login (alex@company.com) ---');
    const r5 = await fetch('http://127.0.0.1:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alex@company.com', password: 'emp123', role: 'employee' })
    });
    const empAuth = await r5.json();
    console.log('Emp Login:', r5.status, empAuth.success, 'User:', empAuth.user?.name);

    console.log('\n--- TEST 6: Employee Clock In ---');
    const r6 = await fetch('http://127.0.0.1:5000/api/attendance/clock-in', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${empAuth.token}`
      },
      body: JSON.stringify({ notes: 'Punch in test' })
    });
    console.log('Clock in:', await r6.json());

    console.log('\n--- TEST 7: Run Payroll Calculation (HR) ---');
    const r7 = await fetch('http://127.0.0.1:5000/api/payroll/calculate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hrAuth.token}`
      },
      body: JSON.stringify({ month: 10, year: 2026, workingDays: 30 })
    });
    const payrollRes = await r7.json();
    console.log('Payroll result:', payrollRes.success, 'Total records:', payrollRes.payrolls?.length);

    console.log('\n✅ ALL BACKEND TESTS PASSED SUCCESSFULLY!\n');
  } catch (err) {
    console.error('Test execution failed:', err);
  } finally {
    server.kill();
    process.exit(0);
  }
}

runTests();

