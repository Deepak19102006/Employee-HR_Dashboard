import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Clock,
  CalendarCheck2,
  BadgeDollarSign,
  UserCheck,
  FileText
} from 'lucide-react';

export default function Sidebar({ currentTab, setCurrentTab }) {
  const { isHR } = useAuth();

  const hrNavItems = [
    { id: 'dashboard', label: 'HR Overview', icon: LayoutDashboard },
    { id: 'employees', label: 'Employees', icon: Users },
    { id: 'attendance', label: 'Monitor Attendance', icon: Clock },
    { id: 'leaves', label: 'Leave Approvals', icon: CalendarCheck2 },
    { id: 'payroll', label: 'Salary & Payroll', icon: BadgeDollarSign },
  ];

  const empNavItems = [
    { id: 'dashboard', label: 'My Dashboard', icon: LayoutDashboard },
    { id: 'profile', label: 'My Profile', icon: UserCheck },
    { id: 'attendance', label: 'My Attendance', icon: Clock },
    { id: 'leaves', label: 'Request Leave', icon: CalendarCheck2 },
    { id: 'payslips', label: 'My Payslips', icon: FileText },
  ];

  const items = isHR ? hrNavItems : empNavItems;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between shrink-0">
      <div className="space-y-1">
        <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Navigation
        </div>
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? isHR
                    ? 'bg-purple-50 text-purple-700 shadow-sm font-semibold'
                    : 'bg-sky-50 text-sky-700 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className={`w-5 h-5 ${
                isActive
                  ? isHR ? 'text-purple-600' : 'text-sky-600'
                  : 'text-slate-400'
              }`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Info card at bottom */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500">
        <div className="font-semibold text-slate-700 mb-1">
          {isHR ? '⚡ HR Admin Mode' : '👤 Employee Mode'}
        </div>
        <p>
          {isHR
            ? 'Full access to personnel records, leave approval, and payroll generation.'
            : 'Access to mark attendance, apply leaves, and view your personal details.'}
        </p>
      </div>
    </aside>
  );
}

