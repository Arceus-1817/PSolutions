import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

// ─── Design Tokens ───────────────────────────────────────────────────────────
const G = {
  bg:        '#0a0c0f',
  surface:   '#111318',
  card:      '#161b22',
  border:    '#1e2530',
  borderHi:  '#2a3441',
  accent:    '#00ff88',
  accentDim: '#00cc6a',
  accentBg:  'rgba(0,255,136,0.06)',
  accentGlow:'rgba(0,255,136,0.15)',
  muted:     '#4a5568',
  text:      '#e2e8f0',
  textSub:   '#718096',
  danger:    '#ff4757',
  warn:      '#ffa502',
  info:      '#3b82f6',
  purple:    '#8b5cf6',
};

// ─── Inject global styles ────────────────────────────────────────────────────
const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@400;500;600;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: ${G.bg}; --surface: ${G.surface}; --card: ${G.card};
    --border: ${G.border}; --border-hi: ${G.borderHi};
    --accent: ${G.accent}; --accent-dim: ${G.accentDim};
    --accent-bg: ${G.accentBg}; --accent-glow: ${G.accentGlow};
    --muted: ${G.muted}; --text: ${G.text}; --text-sub: ${G.textSub};
    --danger: ${G.danger}; --warn: ${G.warn}; --info: ${G.info}; --purple: ${G.purple};
    --r: 12px; --r-lg: 18px;
    --font-display: 'Syne', sans-serif;
    --font-mono: 'DM Mono', monospace;
  }

  body { background: var(--bg); color: var(--text); font-family: var(--font-mono); overflow-x: hidden; }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: var(--surface); }
  ::-webkit-scrollbar-thumb { background: var(--border-hi); border-radius: 2px; }

  @keyframes fadeUp {
    from { opacity:0; transform: translateY(16px); }
    to   { opacity:1; transform: translateY(0); }
  }
  @keyframes pulse-dot {
    0%,100% { box-shadow: 0 0 0 0 rgba(0,255,136,.5); }
    50%      { box-shadow: 0 0 0 6px rgba(0,255,136,0); }
  }
  @keyframes ticker {
    from { transform: translateX(0); }
    to   { transform: translateX(-50%); }
  }
  @keyframes shimmer {
    from { background-position: -200% 0; }
    to   { background-position: 200% 0; }
  }
  @keyframes countUp {
    from { opacity: 0; transform: scale(.9); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes scanline {
    0%   { top: -20%; }
    100% { top: 110%; }
  }

  .fade-up { animation: fadeUp .45s ease both; }
  .fade-up-1 { animation: fadeUp .45s .05s ease both; }
  .fade-up-2 { animation: fadeUp .45s .10s ease both; }
  .fade-up-3 { animation: fadeUp .45s .15s ease both; }
  .fade-up-4 { animation: fadeUp .45s .20s ease both; }
  .fade-up-5 { animation: fadeUp .45s .25s ease both; }

  .skeleton {
    background: linear-gradient(90deg, var(--card) 25%, var(--border) 50%, var(--card) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.4s infinite;
    border-radius: 6px;
  }

  input, select, textarea {
    font-family: var(--font-mono);
    background: var(--surface);
    border: 1px solid var(--border);
    color: var(--text);
    border-radius: var(--r);
    padding: 10px 14px;
    font-size: 13px;
    width: 100%;
    outline: none;
    transition: border-color .2s, box-shadow .2s;
  }
  input:focus, select:focus, textarea:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-glow);
  }
  input::placeholder { color: var(--muted); }

  button { font-family: var(--font-mono); cursor: pointer; border: none; outline: none; transition: all .18s; }

  .btn-primary {
    background: var(--accent);
    color: #000;
    font-weight: 500;
    font-size: 13px;
    padding: 10px 20px;
    border-radius: var(--r);
    letter-spacing: .02em;
  }
  .btn-primary:hover { background: var(--accent-dim); transform: translateY(-1px); box-shadow: 0 4px 20px var(--accent-glow); }
  .btn-primary:active { transform: translateY(0); }

  .btn-ghost {
    background: transparent;
    color: var(--text-sub);
    font-size: 13px;
    padding: 10px 20px;
    border-radius: var(--r);
    border: 1px solid var(--border);
  }
  .btn-ghost:hover { border-color: var(--border-hi); color: var(--text); background: var(--surface); }

  .btn-danger {
    background: rgba(255,71,87,.12);
    color: var(--danger);
    font-size: 13px;
    padding: 8px 16px;
    border-radius: var(--r);
    border: 1px solid rgba(255,71,87,.25);
  }
  .btn-danger:hover { background: rgba(255,71,87,.2); }

  .tag {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 3px 9px; border-radius: 20px; font-size: 11px; font-weight: 500;
  }
  .tag-green  { background: rgba(0,255,136,.1);  color: var(--accent); }
  .tag-red    { background: rgba(255,71,87,.1);  color: var(--danger); }
  .tag-amber  { background: rgba(255,165,2,.1);  color: var(--warn); }
  .tag-blue   { background: rgba(59,130,246,.1); color: var(--info); }
  .tag-purple { background: rgba(139,92,246,.1); color: var(--purple); }
`;

// ─── Mini bar-chart component ────────────────────────────────────────────────
function SparkBar({ data = [], color = G.accent, height = 40 }) {
  const max = Math.max(...data, 1);
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:3, height }}>
      {data.map((v, i) => (
        <div key={i} style={{
          flex: 1,
          height: `${(v / max) * 100}%`,
          minHeight: 3,
          background: i === data.length - 1 ? color : `${color}55`,
          borderRadius: '3px 3px 0 0',
          transition: 'height .4s ease',
        }}/>
      ))}
    </div>
  );
}

// ─── Animated counter ────────────────────────────────────────────────────────
function AnimCount({ value, prefix = '', suffix = '', dur = 1200 }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0; const end = parseFloat(String(value).replace(/[^0-9.]/g,'')) || 0;
    if (end === 0) return;
    const step = end / (dur / 16);
    const t = setInterval(() => {
      start = Math.min(start + step, end);
      setDisplay(Math.floor(start));
      if (start >= end) clearInterval(t);
    }, 16);
    return () => clearInterval(t);
  }, [value]);
  return <>{prefix}{display.toLocaleString('en-IN')}{suffix}</>;
}

// ─── Stat card ───────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, spark, color = G.accent, icon, delay = 0 }) {
  return (
    <div className={`fade-up-${delay}`} style={{
      background: G.card, border: `1px solid ${G.border}`,
      borderRadius: G.rLg, padding: '22px 24px',
      display: 'flex', flexDirection: 'column', gap: 12,
      position: 'relative', overflow: 'hidden',
      transition: 'border-color .2s, box-shadow .2s',
    }}
    onMouseEnter={e => {
      e.currentTarget.style.borderColor = G.borderHi;
      e.currentTarget.style.boxShadow = `0 0 30px rgba(0,0,0,.5)`;
    }}
    onMouseLeave={e => {
      e.currentTarget.style.borderColor = G.border;
      e.currentTarget.style.boxShadow = 'none';
    }}>
      {/* Accent corner */}
      <div style={{
        position:'absolute', top:0, right:0,
        width:60, height:60,
        background:`radial-gradient(circle at top right, ${color}18, transparent 70%)`,
        pointerEvents:'none',
      }}/>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <span style={{ fontSize:11, color: G.textSub, letterSpacing:'.08em', textTransform:'uppercase' }}>
          {label}
        </span>
        {icon && (
          <span style={{
            width:32, height:32, borderRadius:8,
            background:`${color}15`, display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:15,
          }}>{icon}</span>
        )}
      </div>
      <div style={{ fontSize:28, fontFamily:'var(--font-display)', fontWeight:700, color: G.text, lineHeight:1 }}>
        <AnimCount value={value} />
      </div>
      {sub && <div style={{ fontSize:11, color: G.textSub }}>{sub}</div>}
      {spark && <SparkBar data={spark} color={color} height={36} />}
    </div>
  );
}

// ─── Section header ──────────────────────────────────────────────────────────
function SectionHead({ title, sub, action }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
      <div>
        <h2 style={{ fontFamily:'var(--font-display)', fontSize:17, fontWeight:700, color: G.text }}>{title}</h2>
        {sub && <p style={{ fontSize:12, color: G.textSub, marginTop:3 }}>{sub}</p>}
      </div>
      {action}
    </div>
  );
}

// ─── Agent row ───────────────────────────────────────────────────────────────
function AgentRow({ agent, onAction, idx }) {
  const roles = { AGENT:'tag-green', MANAGER:'tag-purple', ADMIN:'tag-blue' };
  const initials = (agent.name || 'NA').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  const colors = ['#00ff88','#8b5cf6','#3b82f6','#ffa502','#ff4757'];
  const col = colors[idx % colors.length];
  return (
    <div style={{
      display:'grid', gridTemplateColumns:'44px 1fr 110px 90px 90px 80px',
      alignItems:'center', gap:16,
      padding:'14px 20px',
      borderBottom: `1px solid ${G.border}`,
      transition:'background .15s',
    }}
    onMouseEnter={e=>e.currentTarget.style.background=G.surface}
    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
      {/* Avatar */}
      <div style={{
        width:36, height:36, borderRadius:10,
        background:`${col}22`, border:`1px solid ${col}44`,
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:13, fontWeight:600, color: col,
        fontFamily:'var(--font-display)',
      }}>{initials}</div>
      {/* Name + email */}
      <div>
        <div style={{ fontSize:13, fontWeight:500, color: G.text }}>{agent.name}</div>
        <div style={{ fontSize:11, color: G.textSub, marginTop:2 }}>{agent.email}</div>
      </div>
      {/* Phone */}
      <div style={{ fontSize:12, color: G.textSub }}>{agent.phoneNumber || '—'}</div>
      {/* Role */}
      <div><span className={`tag ${roles[agent.role] || 'tag-blue'}`}>{agent.role}</span></div>
      {/* Branch */}
      <div style={{ fontSize:12, color: G.textSub }}>{agent.branch?.name || 'HQ'}</div>
      {/* Actions */}
      <div style={{ display:'flex', gap:8 }}>
        <button onClick={() => onAction('view', agent)} style={{
          background:'transparent', border:`1px solid ${G.borderHi}`,
          color: G.textSub, borderRadius:7, padding:'5px 10px', fontSize:11,
          cursor:'pointer', transition:'all .15s',
        }}
        onMouseEnter={e=>{e.currentTarget.style.color=G.text; e.currentTarget.style.borderColor=G.accent;}}
        onMouseLeave={e=>{e.currentTarget.style.color=G.textSub; e.currentTarget.style.borderColor=G.borderHi;}}>
          View
        </button>
      </div>
    </div>
  );
}

// ─── Activity feed item ───────────────────────────────────────────────────────
function ActivityItem({ icon, text, time, color = G.accent }) {
  return (
    <div style={{ display:'flex', gap:12, padding:'12px 0', borderBottom:`1px solid ${G.border}` }}>
      <div style={{
        width:32, height:32, borderRadius:8, flexShrink:0,
        background:`${color}15`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14,
      }}>{icon}</div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:12, color: G.text, lineHeight:1.5 }}>{text}</div>
        <div style={{ fontSize:11, color: G.muted, marginTop:3 }}>{time}</div>
      </div>
    </div>
  );
}

// ─── Modal ───────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div style={{
      position:'fixed', inset:0, zIndex:1000,
      background:'rgba(0,0,0,.7)', backdropFilter:'blur(4px)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:24,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: G.card, border:`1px solid ${G.borderHi}`,
        borderRadius:G.rLg, width:'100%', maxWidth:500,
        animation:'fadeUp .25s ease',
      }}>
        <div style={{
          padding:'20px 24px', borderBottom:`1px solid ${G.border}`,
          display:'flex', justifyContent:'space-between', alignItems:'center',
        }}>
          <h3 style={{ fontFamily:'var(--font-display)', fontSize:16, fontWeight:700 }}>{title}</h3>
          <button onClick={onClose} style={{
            background:'transparent', border:`1px solid ${G.border}`,
            color: G.textSub, borderRadius:8, width:32, height:32, fontSize:18,
            display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
          }}>×</button>
        </div>
        <div style={{ padding:24 }}>{children}</div>
      </div>
    </div>
  );
}

// ─── Ticker bar ───────────────────────────────────────────────────────────────
function TickerBar({ stats }) {
  const items = stats ? [
    `AGENTS  ${stats.agentCount ?? '—'}`,
    `CUSTOMERS  ${stats.customerCount ?? '—'}`,
    `TODAY'S COLLECTIONS  ₹${(stats.todayCollection ?? 0).toLocaleString('en-IN')}`,
    `TOTAL PORTFOLIO  ₹${(stats.totalPortfolio ?? 0).toLocaleString('en-IN')}`,
    `ACTIVE BRANCHES  ${stats.branchCount ?? '—'}`,
  ] : [];
  const text = items.join('   ·   ');
  return (
    <div style={{
      background: G.surface, borderBottom:`1px solid ${G.border}`,
      height:36, overflow:'hidden', display:'flex', alignItems:'center',
    }}>
      <div style={{
        padding:'0 16px', flexShrink:0, fontSize:10,
        color: G.accent, letterSpacing:'.1em', fontWeight:500,
        borderRight:`1px solid ${G.border}`,
      }}>LIVE</div>
      <div style={{ flex:1, overflow:'hidden', position:'relative' }}>
        <div style={{
          display:'inline-block', whiteSpace:'nowrap',
          animation:'ticker 28s linear infinite',
          fontSize:11, color: G.textSub, letterSpacing:'.06em',
        }}>
          {text}{'    ·    '}{text}
        </div>
      </div>
    </div>
  );
}

