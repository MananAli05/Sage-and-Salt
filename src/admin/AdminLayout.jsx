import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { LayoutDashboard, Receipt, QrCode, Settings, LogOut } from 'lucide-react';
import './admin.css';

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const isAuth = localStorage.getItem('sage_admin_auth');
    if (!isAuth) navigate('/admin/login');
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('sage_admin_auth');
    navigate('/admin/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard size={18} /> },
    { name: 'Orders',    path: '/admin/orders',    icon: <Receipt size={18} /> },
    { name: 'QR Generator', path: '/admin/qr',    icon: <QrCode size={18} /> },
    { name: 'Settings',  path: '/admin/settings',  icon: <Settings size={18} /> },
  ];

  return (
    <div className="admin-theme" style={{ display: 'flex', minHeight: '100vh' }}>
      {/* ── Sidebar ── */}
      <aside className="admin-sidebar" style={{
        width: '240px', flexShrink: 0,
        display: 'flex', flexDirection: 'column',
        padding: '1.5rem 1rem',
        position: 'fixed', top: 0, bottom: 0, left: 0,
        overflowY: 'auto'
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '2.5rem', padding: '0 0.25rem' }}>
          <img src="/logo.png" alt="Sage & Salt" style={{ width: '40px', height: '40px', borderRadius: '10px', objectFit: 'cover' }} />
          <div>
            <div style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--a-text)', lineHeight: 1.2 }}>Sage & Salt</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--a-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Admin Portal</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--a-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem', padding: '0 0.5rem' }}>
            Menu
          </div>
          {navItems.map(item => {
            const isActive = location.pathname.includes(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`sidebar-link ${isActive ? 'active' : ''}`}
              >
                {item.icon}
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div style={{ borderTop: '1px solid var(--a-border)', paddingTop: '1rem', marginTop: '1rem' }}>
          <button onClick={handleLogout} className="sidebar-link">
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{ flex: 1, marginLeft: '240px', padding: '2rem 2rem 2rem 2.5rem', minHeight: '100vh' }}>
        <Outlet />
      </main>
    </div>
  );
}
