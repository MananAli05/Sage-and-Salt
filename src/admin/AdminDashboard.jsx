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

// ── Gender detection from name ──────────────────────────────────────────────
const FEMALE_NAMES = new Set([
  'ayesha','fatima','sara','sarah','amna','sana','hira','maria','nida','zara',
  'noor','maryam','rabia','iqra','zainab','kiran','aisha','mehwish','uzma',
  'farah','saima','sobia','nadia','asma','samina','maham','layla','laila',
  'romaisa','rimsha','aliza','minahil','nimra','sehar','sheza','anum','maha',
  'palwasha','huma','nageen','muqaddas','sadia','bushra','fizza','fozia',
]);

function detectGender(name = '') {
  const first = name.toLowerCase().split(' ')[0];
  if (FEMALE_NAMES.has(first)) return 'female';
  if (first.endsWith('a') || first.endsWith('ah') || first.endsWith('ia')) {
    // Exclude common male names that end in 'a'
    const maleExceptions = ['ali','musa','isa','yahya','mustafa','mujtaba','taha','raza','mirza','hamza','hamza','usman','suleman','salman'];
    if (!maleExceptions.includes(first)) return 'female';
  }
  return 'male';
}

// ── SVG Avatars ─────────────────────────────────────────────────────────────
const MaleAvatar = () => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" fill="#dbeafe"/>
    {/* Body */}
    <ellipse cx="50" cy="85" rx="28" ry="18" fill="#3b82f6"/>
    {/* Collar */}
    <path d="M38 68 L50 80 L62 68" fill="none" stroke="#fff" strokeWidth="3"/>
    {/* Head */}
    <circle cx="50" cy="42" r="21" fill="#fcd9a8"/>
    {/* Hair */}
    <path d="M29 38 Q30 20 50 18 Q70 20 71 38 Q68 24 50 22 Q32 24 29 38Z" fill="#4b3728"/>
    {/* Eyes */}
    <circle cx="43" cy="42" r="2.5" fill="#2d1b0e"/>
    <circle cx="57" cy="42" r="2.5" fill="#2d1b0e"/>
    {/* Smile */}
    <path d="M43 50 Q50 56 57 50" fill="none" stroke="#b8722d" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

const FemaleAvatar = () => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" fill="#fce7f3"/>
    {/* Body */}
    <ellipse cx="50" cy="85" rx="28" ry="18" fill="#ec4899"/>
    {/* Scarf / dupatta */}
    <path d="M24 54 Q30 45 50 43 Q70 45 76 54 Q68 50 50 49 Q32 50 24 54Z" fill="#be185d"/>
    {/* Head */}
    <circle cx="50" cy="42" r="21" fill="#fcd9a8"/>
    {/* Hair / hijab base */}
    <path d="M29 42 Q28 18 50 16 Q72 18 71 42 Q68 22 50 20 Q32 22 29 42Z" fill="#7c2d12"/>
    {/* Hijab wrap */}
    <path d="M29 42 Q24 58 50 62 Q76 58 71 42" fill="#9a3412" opacity="0.7"/>
    {/* Eyes */}
    <circle cx="43" cy="42" r="2.5" fill="#2d1b0e"/>
    <circle cx="57" cy="42" r="2.5" fill="#2d1b0e"/>
    {/* Lashes */}
    <path d="M41 39.5 L40 37 M43 39 L43 37 M45 39.5 L46 37" stroke="#2d1b0e" strokeWidth="1" strokeLinecap="round"/>
    <path d="M55 39.5 L54 37 M57 39 L57 37 M59 39.5 L60 37" stroke="#2d1b0e" strokeWidth="1" strokeLinecap="round"/>
    {/* Smile */}
    <path d="M43 51 Q50 57 57 51" fill="none" stroke="#b8722d" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

