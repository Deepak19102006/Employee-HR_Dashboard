import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import StatCard from '../../components/StatCard';
import { Users, Clock, CalendarCheck2, BadgeDollarSign, UserPlus, ArrowUpRight, CheckCircle2, XCircle } from 'lucide-react';

export default function HrDashboard({ onNavigate }) {
  const [stats, setStats] = useState(null);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, leavesRes] = await Promise.all([
        api.getHrStats(),
        api.getAllLeaves({ status: 'pending' })
      ]);
      setStats(statsRes.stats);
      setPendingLeaves(leavesRes.leaves || []);
    } catch (err) {
      console.error('Failed to load HR dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleQuickApprove = async (leaveId, status) => {
    try {
      await api.updateLeaveStatus(leaveId, status, `Quick ${status} from HR dashboard`);
      fetchDashboardData();
    } catch (err) {
      alert(err.message || 'Action failed');
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mr-3"></div>
        <span>Loading HR Dashboard data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-purple-900 to-indigo-900 text-white p-6 rounded-3xl shadow-sm">
        <div>
          <h1 className="text-2xl font-bold">HR Operations Command Center</h1>
          <p className="text-purple-200 text-sm mt-1">
            Real-time workforce attendance, leave requests, and payroll metrics.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigate('employees')}
            className="flex items-center space-x-2 bg-white text-purple-900 hover:bg-purple-50 px-4 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Employee</span>
          </button>
          <button
            onClick={() => onNavigate('payroll')}
            className="flex items-center space-x-2 bg-purple-600/60 hover:bg-purple-600 text-white border border-purple-400/30 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all"
          >
            <BadgeDollarSign className="w-4 h-4" />
            <span>Run Payroll</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Workforce"
          value={stats?.totalEmployees || 0}
          subtitle="Active registered employees"
          icon={Users}
          color="purple"
        />
        <StatCard
          title="Present Today"
          value={stats?.presentToday || 0}
          subtitle={`${stats?.attendanceRate || 0}% attendance rate`}
          icon={Clock}
          color="emerald"
        />
        <StatCard
          title="Pending Leaves"
          value={stats?.pendingLeaves || 0}
          subtitle="Requires HR review"
          icon={CalendarCheck2}
          color="amber"
        />
        <StatCard
          title="Monthly Payroll"
          value={formatCurrency(stats?.totalPayroll)}
          subtitle="Estimated net salary bill"
          icon={BadgeDollarSign}
          color="blue"
        />
      </div>

      {/* Two Column Layout: Pending Leaves & Department Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Leaves List */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Pending Leave Requests</h3>
              <p className="text-xs text-slate-500">Take quick action on employee leave applications</p>
            </div>
            <button
              onClick={() => onNavigate('leaves')}
              className="text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {pendingLeaves.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className="text-sm font-semibold text-slate-700">All caught up!</p>
              <p className="text-xs text-slate-400 mt-0.5">There are no pending leave requests awaiting approval.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingLeaves.slice(0, 4).map((leave) => (
                <div
                  key={leave.id}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-all bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-slate-800">{leave.employee_name}</span>
                      <span className="text-xs px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 font-medium">
                        {leave.leave_type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {leave.start_date} to {leave.end_date} ({leave.total_days} days) • Reason: "{leave.reason}"
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => handleQuickApprove(leave.id, 'approved')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 shadow-sm transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => handleQuickApprove(leave.id, 'rejected')}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Department Distribution */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h3 className="font-bold text-slate-900 text-base mb-1">Departments</h3>
          <p className="text-xs text-slate-500 mb-4">Workforce distribution by team</p>

          <div className="space-y-3">
            {stats?.departments?.length > 0 ? (
              stats.departments.map((dept, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs font-semibold text-slate-700">{dept.department}</span>
                  <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-white text-purple-700 border border-purple-100 shadow-sm">
                    {dept.count} members
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">No department data recorded yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

