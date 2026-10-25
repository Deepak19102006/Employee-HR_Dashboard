import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import StatCard from '../../components/StatCard';
import { Clock, CalendarCheck2, BadgeDollarSign, User, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

export default function EmployeeDashboard({ onNavigate }) {
  const { user } = useAuth();
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [leaveBalances, setLeaveBalances] = useState(null);
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [clockLoading, setClockLoading] = useState(false);

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadData = async () => {
    try {
      const [todayRes, leavesRes, myAttRes] = await Promise.all([
        api.getTodayAttendance(),
        api.getMyLeaves(),
        api.getMyAttendance()
      ]);
      setTodayAttendance(todayRes);
      setLeaveBalances(leavesRes.balances);
      setRecentAttendance((myAttRes.attendance || []).slice(0, 5));
    } catch (err) {
      console.error('Failed to load employee dashboard:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleClockIn = async () => {
    setClockLoading(true);
    try {
      const res = await api.clockIn('Web punch-in');
      alert(res.message);
      loadData();
    } catch (err) {
      alert(err.message || 'Clock in failed');
    } finally {
      setClockLoading(false);
    }
  };

  const handleClockOut = async () => {
    setClockLoading(true);
    try {
      const res = await api.clockOut();
      alert(res.message);
      loadData();
    } catch (err) {
      alert(err.message || 'Clock out failed');
    } finally {
      setClockLoading(false);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-sky-700 via-indigo-700 to-slate-900 rounded-3xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-sky-200 text-xs font-semibold uppercase tracking-wider mb-1">
            <span>Welcome back</span>
            <span>•</span>
            <span className="font-mono">{user?.emp_code}</span>
          </div>
          <h1 className="text-2xl font-bold">{user?.name}</h1>
          <p className="text-sky-100 text-xs mt-1">
            {user?.designation} • {user?.department}
          </p>
        </div>

        {/* Live Clock Card */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-right min-w-[180px]">
          <span className="text-[11px] font-semibold text-sky-200 uppercase tracking-wider block">Live Clock</span>
          <span className="text-2xl font-mono font-bold">{currentTime}</span>
          <span className="text-[11px] text-sky-200 block mt-0.5">
            {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Main Action Area: Clock In/Out & Leave Balance Snapshot */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Today's Attendance Punch Card */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                <Clock className="w-5 h-5 text-sky-600" />
                <span>Today's Work Shift Attendance</span>
              </h3>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
                todayAttendance?.hasClockedOut
                  ? 'bg-purple-100 text-purple-700'
                  : todayAttendance?.hasClockedIn
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {todayAttendance?.hasClockedOut
                  ? 'Shift Completed'
                  : todayAttendance?.hasClockedIn
                  ? 'Active / Clocked In'
                  : 'Not Clocked In'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4 my-6 text-center">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Clock In Time</span>
                <p className="text-base font-bold text-emerald-700 mt-1 font-mono">
                  {todayAttendance?.record?.clock_in || '—'}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Clock Out Time</span>
                <p className="text-base font-bold text-purple-700 mt-1 font-mono">
                  {todayAttendance?.record?.clock_out || '—'}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Logged Hours</span>
                <p className="text-base font-bold text-slate-800 mt-1">
                  {todayAttendance?.record?.work_hours ? `${todayAttendance.record.work_hours} hrs` : '0.00 hrs'}
                </p>
              </div>
            </div>
          </div>

          {/* Punch In / Out Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            {!todayAttendance?.hasClockedIn ? (
              <button
                onClick={handleClockIn}
                disabled={clockLoading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>{clockLoading ? 'Recording In-Time...' : 'Punch In / Clock In Now'}</span>
              </button>
            ) : !todayAttendance?.hasClockedOut ? (
              <button
                onClick={handleClockOut}
                disabled={clockLoading}
                className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-sm shadow-md shadow-rose-600/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <Clock className="w-5 h-5" />
                <span>{clockLoading ? 'Recording Out-Time...' : 'Punch Out / Clock Out Now'}</span>
              </button>
            ) : (
              <div className="w-full py-3 bg-slate-100 text-slate-500 rounded-xl font-semibold text-sm text-center border border-slate-200">
                ✔ Today's attendance recorded and completed. Have a great day!
              </div>
            )}
          </div>
        </div>

        {/* Leave Balances Snapshot */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Leave Balances</h3>
              <button
                onClick={() => onNavigate('leaves')}
                className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center space-x-0.5"
              >
                <span>Request</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-3 mt-4">
              <div className="flex justify-between items-center p-3 rounded-xl bg-purple-50 border border-purple-100">
                <div>
                  <span className="font-bold text-xs text-purple-900">Casual Leave</span>
                  <p className="text-[11px] text-purple-600">Short planned time off</p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-purple-900">
                    {leaveBalances?.casual?.remaining ?? 12}
                  </span>
                  <span className="text-[11px] text-purple-500 block">left</span>
                </div>
              </div>

              <div className="flex justify-between items-center p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                <div>
                  <span className="font-bold text-xs text-emerald-900">Sick Leave</span>
                  <p className="text-[11px] text-emerald-600">Medical emergencies</p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-emerald-900">
                    {leaveBalances?.sick?.remaining ?? 10}
                  </span>
                  <span className="text-[11px] text-emerald-500 block">left</span>
                </div>
              </div>

              <div className="flex justify-between items-center p-3 rounded-xl bg-sky-50 border border-sky-100">
                <div>
                  <span className="font-bold text-xs text-sky-900">Paid Leave</span>
                  <p className="text-[11px] text-sky-600">Vacations & annual</p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-sky-900">
                    {leaveBalances?.paid?.remaining ?? 15}
                  </span>
                  <span className="text-[11px] text-sky-500 block">left</span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('leaves')}
            className="w-full mt-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors"
          >
            Apply For Leave
          </button>
        </div>
      </div>

      {/* Recent Attendance History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Recent Attendance History</h3>
            <p className="text-xs text-slate-500">Your most recent punch records</p>
          </div>
          <button
            onClick={() => onNavigate('attendance')}
            className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center space-x-1"
          >
            <span>Full History</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentAttendance.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">No past attendance logs found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Clock In</th>
                  <th className="py-2.5 px-3">Clock Out</th>
                  <th className="py-2.5 px-3">Logged Hours</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentAttendance.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{a.date}</td>
                    <td className="py-2.5 px-3 font-mono text-emerald-700">{a.clock_in || '—'}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-700">{a.clock_out || '—'}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-800">{a.work_hours || 0} hrs</td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        a.status === 'present' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

