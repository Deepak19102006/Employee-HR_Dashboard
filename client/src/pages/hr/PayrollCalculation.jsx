import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import Modal from '../../components/Modal';
import PayslipModal from '../../components/PayslipModal';
import {
  BadgeDollarSign,
  Calculator,
  Edit2,
  FileText,
  Calendar,
  CheckCircle2,
  Building,
  TrendingDown,
  Layers
} from 'lucide-react';

export default function PayrollCalculation() {
  const [activeSubTab, setActiveSubTab] = useState('calculate'); // 'calculate' or 'structures'
  const [salaries, setSalaries] = useState([]);
  const [payrollHistory, setPayrollHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Month & Year selection for calculation
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [workingDays, setWorkingDays] = useState(30);
  const [calcLoading, setCalcLoading] = useState(false);

  // Payslip Modal
  const [viewPayslip, setViewPayslip] = useState(null);

  // Salary Edit Modal
  const [editSalaryEmp, setEditSalaryEmp] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [salRes, payRes] = await Promise.all([
        api.getSalaryStructures(),
        api.getPayrollHistory({ month: selectedMonth, year: selectedYear })
      ]);
      setSalaries(salRes.salaries || []);
      setPayrollHistory(payRes.payrolls || []);
    } catch (err) {
      console.error('Failed to load payroll data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear]);

  const handleRunCalculation = async () => {
    setCalcLoading(true);
    try {
      const res = await api.calculatePayroll({
        month: selectedMonth,
        year: selectedYear,
        workingDays
      });
      alert(res.message || 'Payroll calculation completed!');
      fetchData();
    } catch (err) {
      alert(err.message || 'Payroll calculation failed');
    } finally {
      setCalcLoading(false);
    }
  };

  const handleSalarySave = async (e) => {
    e.preventDefault();
    try {
      await api.updateSalaryStructure(editSalaryEmp.employee_id, {
        basic_salary: editSalaryEmp.basic_salary,
        hra: editSalaryEmp.hra,
        allowances: editSalaryEmp.allowances,
        pf_deduction: editSalaryEmp.pf_deduction,
        tax_deduction: editSalaryEmp.tax_deduction,
      });
      setIsEditModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to update salary structure');
    }
  };

  const openEditSalary = (s) => {
    setEditSalaryEmp({ ...s });
    setIsEditModalOpen(true);
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Compensation & Payroll Hub</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Configure employee salary packages and compute monthly net payroll based on attendance.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center space-x-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm text-xs">
          <button
            onClick={() => setActiveSubTab('calculate')}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg font-semibold transition-all ${
              activeSubTab === 'calculate'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Payroll Run</span>
          </button>
          <button
            onClick={() => setActiveSubTab('structures')}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg font-semibold transition-all ${
              activeSubTab === 'structures'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Enter / Edit Salaries</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'calculate' ? (
        <div className="space-y-6">
          {/* Payroll Run Controller Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                <Calculator className="w-5 h-5 text-purple-600" />
                <span>Monthly Payroll Calculation Engine</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xl">
                Automatically reconciles present working days from daily attendance logs and deducts Loss of Pay (LOP) for unexcused / unpaid absences.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-0.5">Month</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
                  className="bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2 text-slate-800 font-semibold"
                >
                  {[
                    'January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'
                  ].map((m, idx) => (
                    <option key={idx + 1} value={idx + 1}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-0.5">Year</label>
                <input
                  type="number"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                  className="bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2 text-slate-800 font-semibold w-20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-0.5">Working Days</label>
                <input
                  type="number"
                  value={workingDays}
                  onChange={(e) => setWorkingDays(parseInt(e.target.value, 10))}
                  className="bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2 text-slate-800 font-semibold w-20"
                />
              </div>

              <div className="pt-4">
                <button
                  onClick={handleRunCalculation}
                  disabled={calcLoading}
                  className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md shadow-purple-500/20 transition-all disabled:opacity-50"
                >
                  <Calculator className="w-4 h-4" />
                  <span>{calcLoading ? 'Computing...' : 'Calculate & Generate'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Generated Payroll Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  Payroll Records for Month {selectedMonth}/{selectedYear}
                </h4>
                <p className="text-xs text-slate-500">
                  {payrollHistory.length} employee payslips computed for this billing cycle
                </p>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12 text-slate-400 text-sm">Loading payroll records...</div>
            ) : payrollHistory.length === 0 ? (
              <div className="text-center py-12 bg-slate-50">
                <BadgeDollarSign className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">No payroll records generated yet</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Click "Calculate & Generate" above to compute salaries for this period.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3.5 px-4">Employee</th>
                      <th className="py-3.5 px-4">Days Present</th>
                      <th className="py-3.5 px-4">Gross Pay</th>
                      <th className="py-3.5 px-4">Loss of Pay (LOP)</th>
                      <th className="py-3.5 px-4">Deductions</th>
                      <th className="py-3.5 px-4">Net Take-Home</th>
                      <th className="py-3.5 px-4 text-right">Payslip</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payrollHistory.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{p.employee_name}</div>
                          <div className="text-slate-400 text-[11px] font-mono">{p.emp_code} • {p.department}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-800">{p.present_days}</span>
                          <span className="text-slate-400 text-[11px]"> / {p.working_days} days</span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          {formatCurrency(p.gross_pay)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`font-semibold ${Number(p.loss_of_pay) > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                            {Number(p.loss_of_pay) > 0 ? `-${formatCurrency(p.loss_of_pay)}` : '₹0'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-rose-600 font-semibold">
                          -{formatCurrency(p.total_deductions)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-extrabold text-emerald-600 text-sm">
                            {formatCurrency(p.net_pay)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => setViewPayslip(p)}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg font-semibold text-xs border border-sky-200 transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>View Payslip</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Salary Structures Tab: HR Enter/Adjust Salaries */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100">
            <h4 className="font-bold text-slate-900 text-sm">Employee Base Salary Structures</h4>
            <p className="text-xs text-slate-500">
              Maintain basic pay, HRA, special allowances, PF, and TDS for each workforce member.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Employee</th>
                  <th className="py-3.5 px-4">Basic Pay</th>
                  <th className="py-3.5 px-4">HRA</th>
                  <th className="py-3.5 px-4">Allowances</th>
                  <th className="py-3.5 px-4">PF Deduction</th>
                  <th className="py-3.5 px-4">Tax / TDS</th>
                  <th className="py-3.5 px-4">Net Monthly</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {salaries.map((s) => (
                  <tr key={s.employee_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{s.name}</div>
                      <div className="text-slate-400 text-[11px] font-mono">{s.emp_code} • {s.department}</div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{formatCurrency(s.basic_salary)}</td>
                    <td className="py-3.5 px-4 text-slate-600">{formatCurrency(s.hra)}</td>
                    <td className="py-3.5 px-4 text-slate-600">{formatCurrency(s.allowances)}</td>
                    <td className="py-3.5 px-4 text-rose-600 font-medium">-{formatCurrency(s.pf_deduction)}</td>
                    <td className="py-3.5 px-4 text-rose-600 font-medium">-{formatCurrency(s.tax_deduction)}</td>
                    <td className="py-3.5 px-4 font-bold text-emerald-700 text-sm">
                      {formatCurrency(s.net_salary)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => openEditSalary(s)}
                        className="p-1.5 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Edit Salary"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payslip Modal */}
      <PayslipModal
        isOpen={!!viewPayslip}
        onClose={() => setViewPayslip(null)}
        payslip={viewPayslip}
      />

      {/* Edit Salary Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Adjust Compensation: ${editSalaryEmp?.name || ''}`}
        maxWidth="max-w-md"
      >
        {editSalaryEmp && (
          <form onSubmit={handleSalarySave} className="space-y-4 text-xs">
            <div className="space-y-2">
              <div>
                <label className="block font-semibold text-slate-600 mb-0.5">Basic Salary (₹)</label>
                <input
                  type="number"
                  value={editSalaryEmp.basic_salary}
                  onChange={(e) => setEditSalaryEmp({ ...editSalaryEmp, basic_salary: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-0.5">HRA (₹)</label>
                <input
                  type="number"
                  value={editSalaryEmp.hra}
                  onChange={(e) => setEditSalaryEmp({ ...editSalaryEmp, hra: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-0.5">Allowances (₹)</label>
                <input
                  type="number"
                  value={editSalaryEmp.allowances}
                  onChange={(e) => setEditSalaryEmp({ ...editSalaryEmp, allowances: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-0.5">PF Deduction (₹)</label>
                <input
                  type="number"
                  value={editSalaryEmp.pf_deduction}
                  onChange={(e) => setEditSalaryEmp({ ...editSalaryEmp, pf_deduction: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-0.5">Tax / TDS Deduction (₹)</label>
                <input
                  type="number"
                  value={editSalaryEmp.tax_deduction}
                  onChange={(e) => setEditSalaryEmp({ ...editSalaryEmp, tax_deduction: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold"
              >
                Save Compensation
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

