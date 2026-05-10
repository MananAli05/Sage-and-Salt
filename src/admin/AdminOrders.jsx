import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Receipt, Search, Clock, CheckCircle, XCircle, ChefHat, AlertCircle } from 'lucide-react';
import './admin.css';

const fmt = (n) => `Rs. ${Number(n || 0).toLocaleString()}`;

function getStatus(raw) {
  if (!raw || raw === 'new' || raw === 'pending') return 'pending';
  if (['ready', 'delivered', 'completed'].includes(raw)) return 'completed';
  return raw;
}

const StatusBadge = ({ raw }) => {
  const s = getStatus(raw);
  const cls = { pending: 'a-badge-pending', preparing: 'a-badge-preparing', completed: 'a-badge-completed', cancelled: 'a-badge-cancelled' };
  const lbl = { pending: 'Pending', preparing: 'Preparing', completed: 'Completed', cancelled: 'Cancelled' };
  return <span className={`a-badge ${cls[s] || ''}`}>{lbl[s] || s}</span>;
};

const SourceBadge = ({ src }) => {
  const s = (src || 'qr').toLowerCase();
  const cls = { qr: 'a-badge-qr', whatsapp: 'a-badge-whatsapp', call: 'a-badge-call' };
  const lbl = { qr: 'QR Scan', whatsapp: 'WhatsApp', call: 'Call' };
  return <span className={`a-badge ${cls[s] || 'a-badge-qr'}`}>{lbl[s] || 'QR'}</span>;
};

