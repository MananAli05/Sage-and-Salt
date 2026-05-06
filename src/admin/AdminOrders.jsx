import React from 'react';
import { Receipt } from 'lucide-react';
import './admin.css';

export default function AdminOrders() {
  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--a-text)', marginBottom: '0.15rem' }}>Orders History</h1>
      <p style={{ color: 'var(--a-muted)', fontSize: '0.85rem', marginBottom: '2rem' }}>Full order history and filtering — coming soon.</p>

      <div style={{
        background: 'var(--a-card)', border: '1px solid var(--a-border)', borderRadius: 'var(--a-radius)',
        padding: '4rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        color: 'var(--a-muted)', textAlign: 'center'
      }}>
        <div style={{ width: '64px', height: '64px', background: 'var(--a-panel)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
          <Receipt size={32} color="var(--a-muted)" />
        </div>
        <p style={{ fontWeight: 600, color: 'var(--a-text)', marginBottom: '0.35rem' }}>Under Development</p>
        <p style={{ fontSize: '0.82rem' }}>This section will show a complete filterable history of all orders.</p>
      </div>
    </div>
  );
}
