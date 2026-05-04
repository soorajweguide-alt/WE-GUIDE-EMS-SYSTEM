import { useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar          from './components/Sidebar';
import Dashboard        from './pages/Dashboard';
import Employees        from './pages/Employees';
import AddEmployee      from './pages/AddEmployee';
import EmployeeProfile  from './pages/EmployeeProfile';
import Scanner          from './pages/Scanner';
import Attendance       from './pages/Attendance';
import Login            from './pages/Login';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem('isAdminLoggedIn') === 'true'
  );

  const handleLogin = () => {
    localStorage.setItem('isAdminLoggedIn', 'true');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('isAdminLoggedIn');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return (
      <>
        <Login onLogin={handleLogin} />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1e2a3a',
              color: '#f1f5f9',
              border: '1px solid #2a3650',
              borderRadius: 12,
              fontFamily: 'Inter, sans-serif',
              fontSize: 14,
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
      </>
    );
  }

  return (
    <HashRouter>
      <div className="app-layout">
        <Sidebar onLogout={handleLogout} />
        <main className="main-content">
          <Routes>
            <Route path="/"                element={<Dashboard />}         />
            <Route path="/employees"       element={<Employees />}         />
            <Route path="/employees/new"   element={<AddEmployee />}       />
            <Route path="/employees/:id"   element={<EmployeeProfile />}   />
            <Route path="/scanner"         element={<Scanner />}           />
            <Route path="/attendance"      element={<Attendance />}        />
            <Route path="*"               element={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 16 }}>
                <div style={{ fontSize: 64 }}>404</div>
                <div style={{ color: 'var(--text2)' }}>Page not found</div>
              </div>
            } />
          </Routes>
        </main>
      </div>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1e2a3a',
            color: '#f1f5f9',
            border: '1px solid #2a3650',
            borderRadius: 12,
            fontFamily: 'Inter, sans-serif',
            fontSize: 14,
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
    </HashRouter>
  );
}