const STATUS_TABS = [
  { key: 'all',       label: 'All Orders',  icon: <Receipt size={14} /> },
  { key: 'pending',   label: 'Pending',     icon: <Clock size={14} /> },
  { key: 'preparing', label: 'Preparing',   icon: <ChefHat size={14} /> },
  { key: 'completed', label: 'Completed',   icon: <CheckCircle size={14} /> },
  { key: 'cancelled', label: 'Cancelled',   icon: <XCircle size={14} /> },
];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [expanded, setExpanded] = useState(null);

  useEffect(() =>
    onSnapshot(query(collection(db, 'orders'), orderBy('createdAt', 'desc')), snap => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }), []);

  const filtered = orders.filter(o => {
    const matchTab = activeTab === 'all' || getStatus(o.status) === activeTab;
    const t = search.toLowerCase();
    const matchSearch = !t ||
      o.orderId?.toLowerCase().includes(t) ||
      o.customerName?.toLowerCase().includes(t) ||
      o.phone?.includes(t);
    return matchTab && matchSearch;
  });

  const counts = {
    all:       orders.length,
    pending:   orders.filter(o => getStatus(o.status) === 'pending').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    completed: orders.filter(o => getStatus(o.status) === 'completed').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
  };

  const totalRevenue = orders
    .filter(o => getStatus(o.status) === 'completed')
    .reduce((s, o) => s + (o.total || 0), 0);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
      <div style={{ width: '36px', height: '36px', border: '3px solid #ecddd1', borderTopColor: '#e07a2c', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="a-page-header">
        <div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.5rem', fontWeight: 700, color: 'var(--a-accent)' }}>Orders History</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--a-muted)', marginTop: '0.1rem' }}>
            Complete record of all {orders.length} orders · Total Revenue: <strong style={{ color: 'var(--a-accent)' }}>{fmt(totalRevenue)}</strong>
          </div>
        </div>
        <div className="a-search-wrap">
          <Search size={14} />
          <input
            className="a-search"
            placeholder="Search by ID, name, phone…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Status Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {STATUS_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.45rem 1rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700,
              border: activeTab === tab.key ? '1.5px solid var(--a-accent)' : '1.5px solid var(--a-border-solid)',
              background: activeTab === tab.key ? 'var(--a-accent-lt)' : 'var(--a-card)',
              color: activeTab === tab.key ? 'var(--a-accent)' : 'var(--a-muted)',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {tab.icon} {tab.label}
            <span style={{
              background: activeTab === tab.key ? 'var(--a-accent)' : 'var(--a-panel)',
              color: activeTab === tab.key ? '#fff' : 'var(--a-muted)',
              borderRadius: '50px', padding: '0.05rem 0.45rem', fontSize: '0.7rem', fontWeight: 800,
            }}>{counts[tab.key]}</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="a-table-wrap">
        <table className="a-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Table / Location</th>
              <th>Items</th>
              <th>Amount</th>
              <th>Source</th>
              <th>Time</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '4rem', color: 'var(--a-muted)' }}>
                  <AlertCircle size={32} style={{ marginBottom: '0.75rem', opacity: 0.3 }} />
                  <div style={{ fontWeight: 600 }}>No orders found</div>
                  <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Try changing the filter or search term</div>
                </td>
              </tr>
            ) : filtered.map(o => (
              <React.Fragment key={o.id}>
                <tr
                  onClick={() => setExpanded(expanded === o.id ? null : o.id)}
                  style={{ cursor: 'pointer' }}
                  className={expanded === o.id ? 'selected' : ''}
                >
                  <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--a-muted)' }}>{o.orderId}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{o.customerName}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--a-muted)' }}>{o.phone}</div>
                  </td>
                  <td>
                    {o.tableNo && o.tableNo !== 'Walk-in'
                      ? <span style={{ background: '#eff6ff', color: '#2563eb', padding: '0.15rem 0.55rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>Table {o.tableNo}</span>
                      : <span style={{ color: 'var(--a-muted)', fontSize: '0.82rem' }}>{o.city || 'Walk-in'}</span>}
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--a-muted)' }}>{o.items?.length || 0} item{o.items?.length !== 1 ? 's' : ''}</td>
                  <td style={{ fontWeight: 700 }}>{fmt(o.total)}</td>
                  <td><SourceBadge src={o.source} /></td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--a-muted)' }}>
                    {o.createdAt?.toDate
                      ? o.createdAt.toDate().toLocaleString([], { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })
                      : 'Just now'}
                  </td>
                  <td><StatusBadge raw={o.status} /></td>
                </tr>

                {/* Expandable row with items */}
                {expanded === o.id && (
                  <tr>
                    <td colSpan={8} style={{ padding: 0, background: 'var(--a-panel)' }}>
                      <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--a-border-solid)', borderBottom: '1px solid var(--a-border-solid)' }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--a-muted)', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>Order Items</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                          {o.items?.map((item, i) => (
                            <div key={i} style={{
                              background: 'var(--a-card)', border: '1px solid var(--a-border-solid)',
                              borderRadius: '8px', padding: '0.5rem 0.85rem', fontSize: '0.82rem',
                              display: 'flex', alignItems: 'center', gap: '0.5rem'
                            }}>
                              <span style={{ background: 'var(--a-accent-lt)', color: 'var(--a-accent)', borderRadius: '4px', padding: '0.1rem 0.35rem', fontSize: '0.7rem', fontWeight: 800 }}>{item.qty}×</span>
                              <span style={{ fontWeight: 600 }}>{item.name}</span>
                              <span style={{ color: 'var(--a-muted)' }}>·</span>
                              <span style={{ fontWeight: 700 }}>{fmt(item.subtotal)}</span>
                            </div>
                          ))}
                        </div>
                        {o.note && (
                          <div style={{ marginTop: '0.75rem', background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: '8px', padding: '0.5rem 0.85rem', fontSize: '0.8rem', color: '#78350f' }}>
                            <strong>Note:</strong> {o.note}
                          </div>
                        )}
                        <div style={{ marginTop: '0.75rem', display: 'flex', gap: '2rem', fontSize: '0.8rem', color: 'var(--a-muted)' }}>
                          <span>Subtotal: <strong>{fmt(o.subtotal)}</strong></span>
                          <span>Delivery: <strong>{fmt(o.deliveryFee)}</strong></span>
                          <span>Tax: <strong>{fmt(o.tax)}</strong></span>
                          <span style={{ color: 'var(--a-accent)', fontWeight: 800 }}>Total: {fmt(o.total)}</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
