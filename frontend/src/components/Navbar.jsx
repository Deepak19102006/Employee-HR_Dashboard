import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { LogOut, Shield, User, Database, Building2 } from 'lucide-react';

export default function Navbar() {
  const { user, logout, isHR } = useAuth();
  const [dbStatus, setDbStatus] = useState(null);

  useEffect(() => {
    api.getSystemStatus()
      .then(res => setDbStatus(res.database))
      .catch(() => setDbStatus(null));
  }, []);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">WorkPulse HRMS</span>
                <span className={`text-xs px-2 py-0.5 font-semibold rounded-full uppercase tracking-wider ${
                  isHR ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-sky-100 text-sky-700 border border-sky-200'
                }`}>
                  {isHR ? 'HR Portal' : 'Employee Portal'}
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Enterprise Attendance & Payroll Hub</p>
            </div>
          </div>

          {/* Right section */}
          <div className="flex items-center space-x-4">
            {/* Database indicator */}
            {dbStatus && (
              <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs border border-slate-200">
                <Database className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-medium">{dbStatus.engine}</span>
              </div>
            )}

            {/* User Pill */}
            <div className="flex items-center space-x-3 pl-2 border-l border-slate-200">
              <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-semibold text-sm border border-slate-300">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden sm:block text-left leading-tight">
                <div className="text-sm font-semibold text-slate-800">{user?.name}</div>
                <div className="text-xs text-slate-500 flex items-center space-x-1">
                  <span>{user?.designation || (isHR ? 'HR Admin' : 'Employee')}</span>
                  <span>•</span>
                  <span className="font-mono text-slate-400">{user?.emp_code}</span>
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={logout}
              title="Logout"
              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

