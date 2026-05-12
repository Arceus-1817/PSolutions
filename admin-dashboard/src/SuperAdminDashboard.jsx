import { useState, useEffect } from 'react';
import axios from 'axios';
import { G } from './theme';

export default function SuperAdminDashboard({ user, handleLogout }) {
  const [clients, setClients] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // New Client Form State
  const [companyName, setCompanyName] = useState('');
  const [plan, setPlan] = useState('STARTER');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPhoneNumber, setAdminPhoneNumber] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const validToken = user.token || user.jwt || user.accessToken;
  const authH = { headers: { Authorization: "Bearer " + validToken } };

  const fetchClients = async () => {
    try {
      const res = await axios.get('http://localhost:8085/api/superadmin/clients', authH);
      setClients(res.data);
    } catch (e) {
      console.error("Failed to fetch clients", e);
    }
  };

  useEffect(() => { fetchClients(); }, []);

  const handleOnboard = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('http://localhost:8085/api/superadmin/onboard', {
        companyName, plan, adminName, adminEmail, adminPassword, adminPhoneNumber
      }, authH);

      alert("Company successfully onboarded!");
      setShowModal(false);
      setCompanyName(''); setAdminName(''); setAdminEmail(''); setAdminPassword(''); setAdminPhoneNumber('');
      fetchClients();
    } catch (e) {
      alert(e.response?.data || "Failed to onboard client.");
    }
    setLoading(false);
  };

  // 1. FILTER: Remove the System Admin's own HQ Tenant from the client list
  const activeClients = clients.filter(c =>
    c.id !== user.tenantId &&
    c.companyName !== "PigmyPay System HQ"
  );

  // 2. CALCULATE REVENUE: Calculate actual MRR based on active client plans
  const calculateMRR = () => {
    return activeClients.reduce((total, client) => {
      if (client.plan === 'STARTER') return total + 999;
      if (client.plan === 'GROWTH') return total + 2499;
      if (client.plan === 'ENTERPRISE') return total + 4999; // Base Enterprise price
      return total;
    }, 0);
  };

  const currentMRR = calculateMRR();

  return (
    <div style={{ background: G.bg, color: G.text, minHeight: '100vh', fontFamily: 'sans-serif' }}>

      {/* ── HEADER ── */}
      <header style={{ background: G.surface, borderBottom: `1px solid ${G.border}`, padding: '16px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: G.accentBg, border: `1px solid ${G.accent}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>⚡</div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, letterSpacing: '-.02em' }}>PigmyPay <span style={{ color: G.accent }}>System HQ</span></div>
            <div style={{ fontSize: 11, color: G.textSub, letterSpacing: '.05em', textTransform: 'uppercase' }}>Super Admin Console</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <div style={{ fontSize: 12, color: G.textSub }}>Welcome, {user.name}</div>
          <button className="btn-danger" style={{ padding: '6px 14px', fontSize: 11 }} onClick={handleLogout}>Sign out</button>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main style={{ padding: '40px', maxWidth: 1200, margin: '0 auto' }}>

        <div className="fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 30 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800 }}>Client Management</h1>
            <p style={{ color: G.textSub, fontSize: 13, marginTop: 4 }}>Provision new companies and monitor active SaaS subscriptions.</p>
          </div>
          <button className="btn-primary" onClick={() => setShowModal(true)}>+ Onboard New Client</button>
        </div>

        {/* STATS ROW */}
        <div className="fade-up-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 40 }}>
          <div style={{ background: G.card, border: `1px solid ${G.border}`, padding: 24, borderRadius: G.rLg }}>
            <div style={{ fontSize: 11, color: G.textSub, textTransform: 'uppercase', marginBottom: 8 }}>Active Companies</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: G.accent }}>{activeClients.length}</div>
          </div>
          <div style={{ background: G.card, border: `1px solid ${G.border}`, padding: 24, borderRadius: G.rLg }}>
            <div style={{ fontSize: 11, color: G.textSub, textTransform: 'uppercase', marginBottom: 8 }}>Monthly Recurring Rev</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: G.text }}>₹{currentMRR.toLocaleString('en-IN')} <span style={{ fontSize: 14, color: G.textSub, fontWeight: 400 }}>/mo</span></div>
          </div>
          <div style={{ background: G.card, border: `1px solid ${G.border}`, padding: 24, borderRadius: G.rLg }}>
            <div style={{ fontSize: 11, color: G.textSub, textTransform: 'uppercase', marginBottom: 8 }}>System Health</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: G.info }}>100%</div>
          </div>
        </div>

        {/* CLIENT LIST */}
        <div className="fade-up-2" style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: G.rLg, overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', background: G.surface, borderBottom: `1px solid ${G.border}`, fontSize: 12, fontWeight: 600, color: G.textSub, textTransform: 'uppercase' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr', gap: 16 }}>
              <div>Tenant ID</div>
              <div>Company Name</div>
              <div>Subscription Plan</div>
              <div>Status</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {activeClients.length === 0 ? (
               <div style={{ padding: 40, textAlign: 'center', color: G.muted, fontSize: 13 }}>No external clients onboarded yet.</div>
            ) : (
              activeClients.map((c, i) => (
                <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr', gap: 16, padding: '16px 24px', borderBottom: i === activeClients.length - 1 ? 'none' : `1px solid ${G.border}`, alignItems: 'center' }}>
                  <div style={{ fontSize: 13, color: G.muted }}>#{c.id}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: G.text }}>{c.companyName}</div>
                    <div style={{ fontSize: 11, color: G.textSub, marginTop: 4 }}>Joined {new Date(c.createdAt || Date.now()).toLocaleDateString('en-IN')}</div>
                  </div>
                  <div><span style={{ background: `${G.info}15`, color: G.info, padding: '4px 10px', borderRadius: 20, fontSize: 10, fontWeight: 600 }}>{c.plan || 'STARTER'}</span></div>
                  <div><span style={{ color: G.accent, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 6, height: 6, borderRadius: '50%', background: G.accent }}/> ACTIVE</span></div>
                </div>
              ))
            )}
          </div>
        </div>

      </main>

      {/* ── ONBOARDING MODAL ── */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: G.rLg, padding: 32, width: 480 }}>
            <h3 style={{ marginBottom: 8, fontFamily: 'var(--font-display)', fontSize: 24 }}>Provision New Client</h3>
            <p style={{ fontSize: 12, color: G.textSub, marginBottom: 24 }}>This creates an isolated database workspace and primary Admin account.</p>

            <form onSubmit={handleOnboard}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 11, color: G.textSub, marginBottom: 6, textTransform: 'uppercase' }}>Company Details</label>
                <input required placeholder="Microfinance Company Name" value={companyName} onChange={e => setCompanyName(e.target.value)}
                  style={{ width: '100%', padding: 12, marginBottom: 12, background: G.surface, border: `1px solid ${G.border}`, color: '#fff', borderRadius: 8, outline: 'none' }} />

                <select value={plan} onChange={e => setPlan(e.target.value)} style={{ width: '100%', padding: 12, background: G.surface, border: `1px solid ${G.border}`, color: '#fff', borderRadius: 8, outline: 'none' }}>
                  <option value="STARTER">Starter Plan (₹999/mo)</option>
                  <option value="GROWTH">Growth Plan (₹2,499/mo)</option>
                  <option value="ENTERPRISE">Enterprise (Custom)</option>
                </select>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 11, color: G.textSub, marginBottom: 6, textTransform: 'uppercase' }}>Primary Admin Account</label>
                <input required placeholder="Admin Full Name" value={adminName} onChange={e => setAdminName(e.target.value)}
                  style={{ width: '100%', padding: 12, marginBottom: 12, background: G.surface, border: `1px solid ${G.border}`, color: '#fff', borderRadius: 8, outline: 'none' }} />
                <input required type="email" placeholder="Admin Login Email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)}
                  style={{ width: '100%', padding: 12, marginBottom: 12, background: G.surface, border: `1px solid ${G.border}`, color: '#fff', borderRadius: 8, outline: 'none' }} />
                <input required type="tel" placeholder="Admin Phone Number" value={adminPhoneNumber} onChange={e => setAdminPhoneNumber(e.target.value)}
                  style={{ width: '100%', padding: 12, marginBottom: 12, background: G.surface, border: `1px solid ${G.border}`, color: '#fff', borderRadius: 8, outline: 'none' }} />
                <input required type="password" placeholder="Temporary Password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)}
                  style={{ width: '100%', padding: 12, background: G.surface, border: `1px solid ${G.border}`, color: '#fff', borderRadius: 8, outline: 'none' }} />
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button type="button" style={{ flex: 1, background: 'transparent', color: G.textSub, border: `1px solid ${G.border}`, padding: 12, borderRadius: 8, cursor: 'pointer' }} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" disabled={loading} style={{ flex: 2, background: G.accent, color: '#000', border: 'none', padding: 12, borderRadius: 8, fontWeight: 'bold', cursor: 'pointer' }}>
                  {loading ? 'Provisioning...' : 'Onboard Company'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}