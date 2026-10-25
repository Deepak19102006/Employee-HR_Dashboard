import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Building2, Shield, User, Lock, Mail, ArrowRight, UserPlus, CheckCircle2, KeyRound } from 'lucide-react';

export default function Login() {
  const { login, registerEmployee } = useAuth();
  const [role, setRole] = useState('hr'); // 'hr' or 'employee'
  const [mode, setMode] = useState('login'); // 'login' or 'register' (register is for employee first-time password setup)
  const [email, setEmail] = useState('hr@company.com');
  const [password, setPassword] = useState('admin123');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleRoleSwitch = (newRole) => {
    setRole(newRole);
    setMode('login');
    setError('');
    setSuccessMsg('');
    if (newRole === 'hr') {
      setEmail('hr@company.com');
      setPassword('admin123');
    } else {
      setEmail('alex@company.com');
      setPassword('emp123');
    }
  };

  const handleModeSwitch = (newMode) => {
    setMode(newMode);
    setError('');
    setSuccessMsg('');
    setPassword('');
    setConfirmPassword('');
    if (newMode === 'register') {
      setEmail('');
    } else {
      setEmail('alex@company.com');
      setPassword('emp123');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (role === 'employee' && mode === 'register') {
        // Validation
        if (!email.trim()) {
          throw new Error('Please enter your work email.');
        }
        if (!password) {
          throw new Error('Please create a password.');
        }
        if (password.length < 4) {
          throw new Error('Password must be at least 4 characters long.');
        }
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match. Please re-enter.');
        }

        const res = await registerEmployee({ email: email.trim(), password });
        setSuccessMsg(res.message || 'Password successfully created!');
      } else {
        await login({ email: email.trim(), password, role });
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (demoEmail, demoPassword, demoRole) => {
    setRole(demoRole);
    setMode('login');
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      await login({ email: demoEmail, password: demoPassword, role: demoRole });
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-xl shadow-indigo-500/20 mb-3">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">WorkPulse HRMS</h1>
          <p className="text-slate-400 text-xs mt-1">Enterprise Personnel, Attendance & Payroll Portal</p>
        </div>

        {/* Card Box */}
        <div className="bg-white rounded-3xl p-7 shadow-2xl border border-slate-100">
          {/* Role Switch Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-2xl mb-5">
            <button
              type="button"
              onClick={() => handleRoleSwitch('hr')}
              className={`flex items-center justify-center space-x-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                role === 'hr'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>HR Admin</span>
            </button>
            <button
              type="button"
              onClick={() => handleRoleSwitch('employee')}
              className={`flex items-center justify-center space-x-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                role === 'employee'
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Employee</span>
            </button>
          </div>

          {/* Sub-toggle for Employee: Sign In vs Register / Set Password */}
          {role === 'employee' && (
            <div className="flex border-b border-slate-200 mb-5">
              <button
                type="button"
                onClick={() => handleModeSwitch('login')}
                className={`flex-1 py-2 text-xs font-bold text-center border-b-2 transition-all ${
                  mode === 'login'
                    ? 'border-sky-600 text-sky-700'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => handleModeSwitch('register')}
                className={`flex-1 py-2 text-xs font-bold text-center border-b-2 transition-all flex items-center justify-center space-x-1 ${
                  mode === 'register'
                    ? 'border-sky-600 text-sky-700'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5 mr-1" />
                <span>First Time? Set Password</span>
              </button>
            </div>
          )}

          {/* Notice banner for Register mode */}
          {role === 'employee' && mode === 'register' && (
            <div className="mb-4 p-3 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-800 space-y-1">
              <p className="font-bold flex items-center">
                <KeyRound className="w-4 h-4 mr-1 text-sky-600" /> Employee First-Time Setup
              </p>
              <p className="text-[11px] text-sky-700">
                Enter the work email your HR used to add you to the system. You will create your password here and can use it to log in anytime.
              </p>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-medium flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={
                    role === 'hr'
                      ? 'hr@company.com'
                      : mode === 'register'
                      ? 'your.email@company.com'
                      : 'alex@company.com'
                  }
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                {mode === 'register' ? 'Create Password' : 'Password'}
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'register' ? 'Choose a strong password' : '••••••••'}
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            {/* Confirm Password (only in register mode) */}
            {role === 'employee' && mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-xl text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center space-x-2 ${
                role === 'hr'
                  ? 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500'
                  : 'bg-sky-600 hover:bg-sky-700 focus:ring-sky-500'
              } disabled:opacity-50`}
            >
              <span>
                {loading
                  ? 'Processing...'
                  : role === 'hr'
                  ? 'Sign in as HR Manager'
                  : mode === 'register'
                  ? 'Create Password & Register'
                  : 'Sign in as Employee'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick link to switch mode if on employee tab */}
          {role === 'employee' && (
            <div className="text-center mt-3">
              {mode === 'login' ? (
                <button
                  type="button"
                  onClick={() => handleModeSwitch('register')}
                  className="text-xs text-sky-600 hover:text-sky-800 font-semibold"
                >
                  First time here? Click to set your password ➔
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleModeSwitch('login')}
                  className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
                >
                  Already set your password? Return to Sign In ➔
                </button>
              )}
            </div>
          )}

          {/* Quick Demo Credentials 1-Click shortcuts */}
          <div className="mt-5 pt-5 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 text-center">
              Quick 1-Click Demo Login
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => quickLogin('hr@company.com', 'admin123', 'hr')}
                className="p-2 text-left bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl text-xs transition-colors"
              >
                <div className="font-bold text-purple-900 flex items-center">
                  <Shield className="w-3 h-3 mr-1 text-purple-700" /> HR Admin
                </div>
                <div className="text-purple-600 font-mono text-[11px] truncate">hr@company.com</div>
              </button>

              <button
                type="button"
                onClick={() => quickLogin('alex@company.com', 'emp123', 'employee')}
                className="p-2 text-left bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl text-xs transition-colors"
              >
                <div className="font-bold text-sky-900 flex items-center">
                  <User className="w-3 h-3 mr-1 text-sky-700" /> Alex (Emp)
                </div>
                <div className="text-sky-600 font-mono text-[11px] truncate">alex@company.com</div>
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 mt-5">
          Powered by PostgreSQL Database & Express REST API
        </p>
      </div>
    </div>
  );
}
