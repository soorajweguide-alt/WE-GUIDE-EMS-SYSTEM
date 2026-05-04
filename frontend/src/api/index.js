import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 15000,
});

// ─── Employees ────────────────────────────────────────────────────────────────
export const employeeAPI = {
  getAll:         (params)      => api.get('/employees', { params }),
  getOne:         (id)          => api.get(`/employees/${id}`),
  create:         (data)        => api.post('/employees', data),
  update:         (id, data)    => api.put(`/employees/${id}`, data),
  remove:         (id)          => api.delete(`/employees/${id}`),
  getQRJson:      (id)          => api.get(`/employees/${id}/qr`),
  getQRSVG:       (id)          => api.get(`/employees/${id}/qr`, { params: { format: 'svg' }, responseType: 'text' }),
  // Keep old signature for compatibility
  getQR:          (id, format)  => format === 'svg'
                                    ? api.get(`/employees/${id}/qr`, { params: { format: 'svg' }, responseType: 'text' })
                                    : api.get(`/employees/${id}/qr`),
  getAttendance:  (id, params)  => api.get(`/employees/${id}/attendance`, { params }),
  getDepartments: ()            => api.get('/employees/departments'),
};

// ─── Attendance ───────────────────────────────────────────────────────────────
export const attendanceAPI = {
  scan:     (token)   => api.post('/attendance/scan', { token }),
  getAll:   (params)  => api.get('/attendance', { params }),
  getToday: ()        => api.get('/attendance/today'),
  getStats: ()        => api.get('/attendance/stats'),
};

// ─── Public Profile ───────────────────────────────────────────────────────────
export const publicAPI = {
  getProfile: (token) => api.get(`/public/profile/${token}`),
};

export default api;
