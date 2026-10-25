import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import PayslipModal from '../../components/PayslipModal';
import { FileText, Printer, CheckCircle2, BadgeDollarSign, Download } from 'lucide-react';

export default function MyPayslips() {
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayslip, setSelectedPayslip] = useState(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    api.getMyPayslips()
      .then(res => setPayslips(res.payslips || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Monthly Payslips</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          View official compensation statements and download or print salary slips.
        </p>
      </div>

      {/* Payslips List */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">Salary Statements ({payslips.length})</h3>
          <span className="text-xs text-slate-400">All statements certified by HR</span>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400 text-sm">Loading payslips...</div>
        ) : payslips.length === 0 ? (
          <div className="text-center py-12 bg-slate-50">
            <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No payslips generated yet</p>
            <p className="text-xs text-slate-400 mt-0.5">Monthly statements appear here once HR runs the payroll cycle.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Pay Period</th>
                  <th className="py-3.5 px-4">Present / Working Days</th>
                  <th className="py-3.5 px-4">Gross Earnings</th>
                  <th className="py-3.5 px-4">Total Deductions</th>
                  <th className="py-3.5 px-4">Net Payout</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Document</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payslips.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {monthNames[(p.month || 1) - 1]} {p.year}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-semibold">
                      {p.present_days} / {p.working_days} days
                      {p.unpaid_leaves > 0 && (
                        <span className="text-rose-600 text-[11px] block">({p.unpaid_leaves} unpaid days)</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {formatCurrency(p.gross_pay)}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-rose-600">
                      -{formatCurrency(p.total_deductions)}
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-emerald-600 text-sm">
                      {formatCurrency(p.net_pay)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Credited
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedPayslip(p)}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg font-semibold text-xs border border-sky-200 transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>View / Print</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Printable Payslip Modal */}
      <PayslipModal
        isOpen={!!selectedPayslip}
        onClose={() => setSelectedPayslip(null)}
        payslip={selectedPayslip}
      />
    </div>
  );
}

