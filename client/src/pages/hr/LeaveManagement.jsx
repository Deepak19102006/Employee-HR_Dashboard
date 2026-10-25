import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import Modal from '../../components/Modal';
import { CalendarCheck2, CheckCircle2, XCircle, Clock, Filter, MessageSquare } from 'lucide-react';

export default function LeaveManagement() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  // Review modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [actionType, setActionType] = useState('approved');
  const [remarks, setRemarks] = useState('');

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const res = await api.getAllLeaves({ status: statusFilter });
      setLeaves(res.leaves || []);
    } catch (err) {
      console.error('Failed to load leaves:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [statusFilter]);

  const openReviewModal = (leave, action) => {
    setSelectedLeave(leave);
    setActionType(action);
    setRemarks(action === 'approved' ? 'Approved by HR' : 'Unfortunately cannot approve due to schedule conflict');
    setIsModalOpen(true);
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.updateLeaveStatus(selectedLeave.id, actionType, remarks);
      setIsModalOpen(false);
      fetchLeaves();
    } catch (err) {
      alert(err.message || 'Failed to update leave');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Leave Approvals & Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Review time-off requests, approve or reject applications with comments.
          </p>
        </div>

        {/* Status Filters */}
        <div className="flex items-center space-x-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm text-xs">
          {['all', 'pending', 'approved', 'rejected'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg font-semibold uppercase tracking-wider transition-all ${
                statusFilter === st
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Leaves Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="text-center py-12 text-slate-400 text-sm">Loading leave applications...</div>
        ) : leaves.length === 0 ? (
          <div className="text-center py-12 bg-slate-50">
            <CalendarCheck2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No leave requests found</p>
            <p className="text-xs text-slate-400 mt-0.5">There are no leave requests under status "{statusFilter}".</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Employee</th>
                  <th className="py-3.5 px-4">Leave Type</th>
                  <th className="py-3.5 px-4">Duration</th>
                  <th className="py-3.5 px-4">Reason</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">HR Remarks</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leaves.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{l.employee_name}</div>
                      <div className="text-slate-400 text-[11px] font-mono">{l.emp_code} • {l.department}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                        {l.leave_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{l.start_date} → {l.end_date}</div>
                      <div className="text-slate-400 text-[11px]">{l.total_days} {l.total_days === 1 ? 'day' : 'days'}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 max-w-xs">{l.reason}</td>
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
                      {l.hr_remarks || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {l.status === 'pending' ? (
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => openReviewModal(l, 'approved')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs transition-colors flex items-center space-x-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => openReviewModal(l, 'rejected')}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-semibold text-xs transition-colors flex items-center space-x-1"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">Processed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Approve/Reject with remarks */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`${actionType === 'approved' ? 'Approve' : 'Reject'} Leave Request`}
        maxWidth="max-w-md"
      >
        {selectedLeave && (
          <form onSubmit={handleStatusSubmit} className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
              <div className="font-bold text-slate-800 text-sm">{selectedLeave.employee_name}</div>
              <p className="text-slate-500">
                {selectedLeave.leave_type} ({selectedLeave.total_days} days): {selectedLeave.start_date} to {selectedLeave.end_date}
              </p>
              <p className="text-slate-600 italic">"{selectedLeave.reason}"</p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                HR Remarks / Reason for {actionType}
              </label>
              <textarea
                rows="3"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter feedback for employee..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-5 py-2 text-white rounded-xl font-semibold shadow-sm ${
                  actionType === 'approved' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                Confirm {actionType.toUpperCase()}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

