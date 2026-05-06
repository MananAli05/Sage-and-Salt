import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Search, Phone, MapPin, CreditCard, Clock, X, ChefHat, CheckCircle, XCircle, Bell } from 'lucide-react';
import './admin.css';

const fmt = (n) => `Rs. ${Number(n || 0).toLocaleString()}`;

// ── Gender detection ─────────────────────────────────────────────────────────
const FEMALE = new Set(['ayesha','fatima','sara','sarah','amna','sana','hira','maria','nida','zara','noor','maryam','rabia','iqra','zainab','kiran','aisha','mehwish','uzma','farah','saima','sobia','nadia','asma','maham','layla','aliza','nimra','sehar','anum','maha','huma','fizza','fozia','sadia','bushra']);
const MALE_EX = new Set(['ali','musa','isa','yahya','mustafa','taha','raza','mirza','hamza','usman','salman']);
function gender(name = '') {
  const f = name.toLowerCase().split(' ')[0];
  if (FEMALE.has(f)) return 'female';
  if ((f.endsWith('a') || f.endsWith('ah')) && !MALE_EX.has(f)) return 'female';
  return 'male';
}

// ── SVG Avatars ──────────────────────────────────────────────────────────────
const Male = () => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" fill="#dbeafe"/>
    <ellipse cx="50" cy="86" rx="28" ry="17" fill="#3b82f6"/>
    <path d="M38 69 L50 81 L62 69" fill="none" stroke="#fff" strokeWidth="3"/>
    <circle cx="50" cy="42" r="21" fill="#fcd9a8"/>
    <path d="M29 39 Q30 21 50 19 Q70 21 71 39 Q68 25 50 23 Q32 25 29 39Z" fill="#4b3728"/>
    <circle cx="43" cy="42" r="2.5" fill="#2d1b0e"/>
    <circle cx="57" cy="42" r="2.5" fill="#2d1b0e"/>
    <path d="M43 51 Q50 57 57 51" fill="none" stroke="#b8722d" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);
const Female = () => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" fill="#fce7f3"/>
    <ellipse cx="50" cy="86" rx="28" ry="17" fill="#ec4899"/>
    <path d="M29 43 Q28 19 50 17 Q72 19 71 43 Q68 23 50 21 Q32 23 29 43Z" fill="#7c2d12"/>
    <path d="M29 43 Q24 59 50 63 Q76 59 71 43" fill="#9a3412" opacity="0.7"/>
    <circle cx="50" cy="42" r="21" fill="#fcd9a8"/>
    <circle cx="43" cy="42" r="2.5" fill="#2d1b0e"/>
    <circle cx="57" cy="42" r="2.5" fill="#2d1b0e"/>
    <path d="M41 39.5 L40 37 M43 39 L43 37 M45 39.5 L46 37" stroke="#2d1b0e" strokeWidth="1" strokeLinecap="round"/>
    <path d="M55 39.5 L54 37 M57 39 L57 37 M59 39.5 L60 37" stroke="#2d1b0e" strokeWidth="1" strokeLinecap="round"/>
    <path d="M43 51 Q50 57 57 51" fill="none" stroke="#b8722d" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);
const Avatar = ({ name }) => (
  <div className="a-avatar">{gender(name) === 'female' ? <Female /> : <Male />}</div>
);

// ── Stat SVG Illustrations ───────────────────────────────────────────────────
const BagSVG = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#e07a2c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
  </svg>
);
const ClockSVG = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const CheckSVG = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);
const TrendSVG = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#e07a2c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
  </svg>
);
const BellSVG = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
  </svg>
);

// ── Status helpers ────────────────────────────────────────────────────────────
function getStatus(raw) {
  if (!raw || raw === 'new' || raw === 'pending') return 'pending';
  if (['ready','delivered','completed'].includes(raw)) return 'completed';
  return raw;
}
const StatusBadge = ({ raw }) => {
  const s = getStatus(raw);
  const cls = { pending:'a-badge-pending', preparing:'a-badge-preparing', completed:'a-badge-completed', cancelled:'a-badge-cancelled' };
  const lbl = { pending:'Pending', preparing:'Preparing', completed:'Completed', cancelled:'Cancelled' };
  return <span className={`a-badge ${cls[s]||''}`}>{lbl[s]||s}</span>;
};
const SourceBadge = ({ src }) => {
  const s = (src||'qr').toLowerCase();
  const cls = { qr:'a-badge-qr', whatsapp:'a-badge-whatsapp', call:'a-badge-call' };
  const lbl = { qr:'QR Scan', whatsapp:'WhatsApp', call:'Call' };
  return <span className={`a-badge ${cls[s]||'a-badge-qr'}`}>{lbl[s]||'QR'}</span>;
};

