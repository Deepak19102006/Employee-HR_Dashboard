import React from 'react';
import Modal from './Modal';
import { Printer, Building2, CheckCircle2 } from 'lucide-react';

export default function PayslipModal({ isOpen, onClose, payslip }) {
  if (!payslip) return null;

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const monthName = monthNames[(payslip.month || 1) - 1];

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(num || 0);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Payslip Document" maxWidth="max-w-2xl">
      <div className="space-y-6">
        {/* Printable Payslip Card */}
        <div id="printable-payslip" className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-slate-200 pb-4">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">WorkPulse Enterprise</h2>
                <p className="text-xs text-slate-500">Corporate HQ • Tech Park, Sector 4</p>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Paid
              </span>
              <p className="text-sm font-bold text-slate-800 mt-1">{monthName} {payslip.year}</p>
            </div>
          </div>

          {/* Employee & Pay Details Info Box */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-b border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 block">Employee Name</span>
              <span className="font-semibold text-slate-800 text-sm">{payslip.employee_name}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Employee ID</span>
              <span className="font-semibold text-slate-800 text-sm font-mono">{payslip.emp_code}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Department</span>
              <span className="font-semibold text-slate-800 text-sm">{payslip.department}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Designation</span>
              <span className="font-semibold text-slate-800 text-sm">{payslip.designation}</span>
            </div>
          </div>

          {/* Attendance snapshot */}
          <div className="grid grid-cols-3 gap-2 py-3 bg-slate-50 rounded-lg text-center text-xs my-4 border border-slate-100">
            <div>
              <span className="text-slate-500">Working Days</span>
              <p className="font-bold text-slate-800 text-sm">{payslip.working_days || 30}</p>
            </div>
            <div>
              <span className="text-slate-500">Days Present</span>
              <p className="font-bold text-emerald-700 text-sm">{payslip.present_days}</p>
            </div>
            <div>
              <span className="text-slate-500">Unpaid Leaves (LOP)</span>
              <p className="font-bold text-rose-600 text-sm">{payslip.unpaid_leaves || 0} days</p>
            </div>
          </div>

          {/* Earnings & Deductions Tables */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Earnings */}
            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Earnings</h4>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">Basic Pay</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(payslip.basic_pay)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">HRA</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(payslip.hra)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Allowances</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(payslip.allowances)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-sm text-slate-900">
                  <span>Gross Pay</span>
                  <span>{formatCurrency(payslip.gross_pay)}</span>
                </div>
              </div>
            </div>

            {/* Deductions */}
            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Deductions</h4>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">Provident Fund (PF)</span>
                  <span className="font-semibold text-rose-600">-{formatCurrency(payslip.pf_deduction)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Tax (TDS)</span>
                  <span className="font-semibold text-rose-600">-{formatCurrency(payslip.tax_deduction)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Loss of Pay (LOP)</span>
                  <span className="font-semibold text-rose-600">-{formatCurrency(payslip.loss_of_pay)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-sm text-rose-700">
                  <span>Total Deductions</span>
                  <span>-{formatCurrency(payslip.total_deductions)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Net Salary Banner */}
          <div className="mt-5 p-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white flex justify-between items-center shadow-sm">
            <div>
              <span className="text-xs uppercase tracking-wider font-semibold opacity-90">Net Take-Home Pay</span>
              <p className="text-xs opacity-75">Credited to registered salary account</p>
            </div>
            <div className="text-2xl font-black tracking-tight">
              {formatCurrency(payslip.net_pay)}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between text-[11px] text-slate-400">
            <span>Payment Date: {payslip.payment_date || new Date().toISOString().split('T')[0]}</span>
            <span>This is a computer-generated payslip and does not require physical signature.</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 no-print">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center space-x-2 px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save as PDF</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}

