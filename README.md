# 🏢 WorkPulse HRMS — Full Stack Employee & HR Portal

A modern, responsive, enterprise-grade **Human Resource Management System (HRMS)** built with **React + Vite + Tailwind CSS**, **Node.js + Express REST API**, and **PostgreSQL**.

---

## 📁 Project Architecture & Clean Folder Separation

The project is structured into clear, decoupled folders:

```
Full_stack_project/
├── frontend/                # React 18 + Vite + Tailwind CSS (SPA UI)
│   ├── src/
│   │   ├── api/            # API client wrapper
│   │   ├── context/        # Auth context & session state
│   │   ├── components/     # Modals, Navbar, Sidebar, StatCards, Payslip
│   │   └── pages/
│   │       ├── Login.jsx
│   │       ├── hr/         # HR Dashboard, Employees, Attendance, Leaves, Payroll
│   │       └── employee/   # Employee Dashboard, Profile, Attendance, Leaves, Payslips
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── backend/                 # Node.js + Express REST API & PostgreSQL Layer
│   ├── src/
│   │   ├── db/             # pg Pool, PostgreSQL schema.sql, initial seed
│   │   ├── middleware/     # JWT authentication & role-based access control
│   │   └── routes/         # auth, employees, attendance, leaves, payroll, dashboard
│   ├── .env                # Database credentials & port configuration
│   ├── setup-db.js         # Automated database setup script
│   ├── view-db.js          # Interactive database tables viewer
│   └── package.json
│
├── setup-db.js              # Root wrapper for database setup
├── test-server.js           # Automated backend test suite
├── package.json             # Root runner (starts frontend & backend)
└── .gitignore               # Multi-environment gitignore
```

---

## 🌟 Key Features

### 👔 HR Administration Portal
* **Dashboard Overview**: Real-time KPI statistics (Total workforce, Employees present today, Attendance rate, Pending leave requests, Monthly estimated payroll budget).
* **Employee Directory**:
  - Add new personnel with full employment info (Name, Email, Role, Department, Designation, Phone, Joining Date).
  - Set initial salary structure (Basic Pay, HRA, Allowances, PF deduction, Tax deduction).
  - Search, filter by department, update employee details & salary packages, activate or deactivate accounts.
* **Attendance Monitoring**:
  - Daily workforce attendance logs with real-time punch timestamps (Clock In / Clock Out).
  - Calculated daily working hours.
  - Automatic status flags: **Present**, **Late** (after 9:30 AM), **In-Office (Active)**.
  - Filter by date, employee name, or department.
* **Leave Management**:
  - View all employee leave applications categorized by Pending, Approved, or Rejected.
  - 1-click **Approve** or **Reject** with HR feedback and remarks.
* **Payroll & Compensation Engine**:
  - View and edit employee base salary structures.
  - **1-Click Monthly Payroll Calculation**: Reconciles working days, counts actual attendance, evaluates approved unpaid leaves, calculates **Loss of Pay (LOP)**, deductions, and computes Net Salary.
  - Formatted, printable/downloadable official **Salary Payslips**.

---

### 👤 Employee Self-Service Portal
* **First-Time Registration & Password Setup**:
  - When HR adds an employee to the directory, the employee can visit the portal, click **"First Time? Set Password"**, enter their registered work email, and set their personal password.
  - Future logins use that newly created password.
  - Unauthorized emails cannot register unless HR has explicitly added them first.
* **Strictly View-Only Personal Details**: View personal profile, contact information, department, job designation, joining date, and detailed breakdown of monthly compensation.
* **Live Attendance Tracker**:
  - 1-Click **Punch In (Clock In)** & **Punch Out (Clock Out)** buttons with live digital clock.
  - Automatic calculation of hours worked today.
  - Monthly punch history table with in/out timestamps and status badges.
* **Leave Request System**:
  - Apply for leaves (Casual Leave, Sick Leave, Paid/Annual Leave, Unpaid Leave) with start date, end date, and reason.
  - Real-time leave quota balance counters.
  - Track review status (Pending, Approved, Rejected) and read HR remarks.
* **Personal Payslips & Statements**:
  - View all generated monthly salary records.
  - View and print official corporate payslips with complete earnings and deductions breakdown.

---

## 🔑 Demo Login Accounts

| Role | Email | Password | Pre-seeded Features |
| :--- | :--- | :--- | :--- |
| **HR Administrator** | `hr@company.com` | `admin123` | Full HR dashboard, manage roster, approve leaves, run payroll |
| **Employee 1** | `alex@company.com` | `emp123` | Full Stack Engineer, clock in/out, view profile & leaves |
| **Employee 2** | `john@company.com` | `emp123` | Product Designer, clock in/out, view profile & leaves |
| **Employee 3** | `priya@company.com` | `emp123` | Marketing Manager, clock in/out, view profile & leaves |

---

## 🚀 How to Run

### Option A: From the Root Directory (Quickest)

1. **Start the Backend API Server**:
   ```bash
   npm run backend
   ```
   Backend will be running at: **`http://localhost:5000`**

2. **Start the Frontend Application** (in a second terminal):
   ```bash
   npm run frontend
   ```
   Open your browser at: **`http://localhost:5173`**

---

### Option B: Running from Each Folder Independently

1. **Backend**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

---

## 🗄️ Database Utilities

* **Automated Database Setup**:
  ```bash
  node setup-db.js <your_postgres_password>
  ```
* **View Database Records in Terminal**:
  ```bash
  npm run db:view
  ```
* **Run Automated API Tests**:
  ```bash
  npm run test:api
  ```
