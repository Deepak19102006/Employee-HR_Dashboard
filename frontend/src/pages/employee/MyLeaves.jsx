import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import Modal from '../../components/Modal';
import { CalendarCheck2, PlusCircle, CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';

export default function MyLeaves() {
  const [leaves, setLeaves] = useState([]);
  const [balances, setBalances] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    leave_type: 'Casual Leave',
    start_date: '',
    end_date: '',
    reason: '',
  });

  const loadLeaves = async () => {
    setLoading(true);
    try {
      const res = await api.getMyLeaves();
      setLeaves(res.leaves || []);
      setBalances(res.balances);
    } catch (err) {
      console.error('Failed to load leaves:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaves();
  }, []);

  const handleApply = async (e) => {
    e.preventDefault();
    if (!formData.start_date || !formData.end_date || !formData.reason) {
      alert('Please fill out all leave fields.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.applyLeave(formData);
      alert(res.message || 'Leave request submitted!');
      setIsApplyModalOpen(false);
      setFormData({
        leave_type: 'Casual Leave',
        start_date: '',
        end_date: '',
        reason: '',
      });
      loadLeaves();
    } catch (err) {
      alert(err.message || 'Failed to submit leave request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Leave Requests & Quotas</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Submit new leave requests and check real-time approval status from HR.
          </p>
        </div>

        <button
          onClick={() => setIsApplyModalOpen(true)}
          className="flex items-center space-x-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Apply For Leave</span>
        </button>
      </div>

      {/* Leave Quota Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Casual Leave</span>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {balances?.casual?.remaining ?? 12}
                <span className="text-xs text-slate-400 font-normal ml-1">/ {balances?.casual?.total ?? 12} days</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {balances?.casual?.used ?? 0} days utilized
              </p>
            </div>
            <div className="p-2.5 bg-purple-50 rounded-xl text-purple-600">
              <CalendarCheck2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Sick Leave</span>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {balances?.sick?.remaining ?? 10}
                <span className="text-xs text-slate-400 font-normal ml-1">/ {balances?.sick?.total ?? 10} days</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {balances?.sick?.used ?? 0} days utilized
              </p>
            </div>
            <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">Paid / Annual Leave</span>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {balances?.paid?.remaining ?? 15}
                <span className="text-xs text-slate-400 font-normal ml-1">/ {balances?.paid?.total ?? 15} days</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {balances?.paid?.used ?? 0} days utilized
              </p>
            </div>
            <div className="p-2.5 bg-sky-50 rounded-xl text-sky-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Leave Application History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-sm">Application History</h3>
          <p className="text-xs text-slate-500">Track all pending and approved leave requests</p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400 text-sm">Loading leave applications...</div>
        ) : leaves.length === 0 ? (
          <div className="text-center py-12 bg-slate-50">
            <CalendarCheck2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No leave requests found</p>
            <p className="text-xs text-slate-400 mt-0.5">Click "Apply For Leave" to request time off.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Leave Type</th>
                  <th className="py-3.5 px-4">Start Date</th>
                  <th className="py-3.5 px-4">End Date</th>
                  <th className="py-3.5 px-4">Total Days</th>
                  <th className="py-3.5 px-4">Reason</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">HR Feedback / Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leaves.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{l.leave_type}</td>
                    <td className="py-3.5 px-4 text-slate-700">{l.start_date}</td>
                    <td className="py-3.5 px-4 text-slate-700">{l.end_date}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {l.total_days} {l.total_days === 1 ? 'day' : 'days'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-xs">{l.reason}</td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                        l.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : l.status === 'rejected'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {l.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 italic max-w-xs truncate">
                      {l.hr_remarks || 'Awaiting HR decision'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Apply for Leave */}
      <Modal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        title="Submit Leave Request"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleApply} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-600 uppercase mb-1">Leave Category</label>
            <select
              value={formData.leave_type}
              onChange={(e) => setFormData({ ...formData, leave_type: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
            >
              <option value="Casual Leave">Casual Leave (Short Personal Leave)</option>
              <option value="Sick Leave">Sick Leave (Medical / Illness)</option>
              <option value="Paid Leave">Paid Leave (Vacation / Annual)</option>
              <option value="Unpaid Leave">Unpaid Leave (Loss of Pay)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-600 uppercase mb-1">Start Date</label>
              <input
                type="date"
                required
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-600 uppercase mb-1">End Date</label>
              <input
                type="date"
                required
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-600 uppercase mb-1">Reason for Absence</label>
            <textarea
              rows="3"
              required
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="State reason for taking time off..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setIsApplyModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-semibold shadow-sm disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit to HR'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

