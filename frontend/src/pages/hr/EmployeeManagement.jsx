import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import Modal from '../../components/Modal';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Edit2,
  CheckCircle2,
  XCircle,
  Eye,
  Phone,
  Mail,
  Calendar,
  Building,
  Briefcase
} from 'lucide-react';

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);

  // Add form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: 'emp123',
    role: 'employee',
    department: 'Engineering',
    designation: 'Software Engineer',
    phone: '',
    joining_date: new Date().toISOString().split('T')[0],
    basic_salary: 40000,
    hra: 16000,
    allowances: 5000,
    pf_deduction: 4800,
    tax_deduction: 2500,
  });

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await api.getEmployees({ search, department: deptFilter });
      setEmployees(res.employees || []);
    } catch (err) {
      console.error('Failed to load employees:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [deptFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchEmployees();
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.createEmployee(formData);
      setIsAddModalOpen(false);
      setFormData({
        name: '',
        email: '',
        password: 'emp123',
        role: 'employee',
        department: 'Engineering',
        designation: 'Software Engineer',
        phone: '',
        joining_date: new Date().toISOString().split('T')[0],
        basic_salary: 40000,
        hra: 16000,
        allowances: 5000,
        pf_deduction: 4800,
        tax_deduction: 2500,
      });
      fetchEmployees();
    } catch (err) {
      alert(err.message || 'Failed to add employee');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.updateEmployee(selectedEmp.id, selectedEmp);
      setIsEditModalOpen(false);
      fetchEmployees();
    } catch (err) {
      alert(err.message || 'Failed to update employee');
    }
  };

  const openEdit = (emp) => {
    setSelectedEmp({ ...emp });
    setIsEditModalOpen(true);
  };

  const openView = (emp) => {
    setSelectedEmp(emp);
    setIsViewModalOpen(true);
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
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Workforce & Employee Directory</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Add new personnel, maintain profiles, and adjust compensation structures.
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Employee</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, ID..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
          />
        </form>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          >
            <option value="">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="Product Design">Product Design</option>
            <option value="Marketing">Marketing</option>
            <option value="Finance">Finance</option>
            <option value="Human Resources">Human Resources</option>
          </select>
        </div>
      </div>

      {/* Employee Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="text-center py-12 text-slate-400 text-sm">Loading employees...</div>
        ) : employees.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">No employees found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Employee</th>
                  <th className="py-3.5 px-4">Department & Role</th>
                  <th className="py-3.5 px-4">Joining Date</th>
                  <th className="py-3.5 px-4">Net Salary</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center shrink-0">
                          {emp.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{emp.name}</div>
                          <div className="text-slate-400 text-[11px] font-mono">{emp.emp_code} • {emp.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{emp.designation}</div>
                      <div className="text-slate-500 text-[11px]">{emp.department}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{emp.joining_date}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900">
                        {formatCurrency(emp.net_salary)}
                      </span>
                      <span className="text-[11px] text-slate-400 block">/month</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        emp.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => openView(emp)}
                          title="View Profile"
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEdit(emp)}
                          title="Edit Details & Salary"
                          className="p-1.5 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Add New Employee */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Employee" maxWidth="max-w-2xl">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Full Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Rachel Adams"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Work Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="rachel@company.com"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Phone Number</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 000-1122"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-500/20"
              />
            </div>

            <div className="sm:col-span-2 p-2.5 bg-purple-50 rounded-xl border border-purple-100 text-xs text-purple-700 flex items-center space-x-2">
              <span className="text-base">🔐</span>
              <span><strong>Account Setup:</strong> Once added, the employee can visit the portal, click <strong>"First time employee? Set up password"</strong>, enter their work email, and create their password.</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Department</label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              >
                <option value="Engineering">Engineering</option>
                <option value="Product Design">Product Design</option>
                <option value="Marketing">Marketing</option>
                <option value="Finance">Finance</option>
                <option value="Operations">Operations</option>
                <option value="Human Resources">Human Resources</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Designation</label>
              <input
                type="text"
                required
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                placeholder="e.g. Backend Developer"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
          </div>

          {/* Initial Salary Structure */}
          <div className="pt-3 border-t border-slate-200">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Initial Salary Package (Monthly)</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500">Basic Salary (₹)</label>
                <input
                  type="number"
                  value={formData.basic_salary}
                  onChange={(e) => setFormData({ ...formData, basic_salary: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500">HRA (₹)</label>
                <input
                  type="number"
                  value={formData.hra}
                  onChange={(e) => setFormData({ ...formData, hra: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500">Allowances (₹)</label>
                <input
                  type="number"
                  value={formData.allowances}
                  onChange={(e) => setFormData({ ...formData, allowances: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500">PF Deduction (₹)</label>
                <input
                  type="number"
                  value={formData.pf_deduction}
                  onChange={(e) => setFormData({ ...formData, pf_deduction: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500">Tax / TDS (₹)</label>
                <input
                  type="number"
                  value={formData.tax_deduction}
                  onChange={(e) => setFormData({ ...formData, tax_deduction: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-sm"
            >
              Save Employee
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Employee */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Employee & Salary" maxWidth="max-w-xl">
        {selectedEmp && (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Full Name</label>
                <input
                  type="text"
                  value={selectedEmp.name}
                  onChange={(e) => setSelectedEmp({ ...selectedEmp, name: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Department</label>
                <input
                  type="text"
                  value={selectedEmp.department}
                  onChange={(e) => setSelectedEmp({ ...selectedEmp, department: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Designation</label>
                <input
                  type="text"
                  value={selectedEmp.designation}
                  onChange={(e) => setSelectedEmp({ ...selectedEmp, designation: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Status</label>
                <select
                  value={selectedEmp.status}
                  onChange={(e) => setSelectedEmp({ ...selectedEmp, status: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200">
              <h4 className="text-xs font-bold text-slate-800 uppercase mb-2">Salary Adjustment</h4>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-slate-500 block">Basic (₹)</span>
                  <input
                    type="number"
                    value={selectedEmp.basic_salary}
                    onChange={(e) => setSelectedEmp({ ...selectedEmp, basic_salary: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <span className="text-slate-500 block">HRA (₹)</span>
                  <input
                    type="number"
                    value={selectedEmp.hra}
                    onChange={(e) => setSelectedEmp({ ...selectedEmp, hra: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <span className="text-slate-500 block">Allowances (₹)</span>
                  <input
                    type="number"
                    value={selectedEmp.allowances}
                    onChange={(e) => setSelectedEmp({ ...selectedEmp, allowances: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <span className="text-slate-500 block">PF (₹)</span>
                  <input
                    type="number"
                    value={selectedEmp.pf_deduction}
                    onChange={(e) => setSelectedEmp({ ...selectedEmp, pf_deduction: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <span className="text-slate-500 block">Tax (₹)</span>
                  <input
                    type="number"
                    value={selectedEmp.tax_deduction}
                    onChange={(e) => setSelectedEmp({ ...selectedEmp, tax_deduction: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold"
              >
                Update Details
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal: View Employee */}
      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Employee Profile Details" maxWidth="max-w-lg">
        {selectedEmp && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center space-x-4 p-4 bg-purple-50 rounded-xl">
              <div className="w-12 h-12 rounded-full bg-purple-600 text-white font-bold text-lg flex items-center justify-center">
                {selectedEmp.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedEmp.name}</h3>
                <p className="text-purple-700 font-medium">{selectedEmp.designation} • {selectedEmp.department}</p>
                <p className="text-slate-400 font-mono mt-0.5">{selectedEmp.emp_code}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl">
              <div>
                <span className="text-slate-400 block">Email Address</span>
                <span className="font-semibold text-slate-800">{selectedEmp.email}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Phone</span>
                <span className="font-semibold text-slate-800">{selectedEmp.phone || 'Not provided'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Date of Joining</span>
                <span className="font-semibold text-slate-800">{selectedEmp.joining_date}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Account Status</span>
                <span className="font-semibold text-emerald-700 capitalize">{selectedEmp.status}</span>
              </div>
            </div>

            <div className="p-4 border border-slate-200 rounded-xl bg-slate-50/50">
              <h4 className="font-bold text-slate-800 uppercase mb-2">Compensation Overview</h4>
              <div className="space-y-1 text-slate-600">
                <div className="flex justify-between">
                  <span>Basic:</span>
                  <span className="font-semibold">{formatCurrency(selectedEmp.basic_salary)}</span>
                </div>
                <div className="flex justify-between">
                  <span>HRA:</span>
                  <span className="font-semibold">{formatCurrency(selectedEmp.hra)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Allowances:</span>
                  <span className="font-semibold">{formatCurrency(selectedEmp.allowances)}</span>
                </div>
                <div className="flex justify-between text-rose-600">
                  <span>PF & Tax Deductions:</span>
                  <span className="font-semibold">-{formatCurrency((Number(selectedEmp.pf_deduction) || 0) + (Number(selectedEmp.tax_deduction) || 0))}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-slate-900 text-sm">
                  <span>Net Salary:</span>
                  <span className="text-emerald-600">{formatCurrency(selectedEmp.net_salary)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

