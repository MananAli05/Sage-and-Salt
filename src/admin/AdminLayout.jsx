import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import './admin.css';

// SVG nav icons
const IconDash     = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>;
const IconOrders   = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>;
const IconQR       = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="5" height="5"/><rect x="16" y="3" width="5" height="5"/><rect x="3" y="16" width="5" height="5"/><path d="M21 16h-3a2 2 0 00-2 2v3M21 21v.01M12 3v3M12 9v.01M12 15v3M3 12h3M9 12h.01"/></svg>;
const IconSettings = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>;
const IconLogout   = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!localStorage.getItem('sage_admin_auth')) navigate('/admin/login');
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('sage_admin_auth');
    navigate('/admin/login');
  };

  const nav = [
    { name:'Dashboard',    path:'/admin/dashboard', icon:<IconDash /> },
    { name:'Orders',       path:'/admin/orders',    icon:<IconOrders /> },
    { name:'QR Generator', path:'/admin/qr',        icon:<IconQR /> },
    { name:'Settings',     path:'/admin/settings',  icon:<IconSettings /> },
  ];

  return (
    <div className="admin-theme" style={{ display:'flex', minHeight:'100vh' }}>
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
          {nav.map(item => {
            const active = location.pathname.includes(item.path);
            return (
              <Link key={item.name} to={item.path} className={`sidebar-link ${active ? 'active' : ''}`}>
                <span style={{ display:'flex', flexShrink:0 }}>{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </div>

        {/* Logout */}
        <div style={{ borderTop:'1px solid rgba(224,122,44,0.15)', paddingTop:'1rem' }}>
          <button onClick={handleLogout} className="sidebar-link">
            <IconLogout /> Sign Out
          </button>
        </div>
      </aside>

      <main style={{ flex:1, marginLeft:'240px', padding:'2rem 2.25rem', minHeight:'100vh', background:'var(--a-bg)' }}>
        <Outlet />
      </main>
    </div>
  );
}
