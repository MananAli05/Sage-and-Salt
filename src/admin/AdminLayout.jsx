import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { LayoutDashboard, Receipt, QrCode, Settings, LogOut } from 'lucide-react';
import './admin.css';

export default function AdminLayout() {
  const navigate  = useNavigate();
  const location  = useLocation();

  useEffect(() => {
    const isAuth = localStorage.getItem('sage_admin_auth');
    if (!isAuth) navigate('/admin/login');
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('sage_admin_auth');
    navigate('/admin/login');
  };

  const navItems = [
    { name: 'Dashboard',     path: '/admin/dashboard', icon: <LayoutDashboard size={17} /> },
    { name: 'Orders',        path: '/admin/orders',    icon: <Receipt size={17} /> },
    { name: 'QR Generator',  path: '/admin/qr',        icon: <QrCode size={17} /> },
    { name: 'Settings',      path: '/admin/settings',  icon: <Settings size={17} /> },
  ];

  return (
    <div className="admin-theme" style={{ display:'flex', minHeight:'100vh' }}>

      {/* ── Sidebar ── */}
      <aside className="admin-sidebar">
        {/* Brand */}
        <div className="sidebar-brand">
          <img src="/logo.png" alt="Sage & Salt" />
          <div>
            <div className="sidebar-brand-name">Sage & Salt</div>
            <div className="sidebar-brand-sub">Admin Portal</div>
          </div>
        </div>

        {/* Nav */}
        <div style={{ flex:1 }}>
          <div className="sidebar-section-label">Navigation</div>
          {navItems.map(item => {
            const isActive = location.pathname.includes(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`sidebar-link ${isActive ? 'active' : ''}`}
              >
                <span className="sidebar-link-icon">{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </div>

        {/* Logout */}
        <div style={{ borderTop:'1px solid rgba(255,255,255,0.1)', paddingTop:'1rem' }}>
          <button onClick={handleLogout} className="sidebar-link" style={{ color:'rgba(255,255,255,0.5)' }}>
            <LogOut size={17} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{ flex:1, marginLeft:'240px', padding:'2rem 2rem 2rem 2.25rem', minHeight:'100vh', background:'var(--a-bg)' }}>
        <Outlet />
      </main>
    </div>
  );
}
