import React, { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, Hash } from 'lucide-react';
import './admin.css';

const BASE_URL = 'https://sage-and-salt.vercel.app';

export default function AdminQR() {
  const [tableCount, setTableCount] = useState(10);

  const handleDownload = (tableNo) => {
    const canvas = document.getElementById(`qr-canvas-${tableNo}`);
    if (!canvas) return;
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `Sage_Salt_Table_${tableNo}_QR.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const tables = Array.from({ length: Math.max(1, tableCount) }, (_, i) => i + 1);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--a-text)', marginBottom: '0.15rem' }}>QR Generator</h1>
        <p style={{ color: 'var(--a-muted)', fontSize: '0.85rem' }}>Generate unique, scannable QR codes for each table.</p>
      </div>

      {/* Controls */}
      <div className="qr-controls" style={{ padding: '1.25rem 1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--a-text)', whiteSpace: 'nowrap' }}>
            Number of Tables
          </label>
          <div style={{ position: 'relative' }}>
            <Hash size={14} style={{ position: 'absolute', left: '0.7rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--a-muted)', pointerEvents: 'none' }} />
            <input
              type="number"
              min="1" max="100"
              value={tableCount}
              onChange={e => setTableCount(parseInt(e.target.value) || 1)}
              style={{
                padding: '0.55rem 0.85rem 0.55rem 2rem',
                border: '1px solid var(--a-border)',
                borderRadius: '8px',
                fontSize: '0.875rem',
                color: 'var(--a-text)',
                background: 'var(--a-card)',
                width: '100px',
                outline: 'none'
              }}
            />
          </div>
        </div>
        <p style={{ fontSize: '0.82rem', color: 'var(--a-muted)' }}>
          Each QR code links to your live menu with its unique table number.
        </p>
      </div>

      {/* QR Grid */}
      <div className="qr-print-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
        {tables.map(tableNo => {
          const url = `${BASE_URL}/?table=${tableNo}`;
          return (
            <div key={tableNo} className="qr-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/* QR Code */}
              <div style={{ background: '#fff', padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--a-border)', marginBottom: '0.85rem' }}>
                <QRCodeCanvas
                  id={`qr-canvas-${tableNo}`}
                  value={url}
                  size={400}
                  style={{ width: '130px', height: '130px', display: 'block' }}
                  level="H"
                  includeMargin={true}
                  imageSettings={{
                    src: '/logo.png',
                    height: 100,
                    width: 100,
                    excavate: true,
                  }}
                />
              </div>

              <div style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--a-text)', marginBottom: '0.2rem' }}>
                Table {tableNo}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--a-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                Scan to Order
              </div>

              <button
                onClick={() => handleDownload(tableNo)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                  width: '100%', padding: '0.55rem', borderRadius: '8px',
                  border: '1px solid var(--a-border)', background: 'var(--a-panel)',
                  color: 'var(--a-text)', fontSize: '0.8rem', fontWeight: '600',
                  cursor: 'pointer', transition: 'all 0.15s'
                }}
                onMouseOver={e => { e.currentTarget.style.background = 'var(--a-accent)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'var(--a-accent)'; }}
                onMouseOut={e => { e.currentTarget.style.background = 'var(--a-panel)'; e.currentTarget.style.color = 'var(--a-text)'; e.currentTarget.style.borderColor = 'var(--a-border)'; }}
              >
                <Download size={14} /> Download PNG
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