export default function AdminDashboard() {
  const [orders, setOrders]     = useState([]);
  const [calls, setCalls]       = useState([]);
  const [selected, setSelected] = useState(null);
  const [search, setSearch]     = useState('');
  const [loading, setLoading]   = useState(true);

  useEffect(() => onSnapshot(query(collection(db,'orders'), orderBy('createdAt','desc')), snap => {
    setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoading(false);
  }), []);

  useEffect(() => onSnapshot(query(collection(db,'waiter_calls'), orderBy('createdAt','desc')), snap => {
    setCalls(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(c => c.status === 'pending'));
  }), []);

  const dismiss = id => updateDoc(doc(db,'waiter_calls',id), { status:'done' });
  const setStatus = (orderId, st) => {
    updateDoc(doc(db,'orders',orderId), { status: st });
    if (selected?.id === orderId) setSelected(p => ({ ...p, status: st }));
  };

  const pending   = orders.filter(o => getStatus(o.status) === 'pending').length;
  const preparing = orders.filter(o => o.status === 'preparing').length;
  const completed = orders.filter(o => getStatus(o.status) === 'completed').length;
  const revenue   = orders.filter(o => getStatus(o.status) === 'completed').reduce((s,o) => s+(o.total||0), 0);

  const filtered = orders.filter(o => {
    const t = search.toLowerCase();
    return o.orderId?.toLowerCase().includes(t) || o.customerName?.toLowerCase().includes(t) || o.phone?.includes(t);
  });

  if (loading) return (
    <div style={{ display:'flex',justifyContent:'center',alignItems:'center',height:'60vh' }}>
      <div style={{ width:'36px',height:'36px',border:'3px solid #ecddd1',borderTopColor:'#e07a2c',borderRadius:'50%',animation:'spin 0.8s linear infinite' }} />
    </div>
  );

  return (
    <div style={{ display:'flex', gap:'1.5rem' }}>
      {/* MAIN */}
      <div style={{ flex:1, minWidth:0, paddingRight:'360px' }}>

        {/* Top bar */}
        <div className="a-page-header">
          <div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.5rem', fontWeight:700, color:'var(--a-accent)' }}>Dashboard</div>
            <div style={{ fontSize:'0.82rem', color:'var(--a-muted)', marginTop:'0.1rem' }}>Live overview of your restaurant today</div>
          </div>
          <div className="a-search-wrap">
            <Search size={14} />
            <input className="a-search" placeholder="Search orders…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {/* Waiter alerts */}
        {calls.length > 0 && (
          <div style={{ marginBottom:'1.5rem' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.65rem' }}>
              <BellSVG /><span style={{ fontSize:'0.75rem', fontWeight:800, color:'#92400e', textTransform:'uppercase', letterSpacing:'0.06em' }}>Waiter Requests ({calls.length})</span>
            </div>
            {calls.map(c => (
              <div key={c.id} className="waiter-alert">
                <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                  <div style={{ background:'#fde68a', borderRadius:'8px', padding:'0.4rem 0.5rem', display:'flex' }}><BellSVG /></div>
                  <div>
                    <div style={{ fontWeight:700, fontSize:'0.875rem', color:'var(--a-text)' }}>Table {c.tableNo} — {c.request || 'Needs assistance'}</div>
                    <div style={{ fontSize:'0.72rem', color:'var(--a-muted)' }}>{c.createdAt?.toDate ? c.createdAt.toDate().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}) : 'Just now'}</div>
                  </div>
                </div>
                <button onClick={() => dismiss(c.id)} style={{ background:'transparent', border:'1.5px solid #fcd34d', color:'#92400e', padding:'0.3rem 0.85rem', borderRadius:'6px', fontSize:'0.72rem', fontWeight:700, cursor:'pointer' }}>Dismiss</button>
              </div>
            ))}
          </div>
        )}

        {/* Stat cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(185px, 1fr))', gap:'1rem', marginBottom:'2rem' }}>
          {[
            { icon:<BagSVG />,   bg:'#fff7ed', val:orders.length, lbl:'Total Orders' },
            { icon:<ClockSVG />, bg:'#fffbeb', val:pending,       lbl:'Pending' },
            { icon:<CheckSVG />, bg:'#ecfdf5', val:completed,     lbl:'Completed' },
            { icon:<TrendSVG />, bg:'#fff7ed', val:`Rs.${revenue.toLocaleString()}`, lbl:'Revenue', sm:true },
          ].map(({ icon, bg, val, lbl, sm }) => (
            <div key={lbl} className="a-stat-card">
              <div className="a-stat-icon" style={{ background:bg }}>{icon}</div>
              <div>
                <div className="a-stat-value" style={{ fontSize: sm?'1.2rem':undefined }}>{val}</div>
                <div className="a-stat-label">{lbl}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.75rem' }}>
          <div>
            <div className="a-section-title">Live Orders</div>
            <div className="a-section-subtitle">Click a row to view full details</div>
          </div>
          <div style={{ display:'flex', gap:'0.5rem' }}>
            <span className="a-badge a-badge-pending">{pending} Pending</span>
            <span className="a-badge a-badge-preparing">{preparing} Preparing</span>
          </div>
        </div>

        <div className="a-table-wrap">
          <table className="a-table">
            <thead><tr>
              <th>Customer</th><th>Order ID</th><th>Table / City</th>
              <th>Amount</th><th>Source</th><th>Status</th>
            </tr></thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign:'center', padding:'3rem', color:'var(--a-muted)' }}>No orders yet — they appear here in real-time.</td></tr>
              ) : filtered.map(o => (
                <tr key={o.id} onClick={() => setSelected(o)} className={selected?.id===o.id?'selected':''}>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                      <Avatar name={o.customerName} />
                      <div>
                        <div style={{ fontWeight:600 }}>{o.customerName}</div>
                        <div style={{ fontSize:'0.72rem', color:'var(--a-muted)' }}>{o.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontFamily:'monospace', fontSize:'0.78rem', color:'var(--a-muted)' }}>{o.orderId}</td>
                  <td>
                    {o.tableNo && o.tableNo!=='Walk-in'
                      ? <span style={{ background:'#eff6ff', color:'#2563eb', padding:'0.2rem 0.6rem', borderRadius:'6px', fontSize:'0.75rem', fontWeight:700 }}>Table {o.tableNo}</span>
                      : <span style={{ color:'var(--a-muted)', fontSize:'0.82rem' }}>{o.city||'Walk-in'}</span>}
                  </td>
                  <td style={{ fontWeight:700 }}>{fmt(o.total)}</td>
                  <td><SourceBadge src={o.source} /></td>
                  <td><StatusBadge raw={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <aside className="a-right-panel">
        {!selected ? (
          <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'2rem', textAlign:'center', color:'var(--a-muted)' }}>
            <div style={{ width:'64px', height:'64px', background:'var(--a-panel)', borderRadius:'16px', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'1rem' }}>
              <BagSVG />
            </div>
            <p style={{ fontWeight:600, color:'var(--a-text)', marginBottom:'0.35rem' }}>No Order Selected</p>
            <p style={{ fontSize:'0.8rem' }}>Click any row to view full details here.</p>
          </div>
        ) : (
          <>
            <div className="a-panel-header">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                  <div style={{ width:'44px', height:'44px' }}><Avatar name={selected.customerName} /></div>
                  <div>
                    <div style={{ fontWeight:800, fontSize:'0.95rem', color:'var(--a-text)' }}>{selected.customerName}</div>
                    <div style={{ fontSize:'0.72rem', color:'var(--a-muted)', fontFamily:'monospace' }}>{selected.orderId}</div>
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                  <StatusBadge raw={selected.status} />
                  <button onClick={() => setSelected(null)} style={{ background:'var(--a-panel)', border:'1px solid var(--a-border-solid)', borderRadius:'8px', padding:'0.3rem', display:'flex', cursor:'pointer' }}>
                    <X size={15} color="var(--a-muted)" />
                  </button>
                </div>
              </div>
            </div>

            <div className="a-panel-body">
              <div style={{ background:'var(--a-panel)', border:'1px solid var(--a-border-solid)', borderRadius:'10px', padding:'0.85rem 1rem', marginBottom:'1.25rem' }}>
                <div className="a-info-row"><MapPin size={13} />{selected.tableNo&&selected.tableNo!=='Walk-in' ? `Dine-in — Table ${selected.tableNo}` : `${selected.address}, ${selected.city}`}</div>
                <div className="a-info-row"><Phone size={13} />{selected.phone}</div>
                <div className="a-info-row" style={{ marginBottom:0 }}>
                  <Clock size={13} />{selected.createdAt?.toDate ? selected.createdAt.toDate().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}) : 'Just now'}
                  &nbsp;·&nbsp;<CreditCard size={13} />{selected.paymentMethod==='cash'?'Cash on Delivery':'Online Payment'}
                </div>
              </div>

              <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'1rem' }}>
                <span style={{ fontSize:'0.72rem', color:'var(--a-muted)', fontWeight:600, textTransform:'uppercase' }}>Via</span>
                <SourceBadge src={selected.source} />
              </div>

              <hr className="a-divider" />
              <div style={{ fontSize:'0.72rem', fontWeight:800, textTransform:'uppercase', color:'var(--a-muted)', marginBottom:'0.75rem', letterSpacing:'0.06em' }}>Order Items</div>

              {selected.items?.map((item, i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.65rem' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                    <span style={{ background:'var(--a-accent-lt)', color:'var(--a-accent)', borderRadius:'6px', padding:'0.15rem 0.45rem', fontSize:'0.72rem', fontWeight:800 }}>{item.qty}×</span>
                    <span style={{ fontSize:'0.875rem' }}>{item.name}</span>
                  </div>
                  <span style={{ fontWeight:700 }}>{fmt(item.subtotal)}</span>
                </div>
              ))}

              {selected.note && (
                <div style={{ background:'#fffbeb', border:'1.5px solid #fde68a', borderRadius:'8px', padding:'0.6rem 0.85rem', fontSize:'0.8rem', color:'#78350f', marginTop:'0.75rem' }}>
                  <strong>Note:</strong> {selected.note}
                </div>
              )}

              <hr className="a-divider" />
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.82rem', color:'var(--a-muted)', marginBottom:'0.4rem' }}><span>Subtotal</span><span>{fmt(selected.subtotal)}</span></div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.82rem', color:'var(--a-muted)', marginBottom:'0.75rem' }}><span>Delivery + Tax</span><span>{fmt((selected.deliveryFee||0)+(selected.tax||0))}</span></div>
              <div style={{ display:'flex', justifyContent:'space-between', fontWeight:900, fontSize:'1.15rem' }}>
                <span>Total</span><span style={{ color:'var(--a-accent)' }}>{fmt(selected.total)}</span>
              </div>
            </div>

            <div className="a-panel-footer" style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
              {getStatus(selected.status)==='pending' && <button className="a-btn a-btn-primary" onClick={() => setStatus(selected.id,'preparing')}><ChefHat size={16} /> Start Preparing</button>}
              {selected.status==='preparing' && <button className="a-btn a-btn-success" onClick={() => setStatus(selected.id,'completed')}><CheckCircle size={16} /> Mark Completed</button>}
              {getStatus(selected.status)==='completed' && <div style={{ textAlign:'center', padding:'0.75rem', background:'var(--a-completed-lt)', color:'var(--a-completed)', borderRadius:'10px', fontWeight:700, fontSize:'0.875rem' }}>Order completed successfully</div>}
              {['pending','preparing'].includes(getStatus(selected.status)) && <button className="a-btn a-btn-danger" onClick={() => setStatus(selected.id,'cancelled')}><XCircle size={16} /> Cancel Order</button>}
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
