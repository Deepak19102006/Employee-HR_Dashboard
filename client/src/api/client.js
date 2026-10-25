const API_BASE = '/api';

let currentToken = null;
try {
  currentToken = localStorage.getItem('token');
} catch {
  currentToken = null;
}

export function setAuthToken(token) {
  currentToken = token;
  if (token) {
    try {
      localStorage.setItem('token', token);
    } catch {}
  } else {
    try {
      localStorage.removeItem('token');
    } catch {}
  }
}

export async function apiRequest(endpoint, options = {}) {
  const token = currentToken || localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      setAuthToken(null);
      try {
        localStorage.removeItem('user');
      } catch {}
      window.dispatchEvent(new Event('auth-logout'));
    }
    const error = new Error(data.message || 'API request failed');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Auth
  login: (credentials) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  registerEmployee: (data) => apiRequest('/auth/register-employee', { method: 'POST', body: JSON.stringify(data) }),
  getProfile: () => apiRequest('/auth/me'),

  // Employees (HR)
  getEmployees: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/employees${qs ? `?${qs}` : ''}`);
  },
  getEmployee: (id) => apiRequest(`/employees/${id}`),
  createEmployee: (empData) => apiRequest('/employees', { method: 'POST', body: JSON.stringify(empData) }),
  updateEmployee: (id, empData) => apiRequest(`/employees/${id}`, { method: 'PUT', body: JSON.stringify(empData) }),

  // Attendance
  getTodayAttendance: () => apiRequest('/attendance/today'),
  clockIn: (notes = '') => apiRequest('/attendance/clock-in', { method: 'POST', body: JSON.stringify({ notes }) }),
  clockOut: () => apiRequest('/attendance/clock-out', { method: 'POST' }),
  getMyAttendance: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/attendance/my${qs ? `?${qs}` : ''}`);
  },
  getAllAttendance: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/attendance/all${qs ? `?${qs}` : ''}`);
  },

  // Leaves
  getMyLeaves: () => apiRequest('/leaves/my'),
  applyLeave: (leaveData) => apiRequest('/leaves/apply', { method: 'POST', body: JSON.stringify(leaveData) }),
  getAllLeaves: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/leaves/all${qs ? `?${qs}` : ''}`);
  },
  updateLeaveStatus: (id, status, hr_remarks = '') =>
    apiRequest(`/leaves/${id}/status`, { method: 'PUT', body: JSON.stringify({ status, hr_remarks }) }),

  // Payroll
  getSalaryStructures: () => apiRequest('/payroll/salaries'),
  updateSalaryStructure: (employeeId, salaryData) =>
    apiRequest(`/payroll/salaries/${employeeId}`, { method: 'PUT', body: JSON.stringify(salaryData) }),
  calculatePayroll: (payload) => apiRequest('/payroll/calculate', { method: 'POST', body: JSON.stringify(payload) }),
  getPayrollHistory: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/payroll/history${qs ? `?${qs}` : ''}`);
  },
  getMyPayslips: () => apiRequest('/payroll/my'),

  // Dashboard & Status
  getSystemStatus: () => apiRequest('/dashboard/status'),
  getHrStats: () => apiRequest('/dashboard/hr-stats'),
};
