-- HR & Employee Dashboard Database Schema (PostgreSQL)

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    emp_code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'employee', -- 'hr' or 'employee'
    department VARCHAR(80) NOT NULL DEFAULT 'General',
    designation VARCHAR(80) NOT NULL DEFAULT 'Staff',
    phone VARCHAR(25),
    joining_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active' or 'inactive'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS salaries (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    basic_salary NUMERIC(12, 2) NOT NULL DEFAULT 35000.00,
    hra NUMERIC(12, 2) NOT NULL DEFAULT 14000.00,
    allowances NUMERIC(12, 2) NOT NULL DEFAULT 6000.00,
    pf_deduction NUMERIC(12, 2) NOT NULL DEFAULT 4200.00,
    tax_deduction NUMERIC(12, 2) NOT NULL DEFAULT 2500.00,
    net_salary NUMERIC(12, 2) NOT NULL DEFAULT 44300.00,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    clock_in TIME,
    clock_out TIME,
    work_hours NUMERIC(4, 2) DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'present', -- 'present', 'late', 'half_day', 'absent'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_emp_date UNIQUE (employee_id, date)
);

CREATE TABLE IF NOT EXISTS leaves (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    leave_type VARCHAR(40) NOT NULL, -- 'Sick Leave', 'Casual Leave', 'Paid Leave', 'Emergency Leave'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INTEGER NOT NULL DEFAULT 1,
    reason TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    hr_remarks TEXT,
    reviewed_by INTEGER REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payrolls (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    working_days INTEGER NOT NULL DEFAULT 30,
    present_days INTEGER NOT NULL DEFAULT 0,
    paid_leaves INTEGER NOT NULL DEFAULT 0,
    unpaid_leaves INTEGER NOT NULL DEFAULT 0,
    basic_pay NUMERIC(12, 2) NOT NULL,
    hra NUMERIC(12, 2) NOT NULL,
    allowances NUMERIC(12, 2) NOT NULL,
    gross_pay NUMERIC(12, 2) NOT NULL,
    pf_deduction NUMERIC(12, 2) NOT NULL,
    tax_deduction NUMERIC(12, 2) NOT NULL,
    loss_of_pay NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_deductions NUMERIC(12, 2) NOT NULL,
    net_pay NUMERIC(12, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'generated', -- 'generated', 'paid'
    payment_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_emp_month_year UNIQUE (employee_id, month, year)
);

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_attendance_emp_date ON attendance(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_leaves_emp_status ON leaves(employee_id, status);
CREATE INDEX IF NOT EXISTS idx_payrolls_emp_period ON payrolls(employee_id, month, year);

