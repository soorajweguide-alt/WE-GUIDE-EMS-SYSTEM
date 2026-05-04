import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const navItems = [
  { icon: '📊', label: 'Dashboard',    path: '/' },
  { icon: '👥', label: 'Employees',    path: '/employees' },
  { icon: '➕', label: 'Add Employee', path: '/employees/new' },
  { icon: '📷', label: 'QR Scanner',   path: '/scanner' },
  { icon: '📅', label: 'Attendance',   path: '/attendance' },
];

export default function Sidebar({ onLogout }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [open, setOpen] = useState(false);

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    // Avoid matching /employees/new and /employees/:id as /employees
    if (path === '/employees') return location.pathname === '/employees';
    return location.pathname.startsWith(path);
  };

  const go = (path) => {
    navigate(path);
    setOpen(false);
  };

  const SidebarContent = () => (
    <>
      <div className="sidebar-logo">
        <div className="logo-mark">
          <img src="/logo.png" alt="WE GUIDE Logo" style={{ width: '100%', height: 'auto', borderRadius: '8px' }} />
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-title">Navigation</div>
        {navItems.map(item => (
          <button
            key={item.path}
            className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
            onClick={() => go(item.path)}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <span className="pulse-dot" />
          <span>System Online</span>
        </div>
        {onLogout && (
          <button 
            onClick={onLogout} 
            className="btn btn-danger btn-sm" 
            style={{ width: '100%', marginBottom: 12, justifyContent: 'center' }}
          >
            Log Out
          </button>
        )}
        <div style={{ fontSize: 11, opacity: .6 }}>v1.0.0 — WE GUIDE EMS</div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="sidebar">
        <SidebarContent />
      </aside>

      {/* Mobile Hamburger Button */}
      <button
        className="mobile-menu-btn"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
      >
        ☰
      </button>

      {/* Mobile Drawer Overlay */}
      {open && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(4px)',
            zIndex: 200, display: 'flex',
          }}
          onClick={() => setOpen(false)}
        >
          <aside
            className="sidebar"
            style={{ position: 'relative', animation: 'slideInLeft .25s ease' }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              style={{
                position: 'absolute', top: 16, right: 16,
                background: 'var(--surface2)', border: '1px solid var(--border)',
                borderRadius: 8, padding: '4px 10px', color: 'var(--text2)',
                cursor: 'pointer', fontSize: 16,
              }}
            >✕</button>
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  );
}