function CustomerAvatar({ name }) {
  const gender = detectGender(name);
  return (
    <div className="a-avatar">
      {gender === 'female' ? <FemaleAvatar /> : <MaleAvatar />}
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function getStatus(raw) {
  if (!raw || raw === 'new' || raw === 'pending') return 'pending';
  if (raw === 'ready' || raw === 'delivered' || raw === 'completed') return 'completed';
  return raw;
}

const StatusBadge = ({ raw }) => {
  const s = getStatus(raw);
  const map = {
    pending:   'a-badge-pending',
    preparing: 'a-badge-preparing',
    completed: 'a-badge-completed',
    cancelled: 'a-badge-cancelled',
  };
  const label = { pending: 'Pending', preparing: 'Preparing', completed: 'Completed', cancelled: 'Cancelled' };
  return <span className={`a-badge ${map[s] || ''}`}>{label[s] || s}</span>;
};

const SourceBadge = ({ src }) => {
  const s = (src || 'qr').toLowerCase();
  const map   = { qr: 'a-badge-qr', whatsapp: 'a-badge-whatsapp', call: 'a-badge-call' };
  const label = { qr: 'QR Scan', whatsapp: 'WhatsApp', call: 'Phone Call' };
  return <span className={`a-badge ${map[s] || 'a-badge-qr'}`}>{label[s] || 'QR'}</span>;
};

// ── Main Component ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [orders, setOrders]           = useState([]);
  const [waiterCalls, setWaiterCalls] = useState([]);
  const [selected, setSelected]       = useState(null);
  const [search, setSearch]           = useState('');
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, snap => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'waiter_calls'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, snap => {
      setWaiterCalls(
        snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(c => c.status === 'pending')
      );
    });
  }, []);

  const dismissCall = async (id) =>
    await updateDoc(doc(db, 'waiter_calls', id), { status: 'done' });

  const updateStatus = async (orderId, newStatus) => {
    await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
    if (selected?.id === orderId) setSelected(p => ({ ...p, status: newStatus }));
  };

  const pending   = orders.filter(o => getStatus(o.status) === 'pending').length;
  const preparing = orders.filter(o => o.status === 'preparing').length;
  const completed = orders.filter(o => getStatus(o.status) === 'completed').length;
  const revenue   = orders.filter(o => getStatus(o.status) === 'completed').reduce((s, o) => s + (o.total || 0), 0);

  const filtered = orders.filter(o => {
    const t = search.toLowerCase();
    return (
      o.orderId?.toLowerCase().includes(t) ||
      o.customerName?.toLowerCase().includes(t) ||
      o.tableNo?.toString().toLowerCase().includes(t) ||
      o.phone?.includes(t)
    );
  });

  if (loading) {
    return (
      <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'60vh' }}>
        <div style={{ width:'36px', height:'36px', border:'3px solid var(--a-border)', borderTopColor:'var(--a-accent)', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ display:'flex', gap:'1.5rem' }}>
      {/* ────── MAIN CONTENT ────── */}
      <div style={{ flex:1, minWidth:0, paddingRight:'360px' }}>

        {/* ── Top bar ── */}
        <div className="a-page-header" style={{ marginBottom:'1.75rem' }}>
          <div>
            <div style={{ fontSize:'1.4rem', fontWeight:'900', color:'var(--a-text)', letterSpacing:'-0.02em' }}>
              Good day! 👋
            </div>
            <div style={{ fontSize:'0.82rem', color:'var(--a-muted)', marginTop:'0.1rem' }}>
              Here's what's happening in your restaurant right now.
            </div>
          </div>
          <div className="a-search-wrap">
            <Search size={15} />
            <input
              className="a-search"
              placeholder="Search orders or customers…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* ── Waiter Alerts ── */}
        {waiterCalls.length > 0 && (
          <div style={{ marginBottom:'1.5rem' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.65rem' }}>
              <Bell size={14} color="var(--a-orange)" />
              <span style={{ fontSize:'0.78rem', fontWeight:700, color:'var(--a-orange)', textTransform:'uppercase', letterSpacing:'0.05em' }}>
                Waiter Requests ({waiterCalls.length})
              </span>
            </div>
            {waiterCalls.map(call => (
              <div key={call.id} className="waiter-alert">
                <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                  <div style={{ background:'#fde68a', borderRadius:'8px', padding:'0.4rem 0.5rem', display:'flex', alignItems:'center' }}>
                    <Bell size={15} color="#92400e" />
                  </div>
                  <div>
                    <div style={{ fontWeight:700, fontSize:'0.875rem', color:'var(--a-text)' }}>
                      Table {call.tableNo} — {call.request || 'Needs assistance'}
                    </div>
                    <div style={{ fontSize:'0.72rem', color:'var(--a-muted)' }}>
                      {call.createdAt?.toDate ? call.createdAt.toDate().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }) : 'Just now'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => dismissCall(call.id)}
                  style={{ background:'transparent', border:'1.5px solid #fcd34d', color:'#92400e', padding:'0.3rem 0.85rem', borderRadius:'50px', fontSize:'0.72rem', fontWeight:700, cursor:'pointer' }}
                >
                  Dismiss
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ── Stat Cards ── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'1rem', marginBottom:'2rem' }}>
          <div className="a-stat-card" style={{ '--a-card-accent': 'var(--a-blue)' }}>
            <div className="a-stat-icon" style={{ background:'#eff6ff' }}>
              <ShoppingBag size={24} color="var(--a-blue)" strokeWidth={2} />
            </div>
            <div>
              <div className="a-stat-value">{orders.length}</div>
              <div className="a-stat-label">Total Orders</div>
            </div>
          </div>
          <div className="a-stat-card" style={{ '--a-card-accent': 'var(--a-orange)' }}>
            <div className="a-stat-icon" style={{ background:'var(--a-orange-lt)' }}>
              <Clock size={24} color="var(--a-orange)" strokeWidth={2} />
            </div>
            <div>
              <div className="a-stat-value">{pending}</div>
              <div className="a-stat-label">Pending</div>
            </div>
          </div>
          <div className="a-stat-card" style={{ '--a-card-accent': 'var(--a-green)' }}>
            <div className="a-stat-icon" style={{ background:'var(--a-green-lt)' }}>
              <CheckCircle size={24} color="var(--a-green)" strokeWidth={2} />
            </div>
            <div>
              <div className="a-stat-value">{completed}</div>
              <div className="a-stat-label">Completed</div>
            </div>
          </div>
          <div className="a-stat-card" style={{ '--a-card-accent': 'var(--a-accent)' }}>
            <div className="a-stat-icon" style={{ background:'var(--a-accent-lt)' }}>
              <TrendingUp size={24} color="var(--a-accent)" strokeWidth={2} />
            </div>
            <div>
              <div className="a-stat-value" style={{ fontSize:'1.2rem' }}>Rs.{revenue.toLocaleString()}</div>
              <div className="a-stat-label">Revenue</div>
            </div>
          </div>
        </div>

        {/* ── Orders Table ── */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.75rem' }}>
          <div>
            <div className="a-section-title">Live Orders</div>
            <div className="a-section-subtitle">Click a row to see full order details on the right</div>
          </div>
          <div style={{ display:'flex', gap:'0.5rem' }}>
            <span className="a-badge a-badge-pending">{pending} Pending</span>
            <span className="a-badge a-badge-preparing">{preparing} Preparing</span>
          </div>
        </div>

        <div className="a-table-wrap">
          <table className="a-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Order ID</th>
                <th>Table / Location</th>
                <th>Amount</th>
                <th>Source</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div style={{ textAlign:'center', padding:'3rem 1rem', color:'var(--a-muted)' }}>
                      <ShoppingBag size={40} style={{ marginBottom:'0.75rem', opacity:0.3 }} />
                      <p>No orders yet. They'll appear here in real-time.</p>
                    </div>
                  </td>
                </tr>
              ) : filtered.map(order => (
                <tr
                  key={order.id}
                  onClick={() => setSelected(order)}
                  className={selected?.id === order.id ? 'selected' : ''}
                >
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                      <CustomerAvatar name={order.customerName} />
                      <div>
                        <div style={{ fontWeight:600, fontSize:'0.875rem' }}>{order.customerName}</div>
                        <div style={{ fontSize:'0.72rem', color:'var(--a-muted)' }}>{order.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontFamily:'monospace', fontSize:'0.78rem', color:'var(--a-muted)', letterSpacing:'0.03em' }}>
                    {order.orderId}
                  </td>
                  <td>
                    {order.tableNo && order.tableNo !== 'Walk-in'
                      ? <span style={{ background:'var(--a-blue-lt)', color:'var(--a-blue)', padding:'0.2rem 0.6rem', borderRadius:'6px', fontSize:'0.75rem', fontWeight:700 }}>Table {order.tableNo}</span>
                      : <span style={{ color:'var(--a-muted)', fontSize:'0.82rem' }}>{order.city || 'Walk-in'}</span>
                    }
                  </td>
                  <td style={{ fontWeight:700, fontSize:'0.9rem' }}>{fmt(order.total)}</td>
                  <td><SourceBadge src={order.source} /></td>
                  <td><StatusBadge raw={order.status} /></td>
                  <td><ArrowRight size={15} color="var(--a-muted)" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ────── RIGHT PANEL ────── */}
      <aside className="a-right-panel">
        {!selected ? (
          <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'2rem', textAlign:'center', color:'var(--a-muted)' }}>
            <div style={{ width:'64px', height:'64px', background:'var(--a-panel)', borderRadius:'16px', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'1rem' }}>
              <ShoppingBag size={28} color="var(--a-muted)" />
            </div>
            <p style={{ fontWeight:600, color:'var(--a-text)', marginBottom:'0.35rem' }}>No Order Selected</p>
            <p style={{ fontSize:'0.8rem' }}>Click any row from the table to view full order details here.</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="a-panel-header">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                  <div style={{ width:'44px', height:'44px', flexShrink:0 }}>
                    <CustomerAvatar name={selected.customerName} />
                  </div>
                  <div>
                    <div style={{ fontWeight:800, fontSize:'0.95rem', color:'var(--a-text)' }}>{selected.customerName}</div>
                    <div style={{ fontSize:'0.72rem', color:'var(--a-muted)', fontFamily:'monospace' }}>{selected.orderId}</div>
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                  <StatusBadge raw={selected.status} />
                  <button
                    onClick={() => setSelected(null)}
                    style={{ background:'var(--a-panel)', border:'1px solid var(--a-border)', borderRadius:'8px', padding:'0.3rem', display:'flex', cursor:'pointer' }}
                  >
                    <X size={15} color="var(--a-muted)" />
                  </button>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="a-panel-body">
              {/* Info strip */}
              <div style={{ background:'var(--a-panel)', border:'1px solid var(--a-border)', borderRadius:'10px', padding:'0.85rem 1rem', marginBottom:'1.25rem' }}>
                <div className="a-info-row" style={{ marginBottom:'0.4rem' }}>
                  <MapPin size={13} />
                  {selected.tableNo && selected.tableNo !== 'Walk-in'
                    ? `Dine-in — Table ${selected.tableNo}`
                    : `${selected.address}, ${selected.city}`}
                </div>
                <div className="a-info-row" style={{ marginBottom:'0.4rem' }}>
                  <Phone size={13} /> {selected.phone}
                </div>
                <div className="a-info-row" style={{ marginBottom:0 }}>
                  <Clock size={13} />
                  {selected.createdAt?.toDate
                    ? selected.createdAt.toDate().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })
                    : 'Just now'}
                  &nbsp;·&nbsp;
                  <CreditCard size={13} style={{ marginLeft:'0.25rem' }} />
                  {selected.paymentMethod === 'cash' ? 'Cash on Delivery' : 'Online Payment'}
                </div>
              </div>

              {/* Source */}
              <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'1rem' }}>
                <span style={{ fontSize:'0.72rem', color:'var(--a-muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>Via</span>
                <SourceBadge src={selected.source} />
              </div>

              <hr className="a-divider" />

              {/* Items */}
              <div style={{ fontSize:'0.72rem', fontWeight:700, textTransform:'uppercase', color:'var(--a-muted)', marginBottom:'0.75rem', letterSpacing:'0.06em' }}>
                Order Items
              </div>
              {selected.items?.map((item, i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.65rem' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                    <span style={{ background:'var(--a-accent-lt)', color:'var(--a-accent)', borderRadius:'6px', padding:'0.15rem 0.45rem', fontSize:'0.72rem', fontWeight:800 }}>{item.qty}×</span>
                    <span style={{ fontSize:'0.875rem' }}>{item.name}</span>
                  </div>
                  <span style={{ fontWeight:700, fontSize:'0.875rem' }}>{fmt(item.subtotal)}</span>
                </div>
              ))}

              {selected.note && (
                <div style={{ background:'#fffbeb', border:'1.5px solid #fde68a', borderRadius:'8px', padding:'0.6rem 0.85rem', fontSize:'0.8rem', color:'#78350f', marginTop:'0.75rem' }}>
                  <strong>Special Note:</strong> {selected.note}
                </div>
              )}

              <hr className="a-divider" />

              {/* Totals */}
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.82rem', color:'var(--a-muted)', marginBottom:'0.4rem' }}>
                <span>Subtotal</span><span>{fmt(selected.subtotal)}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.82rem', color:'var(--a-muted)', marginBottom:'0.75rem' }}>
                <span>Delivery + Tax</span><span>{fmt((selected.deliveryFee || 0) + (selected.tax || 0))}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', fontWeight:900, fontSize:'1.15rem', letterSpacing:'-0.01em' }}>
                <span>Total</span>
                <span style={{ color:'var(--a-accent)' }}>{fmt(selected.total)}</span>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="a-panel-footer" style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
              {getStatus(selected.status) === 'pending' && (
                <button className="a-btn a-btn-primary" onClick={() => updateStatus(selected.id, 'preparing')}>
                  <ChefHat size={16} /> Start Preparing
                </button>
              )}
              {selected.status === 'preparing' && (
                <button className="a-btn a-btn-success" onClick={() => updateStatus(selected.id, 'completed')}>
                  <CheckCircle size={16} /> Mark as Completed
                </button>
              )}
              {getStatus(selected.status) === 'completed' && (
                <div style={{ textAlign:'center', padding:'0.75rem', background:'var(--a-green-lt)', color:'var(--a-green)', borderRadius:'var(--a-radius-sm)', fontWeight:700, fontSize:'0.875rem' }}>
                  Order successfully completed
                </div>
              )}
              {(getStatus(selected.status) === 'pending' || selected.status === 'preparing') && (
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
