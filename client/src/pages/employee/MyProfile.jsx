import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { User, Mail, Phone, Calendar, Building, Briefcase, ShieldCheck, BadgeDollarSign } from 'lucide-react';

export default function MyProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getProfile()
      .then(res => setProfile(res.user))
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

  if (loading) {
    return <div className="p-8 text-center text-slate-400 text-sm">Loading profile details...</div>;
  }

  const p = profile || user;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Employment Profile</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          View your personnel records and compensation structure. (Read-only)
        </p>
      </div>

      {/* Main Profile Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Banner */}
        <div className="h-32 bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600"></div>

        {/* User Info Bar */}
        <div className="px-6 pb-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-12 mb-6 gap-4">
            <div className="flex items-end space-x-4">
              <div className="w-24 h-24 rounded-2xl bg-white p-1 shadow-lg">
                <div className="w-full h-full rounded-xl bg-sky-600 text-white font-extrabold text-3xl flex items-center justify-center">
                  {p?.name?.charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="mb-1">
                <h2 className="text-xl font-bold text-slate-900">{p?.name}</h2>
                <p className="text-xs text-slate-500 font-medium">
                  {p?.designation} • <span className="font-mono text-sky-600 font-bold">{p?.emp_code}</span>
                </p>
              </div>
            </div>

            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Active Employee
            </span>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Contact & Personal */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
                <User className="w-3.5 h-3.5 text-sky-600" />
                <span>Contact & Account Information</span>
              </h4>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-200/60">
                <span className="text-slate-500 flex items-center">
                  <Mail className="w-3.5 h-3.5 mr-1.5 text-slate-400" /> Work Email
                </span>
                <span className="font-semibold text-slate-800">{p?.email}</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-200/60">
                <span className="text-slate-500 flex items-center">
                  <Phone className="w-3.5 h-3.5 mr-1.5 text-slate-400" /> Phone Number
                </span>
                <span className="font-semibold text-slate-800">{p?.phone || 'Not registered'}</span>
              </div>

              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-500 flex items-center">
                  <Calendar className="w-3.5 h-3.5 mr-1.5 text-slate-400" /> Date of Joining
                </span>
                <span className="font-semibold text-slate-800">{p?.joining_date}</span>
              </div>
            </div>

            {/* Employment & Department */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
                <Briefcase className="w-3.5 h-3.5 text-sky-600" />
                <span>Department & Designation</span>
              </h4>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-200/60">
                <span className="text-slate-500 flex items-center">
                  <Building className="w-3.5 h-3.5 mr-1.5 text-slate-400" /> Department
                </span>
                <span className="font-semibold text-slate-800">{p?.department}</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-200/60">
                <span className="text-slate-500 flex items-center">
                  <Briefcase className="w-3.5 h-3.5 mr-1.5 text-slate-400" /> Designation
                </span>
                <span className="font-semibold text-slate-800">{p?.designation}</span>
              </div>

              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-500 flex items-center">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-slate-400" /> Role Clearance
                </span>
                <span className="font-semibold text-sky-700 uppercase">{p?.role}</span>
              </div>
            </div>
          </div>

          {/* Salary Structure View */}
          <div className="mt-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-2 mb-3">
              <BadgeDollarSign className="w-4 h-4 text-emerald-600" />
              <span>Current Compensation Structure (Monthly)</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs mb-4">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block text-[11px]">Basic Salary</span>
                <span className="font-bold text-slate-800 text-sm">{formatCurrency(p?.basic_salary)}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block text-[11px]">HRA</span>
                <span className="font-bold text-slate-800 text-sm">{formatCurrency(p?.hra)}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block text-[11px]">Allowances</span>
                <span className="font-bold text-slate-800 text-sm">{formatCurrency(p?.allowances)}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block text-[11px]">PF Deduction</span>
                <span className="font-bold text-rose-600 text-sm">-{formatCurrency(p?.pf_deduction)}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block text-[11px]">Tax / TDS</span>
                <span className="font-bold text-rose-600 text-sm">-{formatCurrency(p?.tax_deduction)}</span>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                <span className="text-emerald-700 font-semibold block text-[11px]">Net Monthly Take-Home</span>
                <span className="font-extrabold text-emerald-800 text-base">{formatCurrency(p?.net_salary)}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 italic">
              Note: This is your standard contractual monthly compensation. Actual payout is finalized upon monthly attendance reconciliation and leave records.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

