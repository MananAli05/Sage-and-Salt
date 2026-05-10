import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle, Store, Truck, Clock, Phone, MapPin } from 'lucide-react';
import './admin.css';

const SETTINGS_KEY = 'sage_salt_settings';

const defaultSettings = {
  restaurantName: 'Sage & Salt',
  tagline: 'Artisan Restaurant',
  phone: '',
  address: '',
  city: 'Lahore',
  openTime: '11:00',
  closeTime: '23:00',
  deliveryFee: 150,
  taxRate: 8,
  estimatedDelivery: 30,
  acceptingOrders: true,
  acceptingDelivery: true,
  whatsappNumber: '',
  menuUrl: 'https://sage-and-salt.vercel.app/',
};

function SettingSection({ title, icon, children }) {
  return (
    <div style={{
      background: 'var(--a-card)', border: '1px solid var(--a-border-solid)',
      borderRadius: '12px', padding: '1.5rem', marginBottom: '1.25rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
        <div style={{ background: 'var(--a-accent-lt)', borderRadius: '8px', padding: '0.4rem', display: 'flex', color: 'var(--a-accent)' }}>
          {icon}
        </div>
        <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--a-text)' }}>{title}</div>
      </div>
      {children}
    </div>
  );
}

function SettingRow({ label, hint, children }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--a-text)', marginBottom: '0.3rem' }}>
        {label}
        {hint && <span style={{ fontWeight: 400, color: 'var(--a-muted)', marginLeft: '0.5rem', fontSize: '0.75rem' }}>{hint}</span>}
      </label>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        width: '44px', height: '24px', borderRadius: '50px', cursor: 'pointer',
        background: checked ? 'var(--a-accent)' : 'var(--a-border-solid)',
        position: 'relative', transition: 'background 0.2s', flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute', top: '3px',
        left: checked ? 'calc(100% - 21px)' : '3px',
        width: '18px', height: '18px', borderRadius: '50%',
        background: '#fff', transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </div>
  );
}

