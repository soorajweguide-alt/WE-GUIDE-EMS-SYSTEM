import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { employeeAPI } from '../api';
import Topbar from '../components/Topbar';
import EmployeeForm from '../components/EmployeeForm';
import toast from 'react-hot-toast';

const BLOOD_COLORS = {
  'A+': 'badge-purple', 'A-': 'badge-purple', 'B+': 'badge-cyan', 'B-': 'badge-cyan',
  'AB+': 'badge-amber', 'AB-': 'badge-amber', 'O+': 'badge-green', 'O-': 'badge-green',
};

const handleDownloadStaticHTML = (emp) => {
  const initials = emp.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const dob = emp.dob
    ? new Date(emp.dob).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
    : '—';

  const staticHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
  <title>${emp.name} - WE GUIDE</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root { --bg:#0d1117; --surface:#161b22; --card:#21262d; --accent:#6e40c9; --accent2:#a855f7; --emerald:#10b981; --red:#ef4444; --text:#f0f6fc; --muted:#8b949e; --border:#30363d; --radius:16px; }
    body { font-family: 'Inter', sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; display: flex; flex-direction: column; align-items: center; padding: 0 0 40px; }
    .header { width: 100%; background: linear-gradient(135deg, var(--accent) 0%, #9333ea 100%); padding: 32px 20px 60px; text-align: center; position: relative; overflow: hidden; }
    .header::before { content: ''; position: absolute; inset: 0; background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='20'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E"); }
    .header .logo { font-size: 13px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; opacity: .7; position: relative; }
    .header h1 { font-size: 26px; font-weight: 800; margin-top: 8px; position: relative; }
    .header .subtitle { font-size: 13px; opacity: .75; margin-top: 4px; position: relative; }
    .avatar-wrap { display: flex; justify-content: center; margin-top: -36px; }
    .avatar { width: 72px; height: 72px; border-radius: 50%; background: linear-gradient(135deg, var(--accent), var(--accent2)); border: 4px solid var(--surface); display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 800; color: #fff; box-shadow: 0 8px 24px rgba(110,64,201,.4); }
    .card { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); margin: 16px 16px 0; padding: 20px; max-width: 440px; width: calc(100% - 32px); }
    .card-title { font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: var(--muted); margin-bottom: 16px; }
    .row { display: flex; gap: 10px; margin-bottom: 12px; align-items: flex-start; }
    .row .icon { width: 36px; height: 36px; border-radius: 10px; background: rgba(110,64,201,.15); display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
    .row .content .label { font-size: 11px; color: var(--muted); font-weight: 500; }
    .row .content .value { font-size: 15px; font-weight: 600; color: var(--text); margin-top: 2px; }
    .badge { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; background: rgba(110,64,201,.2); color: var(--accent2); border: 1px solid rgba(110,64,201,.3); margin-top: 4px; }
    .sos-card { background: linear-gradient(135deg, rgba(239,68,68,.15), rgba(239,68,68,.05)); border-color: rgba(239,68,68,.3); }
    .sos-btn { display: flex; align-items: center; justify-content: center; gap: 10px; background: var(--red); color: #fff; border: none; border-radius: 14px; padding: 16px 24px; font-family: 'Inter', sans-serif; font-size: 16px; font-weight: 700; width: 100%; cursor: pointer; text-decoration: none; transition: all .2s; box-shadow: 0 4px 20px rgba(239,68,68,.4); animation: pulse 2s infinite; }
    .sos-btn:hover { transform: scale(1.02); box-shadow: 0 6px 28px rgba(239,68,68,.6); }
    .sos-btn:active { transform: scale(.98); }
    @keyframes pulse { 0%, 100% { box-shadow: 0 4px 20px rgba(239,68,68,.4); } 50% { box-shadow: 0 4px 30px rgba(239,68,68,.7); } }
    .sos-hint { text-align: center; font-size: 12px; color: var(--muted); margin-top: 10px; }
    .footer { text-align: center; font-size: 12px; color: var(--muted); margin-top: 24px; }
    .footer strong { color: var(--accent2); }
  </style>
</head>
<body>
  <div id="app">
    <div class="header">
      <div class="logo">WE GUIDE</div>
      <h1>${emp.name}</h1>
      <div class="subtitle">${emp.designation} &bull; ${emp.department}</div>
    </div>
    <div class="avatar-wrap"><div class="avatar">${initials}</div></div>
    
    <div class="card" style="margin-top:20px">
      <div class="card-title">👤 Personal Information</div>
      <div class="row"><div class="icon">🗓️</div><div class="content"><div class="label">Date of Birth</div><div class="value">${dob}</div></div></div>
      <div class="row"><div class="icon">⚧</div><div class="content"><div class="label">Gender</div><div class="value">${emp.gender || '—'}</div></div></div>
      <div class="row"><div class="icon">🏢</div><div class="content"><div class="label">Department</div><div class="badge">🏷️ ${emp.department || '—'}</div></div></div>
    </div>
    
    <div class="card">
      <div class="card-title">📞 Contact</div>
      <div class="row"><div class="icon">📱</div><div class="content"><div class="label">Phone Number</div><div class="value"><a href="tel:${emp.phone}" style="color:var(--accent2);text-decoration:none">${emp.phone || '—'}</a></div></div></div>
    </div>
    
    <div class="card sos-card">
      <div class="card-title">🆘 Emergency Contact</div>
      <div class="row"><div class="icon">🚨</div><div class="content"><div class="label">Emergency Number</div><div class="value">${emp.emergency_contact || '—'}</div></div></div>
      <a href="tel:${emp.emergency_contact}" class="sos-btn">🆘 &nbsp;SOS — CALL NOW</a>
      <p class="sos-hint">Tap to immediately call the emergency contact</p>
    </div>
    
    <div class="footer">Powered by <strong>WE GUIDE</strong> &bull; Employee Management System</div>
  </div>
</body>
</html>`;

  const blob = new Blob([staticHTML], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${emp.name}.html`;
  link.click();
  URL.revokeObjectURL(url);
  toast.success('Static HTML downloaded! You can upload this to GitHub.');
};

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [dept, setDept] = useState('');
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [empRes, deptRes] = await Promise.all([
        employeeAPI.getAll(),
        employeeAPI.getDepartments(),
      ]);
      setEmployees(empRes.data.data);
      setFiltered(empRes.data.data);
      setDepartments(deptRes.data.data);
    } catch {
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Client-side filter
  useEffect(() => {
    let list = [...employees];
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(e =>
        e.name.toLowerCase().includes(s) ||
        e.employee_id.toLowerCase().includes(s) ||
        e.designation.toLowerCase().includes(s)
      );
    }
    if (dept) list = list.filter(e => e.department === dept);
    setFiltered(list);
  }, [search, dept, employees]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await employeeAPI.remove(deleteTarget.employee_id);
      toast.success('Employee deleted');
      setDeleteTarget(null);
      load();
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Topbar title="Employees" subtitle={`${filtered.length} of ${employees.length} employees`}>
        <button className="btn btn-primary" onClick={() => navigate('/employees/new')}>
          ➕ Add Employee
        </button>
      </Topbar>

      <div className="page-wrapper fade-in">
        {/* Filter Bar */}
        <div className="filter-bar mb-24">
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input
              className="form-control"
              placeholder="Search by name, ID, designation…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="form-control"
            style={{ width: 'auto', minWidth: 160 }}
            value={dept}
            onChange={e => setDept(e.target.value)}
          >
            <option value="">All Departments</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setDept(''); }}>
            ✕ Clear
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="loading-overlay"><div className="spinner"></div></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state card" style={{ padding: 60 }}>
            <div className="empty-icon">👥</div>
            <h3>{search || dept ? 'No results found' : 'No employees yet'}</h3>
            <p style={{ marginTop: 8 }}>
              {search || dept ? 'Try a different search' : 'Add your first employee to get started'}
            </p>
            {!search && !dept && (
              <button className="btn btn-primary mt-16" onClick={() => navigate('/employees/new')}>
                ➕ Add Employee
              </button>
            )}
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Gender</th>
                  <th>Blood</th>
                  <th>Phone</th>
                  <th>Actions</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(emp => (
                  <tr key={emp.employee_id} className="slide-up">
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar">
                          {emp.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <div>
                          <div className="primary-text">{emp.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'monospace' }}>
                            {emp.employee_id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td><span className="badge badge-cyan">{emp.department}</span></td>
                    <td style={{ color: 'var(--text)' }}>{emp.designation}</td>
                    <td><span className="badge badge-purple">{emp.gender}</span></td>
                    <td><span className={`badge ${BLOOD_COLORS[emp.blood_group] || 'badge-green'}`}>{emp.blood_group}</span></td>
                    <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{emp.phone}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="btn btn-ghost btn-sm btn-icon"
                          title="View Profile"
                          onClick={() => navigate(`/employees/${emp.employee_id}`)}
                        >👁️</button>
                        <button
                          className="btn btn-ghost btn-sm btn-icon"
                          title="Public Page"
                          onClick={() => window.open(emp.profile_url, '_blank')}
                        >🌐</button>
                        <button
                          className="btn btn-ghost btn-sm btn-icon"
                          title="Download GitHub HTML"
                          onClick={() => handleDownloadStaticHTML(emp)}
                        >📄</button>

                        <button
                          className="btn btn-secondary btn-sm"
                          title="Edit"
                          onClick={() => setEditTarget(emp)}
                        >✏️</button>
                        <button
                          className="btn btn-danger btn-sm btn-icon"
                          title="Delete"
                          onClick={() => setDeleteTarget(emp)}
                        >🗑️</button>
                      </div>
                    </td>
                    <td>
                      {emp.attendance_status === 'Checked In' && (
                        <span className="badge badge-green" style={{ background: '#10b981', color: '#000', fontWeight: 'bold' }}>✅ Checked In</span>
                      )}
                      {emp.attendance_status === 'Checked Out' && (
                        <span className="badge badge-amber" style={{ background: '#f59e0b', color: '#000', fontWeight: 'bold' }}>🏃 Checked Out</span>
                      )}
                      {emp.attendance_status === 'Pending' && (
                        <span className="badge" style={{ background: 'var(--surface2)', color: 'var(--text3)' }}>Pending</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>


      {/* Edit Modal */}
      {editTarget && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setEditTarget(null)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">✏️ Edit — {editTarget.name}</div>
              <button className="btn btn-ghost btn-icon" onClick={() => setEditTarget(null)}>✕</button>
            </div>
            <div className="modal-body">
              <EmployeeForm
                employee={editTarget}
                onSuccess={() => { setEditTarget(null); load(); }}
                onCancel={() => setEditTarget(null)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 420 }}>
            <div className="modal-body" style={{ textAlign: 'center', padding: 40 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
              <h2 style={{ marginBottom: 8 }}>Delete Employee?</h2>
              <p style={{ color: 'var(--text2)', marginBottom: 24 }}>
                This will permanently remove <strong style={{ color: 'var(--text)' }}>{deleteTarget.name}</strong> and all their attendance records.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>
                  Cancel
                </button>
                <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
                  {deleting ? 'Deleting…' : '🗑️ Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
