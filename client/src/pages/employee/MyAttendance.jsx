import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Clock, Calendar, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

export default function MyAttendance() {
  const [todayStatus, setTodayStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const loadData = async () => {
    setLoading(true);
    try {
      const [todayRes, histRes] = await Promise.all([
        api.getTodayAttendance(),
        api.getMyAttendance({ month: selectedMonth, year: selectedYear })
      ]);
      setTodayStatus(todayRes);
      setHistory(histRes.attendance || []);
    } catch (err) {
      console.error('Failed to load attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedMonth, selectedYear]);

  const handleClockIn = async () => {
    setActionLoading(true);
    try {
      const res = await api.clockIn('Web dashboard clock-in');
      alert(res.message);
      loadData();
    } catch (err) {
      alert(err.message || 'Clock in failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClockOut = async () => {
    setActionLoading(true);
    try {
      const res = await api.clockOut();
      alert(res.message);
      loadData();
    } catch (err) {
      alert(err.message || 'Clock out failed');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Attendance & Work Hours</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Clock in when your shift starts, clock out when done, and review previous logs.
          </p>
        </div>

        {/* Month selector */}
        <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm text-xs font-semibold">
          <Calendar className="w-4 h-4 text-sky-600" />
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
            className="bg-transparent focus:outline-none text-slate-700"
          >
            {[
              'January', 'February', 'March', 'April', 'May', 'June',
              'July', 'August', 'September', 'October', 'November', 'December'
            ].map((m, idx) => (
              <option key={idx + 1} value={idx + 1}>{m}</option>
            ))}
          </select>
          <input
            type="number"
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
            className="w-16 bg-transparent focus:outline-none text-slate-700"
          />
        </div>
      </div>

      {/* Clock In / Out Action Panel */}
      <div className="bg-gradient-to-br from-white to-sky-50/50 rounded-3xl border border-sky-100 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600">
              Today's Session • {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
            <h2 className="text-xl font-bold text-slate-900">
              {todayStatus?.hasClockedOut
                ? 'Work Shift Completed'
                : todayStatus?.hasClockedIn
                ? 'Work Shift In Progress'
                : 'Ready to Start Work'}
            </h2>
            <p className="text-xs text-slate-500">
              Standard shift begins by 9:30 AM. After 9:30 AM is logged as "Late".
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-center px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-400 block uppercase">Punch In</span>
              <span className="text-base font-bold font-mono text-emerald-700">
                {todayStatus?.record?.clock_in || '—'}
              </span>
            </div>

            <div className="text-center px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-400 block uppercase">Punch Out</span>
              <span className="text-base font-bold font-mono text-purple-700">
                {todayStatus?.record?.clock_out || '—'}
              </span>
            </div>

            <div className="text-center px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-400 block uppercase">Work Duration</span>
              <span className="text-base font-bold text-slate-800">
                {todayStatus?.record?.work_hours ? `${todayStatus.record.work_hours} hrs` : '0 hrs'}
              </span>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-6 pt-6 border-t border-sky-100/80 flex justify-end">
          {!todayStatus?.hasClockedIn ? (
            <button
              onClick={handleClockIn}
              disabled={actionLoading}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center space-x-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>{actionLoading ? 'Recording...' : 'Punch In (Start Shift)'}</span>
            </button>
          ) : !todayStatus?.hasClockedOut ? (
            <button
              onClick={handleClockOut}
              disabled={actionLoading}
              className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold text-sm shadow-md shadow-rose-600/20 transition-all flex items-center space-x-2 disabled:opacity-50"
            >
              <Clock className="w-5 h-5" />
              <span>{actionLoading ? 'Recording...' : 'Punch Out (End Shift)'}</span>
            </button>
          ) : (
            <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-4 py-2.5 rounded-xl border border-emerald-200 flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>You have completed attendance for today. Rest well!</span>
            </div>
          )}
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-sm">Monthly Punch History ({history.length} records)</h3>
          <p className="text-xs text-slate-500">Breakdown of timestamps and total hours logged per day</p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400 text-sm">Loading attendance history...</div>
        ) : history.length === 0 ? (
          <div className="text-center py-12 bg-slate-50">
            <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No attendance logs found for this month</p>
            <p className="text-xs text-slate-400 mt-0.5">Punch in above to record your attendance today.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Clock In</th>
                  <th className="py-3.5 px-4">Clock Out</th>
                  <th className="py-3.5 px-4">Logged Hours</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-800">{h.date}</td>
                    <td className="py-3.5 px-4 font-mono text-emerald-700 font-semibold">{h.clock_in || '—'}</td>
                    <td className="py-3.5 px-4 font-mono text-purple-700 font-semibold">{h.clock_out || '—'}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{h.work_hours || 0} hrs</td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                        h.status === 'present' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {h.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 italic max-w-xs truncate">{h.notes || '—'}</td>
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

