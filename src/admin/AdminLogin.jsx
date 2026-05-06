import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User } from 'lucide-react';
import '../index.css'; // Reusing global theme

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate network delay for realistic feel
    setTimeout(() => {
      if (username === 'admin' && password === 'admin123') {
        localStorage.setItem('sage_admin_auth', 'true');
        navigate('/admin/dashboard');
      } else {
        setError('Invalid username or password');
        setLoading(false);
      }
    }, 800);
  };

  return (
    <div className="admin-login-wrapper" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'url(/hero-food.png) center/cover no-repeat', // Using the existing food hero image for a nice background
      position: 'relative'
    }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)', // Dark overlay
        backdropFilter: 'blur(8px)'
      }} />
      
      <div className="admin-login-card" style={{
        position: 'relative',
        zIndex: 1,
        background: 'var(--card-bg)',
        border: '1px solid var(--border)',
        padding: '2.5rem',
        borderRadius: 'var(--radius)',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img src="/logo.png" alt="Logo" style={{ width: '60px', marginBottom: '1rem' }} />
          <h1 style={{ fontSize: '1.5rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Admin Portal</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Sign in to manage Sage & Salt</p>
        </div>

        <form onSubmit={handleLogin}>
          {error && (
            <div style={{
              background: 'rgba(232, 69, 69, 0.1)',
              color: '#e84545',
              padding: '0.75rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              marginBottom: '1rem',
              textAlign: 'center',
              border: '1px solid rgba(232, 69, 69, 0.2)'
            }}>
              {error}
            </div>
          )}

          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={16} /> Username
            </label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Lock size={16} /> Password
            </label>
            <input 
              type="password" 
              className="form-input" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="submit-btn" 
            disabled={loading}
            style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
          >
            {loading ? <span className="spinner" style={{ margin: 0 }} /> : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
