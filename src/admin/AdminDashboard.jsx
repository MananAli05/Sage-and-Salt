import React, { useEffect, useState } from 'react';
import {
  collection, query, orderBy, onSnapshot,
  doc, updateDoc, serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  Search, Phone, MapPin, CreditCard, Clock, CheckCircle,
  ShoppingBag, TrendingUp, Bell, X, ChefHat, XCircle, ArrowRight
} from 'lucide-react';
import './admin.css';

const fmt = (n) => `Rs. ${Number(n || 0).toLocaleString()}`;

function getStatus(raw) {
  if (!raw || raw === 'new' || raw === 'pending') return 'pending';
  if (raw === 'ready' || raw === 'delivered' || raw === 'completed') return 'completed';
  return raw; // preparing | cancelled
}

export default function AdminDashboard() {
  const [orders, setOrders]               = useState([]);
  const [waiterCalls, setWaiterCalls]     = useState([]);
  const [selected, setSelected]           = useState(null);
  const [search, setSearch]               = useState('');
  const [loading, setLoading]             = useState(true);

  /* ── Live Orders ── */
  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, snap => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  }, []);

  /* ── Waiter Calls ── */
  useEffect(() => {
    const q = query(collection(db, 'waiter_calls'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, snap => {
      setWaiterCalls(
        snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(c => c.status === 'pending')
      );
    });
  }, []);

  const dismissCall = async (id) => {
    await updateDoc(doc(db, 'waiter_calls', id), { status: 'done' });
  };

  const updateStatus = async (orderId, newStatus) => {
    await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
    if (selected?.id === orderId) setSelected(p => ({ ...p, status: newStatus }));
  };

  /* ── Computed Stats ── */
  const pending   = orders.filter(o => getStatus(o.status) === 'pending').length;
  const completed = orders.filter(o => getStatus(o.status) === 'completed').length;
  const revenue   = orders
    .filter(o => getStatus(o.status) === 'completed')
    .reduce((s, o) => s + (o.total || 0), 0);

  const filtered = orders.filter(o => {
    const t = search.toLowerCase();
    return (
      o.orderId?.toLowerCase().includes(t) ||
      o.customerName?.toLowerCase().includes(t) ||
      o.tableNo?.toString().toLowerCase().includes(t)
    );
  });

  /* ── Badge helpers ── */
  const StatusBadge = ({ raw }) => {
    const s = getStatus(raw);
    const map = {
      pending:   'a-badge-pending',
      preparing: 'a-badge-preparing',
      completed: 'a-badge-completed',
      cancelled: 'a-badge-cancelled',
    };
    return <span className={`a-badge ${map[s] || ''}`}>{s.charAt(0).toUpperCase() + s.slice(1)}</span>;
  };

  const SourceBadge = ({ src }) => {
    const s = (src || 'qr').toLowerCase();
    const map = { qr: 'a-badge-qr', whatsapp: 'a-badge-whatsapp', call: 'a-badge-call' };
    const label = { qr: 'QR Menu', whatsapp: 'WhatsApp', call: 'Call' };
    return <span className={`a-badge ${map[s] || 'a-badge-qr'}`}>{label[s] || 'QR'}</span>;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ width: '36px', height: '36px', border: '3px solid #e8ecf0', borderTopColor: 'var(--a-accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: '1.5rem' }}>

      {/* ────── LEFT / MAIN ────── */}
      <div style={{ flex: 1, minWidth: 0, paddingRight: '360px' }}>

        {/* Page header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--a-text)', marginBottom: '0.15rem' }}>Dashboard</h1>
            <p style={{ color: 'var(--a-muted)', fontSize: '0.85rem' }}>Welcome back — here's what's happening today.</p>
          </div>
          <div className="a-search-wrap">
            <Search size={15} />
            <input
              className="a-search"
              placeholder="Search orders, customers…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* ── Waiter Alerts ── */}
        {waiterCalls.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <Bell size={16} color="var(--a-orange)" />
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--a-orange)' }}>
                Waiter Requests ({waiterCalls.length})
              </span>
            </div>
            {waiterCalls.map(call => (
              <div key={call.id} className="waiter-alert">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ background: '#fed7aa', borderRadius: '8px', padding: '0.4rem', display: 'flex' }}>
                    <Bell size={16} color="var(--a-orange)" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--a-text)' }}>
                      Table {call.tableNo} needs assistance
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--a-muted)' }}>
                      {call.createdAt?.toDate ? call.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => dismissCall(call.id)}
                  style={{ background: 'transparent', border: '1px solid #fed7aa', color: 'var(--a-orange)', padding: '0.35rem 0.85rem', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Dismiss
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ── Stat Cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div className="a-stat-card">
            <div className="a-stat-icon" style={{ background: '#eff6ff' }}>
              <ShoppingBag size={22} color="var(--a-blue)" />
            </div>
            <div>
              <div className="a-stat-value">{orders.length}</div>
              <div className="a-stat-label">Total Orders</div>
            </div>
          </div>
          <div className="a-stat-card">
            <div className="a-stat-icon" style={{ background: 'var(--a-orange-lt)' }}>
              <Clock size={22} color="var(--a-orange)" />
            </div>
            <div>
              <div className="a-stat-value">{pending}</div>
              <div className="a-stat-label">Pending</div>
            </div>
          </div>
          <div className="a-stat-card">
            <div className="a-stat-icon" style={{ background: 'var(--a-green-lt)' }}>
              <CheckCircle size={22} color="var(--a-green)" />
            </div>
            <div>
              <div className="a-stat-value">{completed}</div>
              <div className="a-stat-label">Completed</div>
            </div>
          </div>
          <div className="a-stat-card">
            <div className="a-stat-icon" style={{ background: 'var(--a-accent-lt)' }}>
              <TrendingUp size={22} color="var(--a-accent)" />
            </div>
            <div>
              <div className="a-stat-value" style={{ fontSize: '1.25rem' }}>Rs. {revenue.toLocaleString()}</div>
              <div className="a-stat-label">Revenue</div>
            </div>
          </div>
        </div>

        {/* ── Orders Table ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div>
            <div className="a-section-title">Live Orders</div>
            <div className="a-section-subtitle">Click any row to view full details</div>
          </div>
        </div>

        <div className="a-table-wrap">
          <table className="a-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Order ID</th>
                <th>Table / Address</th>
                <th>Amount</th>
                <th>Source</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--a-muted)' }}>
                    No orders yet.
                  </td>
                </tr>
              ) : filtered.map(order => (
                <tr
                  key={order.id}
                  onClick={() => setSelected(order)}
                  className={selected?.id === order.id ? 'selected' : ''}
                >
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <div className="a-avatar">{order.customerName?.charAt(0) || '?'}</div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{order.customerName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--a-muted)' }}>{order.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--a-muted)' }}>{order.orderId}</td>
                  <td style={{ fontSize: '0.82rem' }}>
                    {order.tableNo && order.tableNo !== 'Walk-in'
                      ? <span style={{ background: 'var(--a-blue-lt)', color: 'var(--a-blue)', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>Table {order.tableNo}</span>
                      : <span style={{ color: 'var(--a-muted)' }}>{order.address?.substring(0, 20) || 'Walk-in'}{order.address?.length > 20 ? '…' : ''}</span>
                    }
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--a-text)' }}>{fmt(order.total)}</td>
                  <td><SourceBadge src={order.source} /></td>
                  <td><StatusBadge raw={order.status} /></td>
                  <td><ArrowRight size={16} color="var(--a-muted)" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ────── RIGHT PANEL ────── */}
      <aside className="a-right-panel">
        {!selected ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', color: 'var(--a-muted)', textAlign: 'center' }}>
            <div style={{ width: '60px', height: '60px', background: 'var(--a-panel)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <ShoppingBag size={28} color="var(--a-muted)" />
            </div>
            <p style={{ fontWeight: 600, marginBottom: '0.35rem', color: 'var(--a-text)' }}>No Order Selected</p>
            <p style={{ fontSize: '0.82rem' }}>Click on any row to view its details here.</p>
          </div>
        ) : (
          <>
            {/* Panel Header */}
            <div className="a-panel-header">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--a-text)' }}>Order Details</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--a-muted)', fontFamily: 'monospace', marginTop: '0.2rem' }}>{selected.orderId}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <StatusBadge raw={selected.status} />
                  <button onClick={() => setSelected(null)} style={{ background: 'var(--a-panel)', border: '1px solid var(--a-border)', borderRadius: '8px', padding: '0.3rem', display: 'flex', cursor: 'pointer' }}>
                    <X size={16} color="var(--a-muted)" />
                  </button>
                </div>
              </div>
            </div>

            {/* Panel Body */}
            <div className="a-panel-body">
              {/* Delivery info box */}
              <div style={{ background: 'var(--a-panel)', border: '1px solid var(--a-border)', borderRadius: 'var(--a-radius-sm)', padding: '0.85rem 1rem', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--a-muted)', marginBottom: '0.5rem' }}>
                  {selected.tableNo && selected.tableNo !== 'Walk-in' ? 'Dine In' : 'Delivery Address'}
                </div>
                <div className="a-info-row">
                  <MapPin size={13} />
                  {selected.tableNo && selected.tableNo !== 'Walk-in'
                    ? `Table ${selected.tableNo}`
                    : `${selected.address}, ${selected.city}`}
                </div>
                <div className="a-info-row" style={{ marginBottom: 0 }}>
                  <Clock size={13} />
                  {selected.createdAt?.toDate
                    ? selected.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'Just now'}
                </div>
              </div>

              {/* Customer */}
              <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--a-muted)', marginBottom: '0.5rem' }}>Customer</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div className="a-avatar" style={{ width: '40px', height: '40px', fontSize: '1rem' }}>
                  {selected.customerName?.charAt(0) || '?'}
                </div>
                <div>
                  <div style={{ fontWeight: 700 }}>{selected.customerName}</div>
                  <div className="a-info-row" style={{ marginBottom: 0 }}>
                    <Phone size={12} /> {selected.phone}
                  </div>
                </div>
              </div>
              <div className="a-info-row" style={{ marginBottom: '1.25rem' }}>
                <CreditCard size={13} />
                {selected.paymentMethod === 'cash' ? 'Cash on Delivery' : 'Online Payment'}
              </div>

              <hr className="a-divider" />

              {/* Items */}
              <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--a-muted)', marginBottom: '0.75rem' }}>
                Items <SourceBadge src={selected.source} />
              </div>
              {selected.items?.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ background: 'var(--a-panel)', border: '1px solid var(--a-border)', borderRadius: '6px', padding: '0.15rem 0.45rem', fontSize: '0.75rem', fontWeight: 700 }}>{item.qty}×</span>
                    <span style={{ fontSize: '0.875rem' }}>{item.name}</span>
                  </div>
                  <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{fmt(item.subtotal)}</span>
                </div>
              ))}

              {selected.note && (
                <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '8px', padding: '0.6rem 0.85rem', fontSize: '0.8rem', color: '#92400e', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                  <strong>Note:</strong> {selected.note}
                </div>
              )}

              <hr className="a-divider" />

              {/* Totals */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--a-muted)', marginBottom: '0.4rem' }}>
                <span>Subtotal</span><span>{fmt(selected.subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--a-muted)', marginBottom: '0.75rem' }}>
                <span>Delivery + Tax</span><span>{fmt((selected.deliveryFee || 0) + (selected.tax || 0))}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.1rem', color: 'var(--a-text)' }}>
                <span>Total</span><span style={{ color: 'var(--a-accent)' }}>{fmt(selected.total)}</span>
              </div>
            </div>

            {/* Panel Footer Actions */}
            <div className="a-panel-footer" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {getStatus(selected.status) === 'pending' && (
                <button className="a-btn a-btn-primary" onClick={() => updateStatus(selected.id, 'preparing')}>
                  <ChefHat size={16} /> Start Preparing
                </button>
              )}
              {getStatus(selected.status) === 'preparing' && (
                <button className="a-btn a-btn-success" onClick={() => updateStatus(selected.id, 'completed')}>
                  <CheckCircle size={16} /> Mark as Completed
                </button>
              )}
              {getStatus(selected.status) === 'completed' && (
                <div style={{ textAlign: 'center', padding: '0.75rem', background: 'var(--a-green-lt)', color: 'var(--a-green)', borderRadius: 'var(--a-radius-sm)', fontWeight: 700, fontSize: '0.875rem' }}>
                  Order successfully completed
                </div>
              )}
              {(getStatus(selected.status) === 'pending' || getStatus(selected.status) === 'preparing') && (
                <button className="a-btn a-btn-danger" onClick={() => updateStatus(selected.id, 'cancelled')}>
                  <XCircle size={16} /> Cancel Order
                </button>
              )}
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
