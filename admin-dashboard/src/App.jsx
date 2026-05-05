import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AdminDashboard from './AdminDashboard';
import './index.css';

// ─── Shared design tokens (light theme for public pages) ─────────────────────
const BASE_URL = 'http://localhost:8085';

// ─── Axios instance with default base URL ────────────────────────────────────
const api = axios.create({ baseURL: BASE_URL });

// ─── Helper: build auth header ───────────────────────────────────────────────
const authHeader = (token) => ({ headers: { Authorization: `Bearer ${token}` } });

// ═══════════════════════════════════════════════════════════════════════════════
// 1. LANDING PAGE
// ═══════════════════════════════════════════════════════════════════════════════
function LandingPage() {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const features = [
    { icon: '⚡', title: 'Lightning collection', desc: '2-tap deposit logging for field agents in busy markets' },
    { icon: '🔐', title: 'Bank-grade security', desc: 'JWT stateless auth + BCrypt encryption on every account' },
    { icon: '📊', title: 'Live dashboards', desc: 'Branch managers see real-time portfolio metrics as money moves' },
    { icon: '📱', title: 'Mobile-first agents', desc: 'Optimised for phones — works even in low connectivity zones' },
    { icon: '🏢', title: 'Multi-branch ready', desc: 'One platform manages unlimited branches and agent teams' },
    { icon: '🧾', title: 'Digital passbook', desc: 'Customers view their own balance and history transparently' },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');
        .lp-body { font-family: 'DM Sans', sans-serif; background: #f9f6f1; color: #1a1a1a; min-height: 100vh; }
        .lp-nav { position: fixed; top: 0; left: 0; right: 0; z-index: 100; padding: 0 5vw; height: 64px; display: flex; align-items: center; justify-content: space-between; background: rgba(249,246,241,0.88); backdrop-filter: blur(12px); border-bottom: 1px solid rgba(0,0,0,0.06); }
        .lp-logo { font-family: 'DM Serif Display', serif; font-size: 22px; color: #1a1a1a; letter-spacing: -.02em; }
        .lp-logo span { color: #1d6b4a; }
        .lp-hero { padding: 140px 5vw 100px; max-width: 1160px; margin: 0 auto; }
        .lp-eyebrow { display: inline-flex; align-items: center; gap: 8px; background: #e8f5ee; border: 1px solid #b8dfc8; color: #1d6b4a; border-radius: 20px; padding: 5px 14px; font-size: 12px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; margin-bottom: 28px; }
        .lp-dot { width: 7px; height: 7px; border-radius: 50%; background: #1d6b4a; animation: lp-pulse 2s infinite; }
        @keyframes lp-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.6;transform:scale(1.4)} }
        .lp-h1 { font-family: 'DM Serif Display', serif; font-size: clamp(42px, 6vw, 80px); line-height: 1.06; letter-spacing: -.03em; color: #1a1a1a; margin-bottom: 24px; }
        .lp-h1 em { font-style: italic; color: #1d6b4a; }
        .lp-sub { font-size: clamp(16px, 2vw, 19px); color: #555; line-height: 1.65; max-width: 540px; margin-bottom: 44px; font-weight: 300; }
        .lp-cta-row { display: flex; gap: 14px; flex-wrap: wrap; }
        .lp-btn-main { background: #1a1a1a; color: #f9f6f1; font-family: 'DM Sans', sans-serif; font-weight: 600; font-size: 15px; padding: 14px 32px; border-radius: 50px; border: none; cursor: pointer; transition: all .2s; letter-spacing: -.01em; }
        .lp-btn-main:hover { background: #1d6b4a; transform: translateY(-2px); box-shadow: 0 8px 32px rgba(29,107,74,.3); }
        .lp-btn-sec { background: transparent; color: #1a1a1a; font-family: 'DM Sans', sans-serif; font-weight: 500; font-size: 15px; padding: 14px 32px; border-radius: 50px; border: 1.5px solid rgba(0,0,0,.2); cursor: pointer; transition: all .2s; }
        .lp-btn-sec:hover { border-color: #1a1a1a; background: rgba(0,0,0,.04); }
        .lp-stats { display: flex; gap: 48px; margin-top: 64px; padding-top: 48px; border-top: 1px solid rgba(0,0,0,.08); flex-wrap: wrap; }
        .lp-stat-n { font-family: 'DM Serif Display', serif; font-size: 40px; color: #1a1a1a; line-height: 1; }
        .lp-stat-n em { font-style: italic; color: #1d6b4a; }
        .lp-stat-l { font-size: 13px; color: #777; margin-top: 6px; }
        .lp-features { background: #1a1a1a; padding: 100px 5vw; }
        .lp-features-inner { max-width: 1160px; margin: 0 auto; }
        .lp-feat-head { font-family: 'DM Serif Display', serif; font-size: clamp(32px, 4vw, 52px); color: #f9f6f1; margin-bottom: 56px; letter-spacing: -.02em; line-height: 1.1; }
        .lp-feat-head em { font-style: italic; color: #4ecb82; }
        .lp-feat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1px; background: rgba(255,255,255,.08); border-radius: 16px; overflow: hidden; }
        .lp-feat-card { background: #222; padding: 32px; transition: background .2s; }
        .lp-feat-card:hover { background: #2a2a2a; }
        .lp-feat-icon { width: 44px; height: 44px; background: rgba(78,203,130,.12); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; margin-bottom: 18px; }
        .lp-feat-title { font-size: 17px; font-weight: 600; color: #f0f0f0; margin-bottom: 10px; }
        .lp-feat-desc { font-size: 14px; color: #888; line-height: 1.65; }
        .lp-pricing { padding: 100px 5vw; max-width: 1160px; margin: 0 auto; }
        .lp-pricing-head { font-family: 'DM Serif Display', serif; font-size: clamp(32px, 4vw, 52px); text-align: center; margin-bottom: 12px; letter-spacing: -.02em; }
        .lp-pricing-sub { text-align: center; color: #777; font-size: 16px; margin-bottom: 56px; }
        .lp-plans { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; }
        .lp-plan { border: 1.5px solid rgba(0,0,0,.1); border-radius: 20px; padding: 32px; transition: all .2s; }
        .lp-plan:hover { border-color: #1d6b4a; box-shadow: 0 8px 40px rgba(29,107,74,.12); transform: translateY(-3px); }
        .lp-plan.featured { background: #1a1a1a; color: #f9f6f1; border-color: #1a1a1a; }
        .lp-plan-name { font-size: 13px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #1d6b4a; margin-bottom: 12px; }
        .lp-plan.featured .lp-plan-name { color: #4ecb82; }
        .lp-plan-price { font-family: 'DM Serif Display', serif; font-size: 44px; letter-spacing: -.03em; line-height: 1; margin-bottom: 6px; }
        .lp-plan-period { font-size: 13px; color: #999; margin-bottom: 24px; }
        .lp-plan.featured .lp-plan-period { color: #aaa; }
        .lp-plan-features { list-style: none; padding: 0; margin: 0 0 28px; }
        .lp-plan-features li { font-size: 14px; color: #555; padding: 8px 0; border-bottom: 1px solid rgba(0,0,0,.06); display: flex; gap: 10px; align-items: center; }
        .lp-plan.featured .lp-plan-features li { color: #ccc; border-color: rgba(255,255,255,.08); }
        .lp-plan-features li::before { content: '✓'; color: #1d6b4a; font-weight: 700; flex-shrink: 0; }
        .lp-plan.featured .lp-plan-features li::before { color: #4ecb82; }
        .lp-footer { background: #111; color: #666; padding: 40px 5vw; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; }
        .lp-footer-logo { font-family: 'DM Serif Display', serif; font-size: 18px; color: #f0f0f0; }
        .lp-footer-logo span { color: #4ecb82; }
        @keyframes lp-fadein { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .lp-anim { opacity: 0; }
        .lp-anim.in { animation: lp-fadein .6s ease forwards; }
      `}</style>

      <div className="lp-body">
        {/* Nav */}
        <nav className="lp-nav">
          <div className="lp-logo">Pigmy<span>Pay</span></div>
          <div style={{ display:'flex', gap:12, alignItems:'center' }}>
            <button
              className="lp-btn-sec"
              style={{ padding:'9px 22px', fontSize:14 }}
              onClick={() => navigate('/login')}
            >
              Sign in
            </button>
            <button
              className="lp-btn-main"
              style={{ padding:'9px 22px', fontSize:14 }}
              onClick={() => navigate('/login')}
            >
              Get started →
            </button>
          </div>
        </nav>

        {/* Hero */}
        <section className="lp-hero">
          <div className={`lp-anim ${mounted ? 'in' : ''}`} style={{ animationDelay:'.05s' }}>
            <div className="lp-eyebrow"><span className="lp-dot" />Now in production</div>
          </div>
          <h1 className={`lp-h1 lp-anim ${mounted ? 'in' : ''}`} style={{ animationDelay:'.12s' }}>
            The modern platform<br />for <em>daily collection</em><br />finance.
          </h1>
          <p className={`lp-sub lp-anim ${mounted ? 'in' : ''}`} style={{ animationDelay:'.2s' }}>
            Replace paper ledgers with a secure, real-time digital system. Field agents collect faster. Branch managers see everything live. Customers trust every rupee.
          </p>
          <div className={`lp-cta-row lp-anim ${mounted ? 'in' : ''}`} style={{ animationDelay:'.28s' }}>
            <button className="lp-btn-main" onClick={() => navigate('/login')}>
              Access your portal →
            </button>
            <button className="lp-btn-sec" onClick={() => alert('Demo booking coming in Phase 3')}>
              Book a demo
            </button>
          </div>
          <div className={`lp-stats lp-anim ${mounted ? 'in' : ''}`} style={{ animationDelay:'.36s' }}>
            {[
              { n: '2-tap', l: 'Deposit logging' },
              { n: '24hr', l: 'JWT token security' },
              { n: '∞', l: 'Branches per company' },
              { n: '100%', l: 'Digital audit trail' },
            ].map(s => (
              <div key={s.l}>
                <div className="lp-stat-n"><em>{s.n}</em></div>
                <div className="lp-stat-l">{s.l}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="lp-features">
          <div className="lp-features-inner">
            <h2 className="lp-feat-head">
              Everything your<br /><em>finance company needs.</em>
            </h2>
            <div className="lp-feat-grid">
              {features.map(f => (
                <div key={f.title} className="lp-feat-card">
                  <div className="lp-feat-icon">{f.icon}</div>
                  <div className="lp-feat-title">{f.title}</div>
                  <div className="lp-feat-desc">{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="lp-pricing">
          <h2 className="lp-pricing-head">Simple, honest pricing</h2>
          <p className="lp-pricing-sub">No hidden fees. Cancel any time. Start free.</p>
          <div className="lp-plans">
            {[
              {
                name: 'Starter', price: '₹999', period: '/month',
                features: ['Up to 5 agents', '1 branch', 'Daily collection logs', 'Customer passbook', 'Email support'],
              },
              {
                name: 'Growth', price: '₹2,499', period: '/month', featured: true,
                features: ['Up to 25 agents', '5 branches', 'All Starter features', 'Analytics dashboard', 'WhatsApp receipts', 'Priority support'],
              },
              {
                name: 'Enterprise', price: 'Custom', period: 'contact us',
                features: ['Unlimited agents', 'Unlimited branches', 'All Growth features', 'Custom integrations', 'SLA guarantee', 'Dedicated manager'],
              },
            ].map(p => (
              <div key={p.name} className={`lp-plan${p.featured ? ' featured' : ''}`}>
                <div className="lp-plan-name">{p.name}</div>
                <div className="lp-plan-price">{p.price}</div>
                <div className="lp-plan-period">{p.period}</div>
                <ul className="lp-plan-features">
                  {p.features.map(f => <li key={f}>{f}</li>)}
                </ul>
                <button
                  style={{
                    width:'100%', padding:'13px', borderRadius:'50px', fontSize:14,
                    fontFamily:'DM Sans, sans-serif', fontWeight:600, cursor:'pointer',
                    border: p.featured ? 'none' : '1.5px solid rgba(0,0,0,.2)',
                    background: p.featured ? '#4ecb82' : 'transparent',
                    color: p.featured ? '#000' : 'inherit',
                    transition:'all .2s',
                  }}
                  onClick={() => navigate('/login')}
                >
                  {p.featured ? 'Start free trial' : 'Get started'}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="lp-footer">
          <div className="lp-footer-logo">Pigmy<span>Pay</span></div>
          <div style={{ fontSize:13 }}>© 2025 PigmyPay. Built for India's micro-finance sector.</div>
          <div style={{ display:'flex', gap:20, fontSize:13 }}>
            <span style={{ cursor:'pointer' }}>Privacy</span>
            <span style={{ cursor:'pointer' }}>Terms</span>
            <span style={{ cursor:'pointer' }}>Contact</span>
          </div>
        </footer>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. LOGIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
function LoginPage({ setUser }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [shake, setShake]       = useState(false);
  const navigate = useNavigate();

  const handleLogin = useCallback(async () => {
    if (!email || !password) { setError('Please enter your email and password.'); return; }
    setLoading(true); setError('');
    try {
      const res = await api.post('/api/auth/login', { email, password });
      const userData = res.data;
      setUser(userData);

      if (userData.role === 'ADMIN' || userData.role === 'MANAGER') {
        navigate('/admin');
      } else {
        navigate('/agent');
      }
    } catch (e) {
      const msg = e.response?.status === 401
        ? 'Invalid email or password.'
        : 'Connection failed. Is the server running?';
      setError(msg);
      setShake(true);
      setTimeout(() => setShake(false), 600);
    } finally {
      setLoading(false);
    }
  }, [email, password, navigate, setUser]);

  const onKeyDown = (e) => { if (e.key === 'Enter') handleLogin(); };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&display=swap');
        .login-wrap {
          min-height: 100vh; display: flex;
          background: #0d0f12;
          font-family: 'DM Mono', monospace;
        }
        .login-left {
          flex: 1; display: flex; align-items: center; justify-content: center;
          padding: 48px; position: relative; overflow: hidden;
        }
        .login-left::before {
          content: '';
          position: absolute; inset: 0;
          background:
            radial-gradient(ellipse at 20% 50%, rgba(0,255,136,.07) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 20%, rgba(59,130,246,.05) 0%, transparent 50%);
          pointer-events: none;
        }
        .login-grid {
          position: absolute; inset: 0; opacity: .03;
          background-image: linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px);
          background-size: 48px 48px;
        }
        .login-card {
          width: 100%; max-width: 400px; position: relative; z-index: 1;
        }
        .login-logo {
          font-family: 'DM Serif Display', serif;
          font-size: 26px; color: #f0f0f0; letter-spacing: -.02em; margin-bottom: 6px;
        }
        .login-logo span { color: #00ff88; }
        .login-tagline { font-size: 11px; color: #4a5568; letter-spacing: .08em; text-transform: uppercase; margin-bottom: 44px; }
        .login-field { margin-bottom: 16px; }
        .login-label { display: block; font-size: 10px; color: #4a5568; letter-spacing: .08em; text-transform: uppercase; margin-bottom: 7px; }
        .login-input {
          width: 100%; padding: 13px 16px;
          background: #161b22; border: 1px solid #1e2530;
          color: #e2e8f0; border-radius: 10px; font-size: 13px;
          font-family: 'DM Mono', monospace; outline: none;
          transition: border-color .2s, box-shadow .2s; box-sizing: border-box;
        }
        .login-input:focus { border-color: #00ff88; box-shadow: 0 0 0 3px rgba(0,255,136,.12); }
        .login-input::placeholder { color: #2d3748; }
        .login-error {
          background: rgba(255,71,87,.08); border: 1px solid rgba(255,71,87,.2);
          color: #ff6b6b; font-size: 12px; padding: 10px 14px;
          border-radius: 8px; margin-bottom: 16px;
        }
        .login-btn {
          width: 100%; padding: 14px; background: #00ff88; color: #000;
          font-family: 'DM Mono', monospace; font-weight: 500; font-size: 14px;
          border: none; border-radius: 10px; cursor: pointer;
          transition: all .18s; letter-spacing: .02em;
        }
        .login-btn:hover:not(:disabled) { background: #00cc6a; transform: translateY(-1px); box-shadow: 0 6px 24px rgba(0,255,136,.25); }
        .login-btn:disabled { opacity: .5; cursor: not-allowed; }
        .login-hint { margin-top: 20px; font-size: 11px; color: #2d3748; text-align: center; line-height: 1.7; }
        .login-hint code { color: #4a5568; background: #161b22; padding: 2px 6px; border-radius: 4px; }
        @keyframes login-shake {
          0%,100%{transform:translateX(0)}
          20%,60%{transform:translateX(-8px)}
          40%,80%{transform:translateX(8px)}
        }
        .login-shake { animation: login-shake .4s ease; }
        .login-right {
          width: 420px; background: #060809;
          border-left: 1px solid #1e2530;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 48px; gap: 0;
        }
        @media (max-width: 768px) { .login-right { display: none; } }
        .login-portal-card {
          width: 100%; background: #111318; border: 1px solid #1e2530;
          border-radius: 14px; padding: 22px; margin-bottom: 12px;
          transition: border-color .2s;
        }
        .login-portal-card:hover { border-color: #2a3441; }
        .login-portal-icon { font-size: 22px; margin-bottom: 12px; }
        .login-portal-title { font-size: 13px; color: #e2e8f0; font-weight: 500; margin-bottom: 5px; }
        .login-portal-desc { font-size: 11px; color: #4a5568; line-height: 1.6; }
        .login-portal-badge {
          display: inline-block; margin-top: 10px;
          padding: 3px 9px; border-radius: 20px; font-size: 10px; font-weight: 600;
        }
      `}</style>

      <div className="login-wrap">
        {/* Left — form */}
        <div className="login-left">
          <div className="login-grid" />
          <div className={`login-card ${shake ? 'login-shake' : ''}`}>
            <div className="login-logo">Pigmy<span>Pay</span></div>
            <div className="login-tagline">Secure portal access</div>

            <div className="login-field">
              <label className="login-label">Email address</label>
              <input
                className="login-input"
                type="email"
                placeholder="admin@pigmypay.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={onKeyDown}
                autoComplete="email"
              />
            </div>

            <div className="login-field" style={{ marginBottom: 20 }}>
              <label className="login-label">Password</label>
              <input
                className="login-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={onKeyDown}
                autoComplete="current-password"
              />
            </div>

            {error && <div className="login-error">{error}</div>}

            <button className="login-btn" onClick={handleLogin} disabled={loading}>
              {loading ? 'Authenticating…' : 'Access portal →'}
            </button>

            <div className="login-hint">
              Default admin: <code>admin@pigmypay.com</code> / <code>admin123</code>
            </div>
          </div>
        </div>

        {/* Right — portal directory */}
        <div className="login-right">
          <div style={{ width:'100%', marginBottom:24 }}>
            <div style={{ fontSize:10, color:'#2d3748', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:18 }}>Portal directory</div>
            {[
              { icon:'🛡️', title:'Admin / Manager', desc:'Branch management, agent onboarding, analytics dashboard', badge:'ADMIN · MANAGER', badgeColor:'rgba(139,92,246,.15)', badgeText:'#8b5cf6' },
              { icon:'🚶', title:'Field agent', desc:'Customer search, deposit logging, daily collection targets', badge:'AGENT', badgeColor:'rgba(0,255,136,.1)', badgeText:'#00ff88' },
              { icon:'👤', title:'End customer', desc:'View passbook, check balance, flag disputes', badge:'COMING SOON', badgeColor:'rgba(255,165,2,.1)', badgeText:'#ffa502' },
            ].map(p => (
              <div key={p.title} className="login-portal-card">
                <div className="login-portal-icon">{p.icon}</div>
                <div className="login-portal-title">{p.title}</div>
                <div className="login-portal-desc">{p.desc}</div>
                <span className="login-portal-badge" style={{ background: p.badgeColor, color: p.badgeText }}>
                  {p.badge}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. AGENT DASHBOARD (full — unchanged logic, improved styling)
// ═══════════════════════════════════════════════════════════════════════════════
function AgentDashboard({ user, handleLogout }) {
  const [customers, setCustomers]           = useState([]);
  const [selectedCustomer, setSelected]     = useState(null);
  const [depositAmount, setDepositAmount]   = useState('');
  const [paymentMode, setPaymentMode]       = useState('CASH');
  const [transactions, setTransactions]     = useState([]);
  const [status, setStatus]                 = useState({ type:'', message:'' });
  const [searchTerm, setSearch]             = useState('');
  const [showAddForm, setShowAddForm]       = useState(false);
  const [newCustomer, setNewCustomer]       = useState({ name:'', accountNumber:'', phoneNumber:'', currentBalance:0 });
  const [loadingCustomers, setLoadingC]     = useState(true);
  const [isSaving, setIsSaving]             = useState(false);

  const getAuth = () => authHeader(user.token);

  const fetchCustomers = useCallback(async () => {
    setLoadingC(true);
    try {
      const res = await api.get(`/api/customers/agent/${user.userId}`, getAuth());
      setCustomers(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      if (e.response?.status === 401 || e.response?.status === 403) handleLogout();
    } finally { setLoadingC(false); }
  }, [user.userId, user.token]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const handleSelectCustomer = async (customer) => {
    setSelected(customer);
    setShowAddForm(false);
    setStatus({ type:'', message:'' });
    try {
      const res = await api.get(`/api/transactions/history/${customer.id}`, getAuth());
      setTransactions(Array.isArray(res.data) ? res.data : []);
    } catch { setTransactions([]); }
  };

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) return;
    const body = {
      customerId: selectedCustomer.id,
      agentId: user.userId,
      amount: parseFloat(depositAmount),
      paymentMode,
    };
    try {
      await api.post('/api/transactions/deposit', body, getAuth());
      setStatus({ type:'success', message:`₹${depositAmount} deposited successfully!` });
      setDepositAmount('');
      fetchCustomers();
      handleSelectCustomer(selectedCustomer);
    } catch { setStatus({ type:'error', message:'Deposit failed. Try again.' }); }
  };

  const handleAddCustomer = async () => {
      if (!newCustomer.name || !newCustomer.accountNumber) return;

      setIsSaving(true); // 1. Lock the button immediately

      const payload = { ...newCustomer, assignedAgent: { id: user.userId } };
      try {
        await api.post('/api/customers', payload, getAuth());
        setStatus({ type:'success', message:`${newCustomer.name} added!` });
        setShowAddForm(false);
        setNewCustomer({ name:'', accountNumber:'', phoneNumber:'', currentBalance:0 });

        await fetchCustomers(); // 2. Wait for the fresh list from the database

      } catch (e) {
        // 3. If the database rejects a duplicate account number, it drops an error here!
        setStatus({ type:'error', message:'Failed. Does this account number already exist?' });
      } finally {
        setIsSaving(false); // 4. Unlock the button
      }
    };

  const filtered = customers.filter(c =>
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.accountNumber?.includes(searchTerm)
  );
  const totalPortfolio = customers.reduce((s, c) => s + (c.currentBalance || 0), 0);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@600;700;800&display=swap');
        .ag-wrap { min-height: 100vh; background: #0a0c0f; color: #e2e8f0; font-family: 'DM Mono', monospace; }
        .ag-header { background: #111318; border-bottom: 1px solid #1e2530; padding: 0 28px; height: 58px; display: flex; align-items: center; justify-content: space-between; }
        .ag-logo { font-family: 'Syne', sans-serif; font-size: 17px; font-weight: 800; color: #e2e8f0; }
        .ag-logo span { color: #00ff88; }
        .ag-user { font-size: 11px; color: #4a5568; }
        .ag-user strong { color: #718096; }
        .ag-logout { background: rgba(255,71,87,.08); border: 1px solid rgba(255,71,87,.2); color: #ff4757; font-size: 11px; padding: 7px 14px; border-radius: 8px; cursor: pointer; font-family: 'DM Mono', monospace; transition: all .15s; }
        .ag-logout:hover { background: rgba(255,71,87,.15); }
        .ag-main { display: grid; grid-template-columns: 360px 1fr; height: calc(100vh - 58px); overflow: hidden; }
        .ag-left { border-right: 1px solid #1e2530; display: flex; flex-direction: column; overflow: hidden; }
        .ag-portfolio { padding: 20px 20px 16px; border-bottom: 1px solid #1e2530; }
        .ag-portfolio-label { font-size: 10px; color: #4a5568; letter-spacing: .08em; text-transform: uppercase; margin-bottom: 6px; }
        .ag-portfolio-value { font-family: 'Syne', sans-serif; font-size: 32px; font-weight: 800; color: #e2e8f0; line-height: 1; }
        .ag-portfolio-value span { color: #00ff88; }
        .ag-portfolio-sub { font-size: 11px; color: #4a5568; margin-top: 4px; }
        .ag-search-row { padding: 12px 16px; border-bottom: 1px solid #1e2530; display: flex; gap: 8px; }
        .ag-search { flex:1; background: #161b22; border: 1px solid #1e2530; color: #e2e8f0; border-radius: 8px; padding: 9px 12px; font-size: 12px; font-family: 'DM Mono', monospace; outline: none; transition: border-color .2s; }
        .ag-search:focus { border-color: #00ff88; }
        .ag-search::placeholder { color: #2d3748; }
        .ag-add-btn { background: #00ff88; color: #000; border: none; border-radius: 8px; padding: 9px 14px; font-size: 12px; font-weight: 500; cursor: pointer; font-family: 'DM Mono', monospace; transition: all .15s; white-space: nowrap; }
        .ag-add-btn:hover { background: #00cc6a; }
        .ag-customer-list { flex: 1; overflow-y: auto; }
        .ag-customer-item { padding: 14px 16px; border-bottom: 1px solid #1e2530; cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: background .12s; }
        .ag-customer-item:hover { background: #161b22; }
        .ag-customer-item.active { background: #00ff8810; border-left: 2px solid #00ff88; }
        .ag-customer-name { font-size: 13px; color: #e2e8f0; }
        .ag-customer-acc { font-size: 11px; color: #4a5568; margin-top: 3px; }
        .ag-customer-bal { font-size: 13px; color: #00ff88; font-weight: 500; }
        .ag-right { overflow-y: auto; padding: 24px 28px; }
        .ag-detail-name { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 700; margin-bottom: 4px; }
        .ag-detail-phone { font-size: 12px; color: #4a5568; margin-bottom: 20px; }
        .ag-status-ok { background: rgba(0,255,136,.08); border: 1px solid rgba(0,255,136,.2); color: #00ff88; padding: 10px 14px; border-radius: 8px; font-size: 12px; margin-bottom: 16px; }
        .ag-status-err { background: rgba(255,71,87,.08); border: 1px solid rgba(255,71,87,.2); color: #ff4757; padding: 10px 14px; border-radius: 8px; font-size: 12px; margin-bottom: 16px; }
        .ag-deposit-box { background: #161b22; border: 1px solid #1e2530; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
        .ag-deposit-title { font-size: 13px; color: #718096; letter-spacing: .04em; margin-bottom: 16px; }
        .ag-amount-input { width: 100%; background: #111318; border: 1px solid #1e2530; color: #e2e8f0; border-radius: 8px; padding: 12px 14px; font-size: 18px; font-family: 'DM Mono', monospace; outline: none; box-sizing: border-box; margin-bottom: 12px; transition: border-color .2s; }
        .ag-amount-input:focus { border-color: #00ff88; box-shadow: 0 0 0 3px rgba(0,255,136,.1); }
        .ag-mode-row { display: flex; gap: 8px; margin-bottom: 14px; }
        .ag-mode-btn { flex:1; padding: 9px; border-radius: 8px; font-size: 12px; font-family: 'DM Mono', monospace; cursor: pointer; transition: all .15s; border: 1px solid #1e2530; background: transparent; color: #718096; }
        .ag-mode-btn.active { background: rgba(0,255,136,.1); border-color: rgba(0,255,136,.3); color: #00ff88; }
        .ag-confirm-btn { width: 100%; padding: 13px; background: #00ff88; color: #000; border: none; border-radius: 8px; font-size: 14px; font-weight: 500; font-family: 'DM Mono', monospace; cursor: pointer; transition: all .18s; }
        .ag-confirm-btn:hover { background: #00cc6a; transform: translateY(-1px); box-shadow: 0 4px 20px rgba(0,255,136,.2); }
        .ag-history-title { font-size: 12px; color: #4a5568; letter-spacing: .06em; text-transform: uppercase; margin-bottom: 14px; }
        .ag-txn-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #1e2530; align-items: center; }
        .ag-txn-amt { color: #00ff88; font-size: 14px; font-weight: 500; }
        .ag-txn-mode { font-size: 10px; color: #2d3748; background: #161b22; padding: 3px 8px; border-radius: 12px; border: 1px solid #1e2530; }
        .ag-txn-date { font-size: 11px; color: #4a5568; }
        .ag-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #2d3748; font-size: 13px; gap: 10px; text-align: center; padding: 40px; }
        .ag-empty-icon { font-size: 36px; opacity: .3; }
        .ag-add-form { background: #161b22; border: 1px solid #1e2530; border-radius: 10px; padding: 16px; margin-bottom: 16px; }
        .ag-form-input { width: 100%; background: #111318; border: 1px solid #1e2530; color: #e2e8f0; border-radius: 7px; padding: 10px 12px; font-size: 12px; font-family: 'DM Mono', monospace; outline: none; box-sizing: border-box; margin-bottom: 10px; transition: border-color .15s; }
        .ag-form-input:focus { border-color: #00ff8866; }
        .ag-form-input::placeholder { color: #2d3748; }
      `}</style>

      <div className="ag-wrap">
        {/* Header */}
        <header className="ag-header">
          <div className="ag-logo">Pigmy<span>Pay</span> <span style={{ fontSize:11, color:'#2d3748', fontFamily:'DM Mono,monospace', fontWeight:400 }}>/ Field</span></div>
          <div style={{ display:'flex', alignItems:'center', gap:20 }}>
            <div className="ag-user">Logged in as <strong>{user.name}</strong> · {user.role}</div>
            <button className="ag-logout" onClick={handleLogout}>Sign out</button>
          </div>
        </header>

        <div className="ag-main">
          {/* Left panel */}
          <div className="ag-left">
            <div className="ag-portfolio">
              <div className="ag-portfolio-label">Total portfolio</div>
              <div className="ag-portfolio-value"><span>₹</span>{totalPortfolio.toLocaleString('en-IN')}</div>
              <div className="ag-portfolio-sub">{customers.length} customers · {user.name}</div>
            </div>

            <div className="ag-search-row">
              <input
                className="ag-search"
                placeholder="Search name or account…"
                value={searchTerm}
                onChange={e => setSearch(e.target.value)}
              />
              <button
                className="ag-add-btn"
                onClick={() => { setShowAddForm(!showAddForm); setSelected(null); setStatus({type:'',message:''}); }}
              >
                {showAddForm ? '✕' : '+ New'}
              </button>
            </div>

            {showAddForm && (
              <div style={{ padding:'0 12px 12px' }}>
                <div className="ag-add-form">
                  <input className="ag-form-input" placeholder="Full name *" value={newCustomer.name} onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })} />
                  <input className="ag-form-input" placeholder="Account number *" value={newCustomer.accountNumber} onChange={e => setNewCustomer({ ...newCustomer, accountNumber: e.target.value })} />
                  <input className="ag-form-input" placeholder="Phone number" value={newCustomer.phoneNumber} onChange={e => setNewCustomer({ ...newCustomer, phoneNumber: e.target.value })} />
<button
  className="ag-confirm-btn"
  style={{ fontSize:12, padding:'10px', opacity: isSaving ? 0.7 : 1 }}
  onClick={handleAddCustomer}
  disabled={isSaving} // Disables the button while saving
>
  {isSaving ? 'Saving...' : 'Save customer'}
</button>                </div>
              </div>
            )}

            <div className="ag-customer-list">
              {loadingCustomers ? (
                <div style={{ padding:20 }}>
                  {[1,2,3].map(i => (
                    <div key={i} style={{ height:60, borderRadius:8, marginBottom:8, background:'linear-gradient(90deg,#161b22 25%,#1e2530 50%,#161b22 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.4s infinite' }} />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="ag-empty">
                  <div className="ag-empty-icon">👤</div>
                  <div>{searchTerm ? 'No customers match your search.' : 'No customers yet. Add your first one.'}</div>
                </div>
              ) : filtered.map(c => (
                <div
                  key={c.id}
                  className={`ag-customer-item ${selectedCustomer?.id === c.id ? 'active' : ''}`}
                  onClick={() => handleSelectCustomer(c)}
                >
                  <div>
                    <div className="ag-customer-name">{c.name}</div>
                    <div className="ag-customer-acc">ACC: {c.accountNumber}</div>
                  </div>
                  <div className="ag-customer-bal">₹{(c.currentBalance || 0).toLocaleString('en-IN')}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right panel */}
          <div className="ag-right">
            {selectedCustomer ? (
              <>
                <div className="ag-detail-name">{selectedCustomer.name}</div>
                {selectedCustomer.phoneNumber && (
                  <div className="ag-detail-phone">📞 {selectedCustomer.phoneNumber}</div>
                )}

                {status.message && (
                  <div className={status.type === 'success' ? 'ag-status-ok' : 'ag-status-err'}>
                    {status.message}
                  </div>
                )}

                <div className="ag-deposit-box">
                  <div className="ag-deposit-title">RECORD COLLECTION</div>
                  <input
                    className="ag-amount-input"
                    type="number"
                    placeholder="₹ Enter amount"
                    value={depositAmount}
                    onChange={e => setDepositAmount(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleDeposit()}
                  />
                  <div className="ag-mode-row">
                    {['CASH', 'UPI'].map(m => (
                      <button
                        key={m}
                        className={`ag-mode-btn ${paymentMode === m ? 'active' : ''}`}
                        onClick={() => setPaymentMode(m)}
                      >
                        {m === 'CASH' ? '💵' : '📱'} {m}
                      </button>
                    ))}
                  </div>
                  <button className="ag-confirm-btn" onClick={handleDeposit}>
                    Confirm deposit
                  </button>
                </div>

                <div className="ag-history-title">Recent history</div>
                {transactions.length === 0 ? (
                  <div style={{ color:'#2d3748', fontSize:12, padding:'20px 0' }}>No transactions yet.</div>
                ) : transactions.map((t, i) => (
                  <div key={i} className="ag-txn-row">
                    <span className="ag-txn-amt">+ ₹{parseFloat(t.amount).toLocaleString('en-IN')}</span>
                    <span className="ag-txn-mode">{t.paymentMode || 'CASH'}</span>
                    <span className="ag-txn-date">{new Date(t.transactionDate).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}</span>
                  </div>
                ))}
              </>
            ) : (
              <div className="ag-empty">
                <div className="ag-empty-icon">◈</div>
                <div>Select a customer to record a deposit</div>
                <div style={{ fontSize:11, color:'#2d3748' }}>or use + New to add a customer</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. PROTECTED ROUTE WRAPPER
// ═══════════════════════════════════════════════════════════════════════════════
function ProtectedRoute({ user, allowedRoles, children }) {
  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/login" replace />;
  return children;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 5. APP ROUTER
// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  // Persist user in sessionStorage so refresh doesn't log them out
  const [user, setUser] = useState(() => {
    try {
      const saved = sessionStorage.getItem('pigmypay_user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const handleSetUser = useCallback((userData) => {
    setUser(userData);
    try { sessionStorage.setItem('pigmypay_user', JSON.stringify(userData)); } catch {}
  }, []);

  const handleLogout = useCallback(() => {
    setUser(null);
    try { sessionStorage.removeItem('pigmypay_user'); } catch {}
    window.location.href = '/login';
  }, []);

  return (
    <Router>
      <Routes>
        {/* Public */}
        <Route path="/"       element={<LandingPage />} />
        <Route path="/login"  element={
          user
            ? <Navigate to={user.role === 'AGENT' ? '/agent' : '/admin'} replace />
            : <LoginPage setUser={handleSetUser} />
        } />

        {/* Admin / Manager portal */}
        <Route path="/admin" element={
          <ProtectedRoute user={user} allowedRoles={['ADMIN','MANAGER']}>
            <AdminDashboard user={user} handleLogout={handleLogout} />
          </ProtectedRoute>
        } />

        {/* Agent portal — admins can also preview it */}
        <Route path="/agent" element={
          <ProtectedRoute user={user} allowedRoles={['AGENT','ADMIN','MANAGER']}>
            <AgentDashboard user={user} handleLogout={handleLogout} />
          </ProtectedRoute>
        } />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}