export default function AdminSettings() {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });
  const [saved, setSaved] = useState(false);

  const set = (key) => (e) =>
    setSettings(p => ({ ...p, [key]: e.target ? e.target.value : e }));

  const handleSave = () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const inputStyle = {
    width: '100%', padding: '0.6rem 0.85rem',
    border: '1px solid var(--a-border-solid)', borderRadius: '8px',
    background: 'var(--a-panel)', color: 'var(--a-text)',
    fontSize: '0.875rem', outline: 'none',
    transition: 'border-color 0.15s', boxSizing: 'border-box',
  };

  return (
    <div>
      {/* Header */}
      <div className="a-page-header" style={{ marginBottom: '1.75rem' }}>
        <div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.5rem', fontWeight: 700, color: 'var(--a-accent)' }}>Settings</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--a-muted)', marginTop: '0.1rem' }}>Configure your restaurant preferences</div>
        </div>
        <button
          onClick={handleSave}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.6rem 1.25rem', borderRadius: '8px', fontWeight: 700, fontSize: '0.875rem',
            border: 'none', cursor: 'pointer', transition: 'all 0.2s',
            background: saved ? '#059669' : 'var(--a-accent)',
            color: '#fff',
          }}
        >
          {saved ? <><CheckCircle size={15} /> Saved!</> : <><Save size={15} /> Save Changes</>}
        </button>
      </div>

      {/* Restaurant Info */}
      <SettingSection title="Restaurant Information" icon={<Store size={16} />}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <SettingRow label="Restaurant Name">
            <input style={inputStyle} value={settings.restaurantName} onChange={set('restaurantName')} />
          </SettingRow>
          <SettingRow label="Tagline">
            <input style={inputStyle} value={settings.tagline} onChange={set('tagline')} />
          </SettingRow>
          <SettingRow label="Phone Number">
            <input style={inputStyle} placeholder="03XXXXXXXXX" value={settings.phone} onChange={set('phone')} />
          </SettingRow>
          <SettingRow label="WhatsApp Number" hint="(for bot)">
            <input style={inputStyle} placeholder="whatsapp:+923XXXXXXXXX" value={settings.whatsappNumber} onChange={set('whatsappNumber')} />
          </SettingRow>
          <SettingRow label="Address" >
            <input style={inputStyle} placeholder="Street, Area" value={settings.address} onChange={set('address')} />
          </SettingRow>
          <SettingRow label="City">
            <input style={inputStyle} placeholder="Lahore" value={settings.city} onChange={set('city')} />
          </SettingRow>
        </div>
        <SettingRow label="Menu / Ordering URL">
          <input style={inputStyle} value={settings.menuUrl} onChange={set('menuUrl')} />
        </SettingRow>
      </SettingSection>

      {/* Hours */}
      <SettingSection title="Opening Hours" icon={<Clock size={16} />}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <SettingRow label="Opening Time">
            <input type="time" style={inputStyle} value={settings.openTime} onChange={set('openTime')} />
          </SettingRow>
          <SettingRow label="Closing Time">
            <input type="time" style={inputStyle} value={settings.closeTime} onChange={set('closeTime')} />
          </SettingRow>
        </div>
      </SettingSection>

      {/* Ordering */}
      <SettingSection title="Delivery & Pricing" icon={<Truck size={16} />}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
          <SettingRow label="Delivery Fee (Rs.)" hint="(per order)">
            <input type="number" style={inputStyle} min={0} value={settings.deliveryFee} onChange={set('deliveryFee')} />
          </SettingRow>
          <SettingRow label="Tax Rate (%)" >
            <input type="number" style={inputStyle} min={0} max={100} value={settings.taxRate} onChange={set('taxRate')} />
          </SettingRow>
          <SettingRow label="Estimated Delivery (mins)">
            <input type="number" style={inputStyle} min={5} value={settings.estimatedDelivery} onChange={set('estimatedDelivery')} />
          </SettingRow>
        </div>

        {/* Toggles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {[
            { key: 'acceptingOrders',   label: 'Accepting Orders',   desc: 'Toggle to pause all new orders' },
            { key: 'acceptingDelivery', label: 'Delivery Available', desc: 'Toggle to disable delivery (dine-in only)' },
          ].map(({ key, label, desc }) => (
            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1rem', background: 'var(--a-panel)', borderRadius: '10px', border: '1px solid var(--a-border-solid)' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--a-text)' }}>{label}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--a-muted)', marginTop: '0.1rem' }}>{desc}</div>
              </div>
              <Toggle checked={settings[key]} onChange={set(key)} />
            </div>
          ))}
        </div>
      </SettingSection>

      {/* System Info */}
      <SettingSection title="System Info" icon={<Settings size={16} />}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: '0.75rem' }}>
          {[
            { label: 'Version',      value: 'v1.0.0' },
            { label: 'Database',     value: 'Firebase Firestore' },
            { label: 'Hosting',      value: 'Vercel' },
            { label: 'Bot',          value: 'Twilio WhatsApp' },
            { label: 'Voice Agent',  value: 'Polly.Raza (ur-PK)' },
            { label: 'AI Model',     value: 'Llama 70B (Groq)' },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: 'var(--a-panel)', borderRadius: '8px', padding: '0.75rem 1rem', border: '1px solid var(--a-border-solid)' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--a-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--a-text)', marginTop: '0.2rem' }}>{value}</div>
            </div>
          ))}
        </div>
      </SettingSection>

      {/* Admin Credentials reminder */}
      <div style={{ background: '#fff7ed', border: '1.5px solid #fed7aa', borderRadius: '10px', padding: '0.85rem 1.1rem', fontSize: '0.82rem', color: '#92400e', display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
        <Settings size={15} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
        <div><strong>Admin Login:</strong> Username: <code>admin</code> · Password: <code>admin123</code> — Change these in <code>AdminLogin.jsx</code> before going live.</div>
      </div>
    </div>
  );
}
