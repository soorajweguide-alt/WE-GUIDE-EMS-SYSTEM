import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { employeeAPI, attendanceAPI } from '../api';
import Topbar from '../components/Topbar';
import QRModal from '../components/QRModal';
import EmployeeForm from '../components/EmployeeForm';
import toast from 'react-hot-toast';

const BLOOD_COLORS = {
  'A+':'badge-purple','A-':'badge-purple','B+':'badge-cyan','B-':'badge-cyan',
  'AB+':'badge-amber','AB-':'badge-amber','O+':'badge-green','O-':'badge-green',
};

function InfoRow({ icon, label, value, mono }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{
        width: 38, height: 38, borderRadius: 10,
        background: 'rgba(99,102,241,.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18, flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {label}
        </div>
        <div style={{ marginTop: 3, fontSize: 15, fontWeight: 600, color: 'var(--text)', fontFamily: mono ? 'JetBrains Mono, monospace' : undefined }}>
          {value || '—'}
        </div>
      </div>
    </div>
  );
}

export default function EmployeeProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee,   setEmployee]   = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [attLoading, setAttLoading] = useState(true);
  const [qrOpen,     setQrOpen]     = useState(false);
  const [editOpen,   setEditOpen]   = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting,   setDeleting]   = useState(false);
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear,  setFilterYear]  = useState(new Date().getFullYear().toString());

  const today = new Date().toISOString().split('T')[0];

  const loadEmployee = useCallback(async () => {
    try {
      const res = await employeeAPI.getOne(id);
      setEmployee(res.data.data);
    } catch {
      toast.error('Employee not found');
      navigate('/employees');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  const loadAttendance = useCallback(async () => {
    setAttLoading(true);
    try {
      const params = {};
      if (filterMonth) params.month = filterMonth;
      if (filterYear)  params.year  = filterYear;
      const res = await employeeAPI.getAttendance(id, params);
      setAttendance(res.data.data);
    } catch {
      toast.error('Failed to load attendance');
    } finally {
      setAttLoading(false);
    }
  }, [id, filterMonth, filterYear]);

  useEffect(() => { loadEmployee(); }, [loadEmployee]);
  useEffect(() => { if (employee) loadAttendance(); }, [employee, loadAttendance]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await employeeAPI.remove(id);
      toast.success('Employee deleted');
      navigate('/employees');
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  // Attendance rate
  const totalDays = [...new Set(attendance.map(a => a.date))].length;
  const workingDays = filterMonth && filterYear
    ? new Date(parseInt(filterYear), parseInt(filterMonth), 0).getDate()
    : 30;
  const rate = workingDays > 0 ? Math.round((totalDays / workingDays) * 100) : 0;

  if (loading) {
    return (
      <>
        <Topbar title="Employee Profile" subtitle="Loading…" />
        <div className="loading-overlay" style={{ height: '60vh' }}>
          <div className="spinner" />
          <span style={{ color: 'var(--text2)' }}>Loading employee…</span>
        </div>
      </>
    );
  }

  if (!employee) return null;

  const initials = employee.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <>
      <Topbar
        title="Employee Profile"
        subtitle={`${employee.name} — ${employee.employee_id}`}
      >
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/employees')}>
          ← Back
        </button>
        <button className="btn btn-secondary btn-sm" onClick={() => setQrOpen(true)}>
          🔳 QR Code
        </button>
        <button className="btn btn-secondary btn-sm" onClick={() => setEditOpen(true)}>
          ✏️ Edit
        </button>
        <button className="btn btn-danger btn-sm" onClick={() => setDeleteOpen(true)}>
          🗑️ Delete
        </button>
      </Topbar>

      <div className="page-wrapper fade-in">
        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 24, alignItems: 'start' }}>

          {/* Left: Employee Card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Profile Card */}
            <div className="card" style={{ overflow: 'hidden' }}>
              {/* Gradient Header */}
              <div style={{
                background: 'linear-gradient(135deg, var(--accent), var(--purple))',
                padding: '32px 24px 48px',
                position: 'relative',
                textAlign: 'center',
              }}>
                <div style={{ position: 'absolute', inset: 0, opacity: 0.05, backgroundImage: 'radial-gradient(circle at 30% 50%, #fff 0%, transparent 60%)' }} />
                <div className="avatar avatar-lg" style={{ margin: '0 auto', width: 64, height: 64, fontSize: 22, borderRadius: 18 }}>
                  {initials}
                </div>
                <div style={{ marginTop: 12, fontWeight: 800, fontSize: 18 }}>{employee.name}</div>
                <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>{employee.designation}</div>
              </div>

              {/* Badges Row */}
              <div style={{ padding: '16px 20px', display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', borderBottom: '1px solid var(--border)' }}>
                <span className="badge badge-cyan">{employee.department}</span>
                <span className={`badge ${BLOOD_COLORS[employee.blood_group] || 'badge-green'}`}>{employee.blood_group}</span>
                <span className="badge badge-purple">{employee.gender}</span>
              </div>

              {/* Info Rows */}
              <div style={{ padding: '0 20px 12px' }}>
                <InfoRow icon="🪪" label="Employee ID"   value={employee.employee_id} mono />
                <InfoRow icon="🎂" label="Date of Birth" value={new Date(employee.dob).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })} />
                <InfoRow icon="🎂" label="Age"           value={`${employee.age} years`} />
                <InfoRow icon="📱" label="Phone"         value={employee.phone} mono />
                <InfoRow icon="🚨" label="Emergency"     value={employee.emergency_contact} mono />
                <InfoRow icon="📍" label="Address"       value={employee.address} />
              </div>
            </div>

            {/* Attendance Summary Card */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">📊 Attendance Summary</div>
              </div>
              <div className="card-body">
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  {/* Circular progress */}
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <svg width="100" height="100" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="var(--border2)" strokeWidth="8" />
                      <circle
                        cx="50" cy="50" r="40" fill="none"
                        stroke="var(--accent)" strokeWidth="8"
                        strokeDasharray={`${2 * Math.PI * 40}`}
                        strokeDashoffset={`${2 * Math.PI * 40 * (1 - Math.min(rate, 100) / 100)}`}
                        strokeLinecap="round"
                        transform="rotate(-90 50 50)"
                        style={{ transition: 'stroke-dashoffset 1s ease' }}
                      />
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent-light)' }}>{Math.min(rate, 100)}%</div>
                      <div style={{ fontSize: 10, color: 'var(--text3)' }}>Rate</div>
                    </div>
                  </div>
                  <div style={{ marginTop: 12, fontSize: 13, color: 'var(--text2)' }}>
                    <strong style={{ color: 'var(--text)', fontSize: 18 }}>{totalDays}</strong> days attended
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ flex: 1, background: 'rgba(16,185,129,.1)', border: '1px solid rgba(16,185,129,.2)', borderRadius: 10, padding: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#34d399' }}>{totalDays}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>Present</div>
                  </div>
                  <div style={{ flex: 1, background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 10, padding: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#f87171' }}>{Math.max(0, workingDays - totalDays)}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>Absent</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Attendance Log */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                📅 Attendance History
                <span className="badge badge-cyan" style={{ marginLeft: 8 }}>{attendance.length} records</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <select
                  className="form-control"
                  style={{ width: 'auto', fontSize: 13, padding: '6px 10px' }}
                  value={filterMonth}
                  onChange={e => setFilterMonth(e.target.value)}
                >
                  <option value="">All Months</option>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(2000, i).toLocaleString('en', { month: 'long' })}
                    </option>
                  ))}
                </select>
                <select
                  className="form-control"
                  style={{ width: 'auto', fontSize: 13, padding: '6px 10px' }}
                  value={filterYear}
                  onChange={e => setFilterYear(e.target.value)}
                >
                  {Array.from({ length: 5 }, (_, i) => {
                    const y = new Date().getFullYear() - i;
                    return <option key={y} value={y}>{y}</option>;
                  })}
                </select>
              </div>
            </div>

            <div style={{ padding: 0 }}>
              {attLoading ? (
                <div className="loading-overlay"><div className="spinner" /></div>
              ) : attendance.length === 0 ? (
                <div className="empty-state" style={{ padding: 60 }}>
                  <div className="empty-icon">📭</div>
                  <h3>No attendance records</h3>
                  <p>No records found for the selected period</p>
                </div>
              ) : (
                <div className="table-container" style={{ border: 'none', borderRadius: '0 0 18px 18px' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Date</th>
                        <th>Day</th>
                        <th>Check-In Time</th>
                        <th>Marked By</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendance.map((rec, idx) => (
                        <tr key={rec.id} className="slide-up">
                          <td style={{ color: 'var(--text3)', fontFamily: 'monospace', fontSize: 12 }}>{idx + 1}</td>
                          <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}>
                            {rec.date === today ? (
                              <><span className="pulse-dot" />{rec.date}</>
                            ) : rec.date}
                          </td>
                          <td style={{ fontSize: 13, color: 'var(--text2)' }}>
                            {new Date(rec.date + 'T00:00:00').toLocaleDateString('en', { weekday: 'short' })}
                          </td>
                          <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: 'var(--emerald)' }}>
                            {rec.time_in}
                          </td>
                          <td>
                            <span className="badge badge-amber">
                              {rec.marked_by === 'QR_SCANNER' ? '📷 QR Scan' : rec.marked_by}
                            </span>
                          </td>
                          <td>
                            <span className="badge badge-green">✅ Present</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {qrOpen && <QRModal employee={employee} onClose={() => setQrOpen(false)} />}

      {editOpen && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setEditOpen(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">✏️ Edit — {employee.name}</div>
              <button className="btn btn-ghost btn-icon" onClick={() => setEditOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              <EmployeeForm
                employee={employee}
                onSuccess={() => { setEditOpen(false); loadEmployee(); }}
                onCancel={() => setEditOpen(false)}
              />
            </div>
          </div>
        </div>
      )}

      {deleteOpen && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 420 }}>
            <div className="modal-body" style={{ textAlign: 'center', padding: 40 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
              <h2 style={{ marginBottom: 8 }}>Delete Employee?</h2>
              <p style={{ color: 'var(--text2)', marginBottom: 24 }}>
                This will permanently remove <strong style={{ color: 'var(--text)' }}>{employee.name}</strong> and all their attendance records.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button className="btn btn-secondary" onClick={() => setDeleteOpen(false)}>Cancel</button>
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