// ─── Add Agent Form ───────────────────────────────────────────────────────────
function AddAgentForm({ user, branches, onSuccess, onClose }) {
  const [form, setForm] = useState({
    name:'', email:'', phoneNumber:'', password:'', role:'AGENT', branchId:'',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (k, v) => setForm(p => ({ ...p, [k]: v }));

 const submit = async () => {
     if (!form.name || !form.email || !form.password) {
       setError('Name, email and password are required.'); return;
     }
     setLoading(true); setError('');

     const branchPayload = form.branchId ? { id: parseInt(form.branchId) } : null;
     const safeTenantId = user.tenantId || 1;

     try {
       await axios.post('http://localhost:8085/api/users', {
         name: form.name,
         email: form.email,
         phoneNumber: form.phoneNumber,
         password: form.password,
         role: form.role,
         branch: branchPayload,
         tenantId: safeTenantId
       }, { headers: { Authorization: `Bearer ${user.token}` } });

       // CRITICAL FIX: Wait for the parent to pull the fresh data before closing
       await onSuccess();

     } catch (e) {
       const errorMsg = e.response?.data?.message || e.response?.data || 'Failed to create user.';
       setError(typeof errorMsg === 'string' ? errorMsg : 'Server error occurred.');
     } finally {
       setLoading(false);
     }
   };

  // Changed from a Component to a helper function so it doesn't lose focus
  const renderField = (label, k, type='text', opts) => (
    <div style={{ marginBottom:14 }}>
      <label style={{ display:'block', fontSize:11, color: G.textSub, marginBottom:6, letterSpacing:'.06em', textTransform:'uppercase' }}>{label}</label>
      {opts ? (
        <select value={form[k]} onChange={e => handleChange(k, e.target.value)}>
          {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <input type={type} value={form[k]} onChange={e => handleChange(k, e.target.value)} placeholder={label} />
      )}
    </div>
  );

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 16px' }}>
        {renderField('Full name', 'name')}
        {renderField('Phone', 'phoneNumber')}
        {renderField('Email', 'email', 'email')}
        {renderField('Password', 'password', 'password')}
        {renderField('Role', 'role', 'text', [
          { value:'AGENT', label:'Field Agent' },
          { value:'MANAGER', label:'Branch Manager' },
        ])}
        {renderField('Branch', 'branchId', 'text', [
          { value:'', label:'— None / HQ —' },
          ...branches.map(b => ({ value: String(b.id), label: b.name })),
        ])}
      </div>
      {error && (
        <div style={{ background:'rgba(255,71,87,.1)', border:'1px solid rgba(255,71,87,.25)', borderRadius:8, padding:'10px 14px', fontSize:12, color: G.danger, marginBottom:16 }}>
          {error}
        </div>
      )}
      <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
        <button className="btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn-primary" onClick={submit} disabled={loading}>
          {loading ? 'Creating...' : 'Create user'}
        </button>
      </div>
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────
export default function AdminDashboard({ user, handleLogout }) {
  const [agents, setAgents] = useState([]);
  const [branches, setBranches] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [showAddAgent, setShowAddAgent] = useState(false);
  const [showAddBranch, setShowAddBranch] = useState(false);
  const [branchName, setBranchName] = useState('');
  const [branchCity, setBranchCity] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [currentTime, setCurrentTime] = useState(new Date());

  const token = user?.token;
  const tenantId = user?.tenantId ?? 1;
  const authH = { headers: { Authorization: `Bearer ${token}` } };

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const fetchAll = async () => {
      setLoading(true);
      try {
        // NEW: Create a unique timestamp to bust the browser cache!
        const timestamp = new Date().getTime();

        const [agentsRes, branchesRes] = await Promise.all([
          axios.get(`http://localhost:8085/api/users/tenant/${tenantId}?t=${timestamp}`, authH),
          axios.get(`http://localhost:8085/api/branches/tenant/${tenantId}?t=${timestamp}`, authH),
        ]);

        const agentList = Array.isArray(agentsRes.data) ? agentsRes.data : [];
        const branchList = Array.isArray(branchesRes.data) ? branchesRes.data : [];
        setAgents(agentList);
        setBranches(branchList);

        setStats({
          agentCount: agentList.filter(a => a.role === 'AGENT').length,
          managerCount: agentList.filter(a => a.role === 'MANAGER').length,
          branchCount: branchList.length,
          totalPortfolio: 0,
          todayCollection: 0,
          customerCount: 0,
        });
      } catch (e) {
        console.error(e);
      } finally { setLoading(false); }
    };

  useEffect(() => { fetchAll(); }, []);

  const addBranch = async () => {
    if (!branchName) return;
    try {
      await axios.post('http://localhost:8085/api/branches', {
        name: branchName, city: branchCity,
        tenant: { id: tenantId },
      }, authH);
      setBranchName(''); setBranchCity('');
      setShowAddBranch(false); fetchAll();
    } catch (e) { alert(e.response?.data || 'Failed'); }
  };

  const filtered = agents.filter(a => {
    const q = search.toLowerCase();
    const matchQ = !q || a.name?.toLowerCase().includes(q) || a.email?.toLowerCase().includes(q);
    const matchR = roleFilter === 'ALL' || a.role === roleFilter;
    return matchQ && matchR;
  });

  const SPARK = [42,38,55,61,48,72,68,80,75,90,88,95];

  // ── Sidebar tabs ────────────────────────────────────────────────────────────
  const TABS = [
    { id:'overview',  label:'Overview',  icon:'◈' },
    { id:'agents',    label:'Users',     icon:'◉' },
    { id:'branches',  label:'Branches',  icon:'◧' },
    { id:'analytics', label:'Analytics', icon:'◫' },
  ];

  return (
    <>
      <style>{STYLE}</style>

      {/* Ticker */}
      <TickerBar stats={stats} />

      <div style={{ display:'flex', height:'calc(100vh - 36px)', overflow:'hidden' }}>

        {/* ── Sidebar ──────────────────────────────────────────────────────── */}
        <aside style={{
          width:220, flexShrink:0,
          background: G.surface,
          borderRight:`1px solid ${G.border}`,
          display:'flex', flexDirection:'column',
          overflow:'hidden',
        }}>
          {/* Logo */}
          <div style={{
            padding:'24px 20px 20px',
            borderBottom:`1px solid ${G.border}`,
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{
                width:34, height:34, borderRadius:9,
                background: G.accentBg, border:`1px solid ${G.accent}33`,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:16,
              }}>₿</div>
              <div>
                <div style={{ fontFamily:'var(--font-display)', fontSize:15, fontWeight:800, color: G.text, letterSpacing:'-.01em' }}>PigmyPay</div>
                <div style={{ fontSize:10, color: G.textSub, letterSpacing:'.05em' }}>COMMAND CENTER</div>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ padding:'12px 10px', flex:1 }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                width:'100%', display:'flex', alignItems:'center', gap:10,
                padding:'10px 12px', borderRadius:9, marginBottom:2,
                background: tab === t.id ? G.accentBg : 'transparent',
                border: tab === t.id ? `1px solid ${G.accent}33` : '1px solid transparent',
                color: tab === t.id ? G.accent : G.textSub,
                fontSize:13, textAlign:'left', cursor:'pointer',
                transition:'all .15s',
              }}
              onMouseEnter={e => { if(tab !== t.id) e.currentTarget.style.color = G.text; }}
              onMouseLeave={e => { if(tab !== t.id) e.currentTarget.style.color = G.textSub; }}>
                <span style={{ fontSize:14, opacity:.8 }}>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </nav>

          {/* User card */}
          <div style={{
            margin:10, padding:'12px 14px',
            background: G.card, border:`1px solid ${G.border}`,
            borderRadius:10,
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
              <div style={{
                width:32, height:32, borderRadius:8,
                background: G.accentBg, border:`1px solid ${G.accent}33`,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:12, fontWeight:600, color: G.accent,
                fontFamily:'var(--font-display)',
              }}>
                {(user?.name || 'A').charAt(0).toUpperCase()}
              </div>
              <div style={{ minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:500, color: G.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.name || 'Admin'}</div>
                <div style={{ fontSize:10, color: G.textSub }}>{user?.role}</div>
              </div>
            </div>
            <div style={{
              fontSize:10, color: G.muted, fontFamily:'var(--font-mono)',
              marginBottom:10, letterSpacing:'.03em',
            }}>
              {currentTime.toLocaleTimeString('en-IN', { hour12:false })}
            </div>
            <button className="btn-danger" style={{ width:'100%', fontSize:11, padding:'7px' }} onClick={handleLogout}>
              Sign out
            </button>
          </div>
        </aside>

        {/* ── Main content ─────────────────────────────────────────────────── */}
        <main style={{ flex:1, overflowY:'auto', padding:'28px 32px' }}>

          {/* ── OVERVIEW TAB ───────────────────────────────────────────── */}
          {tab === 'overview' && (
            <div>
              <div className="fade-up" style={{ marginBottom:28 }}>
                <h1 style={{ fontFamily:'var(--font-display)', fontSize:26, fontWeight:800, letterSpacing:'-.02em', color: G.text }}>
                  Good {currentTime.getHours() < 12 ? 'morning' : currentTime.getHours() < 17 ? 'afternoon' : 'evening'}, {(user?.name || 'Admin').split(' ')[0]}
                </h1>
                <p style={{ color: G.textSub, fontSize:13, marginTop:5 }}>
                  {currentTime.toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
                </p>
              </div>

              {/* Stat cards */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:16, marginBottom:28 }}>
                <StatCard label="Total agents" value={stats?.agentCount ?? 0} sub="Active field agents" spark={SPARK} color={G.accent} icon="👤" delay={1} />
                <StatCard label="Branches" value={stats?.branchCount ?? 0} sub="Active locations" spark={SPARK.map(v=>v*.7)} color={G.info} icon="🏢" delay={2} />
                <StatCard label="Today's collections" value={stats?.todayCollection ?? 0} sub="₹ collected today" spark={SPARK.map(v=>v*.9)} color={G.warn} icon="💰" delay={3} />
                <StatCard label="Total portfolio" value={stats?.totalPortfolio ?? 0} sub="Cumulative balance" spark={SPARK.map(v=>v*.85)} color={G.purple} icon="📊" delay={4} />
              </div>

              {/* Two-column lower */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 360px', gap:20 }}>
                {/* Recent agents */}
                <div className="fade-up-3" style={{
                  background: G.card, border:`1px solid ${G.border}`,
                  borderRadius:G.rLg, overflow:'hidden',
                }}>
                  <div style={{ padding:'18px 20px', borderBottom:`1px solid ${G.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div>
                      <div style={{ fontFamily:'var(--font-display)', fontSize:15, fontWeight:700 }}>Recent users</div>
                      <div style={{ fontSize:11, color: G.textSub, marginTop:2 }}>Last onboarded</div>
                    </div>
                    <button className="btn-primary" style={{ fontSize:11, padding:'7px 14px' }} onClick={() => setShowAddAgent(true)}>
                      + Add user
                    </button>
                  </div>
                  {loading ? (
                    <div style={{ padding:20 }}>
                      {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height:48, marginBottom:10 }} />)}
                    </div>
                  ) : agents.slice(0,5).map((a, i) => (
                    <AgentRow key={a.id} agent={a} idx={i} onAction={(action, ag) => console.log(action, ag)} />
                  ))}
                  {!loading && agents.length === 0 && (
                    <div style={{ padding:40, textAlign:'center', color: G.muted, fontSize:13 }}>
                      No users yet. Add your first agent above.
                    </div>
                  )}
                </div>

                {/* Activity + quick actions */}
                <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                  {/* Quick actions */}
                  <div className="fade-up-4" style={{
                    background: G.card, border:`1px solid ${G.border}`,
                    borderRadius:G.rLg, padding:20,
                  }}>
                    <div style={{ fontFamily:'var(--font-display)', fontSize:14, fontWeight:700, marginBottom:14 }}>Quick actions</div>
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                      {[
                        { label:'Add field agent', icon:'👤', action: () => setShowAddAgent(true), color: G.accent },
                        { label:'Create branch', icon:'🏢', action: () => setShowAddBranch(true), color: G.info },
                        { label:'Export ledger', icon:'📥', action: () => alert('Export coming in Phase 3'), color: G.warn },
                        { label:'View analytics', icon:'📊', action: () => setTab('analytics'), color: G.purple },
                      ].map(q => (
                        <button key={q.label} onClick={q.action} style={{
                          display:'flex', alignItems:'center', gap:10,
                          background: G.surface, border:`1px solid ${G.border}`,
                          borderRadius:9, padding:'11px 14px',
                          color: G.text, fontSize:12, cursor:'pointer',
                          transition:'all .15s', textAlign:'left',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = q.color+'44'; e.currentTarget.style.background = `${q.color}08`; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = G.border; e.currentTarget.style.background = G.surface; }}>
                          <span style={{ fontSize:14 }}>{q.icon}</span>
                          {q.label}
                          <span style={{ marginLeft:'auto', color: G.muted, fontSize:14 }}>›</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Activity feed */}
                  <div className="fade-up-5" style={{
                    background: G.card, border:`1px solid ${G.border}`,
                    borderRadius:G.rLg, padding:20, flex:1,
                  }}>
                    <div style={{ fontFamily:'var(--font-display)', fontSize:14, fontWeight:700, marginBottom:14 }}>Activity</div>
                    <ActivityItem icon="✅" text="System online and healthy" time="Just now" color={G.accent} />
                    <ActivityItem icon="🔐" text={`Admin login: ${user?.name}`} time={currentTime.toLocaleTimeString('en-IN')} color={G.info} />
                    <ActivityItem icon="🏢" text={`${branches.length} branches loaded`} time="On startup" color={G.warn} />
                    <ActivityItem icon="👥" text={`${agents.length} users in tenant`} time="On startup" color={G.purple} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── AGENTS TAB ─────────────────────────────────────────────── */}
          {tab === 'agents' && (
            <div>
              <div className="fade-up" style={{ marginBottom:24, display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
                <div>
                  <h1 style={{ fontFamily:'var(--font-display)', fontSize:24, fontWeight:800, letterSpacing:'-.02em' }}>User management</h1>
                  <p style={{ color: G.textSub, fontSize:12, marginTop:4 }}>{agents.length} total · {agents.filter(a=>a.role==='AGENT').length} agents · {agents.filter(a=>a.role==='MANAGER').length} managers</p>
                </div>
                <button className="btn-primary" onClick={() => setShowAddAgent(true)}>+ Add user</button>
              </div>

              {/* Filters */}
              <div className="fade-up-1" style={{ display:'flex', gap:10, marginBottom:20 }}>
                <div style={{ flex:1, position:'relative' }}>
                  <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color: G.muted, fontSize:13 }}>🔍</span>
                  <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name or email…" style={{ paddingLeft:34 }} />
                </div>
                {['ALL','AGENT','MANAGER','ADMIN'].map(r => (
                  <button key={r} onClick={() => setRoleFilter(r)} style={{
                    padding:'9px 16px', borderRadius:9, fontSize:11,
                    border:`1px solid ${roleFilter === r ? G.accent+'44' : G.border}`,
                    background: roleFilter === r ? G.accentBg : 'transparent',
                    color: roleFilter === r ? G.accent : G.textSub,
                    cursor:'pointer', transition:'all .15s', letterSpacing:'.04em',
                  }}>{r}</button>
                ))}
              </div>

              {/* Table */}
              <div className="fade-up-2" style={{ background: G.card, border:`1px solid ${G.border}`, borderRadius:G.rLg, overflow:'hidden' }}>
                {/* Header */}
                <div style={{
                  display:'grid', gridTemplateColumns:'44px 1fr 110px 90px 90px 80px',
                  gap:16, padding:'11px 20px',
                  borderBottom:`1px solid ${G.border}`,
                  background: G.surface,
                  fontSize:10, color: G.muted, letterSpacing:'.08em', textTransform:'uppercase',
                }}>
                  <div/>
                  <div>Name</div><div>Phone</div><div>Role</div><div>Branch</div><div>Action</div>
                </div>
                {loading ? (
                  <div style={{ padding:20 }}>
                    {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height:56, marginBottom:8 }} />)}
                  </div>
                ) : filtered.length === 0 ? (
                  <div style={{ padding:60, textAlign:'center', color: G.muted, fontSize:13 }}>
                    {search ? 'No users match your search.' : 'No users yet — add your first agent.'}
                  </div>
                ) : filtered.map((a, i) => (
                  <AgentRow key={a.id} agent={a} idx={i} onAction={(action, ag) => console.log(action, ag)} />
                ))}
              </div>
            </div>
          )}

          {/* ── BRANCHES TAB ──────────────────────────────────────────── */}
          {tab === 'branches' && (
            <div>
              <div className="fade-up" style={{ marginBottom:24, display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
                <div>
                  <h1 style={{ fontFamily:'var(--font-display)', fontSize:24, fontWeight:800, letterSpacing:'-.02em' }}>Branch management</h1>
                  <p style={{ color: G.textSub, fontSize:12, marginTop:4 }}>{branches.length} active branches</p>
                </div>
                <button className="btn-primary" onClick={() => setShowAddBranch(true)}>+ New branch</button>
              </div>

              <div className="fade-up-1" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:16 }}>
                {branches.map((b, i) => {
                  const branchAgents = agents.filter(a => a.branch?.id === b.id);
                  const colors = [G.accent, G.info, G.warn, G.purple, G.danger];
                  const c = colors[i % colors.length];
                  return (
                    <div key={b.id} style={{
                      background: G.card, border:`1px solid ${G.border}`,
                      borderRadius:G.rLg, padding:22, cursor:'pointer',
                      transition:'all .2s', position:'relative', overflow:'hidden',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = c+'55'; e.currentTarget.style.boxShadow = `0 0 30px ${c}10`; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = G.border; e.currentTarget.style.boxShadow = 'none'; }}>
                      <div style={{
                        position:'absolute', top:0, left:0, right:0, height:3,
                        background:`linear-gradient(90deg, ${c}, ${c}44)`,
                        borderRadius:'12px 12px 0 0',
                      }}/>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:14 }}>
                        <div style={{ width:40, height:40, borderRadius:10, background:`${c}15`, border:`1px solid ${c}33`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>🏢</div>
                        <span className="tag tag-green" style={{ alignSelf:'flex-start' }}>Active</span>
                      </div>
                      <div style={{ fontFamily:'var(--font-display)', fontSize:16, fontWeight:700, marginBottom:4 }}>{b.name}</div>
                      <div style={{ fontSize:12, color: G.textSub, marginBottom:16 }}>{b.city || 'City not set'}</div>
                      <div style={{ display:'flex', gap:16 }}>
                        <div>
                          <div style={{ fontSize:18, fontFamily:'var(--font-display)', fontWeight:700, color: c }}>{branchAgents.length}</div>
                          <div style={{ fontSize:10, color: G.muted, letterSpacing:'.06em' }}>AGENTS</div>
                        </div>
                        <div>
                          <div style={{ fontSize:18, fontFamily:'var(--font-display)', fontWeight:700 }}>0</div>
                          <div style={{ fontSize:10, color: G.muted, letterSpacing:'.06em' }}>CUSTOMERS</div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Empty state */}
                {branches.length === 0 && (
                  <div style={{
                    gridColumn:'1 / -1', padding:60, textAlign:'center',
                    background: G.card, border:`1px dashed ${G.borderHi}`,
                    borderRadius:G.rLg, color: G.muted, fontSize:13,
                  }}>
                    No branches yet. Create your first branch to assign agents.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── ANALYTICS TAB ──────────────────────────────────────────── */}
          {tab === 'analytics' && (
            <div>
              <div className="fade-up" style={{ marginBottom:28 }}>
                <h1 style={{ fontFamily:'var(--font-display)', fontSize:24, fontWeight:800, letterSpacing:'-.02em' }}>Analytics</h1>
                <p style={{ color: G.textSub, fontSize:12, marginTop:4 }}>Portfolio performance overview</p>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
                {[
                  { label:'Collections by month', data:[28,45,32,61,55,70,68,82,90,78,95,88], color: G.accent },
                  { label:'New customers / month', data:[5,8,6,12,10,15,14,18,20,17,22,19], color: G.info },
                  { label:'Active agents trend', data:[2,2,3,3,4,4,5,5,6,6,7,7], color: G.purple },
                  { label:'Portfolio growth (₹K)', data:[80,120,110,160,150,190,185,220,240,210,260,255], color: G.warn },
                ].map((chart, i) => (
                  <div key={i} className={`fade-up-${i+1}`} style={{
                    background: G.card, border:`1px solid ${G.border}`,
                    borderRadius:G.rLg, padding:22,
                  }}>
                    <div style={{ fontFamily:'var(--font-display)', fontSize:14, fontWeight:700, marginBottom:6 }}>{chart.label}</div>
                    <div style={{ fontSize:11, color: G.textSub, marginBottom:18 }}>Last 12 months</div>
                    <SparkBar data={chart.data} color={chart.color} height={80} />
                    <div style={{ display:'flex', justifyContent:'space-between', marginTop:12, fontSize:11, color: G.muted }}>
                      <span>Jan</span><span>Mar</span><span>Jun</span><span>Sep</span><span>Dec</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coming soon banner */}
              <div className="fade-up-5" style={{
                marginTop:20, padding:24,
                background: G.card, border:`1px solid ${G.accentGlow}`,
                borderRadius:G.rLg, textAlign:'center',
              }}>
                <div style={{ fontSize:22, marginBottom:8 }}>📡</div>
                <div style={{ fontFamily:'var(--font-display)', fontSize:16, fontWeight:700, marginBottom:6 }}>Live data connects in Phase 3</div>
                <div style={{ fontSize:13, color: G.textSub }}>Charts above show mock trends. Once transaction volume grows, this panel will stream real portfolio metrics from your MySQL database.</div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ── MODALS ──────────────────────────────────────────────────────────── */}
            {showAddAgent && (
              <Modal title="Add new user" onClose={() => setShowAddAgent(false)}>
                <AddAgentForm
                  user={user}
                  branches={branches}
                  onSuccess={async () => {
                    setSearch('');
                    setRoleFilter('ALL');

                    // NEW: Give MySQL a tiny 300ms head start to finish saving
                    await new Promise(resolve => setTimeout(resolve, 300));

                    await fetchAll();
                    setShowAddAgent(false);
                  }}
                  onClose={() => setShowAddAgent(false)}
                />
              </Modal>
            )}

      {showAddBranch && (
        <Modal title="Create new branch" onClose={() => setShowAddBranch(false)}>
          <div style={{ marginBottom:14 }}>
            <label style={{ display:'block', fontSize:11, color: G.textSub, marginBottom:6, letterSpacing:'.06em', textTransform:'uppercase' }}>Branch name</label>
            <input value={branchName} onChange={e=>setBranchName(e.target.value)} placeholder="e.g. Shivaji Nagar Branch" />
          </div>
          <div style={{ marginBottom:20 }}>
            <label style={{ display:'block', fontSize:11, color: G.textSub, marginBottom:6, letterSpacing:'.06em', textTransform:'uppercase' }}>City</label>
            <input value={branchCity} onChange={e=>setBranchCity(e.target.value)} placeholder="e.g. Pune" />
          </div>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
            <button className="btn-ghost" onClick={() => setShowAddBranch(false)}>Cancel</button>
            <button className="btn-primary" onClick={addBranch}>Create branch</button>
          </div>
        </Modal>
      )}
    </>
  );
}