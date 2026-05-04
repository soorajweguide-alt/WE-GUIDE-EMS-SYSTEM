import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Topbar from '../components/Topbar';
import EmployeeForm from '../components/EmployeeForm';
import toast from 'react-hot-toast';

// ─── Blood group badge colour map ─────────────────────────────────────────────
const BLOOD_COLORS = {
  'A+': 'badge-purple', 'A-': 'badge-purple',
  'B+': 'badge-cyan',   'B-': 'badge-cyan',
  'AB+': 'badge-amber', 'AB-': 'badge-amber',
  'O+': 'badge-green',  'O-': 'badge-green',
};

// ─── A single detail row ──────────────────────────────────────────────────────
function DetailRow({ icon, label, value, mono, accent }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 14,
      padding: '14px 0',
      borderBottom: '1px solid var(--border)',
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
        background: 'rgba(99,102,241,.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 11, color: 'var(--text3)', fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 3,
        }}>
          {label}
        </div>
        <div style={{
          fontSize: 15, fontWeight: 600,
          color: accent || 'var(--text)',
          fontFamily: mono ? 'JetBrains Mono, monospace' : undefined,
          wordBreak: 'break-word',
        }}>
          {value || '—'}
        </div>
      </div>
    </div>
  );
}

// ─── Employee Card shown after successful add ─────────────────────────────────
function EmployeeCard({ emp, onAddAnother }) {
  const navigate = useNavigate();
  const initials = emp.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const dob = emp.dob
    ? new Date(emp.dob).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
    : '—';

  const handleDownloadStaticHTML = () => {
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

  return (
    <div className="fade-in" style={{ maxWidth: 760, margin: '0 auto' }}>

      {/* ── Success banner ─────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(16,185,129,.15), rgba(6,182,212,.1))',
        border: '1px solid rgba(16,185,129,.3)',
        borderRadius: 16,
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        marginBottom: 24,
      }}>
        <div style={{ fontSize: 40 }}>🎉</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 17, color: '#34d399' }}>
            Employee Added Successfully!
          </div>
          <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 3 }}>
            <strong style={{ color: 'var(--text)' }}>{emp.name}</strong> has been registered in the system.
          </div>
        </div>
      </div>

      {/* ── Profile card ───────────────────────────────────── */}
      <div className="card" style={{ overflow: 'hidden', marginBottom: 24 }}>

        {/* Gradient header */}
        <div style={{
          background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
          padding: '36px 32px 52px',
          position: 'relative',
          textAlign: 'center',
        }}>
          {/* decorative circles */}
          <div style={{
            position: 'absolute', top: -30, right: -30,
            width: 150, height: 150, borderRadius: '50%',
            background: 'rgba(255,255,255,.07)',
          }} />
          <div style={{
            position: 'absolute', bottom: -20, left: -20,
            width: 100, height: 100, borderRadius: '50%',
            background: 'rgba(255,255,255,.05)',
          }} />

          {/* Avatar */}
          <div style={{
            width: 80, height: 80, borderRadius: 22,
            background: 'rgba(255,255,255,.2)',
            border: '3px solid rgba(255,255,255,.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, fontWeight: 800, color: '#fff',
            margin: '0 auto 14px',
            backdropFilter: 'blur(10px)',
          }}>
            {initials}
          </div>

          <div style={{ fontWeight: 800, fontSize: 22, color: '#fff', position: 'relative' }}>
            {emp.name}
          </div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,.75)', marginTop: 4, position: 'relative' }}>
            {emp.designation}
          </div>

          {/* ID badge */}
          <div style={{
            display: 'inline-block',
            marginTop: 10,
            background: 'rgba(255,255,255,.15)',
            border: '1px solid rgba(255,255,255,.25)',
            borderRadius: 20, padding: '4px 14px',
            fontSize: 12, fontWeight: 600, color: '#fff',
            fontFamily: 'JetBrains Mono, monospace',
            backdropFilter: 'blur(4px)',
            position: 'relative',
          }}>
            🪪 {emp.employee_id}
          </div>
        </div>

        {/* Tag row */}
        <div style={{
          padding: '16px 28px',
          display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center',
          borderBottom: '1px solid var(--border)',
        }}>
          <span className="badge badge-cyan">{emp.department}</span>
          <span className={`badge ${BLOOD_COLORS[emp.blood_group] || 'badge-green'}`}>
            🩸 {emp.blood_group}
          </span>
          <span className="badge badge-purple">{emp.gender}</span>
          <span className="badge badge-amber">Age {emp.age}</span>
        </div>

        {/* Detail rows — 2-column grid on wide, 1-column on narrow */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '0 32px',
          padding: '0 28px',
        }}>
          <DetailRow icon="🗓️" label="Date of Birth"     value={dob} />
          <DetailRow icon="📱" label="Phone Number"      value={emp.phone}             mono />
          <DetailRow icon="🚨" label="Emergency Contact" value={emp.emergency_contact} mono accent="#f87171" />
          <DetailRow icon="🏢" label="Department"        value={emp.department} />
          <DetailRow icon="💼" label="Designation"       value={emp.designation} />
          <DetailRow icon="⚧"  label="Gender"            value={emp.gender} />

          {/* Address spans full width */}
          <div style={{ gridColumn: '1 / -1' }}>
            <DetailRow icon="📍" label="Address" value={emp.address} />
          </div>
        </div>

        {/* Footer timestamp */}
        <div style={{
          padding: '14px 28px',
          borderTop: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 8,
        }}>
          <div style={{ fontSize: 12, color: 'var(--text3)' }}>
            🕒 Registered on{' '}
            {new Date(emp.created_at).toLocaleString('en-IN', {
              day: '2-digit', month: 'long', year: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}
          </div>
          <span className="badge badge-green">✅ Active</span>
        </div>
      </div>

      {/* ── Action buttons ─────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button className="btn btn-primary" onClick={onAddAnother}>
          ➕ Add Another Employee
        </button>
        <button className="btn btn-primary" onClick={handleDownloadStaticHTML} style={{ background: '#10b981', color: '#000' }}>
          📄 Download GitHub HTML
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => navigate(`/employees/${emp.employee_id}`)}
        >
          👁️ View Full Profile
        </button>
        <button
          className="btn btn-ghost"
          onClick={() => navigate('/employees')}
        >
          👥 All Employees
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AddEmployee() {
  const navigate = useNavigate();
  const [createdEmp, setCreatedEmp] = useState(null);

  const handleSuccess = (emp) => {
    setCreatedEmp(emp);
  };

  const handleAddAnother = () => {
    setCreatedEmp(null);
  };

  return (
    <>
      <Topbar
        title={createdEmp ? 'Employee Added' : 'Add New Employee'}
        subtitle={
          createdEmp
            ? `${createdEmp.name} — ${createdEmp.employee_id}`
            : 'Fill in the details below to register a new employee'
        }
      >
        {!createdEmp && (
          <button className="btn btn-secondary" onClick={() => navigate('/employees')}>
            ← Back to Employees
          </button>
        )}
      </Topbar>

      <div className="page-wrapper fade-in">
        {createdEmp ? (
          <EmployeeCard emp={createdEmp} onAddAnother={handleAddAnother} />
        ) : (
          <div className="card">
            <div className="card-header">
              <div className="card-title">✨ Employee Details</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <span className="badge badge-cyan">Secure Token Auto-Generated</span>
                <button 
                  className="btn btn-primary btn-sm" 
                  style={{ background: '#10b981', color: '#000', padding: '4px 10px', fontSize: 12, height: 'auto', minHeight: 24 }}
                  onClick={() => toast.error('Please fill the details and click "Add Employee" first. The HTML is generated after creation.')}
                >
                  📄 Download GitHub HTML
                </button>
              </div>
            </div>
            <div className="card-body">
              <EmployeeForm onSuccess={handleSuccess} />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
