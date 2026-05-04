import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { attendanceAPI, employeeAPI } from '../api';
import Topbar from '../components/Topbar';

export default function Dashboard() {
  const [stats,   setStats]   = useState(null);
  const [today,   setToday]   = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      attendanceAPI.getStats(),
      attendanceAPI.getToday(),
    ]).then(([s, t]) => {
      setStats(s.data.data);
      setToday(t.data.data);
    }).finally(() => setLoading(false));
  }, []);

  const statCards = stats ? [
    {
      icon: '👥', label: 'Total Employees', value: stats.total_employees,
      gradient: 'linear-gradient(135deg,#6366f1,#a855f7)', bg: '#6366f1',
    },
    {
      icon: '✅', label: 'Present Today', value: stats.today_present,
      gradient: 'linear-gradient(135deg,#10b981,#06b6d4)', bg: '#10b981',
    },
    {
      icon: '❌', label: 'Absent Today', value: stats.today_absent,
      gradient: 'linear-gradient(135deg,#ef4444,#f97316)', bg: '#ef4444',
    },
    {
      icon: '📅', label: 'This Month', value: stats.this_month_logs,
      gradient: 'linear-gradient(135deg,#f59e0b,#fb923c)', bg: '#f59e0b',
    },
  ] : [];

  return (
    <>
      <Topbar
        title="Dashboard"
        subtitle={`Today — ${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`}
      >
        <button className="btn btn-primary" onClick={() => navigate('/employees/new')}>
          ➕ Add Employee
        </button>
        <button className="btn btn-secondary" onClick={() => navigate('/scanner')}>
          📷 Open Scanner
        </button>
      </Topbar>

      <div className="page-wrapper fade-in">
        {/* Stat Cards */}
        <div className="stats-grid">
          {loading ? (
            Array(4).fill(0).map((_,i) => (
              <div key={i} className="stat-card" style={{ background: 'var(--card)', height: 120, opacity: .5 }}></div>
            ))
          ) : statCards.map(card => (
            <div key={card.label} className="stat-card" style={{ '--gradient': card.gradient }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: card.gradient, borderRadius: '12px 12px 0 0' }}></div>
              <div className="stat-icon">{card.icon}</div>
              <div className="stat-value">{card.value}</div>
              <div className="stat-label">{card.label}</div>
            </div>
          ))}
        </div>

        {/* Today's Attendance */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              📋 Today's Attendance
              <span className="badge badge-green" style={{ marginLeft: 8 }}>
                {today.length} marked
              </span>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/attendance')}>
              View All →
            </button>
          </div>

          {loading ? (
            <div className="loading-overlay">
              <div className="spinner"></div>
              <span style={{ color: 'var(--text2)' }}>Loading…</span>
            </div>
          ) : today.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <h3>No attendance marked yet</h3>
              <p>Scan employee QR codes to mark attendance</p>
            </div>
          ) : (
            <div className="table-container" style={{ border: 'none' }}>
              <table>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Check-In</th>
                    <th>Check-Out</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {today.map(record => (
                    <tr key={record.id} className="slide-up">
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="avatar">
                            {record.name?.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)}
                          </div>
                          <div>
                            <div className="primary-text">{record.name}</div>
                            <div style={{ fontSize: 12, color: 'var(--text3)' }}>{record.employee_id}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-cyan">{record.department}</span>
                      </td>
                      <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: 'var(--emerald)', fontWeight: 'bold' }}>
                        {record.time_in}
                      </td>
                      <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: 'var(--red)', fontWeight: 'bold' }}>
                        {record.time_out || '—'}
                      </td>
                      <td>
                        {(() => {
                          const isCheckIn = record.scans ? record.scans.length % 2 !== 0 : !record.time_out;
                          return (
                            <span className={!isCheckIn ? 'badge' : 'badge badge-green'}>
                              {!isCheckIn ? '🏃 Checked Out' : '✅ Checked In'}
                            </span>
                          );
                        })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginTop: 24 }}>
          {[
            { icon: '👥', label: 'Manage Employees', desc: 'View, edit, delete employees', path: '/employees', color: '#6366f1' },
            { icon: '📷', label: 'Mark Attendance',  desc: 'Scan QR codes',               path: '/scanner',   color: '#10b981' },
            { icon: '📅', label: 'Attendance Log',   desc: 'Full attendance history',      path: '/attendance', color: '#f59e0b' },
          ].map(action => (
            <button
              key={action.path}
              className="card"
              style={{ border: 'none', textAlign: 'left', cursor: 'pointer', padding: 20, background: 'var(--card)' }}
              onClick={() => navigate(action.path)}
            >
              <div style={{ fontSize: 28, marginBottom: 10 }}>{action.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: action.color }}>{action.label}</div>
              <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>{action.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
