import { useState } from 'react';
import toast from 'react-hot-toast';
import Scanner from './Scanner';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username === 'we_guide' && password === 'admin@weguide') {
      onLogin();
    } else {
      toast.error('Invalid username or password');
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      minHeight: '100vh',
      background: 'var(--bg)',
      color: 'var(--text)'
    }}>
      {/* Kiosk Scanner Side */}
      <div style={{ flex: '1 1 500px', padding: '40px', borderRight: '1px solid var(--border)', background: 'var(--surface2)', overflowY: 'auto', maxHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1 }}>
          <Scanner isKiosk={true} />
        </div>
      </div>

      {/* Admin Login Side */}
      <div style={{
        flex: '1 1 400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20
      }}>
        <div className="card slide-up" style={{ width: '100%', maxWidth: 400, padding: '40px 32px' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <img src="/logo.png" alt="WE GUIDE" style={{ height: 64, marginBottom: 16, objectFit: 'contain' }} />
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Admin Login</h2>
            <p style={{ color: 'var(--text2)', fontSize: 14 }}>WE GUIDE — Employee Management</p>
          </div>
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label className="form-label" style={{ marginBottom: 8, display: 'block' }}>Username</label>
              <input 
                type="text" 
                className="form-control" 
                value={username} 
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter username"
                required 
              />
            </div>
            <div>
              <label className="form-label" style={{ marginBottom: 8, display: 'block' }}>Password</label>
              <input 
                type="password" 
                className="form-control" 
                value={password} 
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password"
                required 
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 12, padding: '12px' }}>
              Login to Dashboard
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
