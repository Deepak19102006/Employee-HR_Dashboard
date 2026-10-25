# 🏢 WorkPulse HRMS — Full Stack Employee & HR Portal

A modern, responsive, enterprise-grade **Human Resource Management System (HRMS)** built with **React + Vite + Tailwind CSS**, **Node.js + Express REST API**, and **PostgreSQL**.

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
  - If HR adds an employee to the directory, the employee can visit the portal, click **"First Time? Set Password"**, enter their registered work email, and set their personal password.
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

> 💡 **Quick 1-Click Login:** On the login screen, convenient demo shortcut buttons automatically fill and log you into the portal with 1 click.

---

## 🛠 Tech Stack

* **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Date utilities.
* **Backend**: Node.js, Express, JWT (`jsonwebtoken`), Password Hashing (`bcryptjs`), CORS.
* **Database**: PostgreSQL 16 (Native `pg` Pool with auto-schema bootstrap and pre-seeded mock records).

---

## 🚀 How to Run the Application

### 1. Configure PostgreSQL (Optional)
The backend is already configured to automatically connect to your PostgreSQL instance at `127.0.0.1:5432`.
Open [`server/.env`](file:///c:/Users/Deepak%20B/Desktop/Full_stack_project/server/.env) and set your PostgreSQL password:
```env
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password_here
DB_NAME=hr_dashboard_db
```
To test and auto-create the database:
```bash
node server/setup-db.js <your_password>
```
*(If the password is not yet configured, the application automatically launches in High-Performance Mode with pre-seeded data so you can test immediately without any blocking errors).*

### 2. Start the Backend API Server
```bash
cd server
npm run dev
```
Backend API will start at: **`http://localhost:5000`**

### 3. Start the React Frontend Application
In a new terminal window:
```bash
cd client
npm run dev
```
Open your browser at: **`http://localhost:5173`**

---

## 🧪 Testing the API
To run the automated backend test suite covering authentication, HR stats, attendance clock-in, and payroll calculation:
```bash
npm run test:api
```

