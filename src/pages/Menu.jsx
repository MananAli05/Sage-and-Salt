import { useState, useEffect } from 'react';
import '../index.css';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// ─── Waiter Call Helper ────────────────────────────────────────────────────────
async function sendWaiterRequest(tableNo, request) {
  await addDoc(collection(db, 'waiter_calls'), {
    tableNo,
    request,   // e.g. "Water Bottle"
    status: 'pending',
    createdAt: serverTimestamp(),
  });
}

// ─── SVG Icons ─────────────────────────────────────────────────────────────
const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

const BellIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

// ─── Waiter Request Modal ─────────────────────────────────────────────────────
const WAITER_OPTIONS = [
  { id: 'water',   label: 'Water Bottle',     },
  { id: 'tissue',  label: 'Tissues / Napkins',  },
  { id: 'cutlery', label: 'Extra Cutlery',    },
  { id: 'sauce',   label: 'Extra Sauce',      },
  { id: 'bill',    label: 'Request Bill',     },
];

function WaiterModal({ tableNo, onClose }) {
  const [sent, setSent] = useState(null);   // which option was sent
  const [loading, setLoading] = useState(false);

  const handleRequest = async (option) => {
    if (loading || sent) return;
    setLoading(true);
    try {
      await sendWaiterRequest(tableNo, option.label);
      setSent(option);
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="order-modal" style={{ maxWidth: '400px', padding: '0' }}>
        {/* Header */}
        <div className="modal-header" style={{ padding: '1.5rem 1.5rem 1rem' }}>
          <div>
            <h2 className="modal-title">Need Assistance?</h2>
            <p className="modal-subtitle">Select what you need and a waiter will come to your table.</p>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Options */}
        <div style={{ padding: '0 1.5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {!sent ? WAITER_OPTIONS.map(opt => (
            <button
              key={opt.id}
              onClick={() => handleRequest(opt)}
              disabled={loading}
              style={{
                display: 'flex', alignItems: 'center', gap: '1rem',
                padding: '0.9rem 1.25rem', borderRadius: '12px',
                border: '1px solid var(--border)', background: 'var(--surface)',
                color: 'var(--text)', cursor: 'pointer', textAlign: 'left',
                fontWeight: 600, fontSize: '0.95rem', transition: 'all 0.2s',
                opacity: loading ? 0.6 : 1
              }}
              onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'rgba(232,70,30,0.06)'; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface)'; }}
            >
              <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>{opt.icon}</span>
              <span>{opt.label}</span>
            </button>
          )) : (
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--text)' }}>Request Sent!</div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>A waiter has been notified for: <strong>{sent.label}</strong></p>
              <button className="submit-btn" onClick={onClose} style={{ marginTop: '1.5rem' }}>Done</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Menu Data ────────────────────────────────────────────────────────────────
const MENU_ITEMS = [
  { id: 1, name: 'Sage Smash Burger', category: 'Burgers', price: 1350, desc: 'Double smash patty, aged cheddar, caramelized onion, secret sage sauce', img: '/food-burger.png', badge: 'popular', rating: 4.9 },
  { id: 2, name: 'Truffle Fettuccine', category: 'Pasta', price: 1650, desc: 'Black truffle cream, parmesan, fresh herbs, silky egg pasta', img: '/food-pasta.png', badge: 'chef', rating: 4.8 },
  { id: 3, name: 'Margherita Rustica', category: 'Pizza', price: 1450, desc: 'San Marzano tomatoes, fresh mozzarella di bufala, basil from the garden', img: '/food-pizza.png', badge: null, rating: 4.7 },
  { id: 4, name: 'Herb Grilled Chicken', category: 'Mains', price: 1550, desc: 'Rosemary-marinated airline chicken, roasted seasonal vegetables, jus', img: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c3?w=600&q=80', badge: 'spicy', rating: 4.6 },
  { id: 5, name: 'Caesar Supreme', category: 'Salads', price: 850, desc: 'Romaine hearts, house Caesar, crispy pancetta, parmesan tuiles', img: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=600&q=80', badge: null, rating: 4.5 },
  { id: 6, name: 'BBQ Crispy Wings', category: 'Starters', price: 1100, desc: 'Double-fried chicken wings, honey-chipotle glaze, cooling ranch dip', img: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=600&q=80', badge: 'spicy', rating: 4.8 },
  { id: 7, name: 'Mushroom Risotto', category: 'Mains', price: 1400, desc: 'Arborio rice, wild porcini, mascarpone, aged parmesan, truffle oil', img: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=600&q=80', badge: null, rating: 4.7 },
  { id: 8, name: 'Pepperoni Feast', category: 'Pizza', price: 1600, desc: 'Cupped pepperoni, fresh mozzarella, roasted garlic oil, chilli honey', img: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600&q=80', badge: 'popular', rating: 4.9 },
  { id: 9, name: 'Lava Chocolate Cake', category: 'Desserts', price: 750, desc: 'Warm dark chocolate fondant, vanilla bean ice cream, berry coulis', img: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&q=80', badge: null, rating: 4.9 },
  { id: 10, name: 'Crispy Calamari', category: 'Starters', price: 950, desc: 'Lightly battered squid rings, lemon aioli, fresh herbs', img: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=600&q=80', badge: null, rating: 4.4 },
  { id: 11, name: 'Spinach Fettuccine', category: 'Pasta', price: 1300, desc: 'Spinach pasta, sundried tomatoes, olives, basil pesto, pine nuts', img: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=600&q=80', badge: null, rating: 4.5 },
  { id: 12, name: 'Tiramisu Classico', category: 'Desserts', price: 700, desc: 'Espresso-soaked savoiardi, mascarpone cream, premium cocoa', img: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&q=80', badge: 'chef', rating: 4.8 },
];

const CATEGORIES = ['All', 'Starters', 'Burgers', 'Pizza', 'Pasta', 'Mains', 'Salads', 'Desserts'];
const CAT_ICONS  = { All:'', Starters:'', Burgers:'', Pizza:'', Pasta:'', Mains:'', Salads:'', Desserts:'' };
const DELIVERY_FEE = 150;
const TAX_RATE = 0.08;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => `Rs. ${n.toLocaleString()}`;
const genOrderId = () => 'SS-' + Math.random().toString(36).slice(2,8).toUpperCase();

// ─── MenuCard ─────────────────────────────────────────────────────────────────
function MenuCard({ item, onAdd, qty, onInc, onDec }) {
  const badgeLabel = { popular:' Popular', spicy:' Spicy', chef:' Chef\'s Pick' };
  return (
    <div className="menu-card">
      <div className="card-img-wrap">
        <img src={item.img} alt={item.name} className="card-img" loading="lazy"
          onError={e => { e.target.src='https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80'; }} />
        {item.badge && <span className={`card-badge ${item.badge}`}>{badgeLabel[item.badge]}</span>}
      </div>
      <div className="card-body">
        <div className="card-name">{item.name}</div>
        <div className="card-desc">{item.desc}</div>
        <div className="card-footer">
          <div className="card-price">{fmt(item.price)}</div>
          {qty > 0 ? (
            <div className="qty-ctrl">
              <button className="qty-btn" onClick={() => onDec(item.id)} aria-label="Decrease">−</button>
              <span className="qty-num">{qty}</span>
              <button className="qty-btn" onClick={() => onInc(item.id)} aria-label="Increase">+</button>
            </div>
          ) : (
            <button className="add-btn" onClick={() => onAdd(item)} aria-label={`Add ${item.name}`}>
              <span></span> Add
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── CartDrawer ───────────────────────────────────────────────────────────────
function CartDrawer({ cart, onClose, onInc, onDec, onRemove, onCheckout }) {
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const tax = Math.round(subtotal * TAX_RATE);
  const total = subtotal + DELIVERY_FEE + tax;

  return (
    <>
      <div className="cart-overlay" onClick={onClose} />
      <aside className="cart-drawer" role="dialog" aria-label="Your Cart">
        <div className="cart-header">
          <div>
            <h2 className="cart-title">Your Order </h2>
            <p style={{fontSize:'0.8rem', color:'var(--text-muted)', marginTop:'0.2rem'}}>{cart.length} item{cart.length !== 1 ? 's' : ''}</p>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close cart">✕</button>
        </div>

        <div className="cart-items">
          {cart.length === 0 ? (
            <div className="cart-empty">
              <div className="cart-empty-icon"></div>
              <p>Your cart Is Empty</p>
              <p style={{fontSize:'0.82rem'}}>Add Delicious Items From Our Menu</p>
            </div>
          ) : cart.map(item => (
            <div className="cart-item" key={item.id}>
              <img src={item.img} alt={item.name} className="cart-item-img"
                onError={e => { e.target.src='https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&q=70'; }} />
              <div className="cart-item-info">
                <div className="cart-item-name">{item.name}</div>
                <div className="cart-item-price">{fmt(item.price)} × {item.qty} = {fmt(item.price * item.qty)}</div>
                <div className="qty-ctrl" style={{marginTop:'0.5rem', width:'fit-content'}}>
                  <button className="qty-btn" onClick={() => onDec(item.id)}>−</button>
                  <span className="qty-num">{item.qty}</span>
                  <button className="qty-btn" onClick={() => onInc(item.id)}>+</button>
                </div>
              </div>
              <button className="remove-btn" onClick={() => onRemove(item.id)} aria-label="Remove item"><TrashIcon /></button>
            </div>
          ))}
        </div>

        {cart.length > 0 && (
          <div className="cart-footer">
            <div className="cart-totals">
              <div className="cart-row"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
              <div className="cart-row"><span>Delivery</span><span>{fmt(DELIVERY_FEE)}</span></div>
              <div className="cart-row"><span>Tax (8%)</span><span>{fmt(tax)}</span></div>
              <div className="cart-row total"><span>Total</span><span>{fmt(total)}</span></div>
            </div>
            <button className="checkout-btn" onClick={onCheckout}>Proceed To Checkout</button>
          </div>
        )}
      </aside>
    </>
  );
}

// ─── OrderModal ───────────────────────────────────────────────────────────────
function OrderModal({ cart, onClose, onOrderPlaced }) {
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const tax = Math.round(subtotal * TAX_RATE);
  const total = subtotal + DELIVERY_FEE + tax;

  const [form, setForm] = useState({ name:'', phone:'', address:'', city:'', note:'' });
  const [payment, setPayment] = useState('cash');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name Is Required';
    if (!/^03\d{9}$/.test(form.phone)) e.phone = 'Enter Valid Pakistani Number (03XXXXXXXXX)';
    if (!form.address.trim()) e.address = 'Address Is Required';
    if (!form.city.trim()) e.city = 'City Is Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    // Read table number from QR URL e.g. ?table=3
    const tableNo = new URLSearchParams(window.location.search).get('table') || 'Walk-in';
    const orderId = genOrderId();

    try {
      // Create a timeout promise to catch Firebase hanging (e.g. missing Vercel env vars)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Connection timeout. Check Firebase config in Vercel.")), 10000)
      );

      const orderPromise = addDoc(collection(db, 'orders'), {
        orderId,
        customerName:  form.name,
        phone:         form.phone,
        address:       form.address,
        city:          form.city,
        note:          form.note,
        paymentMethod: payment,
        items: cart.map(i => ({
          id:       i.id,
          name:     i.name,
          price:    i.price,
          qty:      i.qty,
          subtotal: i.price * i.qty,
        })),
        subtotal,
        tax,
        deliveryFee: DELIVERY_FEE,
        total,
        tableNo,
        source:    'qr',        // qr | whatsapp | call
        status:    'new',       // new → preparing → ready → delivered
        createdAt: serverTimestamp(),
      });

      // Race the actual upload against the timeout
      await Promise.race([orderPromise, timeoutPromise]);

      setLoading(false);
      onOrderPlaced({ ...form, payment, total, orderId, items: cart });

    } catch (err) {
      console.error('Order failed:', err);
      setLoading(false);
      alert(`Order failed: ${err.message}. If you are on Vercel, make sure you added the Firebase Environment Variables in your Vercel Project Settings!`);
    }
  };

  const set = (k) => (e) => { setForm(p => ({ ...p, [k]: e.target.value })); if (errors[k]) setErrors(p => ({ ...p, [k]: '' })); };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="order-modal">
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Complete Order</h2>
            <p className="modal-subtitle">Fill in your details to place the order</p>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Order Summary */}
        <div className="order-summary">
          <div className="order-summary-title">Order Summary</div>
          {cart.map(i => (
            <div className="summary-item" key={i.id}>
              <span>{i.name} × {i.qty}</span>
              <span>{fmt(i.price * i.qty)}</span>
            </div>
          ))}
          <div className="summary-item"><span>Delivery</span><span>{fmt(DELIVERY_FEE)}</span></div>
          <div className="summary-item"><span>Tax</span><span>{fmt(tax)}</span></div>
          <div className="summary-total"><span>Total Payable</span><span>{fmt(total)}</span></div>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* Personal Info */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="inp-name">Full Name</label>
              <input id="inp-name" className="form-input" placeholder="Abdul Manan" value={form.name} onChange={set('name')} />
              {errors.name && <span style={{color:'#e84545', fontSize:'0.78rem'}}>{errors.name}</span>}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="inp-phone">Phone Number</label>
              <input id="inp-phone" className="form-input" placeholder="0303xxxxxxx" value={form.phone} onChange={set('phone')} maxLength={11} />
              {errors.phone && <span style={{color:'#e84545', fontSize:'0.78rem'}}>{errors.phone}</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="inp-address">Delivery Address</label>
            <input id="inp-address" className="form-input" placeholder="House #, Street, Area" value={form.address} onChange={set('address')} />
            {errors.address && <span style={{color:'#e84545', fontSize:'0.78rem'}}>{errors.address}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="inp-city">City</label>
              <input id="inp-city" className="form-input" placeholder="Lahore" value={form.city} onChange={set('city')} />
              {errors.city && <span style={{color:'#e84545', fontSize:'0.78rem'}}>{errors.city}</span>}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="inp-note">Special Note</label>
              <input id="inp-note" className="form-input" placeholder="Extra spicy, no onions…" value={form.note} onChange={set('note')} />
            </div>
          </div>

          {/* Payment */}
          <div className="form-group">
            <label className="form-label">Payment Method</label>
            <div className="payment-opts">
              <div className={`pay-opt ${payment === 'cash' ? 'selected' : ''}`} onClick={() => setPayment('cash')} role="button" tabIndex={0} aria-pressed={payment === 'cash'}>
                <span className="pay-icon"></span>
                <div><div className="pay-name">Cash on Delivery</div><div className="pay-desc">Pay when delivered</div></div>
              </div>
              <div className={`pay-opt ${payment === 'online' ? 'selected' : ''}`} onClick={() => setPayment('online')} role="button" tabIndex={0} aria-pressed={payment === 'online'}>
                <span className="pay-icon"></span>
                <div><div className="pay-name">Online Payment</div><div className="pay-desc">JazzCash / EasyPaisa</div></div>
              </div>
            </div>
          </div>

          <button type="submit" className="submit-btn" id="place-order-btn" disabled={loading}>
            {loading ? <><span className="spinner" /> Processing…</> : <> Place Order · {fmt(total)}</>}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── SuccessModal ─────────────────────────────────────────────────────────────
function SuccessModal({ order, onClose }) {
  const [elapsed, setElapsed] = useState(0);
  const ETA_MINS = 20;

  useEffect(() => {
    const interval = setInterval(() => setElapsed(s => s + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  const minsLeft = Math.max(ETA_MINS - elapsed, 1);

  return (
    <div className="modal-overlay">
      <div className="order-modal" style={{maxWidth:'480px'}}>
        <div className="success-screen">
          <div className="success-icon"></div>
          <h2 className="success-title">Order Confirmed!</h2>
          <p style={{ fontSize:'0.75rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-muted)', marginTop:'0.35rem' }}>Order ID</p>
          <p className="order-id">{order.orderId}</p>

          {/* ETA Banner */}
          <div style={{
            background:'var(--accent)', borderRadius:'12px',
            padding:'0.85rem 1.25rem', margin:'1rem 0', color:'#fff',
            display:'flex', alignItems:'center', justifyContent:'space-between'
          }}>
            <span style={{fontSize:'0.9rem', fontWeight:600}}>Estimated Time</span>
            <span style={{fontSize:'1.4rem', fontWeight:800}}>{minsLeft} mins</span>
          </div>

          {/* Ordered Items */}
          <div style={{width:'100%', textAlign:'left', margin:'0.5rem 0'}}>
            <p style={{fontSize:'0.8rem', fontWeight:700, textTransform:'uppercase',
              letterSpacing:'0.05em', color:'var(--text-muted)', marginBottom:'0.5rem'}}>Your Order</p>
            {order.items.map((item, i) => (
              <div key={i} style={{
                display:'flex', justifyContent:'space-between',
                padding:'0.5rem 0', borderBottom:'1px solid var(--border)',
                fontSize:'0.9rem'
              }}>
                <span>{item.name} <span style={{color:'var(--text-muted)'}}>×{item.qty}</span></span>
                <span style={{fontWeight:600}}>{fmt(item.price * item.qty)}</span>
              </div>
            ))}
            <div style={{
              display:'flex', justifyContent:'space-between',
              padding:'0.75rem 0 0', fontWeight:800, fontSize:'1rem', color:'var(--accent)'
            }}>
              <span>Total Paid</span>
              <span>{fmt(order.total)}</span>
            </div>
          </div>

          <p className="success-msg" style={{marginTop:'0.75rem', fontSize:'0.82rem'}}>
            Thank you, <strong>{order.name}</strong>! Sit Back And Relax Your Food Is Being Prepared.
          </p>
          <button className="submit-btn" onClick={onClose} style={{marginTop:'1.25rem'}}>
            Back to Menu
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [orderOpen, setOrderOpen] = useState(false);
  const [successOrder, setSuccessOrder] = useState(null);
  const [heroBgLoaded, setHeroBgLoaded] = useState(false);
  const [waiterCalling, setWaiterCalling] = useState(false);
  const [waiterCalled, setWaiterCalled] = useState(false);
  const [waiterModalOpen, setWaiterModalOpen] = useState(false);

  const tableNo = new URLSearchParams(window.location.search).get('table') || null;

  const handleCallWaiter = () => {
    setWaiterModalOpen(true);
  };

  // preload hero
  useEffect(() => {
    const img = new Image();
    img.src = '/hero-food.png';
    img.onload = () => setHeroBgLoaded(true);
  }, []);

  // Filtered menu
  const filtered = MENU_ITEMS.filter(item => {
    const matchCat = activeCategory === 'All' || item.category === activeCategory;
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
                        item.desc.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  // Cart helpers
  const getQty = (id) => cart.find(i => i.id === id)?.qty || 0;
  const addToCart = (item) => setCart(p => [...p, { ...item, qty: 1 }]);
  const incQty = (id) => setCart(p => p.map(i => i.id === id ? { ...i, qty: i.qty + 1 } : i));
  const decQty = (id) => setCart(p => { const updated = p.map(i => i.id === id ? { ...i, qty: i.qty - 1 } : i); return updated.filter(i => i.qty > 0); });
  const removeItem = (id) => setCart(p => p.filter(i => i.id !== id));
  const totalItems = cart.reduce((s, i) => s + i.qty, 0);

  const handleOrderPlaced = (order) => {
    setOrderOpen(false);
    setCartOpen(false);
    setSuccessOrder(order);
    setCart([]);
  };

  return (
    <>
      {/* Navbar */}
      <nav className="navbar">
        <a className="navbar-brand" href="#" aria-label="Sage & Salt Home">
          <img src="/logo.png" alt="Sage & Salt logo" className="navbar-logo" />
          <div>
            <div className="navbar-name">Sage &amp; Salt</div>
            <div className="navbar-tagline">Artisan Restaurant</div>
          </div>
        </a>
        <div style={{display:'flex', alignItems:'center', gap:'0.75rem'}}>
          {/* Waiter Call Button — only show if customer arrived via QR (has table number) */}
          {tableNo && (
            <button
              onClick={handleCallWaiter}
              style={{
                display:'flex', alignItems:'center', gap:'0.5rem',
                padding:'0.55rem 1rem', borderRadius:'50px', fontWeight:700,
                fontSize:'0.85rem', border:'none', cursor:'pointer',
                background:'var(--accent)', color:'#fff', transition:'all 0.3s ease',
                boxShadow:'0 4px 15px rgba(232,69,69,0.35)'
              }}
              aria-label="Call waiter"
            >
              Call Waiter
            </button>
          )}
          <button className="cart-btn" id="cart-toggle-btn" onClick={() => setCartOpen(true)} aria-label={`Open cart, ${totalItems} items`}>
             Cart
            {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero" aria-label="Welcome to Sage and Salt">
        <div className={`hero-bg${heroBgLoaded ? ' loaded' : ''}`} />
        <div className="hero-overlay" />
        <div className="hero-content">
          <h1 className="hero-title">
            Crafted with <em>Passion</em>,<br />Served with <em>Soul</em>
          </h1>
          <p className="hero-desc">
            Every dish at Sage &amp; Salt is a story hand-picked ingredients, time-honored recipes and a touch of modern artistry on your plate.
          </p>
          <div className="hero-actions">
            <button className="btn-primary" onClick={() => document.getElementById('menu-section').scrollIntoView({ behavior:'smooth' })}>
              Explore Menu
            </button>
            <button className="btn-outline" onClick={() => { document.getElementById('menu-section').scrollIntoView({ behavior:'smooth' }); }}>
              View Specials
            </button>
          </div>
        </div><br></br>
      </section>

      {/* Menu */}
      <main className="menu-section" id="menu-section">
        <div className="section-header">
          <div className="section-label">Our Menu</div>
          <h2 className="section-title">Discover <em>Delicious</em> Flavors</h2>
        </div>

        {/* Search */}
        <div className="search-wrap">
          <div className="search-wrap-inner">
            <input
              className="search-input"
              placeholder="Search Dishes, Ingredients…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label="Search menu"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="categories" role="tablist" aria-label="Menu categories">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              id={`cat-${cat.toLowerCase()}`}
              className={`cat-btn${activeCategory === cat ? ' active' : ''}`}
              onClick={() => setActiveCategory(cat)}
              role="tab"
              aria-selected={activeCategory === cat}
            >
              <span className="cat-icon">{CAT_ICONS[cat]}</span>
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'3rem', color:'var(--text-muted)' }}>
            <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>🍽️</div>
            <p>No dishes found. Try a different search.</p>
          </div>
        ) : (
          <div className="menu-grid" role="list">
            {filtered.map(item => (
              <div key={item.id} role="listitem">
                <MenuCard
                  item={item}
                  qty={getQty(item.id)}
                  onAdd={addToCart}
                  onInc={incQty}
                  onDec={decQty}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Floating Cart Button (mobile) */}
      {totalItems > 0 && (
        <button className={`floating-cart visible`} onClick={() => setCartOpen(true)} aria-label="View cart">
           View Cart ({totalItems})
          <span style={{ background:'rgba(0,0,0,0.2)', borderRadius:'50px', padding:'0.1rem 0.5rem', fontSize:'0.85rem' }}>
            Rs. {cart.reduce((s,i)=>s+i.price*i.qty,0).toLocaleString()}
          </span>
        </button>
      )}

      {/* Cart Drawer */}
      {cartOpen && (
        <CartDrawer
          cart={cart}
          onClose={() => setCartOpen(false)}
          onInc={incQty}
          onDec={decQty}
          onRemove={removeItem}
          onCheckout={() => { setCartOpen(false); setOrderOpen(true); }}
        />
      )}

      {/* Order Modal */}
      {orderOpen && (
        <OrderModal
          cart={cart}
          onClose={() => setOrderOpen(false)}
          onOrderPlaced={handleOrderPlaced}
        />
      )}

      {/* Success Modal */}
      {successOrder && (
        <SuccessModal
          order={successOrder}
          onClose={() => setSuccessOrder(null)}
        />
      )}

      {/* Waiter Request Modal */}
      {waiterModalOpen && (
        <WaiterModal
          tableNo={tableNo || 'Walk-in'}
          onClose={() => setWaiterModalOpen(false)}
        />
      )}
    </>
  );
}
