import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';

// HR Pages
import HrDashboard from './pages/hr/HrDashboard';
import EmployeeManagement from './pages/hr/EmployeeManagement';
import AttendanceMonitoring from './pages/hr/AttendanceMonitoring';
import LeaveManagement from './pages/hr/LeaveManagement';
import PayrollCalculation from './pages/hr/PayrollCalculation';

// Employee Pages
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import MyProfile from './pages/employee/MyProfile';
import MyAttendance from './pages/employee/MyAttendance';
import MyLeaves from './pages/employee/MyLeaves';
import MyPayslips from './pages/employee/MyPayslips';

function AppContent() {
  const { user, loading, isHR } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-semibold text-slate-300">Initializing WorkPulse HRMS...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const renderContent = () => {
    if (isHR) {
      switch (currentTab) {
        case 'dashboard':
          return <HrDashboard onNavigate={setCurrentTab} />;
        case 'employees':
          return <EmployeeManagement />;
        case 'attendance':
          return <AttendanceMonitoring />;
        case 'leaves':
          return <LeaveManagement />;
        case 'payroll':
          return <PayrollCalculation />;
        default:
          return <HrDashboard onNavigate={setCurrentTab} />;
      }
    } else {
      switch (currentTab) {
        case 'dashboard':
          return <EmployeeDashboard onNavigate={setCurrentTab} />;
        case 'profile':
          return <MyProfile />;
        case 'attendance':
          return <MyAttendance />;
        case 'leaves':
          return <MyLeaves />;
        case 'payslips':
          return <MyPayslips />;
        default:
          return <EmployeeDashboard onNavigate={setCurrentTab} />;
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-col">
      <Navbar />
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

