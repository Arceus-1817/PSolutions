import { useState, useEffect } from 'react';
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
  rLg:       '18px',
};

// ─── Global styles ────────────────────────────────────────────────────────────
const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@400;600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg:${G.bg};--surface:${G.surface};--card:${G.card};
    --border:${G.border};--border-hi:${G.borderHi};
    --accent:${G.accent};--accent-dim:${G.accentDim};
    --accent-bg:${G.accentBg};--accent-glow:${G.accentGlow};
    --muted:${G.muted};--text:${G.text};--text-sub:${G.textSub};
    --danger:${G.danger};--warn:${G.warn};--info:${G.info};--purple:${G.purple};
    --r:12px;--r-lg:18px;
    --font-display:'Syne',sans-serif;
    --font-mono:'DM Mono',monospace;
  }
  body{background:var(--bg);color:var(--text);font-family:var(--font-mono);overflow-x:hidden;}
  ::-webkit-scrollbar{width:4px;}
  ::-webkit-scrollbar-track{background:var(--surface);}
  ::-webkit-scrollbar-thumb{background:var(--border-hi);border-radius:2px;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
  @keyframes ticker{from{transform:translateX(0)}to{transform:translateX(-50%)}}
  @keyframes shimmer{from{background-position:-200% 0}to{background-position:200% 0}}
  .fade-up{animation:fadeUp .4s ease both}
  .fade-up-1{animation:fadeUp .4s .04s ease both}
  .fade-up-2{animation:fadeUp .4s .08s ease both}
  .fade-up-3{animation:fadeUp .4s .12s ease both}
  .fade-up-4{animation:fadeUp .4s .16s ease both}
  .fade-up-5{animation:fadeUp .4s .20s ease both}
  .skeleton{background:linear-gradient(90deg,var(--card) 25%,var(--border) 50%,var(--card) 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;border-radius:6px;}
  input,select,textarea{font-family:var(--font-mono);background:var(--surface);border:1px solid var(--border);color:var(--text);border-radius:var(--r);padding:10px 14px;font-size:13px;width:100%;outline:none;transition:border-color .2s,box-shadow .2s;}
  input:focus,select:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-glow);}
  input:disabled{opacity:0.6;cursor:not-allowed;}
  input::placeholder{color:var(--muted);}
  button{font-family:var(--font-mono);cursor:pointer;border:none;outline:none;transition:all .18s;}
  .btn-primary{background:var(--accent);color:#000;font-weight:500;font-size:13px;padding:10px 20px;border-radius:var(--r);letter-spacing:.02em;}
  .btn-primary:hover:not(:disabled){background:var(--accent-dim);transform:translateY(-1px);box-shadow:0 4px 20px var(--accent-glow);}
  .btn-primary:disabled{opacity:.5;cursor:not-allowed;transform:none;}
  .btn-ghost{background:transparent;color:var(--text-sub);font-size:13px;padding:10px 20px;border-radius:var(--r);border:1px solid var(--border);}
  .btn-ghost:hover{border-color:var(--border-hi);color:var(--text);background:var(--surface);}
  .btn-danger{background:rgba(255,71,87,.12);color:var(--danger);font-size:12px;padding:7px 14px;border-radius:var(--r);border:1px solid rgba(255,71,87,.25);}
  .btn-danger:hover{background:rgba(255,71,87,.22);}
  .btn-warn{background:rgba(255,165,2,.1);color:var(--warn);font-size:12px;padding:7px 14px;border-radius:var(--r);border:1px solid rgba(255,165,2,.25);}
  .btn-warn:hover{background:rgba(255,165,2,.2);}
  .tag{display:inline-flex;align-items:center;gap:5px;padding:3px 9px;border-radius:20px;font-size:11px;font-weight:500;}
  .tag-green{background:rgba(0,255,136,.1);color:var(--accent);}
  .tag-red{background:rgba(255,71,87,.1);color:var(--danger);}
  .tag-amber{background:rgba(255,165,2,.1);color:var(--warn);}
  .tag-blue{background:rgba(59,130,246,.1);color:var(--info);}
  .tag-purple{background:rgba(139,92,246,.1);color:var(--purple);}
`;


// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt  = (n) => Number(n || 0).toLocaleString('en-IN');
const fmtR = (n) => `₹${fmt(n)}`;
const colors = ['#00ff88','#8b5cf6','#3b82f6','#ffa502','#ff4757','#06b6d4'];
const roleTag = { AGENT:'tag-green', MANAGER:'tag-purple', ADMIN:'tag-blue' };

function initials(name = 'NA') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

// ─── Components ───────────────────────────────────────────────────────────────
function SparkBar({ data = [], color = '#00ff88', height = 36 }) {
  const max = Math.max(...data, 1);
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:3, height }}>
      {data.map((v, i) => (
        <div key={i} style={{
          flex:1, minHeight:3, borderRadius:'3px 3px 0 0',
          height:`${(v / max) * 100}%`,
          background: i === data.length - 1 ? color : `${color}55`,
          transition:'height .4s ease',
        }}/>
      ))}
    </div>
  );
}

function AnimCount({ value = 0, prefix = '', dur = 1000 }) {
  const [disp, setDisp] = useState(0);
  useEffect(() => {
    let s = 0;
    const end = parseFloat(String(value).replace(/[^0-9.]/g, '')) || 0;
    if (!end) return;
    const step = end / (dur / 16);
    const t = setInterval(() => {
      s = Math.min(s + step, end);
      setDisp(Math.floor(s));
      if (s >= end) clearInterval(t);
    }, 16);
    return () => clearInterval(t);
  }, [value]);
  return <>{prefix}{disp.toLocaleString('en-IN')}</>;
}

function StatCard({ label, value, prefix = '', sub, spark, color = '#00ff88', icon, delay = 1 }) {
  return (
    <div className={`fade-up-${delay}`} style={{
      background:G.card, border:`1px solid ${G.border}`, borderRadius:G.rLg,
      padding:'22px 24px', display:'flex', flexDirection:'column', gap:12,
      position:'relative', overflow:'hidden', transition:'border-color .2s, box-shadow .2s',
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = G.borderHi; e.currentTarget.style.boxShadow='0 0 30px rgba(0,0,0,.5)'; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = G.border; e.currentTarget.style.boxShadow='none'; }}>
      <div style={{ position:'absolute', top:0, right:0, width:60, height:60, background:`radial-gradient(circle at top right,${color}18,transparent 70%)`, pointerEvents:'none' }}/>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <span style={{ fontSize:11, color:G.textSub, letterSpacing:'.08em', textTransform:'uppercase' }}>{label}</span>
        {icon && <span style={{ width:32, height:32, borderRadius:8, background:`${color}15`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15 }}>{icon}</span>}
      </div>
      <div style={{ fontSize:28, fontFamily:'var(--font-display)', fontWeight:700, color:G.text, lineHeight:1 }}>
        <AnimCount value={value} prefix={prefix} />
      </div>
      {sub && <div style={{ fontSize:11, color:G.textSub }}>{sub}</div>}
      {spark && <SparkBar data={spark} color={color} height={36} />}
    </div>
  );
}

function Modal({ title, onClose, children, maxWidth = 520 }) {
  return (
    <div style={{
      position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,.75)', backdropFilter:'blur(5px)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:24,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:G.card, border:`1px solid ${G.borderHi}`, borderRadius:G.rLg, width:'100%', maxWidth, animation:'fadeUp .22s ease', maxHeight:'90vh', overflowY:'auto' }}>
        <div style={{ padding:'18px 24px', borderBottom:`1px solid ${G.border}`, display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, background:G.card, zIndex:10 }}>
          <h3 style={{ fontFamily:'var(--font-display)', fontSize:16, fontWeight:700 }}>{title}</h3>
          <button onClick={onClose} style={{ background:'transparent', border:`1px solid ${G.border}`, color:G.textSub, borderRadius:8, width:32, height:32, fontSize:18, display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
        </div>
        <div style={{ padding:24 }}>{children}</div>
      </div>
    </div>
  );
}

function field(label, value, onChange, opts = {}) {
  const { type = 'text', placeholder, options, disabled = false } = opts;
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ display:'block', fontSize:11, color:G.textSub, marginBottom:6, letterSpacing:'.06em', textTransform:'uppercase' }}>{label}</label>
      {options ? (
        <select value={value} onChange={e => onChange(e.target.value)} disabled={disabled}>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder || label} disabled={disabled} />
      )}
    </div>
  );
}

// ─── Ticker Bar ───────────────────────────────────────────────────────────────
function TickerBar({ stats }) {
  const items = stats ? [
    `AGENTS  ${stats.agentCount ?? '—'}`,
    `CUSTOMERS  ${stats.customerCount ?? '—'}`,
    `BRANCHES  ${stats.branchCount ?? '—'}`,
    `TODAY'S COLLECTIONS  ${fmtR(stats.todayCollection)}`,
    `TOTAL PORTFOLIO  ${fmtR(stats.totalPortfolio)}`,
    `TODAY'S TXN COUNT  ${stats.todayTxnCount ?? 0}`,
  ] : ['Loading live data…'];
  const text = items.join('   ·   ');
  return (
    <div style={{ background:G.surface, borderBottom:`1px solid ${G.border}`, height:36, overflow:'hidden', display:'flex', alignItems:'center' }}>
      <div style={{ padding:'0 16px', flexShrink:0, fontSize:10, color:G.accent, letterSpacing:'.1em', fontWeight:500, borderRight:`1px solid ${G.border}` }}>LIVE</div>
      <div style={{ flex:1, overflow:'hidden' }}>
        <div style={{ display:'inline-block', whiteSpace:'nowrap', animation:'ticker 32s linear infinite', fontSize:11, color:G.textSub, letterSpacing:'.06em' }}>
          {text}{'    ·    '}{text}
        </div>
      </div>
    </div>
  );
}

// ─── Forms & Modals ───────────────────────────────────────────────────────────
function AddAgentForm({ user, branches, onSuccess, onClose }) {
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [phone, setPhone]       = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole]         = useState('AGENT');
  const [branchId, setBranch]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const submit = async () => {
    if (!name || !email || !password) { setError('Name, email and password are required.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true); setError('');
    try {
      await axios.post('http://localhost:8085/api/users', {
        name, email, phoneNumber: phone, password, role,
        tenantId: user.tenantId,
        branchId: branchId ? parseInt(branchId) : null,
      }, { headers: { Authorization: `Bearer ${user.token}` } });
      await onSuccess();
    } catch (e) {
      setError(e.response?.data?.message || typeof e.response?.data === 'string' ? e.response.data : 'Failed to create user.');
    } finally { setLoading(false); }
  };

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 16px' }}>
        {field('Full name',  name,     setName)}
        {field('Phone',      phone,    setPhone,    { placeholder:'Phone number' })}
        {field('Email',      email,    setEmail,    { type:'email' })}
        {field('Password',   password, setPassword, { type:'password', placeholder:'Min 6 characters' })}
        {field('Role',       role,     setRole,     { options:[
          { value:'AGENT',   label:'Field Agent' },
          { value:'MANAGER', label:'Branch Manager' },
        ]})}
        {field('Branch',     branchId, setBranch,   { options:[
          { value:'', label:'— None / HQ —' },
          ...branches.map(b => ({ value: String(b.id), label: b.name })),
        ]})}
      </div>
      {error && <div style={{ background:'rgba(255,71,87,.1)', border:'1px solid rgba(255,71,87,.25)', borderRadius:8, padding:'10px 14px', fontSize:12, color:G.danger, marginBottom:16 }}>{error}</div>}
      <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
        <button className="btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn-primary" onClick={submit} disabled={loading}>{loading ? 'Creating…' : 'Create user'}</button>
      </div>
    </div>
  );
}

function EditUserModal({ agent, branches, token, onSuccess, onClose }) {
  const [name,     setName]    = useState(agent.name || '');
  const [phone,    setPhone]   = useState(agent.phoneNumber || '');
  const [role,     setRole]    = useState(agent.role || 'AGENT');
  const [branchId, setBranch]  = useState(agent.branch?.id ? String(agent.branch.id) : '');
  const [newPass,  setNewPass] = useState('');
  const [loading,  setLoading] = useState(false);
  const [error,    setError]   = useState('');
  const [success,  setSuccess] = useState('');

const authH = { headers: { Authorization: "Bearer " + token } };
  const saveDetails = async () => {
    setLoading(true); setError(''); setSuccess('');
    try {
      await axios.put(`http://localhost:8085/api/users/${agent.id}`, {
        name, phoneNumber: phone, role,
        branchId: branchId ? parseInt(branchId) : null,
      }, authH);
      setSuccess('User updated.');
      await onSuccess();
    } catch (e) {
      setError(e.response?.data?.message || 'Update failed.');
    } finally { setLoading(false); }
  };

  const resetPass = async () => {
    if (!newPass || newPass.length < 6) { setError('Password must be at least 6 chars.'); return; }
    setLoading(true); setError(''); setSuccess('');
    try {
      await axios.patch(`http://localhost:8085/api/users/${agent.id}/password`, { password: newPass }, authH);
      setSuccess('Password reset.'); setNewPass('');
    } catch (e) {
      setError(e.response?.data?.message || 'Reset failed.');
    } finally { setLoading(false); }
  };

  const deleteUser = async () => {
    if (!window.confirm(`Delete ${agent.name}? This cannot be undone.`)) return;
    setLoading(true);
    try {
      await axios.delete(`http://localhost:8085/api/users/${agent.id}`, authH);
      await onSuccess();
      onClose();
    } catch (e) {
      setError(e.response?.data?.message || 'Delete failed. Agent might be tied to existing customers.');
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 16px' }}>
        {field('Name',   name,  setName)}
        {field('Phone',  phone, setPhone)}
        {field('Role',   role,  setRole, { options:[
          { value:'AGENT',   label:'Field Agent' },
          { value:'MANAGER', label:'Branch Manager' },
          { value:'ADMIN',   label:'Admin' },
        ]})}
        {field('Branch', branchId, setBranch, { options:[
          { value:'', label:'— None / HQ —' },
          ...branches.map(b => ({ value: String(b.id), label: b.name })),
        ]})}
      </div>
      <button className="btn-primary" style={{ width:'100%', marginBottom:20 }} onClick={saveDetails} disabled={loading}>
        {loading ? 'Saving…' : 'Save changes'}
      </button>

      <div style={{ borderTop:`1px solid ${G.border}`, paddingTop:18, marginBottom:16 }}>
        <div style={{ fontSize:11, color:G.textSub, letterSpacing:'.06em', textTransform:'uppercase', marginBottom:10 }}>Reset password</div>
        <div style={{ display:'flex', gap:10 }}>
          <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="New password (min 6 chars)" style={{ flex:1 }} />
          <button className="btn-warn" onClick={resetPass} disabled={loading}>Reset</button>
        </div>
      </div>

      {error   && <div style={{ background:'rgba(255,71,87,.1)', border:'1px solid rgba(255,71,87,.25)', borderRadius:8, padding:'10px 14px', fontSize:12, color:G.danger, marginBottom:12 }}>{error}</div>}
      {success && <div style={{ background:'rgba(0,255,136,.08)', border:'1px solid rgba(0,255,136,.2)', borderRadius:8, padding:'10px 14px', fontSize:12, color:G.accent, marginBottom:12 }}>{success}</div>}

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', borderTop:`1px solid ${G.border}`, paddingTop:16 }}>
        <button className="btn-danger" onClick={deleteUser} disabled={loading}>Delete user</button>
        <button className="btn-ghost" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

function CustomerProfileModal({ customer, token, onSuccess, onClose }) {
  const [tab, setTab] = useState('loans');
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  // KYC
  const [aadhar, setAadhar] = useState(customer.aadharNumber || '');
  const [pan, setPan] = useState(customer.panNumber || '');
  const [address, setAddress] = useState(customer.residentialAddress || '');
  const [gName, setGName] = useState(customer.guarantorName || '');
  const [gPhone, setGPhone] = useState(customer.guarantorPhoneNumber || '');

  // Loan Engine
  const [principal, setPrincipal] = useState('');
  const [interestRate, setInterestRate] = useState('10');

  const authH = { headers: { Authorization: `Bearer ${token}` } };

  const fetchLoans = async () => {
    try {
      const res = await axios.get(`http://localhost:8085/api/loans/customer/${customer.id}`, authH);
      setLoans(Array.isArray(res.data) ? res.data : []);
    } catch (e) { console.error("Loans missing/403"); } finally { setLoading(false); }
  };

  useEffect(() => { fetchLoans(); }, []);

  const saveKyc = async () => {
    setLoading(true);
    try {
      await axios.put(`http://localhost:8085/api/customers/${customer.id}/kyc`, {
        aadharNumber: aadhar, panNumber: pan, residentialAddress: address, guarantorName: gName, guarantorPhoneNumber: gPhone
      }, authH);
      alert('KYC Updated Successfully!');
      onSuccess();
    } catch (e) { alert('KYC Update Failed (Endpoint might be missing)'); } finally { setLoading(false); }
  };

  const issueLoan = async () => {
    if (!principal || principal <= 0) return alert('Enter a valid principal amount.');
    setLoading(true);
    try {
      await axios.post(`http://localhost:8085/api/loans/issue/${customer.id}`, {
        principalAmount: parseFloat(principal), interestRate: parseFloat(interestRate)
      }, authH);
      setPrincipal('');
      await fetchLoans();
      onSuccess();
    } catch (e) { alert('Failed to issue loan. (Endpoint might be missing)'); } finally { setLoading(false); }
  };

  const pAmt = parseFloat(principal) || 0;
  const iRate = parseFloat(interestRate) || 0;
  const calcInterest = pAmt * (iRate / 100);
  const calcTotal = pAmt + calcInterest;
  const calcDaily = Math.ceil(calcTotal / 100);

  return (
    <div>
      <div style={{ display:'flex', gap:16, alignItems:'center', paddingBottom:20, borderBottom:`1px solid ${G.border}`, marginBottom:20 }}>
        <div style={{ width:48, height:48, borderRadius:12, background:`${G.accent}22`, border:`1px solid ${G.accent}44`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:700, color:G.accent, fontFamily:'var(--font-display)' }}>
          {initials(customer.name)}
        </div>
        <div>
          <div style={{ fontSize:18, fontWeight:700, color:G.text }}>{customer.name}</div>
          <div style={{ fontSize:12, color:G.textSub, marginTop:2 }}>ACC: {customer.accountNumber} · <span className={customer.kycStatus === 'VERIFIED' ? 'tag tag-green' : 'tag tag-amber'}>{customer.kycStatus || 'PENDING KYC'}</span></div>
        </div>
      </div>

      <div style={{ display:'flex', gap:10, marginBottom:20 }}>
        <button onClick={()=>setTab('loans')} className={tab === 'loans' ? 'btn-primary' : 'btn-ghost'} style={{flex:1}}>Loan Engine</button>
        <button onClick={()=>setTab('kyc')} className={tab === 'kyc' ? 'btn-primary' : 'btn-ghost'} style={{flex:1}}>KYC Profile</button>
      </div>

      {tab === 'loans' && (
        <div className="fade-up">
          <div style={{ background:G.surface, border:`1px solid ${G.border}`, borderRadius:12, padding:16, marginBottom:20 }}>
            <h4 style={{ fontSize:12, color:G.textSub, textTransform:'uppercase', letterSpacing:'1px', marginBottom:12 }}>Issue New Loan</h4>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 16px' }}>
              {field('Principal Amount (₹)', principal, setPrincipal, { type: 'number', placeholder: 'e.g. 10000' })}
              {field('Flat Interest Rate (%)', interestRate, setInterestRate, { type: 'number' })}
            </div>
            {pAmt > 0 && (
              <div style={{ display:'flex', justifyContent:'space-between', background:G.bg, padding:'12px 16px', borderRadius:8, border:`1px solid ${G.borderHi}`, marginBottom:16 }}>
                <div><div style={{ fontSize:10, color:G.textSub }}>Total Due</div><div style={{ color:G.warn, fontWeight:600 }}>{fmtR(calcTotal)}</div></div>
                <div><div style={{ fontSize:10, color:G.textSub }}>Daily EMI (100 days)</div><div style={{ color:G.accent, fontWeight:600 }}>{fmtR(calcDaily)} / day</div></div>
              </div>
            )}
            <button className="btn-primary" style={{ width:'100%' }} onClick={issueLoan} disabled={loading || pAmt <= 0}>
              {loading ? 'Processing...' : 'Authorize & Issue Loan'}
            </button>
          </div>

          <h4 style={{ fontSize:12, color:G.textSub, textTransform:'uppercase', letterSpacing:'1px', marginBottom:12 }}>Active & Past Loans</h4>
          {loans.length === 0 ? <p style={{ fontSize:13, color:G.muted }}>No loan history found.</p> : loans.map(l => (
            <div key={l.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', background:G.surface, padding:'12px 16px', borderRadius:8, border:`1px solid ${G.border}`, marginBottom:8 }}>
              <div>
                <div style={{ fontSize:14, color:G.text, fontWeight:500 }}>{fmtR(l.principalAmount)} <span style={{ fontSize:11, color:G.textSub }}>@ {l.interestRate}%</span></div>
                <div style={{ fontSize:11, color:G.muted, marginTop:4 }}>Paid: {fmtR(l.amountPaid)} / {fmtR(l.totalAmountDue)}</div>
              </div>
              <span className={l.status === 'ACTIVE' ? 'tag tag-green' : 'tag tag-amber'}>{l.status}</span>
            </div>
          ))}
        </div>
      )}

      {tab === 'kyc' && (
        <div className="fade-up">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 16px' }}>
            {field('Aadhar Number', aadhar, setAadhar, { placeholder: '12-digit UIDAI' })}
            {field('PAN Card', pan, setPan, { placeholder: '10-char Alphanumeric' })}
            <div style={{ gridColumn:'1 / -1' }}>{field('Residential Address', address, setAddress, { placeholder: 'Full local address' })}</div>
            <div style={{ gridColumn:'1 / -1', borderTop:`1px solid ${G.border}`, paddingTop:16, marginTop:8, fontSize:12, color:G.textSub, fontWeight:600 }}>GUARANTOR DETAILS</div>
            {field('Guarantor Name', gName, setGName)}
            {field('Guarantor Phone', gPhone, setGPhone)}
          </div>
          <button className="btn-primary" style={{ width:'100%', marginTop:10 }} onClick={saveKyc} disabled={loading}>
            {loading ? 'Saving...' : 'Verify & Save KYC'}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminDashboard({ user, handleLogout }) {
  // State
  const [agents, setAgents]       = useState([]);
  const [branches, setBranches]   = useState([]);
  const [customers, setCustomers] = useState([]);
  const [activity, setActivity]   = useState([]);
  const [stats, setStats]         = useState(null);
  const [loading, setLoading]     = useState(true);
  const [pendingCash, setPendingCash] = useState({});
  // Route & Logistics State
    const [routes, setRoutes] = useState([]);
    const [selectedRoute, setSelectedRoute] = useState(null);
    const [routeCustomers, setRouteCustomers] = useState([]);
    const [draggedIdx, setDraggedIdx] = useState(null);

  const [tab, setTab]             = useState('overview');
  const [clock, setClock]         = useState(new Date());

  // Search & Filter State
  const [search, setSearch]             = useState('');
  const [custSearch, setCustSearch]     = useState('');
  const [roleFilter, setRoleFilter]     = useState('ALL');

  // Modal State
  const [showAddAgent, setShowAddAgent]   = useState(false);
  const [showAddBranch, setShowAddBranch] = useState(false);
  const [editAgent, setEditAgent]         = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Form State (Branch)
  const [branchName, setBranchName] = useState('');
  const [branchCity, setBranchCity] = useState('');

  const token = user?.token;
  const tenantId = user?.tenantId ?? 1;
  const authH = { headers: { Authorization: `Bearer ${token}` } };

  // Clock
  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // ─── THE BLAST SHIELD REWRITE ───
  const fetchAll = async () => {
    setLoading(true);
    const ts = Date.now();

    // Helper to safely unwrap objects if Java returns { data: [...] } instead of pure arrays
    const extractArray = (res) => {
      if (!res || !res.data) return [];
      if (Array.isArray(res.data)) return res.data;
      if (Array.isArray(res.data.data)) return res.data.data;
      if (Array.isArray(res.data.users)) return res.data.users;
      if (Array.isArray(res.data.content)) return res.data.content;
      return [];
    };

    try {
        const settleRes = await axios.get(`http://localhost:8085/api/settlements/pending/${tenantId}?t=${ts}`, authH);
        setPendingCash(settleRes.data || {});
      } catch(e) { console.warn("Settlement API blocked"); }

    try {
            const routesRes = await axios.get(`http://localhost:8085/api/routes?t=${ts}`, authH);
            setRoutes(extractArray(routesRes));
          } catch (e) { console.warn("Routes API missing"); }

    try {
      // 1. Core Data
      const [agentsRes, branchesRes] = await Promise.all([
        axios.get(`http://localhost:8085/api/users/tenant/${tenantId}?t=${ts}`, authH),
        axios.get(`http://localhost:8085/api/branches/tenant/${tenantId}?t=${ts}`, authH),
      ]);

      const agentList = extractArray(agentsRes);
      const branchList = extractArray(branchesRes);
      setAgents(agentList);
      setBranches(branchList);

      // 2. Customers Data
      let customerList = [];
      try {
        const custRes = await axios.get(`http://localhost:8085/api/customers/tenant/${tenantId}?t=${ts}`, authH);
        customerList = extractArray(custRes);
        setCustomers(customerList);
      } catch (e) { console.warn("Customer API missing/blocked."); }

      // 3. Transaction/Activity Data
      try {
        const txRes = await axios.get(`http://localhost:8085/api/transactions/recent/${tenantId}?t=${ts}`, authH);
        setActivity(extractArray(txRes));
      } catch (e) { console.warn("Transaction API missing/blocked."); }

      // 4. Stats Data
      try {
        const statsRes = await axios.get(`http://localhost:8085/api/stats/tenant/${tenantId}?t=${ts}`, authH);
        setStats(statsRes.data);
      } catch (e) {
        console.warn("Stats API missing/blocked. Using UI fallbacks.");
        setStats({
          agentCount: agentList.filter(a => a.role === 'AGENT').length,
          managerCount: agentList.filter(a => a.role === 'MANAGER').length,
          branchCount: branchList.length,
          customerCount: customerList.length,
          todayCollection: 0,
          totalPortfolio: 0,
        });
      }

    } catch (e) {
      console.error("Critical API Failure: Core data could not load.", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // --- ACTIONS ---
  const addBranch = async () => {
    if (!branchName) return;
    try {
      await axios.post('http://localhost:8085/api/branches', {
        name: branchName, city: branchCity, tenant: { id: tenantId },
      }, authH);
      setBranchName(''); setBranchCity('');
      setShowAddBranch(false);
      fetchAll();
    } catch (e) { alert(e.response?.data || 'Failed'); }
  };

  // Filter Logic
  const filteredAgents = agents.filter(a => {
    const q = search.toLowerCase();
    const mQ = !q || a.name?.toLowerCase().includes(q) || a.email?.toLowerCase().includes(q);
    const mR = roleFilter === 'ALL' || a.role === roleFilter;
    return mQ && mR;
  });

  const filteredCustomers = customers.filter(c => {
    const q = custSearch.toLowerCase();
    return !q || c.name?.toLowerCase().includes(q) || c.accountNumber?.includes(q);
  });

  const SPARK = [42,38,55,61,48,72,68,80,75,90,88,95];
  const hour  = clock.getHours();
  const greeting = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';

  // ── 🛡️ 4-TIER UI FILTER ──
    // This automatically hides tabs if the user's role isn't in the 'roles' array.
    const TABS = [
      { id:'overview',   label:'Overview',   icon:'◈', roles: ['ADMIN', 'MANAGER'] },
      { id:'settlements',label:'Settlements',icon:'🤝', roles: ['ADMIN', 'MANAGER'] },
      { id:'logistics',  label:'Logistics',  icon:'🗺️', roles: ['ADMIN', 'MANAGER'] },
      { id:'customers',  label:'Customers',  icon:'◎', roles: ['ADMIN', 'MANAGER'] },
      { id:'agents',     label:'Users',      icon:'◉', roles: ['ADMIN', 'MANAGER'] },

      // 🔒 RESTRICTED TABS: Only Company Admins can see these
      { id:'branches',   label:'Branches',   icon:'◧', roles: ['ADMIN'] },
      { id:'analytics',  label:'Analytics',  icon:'◫', roles: ['ADMIN'] },
    ].filter(t => t.roles.includes(user?.role)); // <-- This filter is the magic security key

  return (
    <>
      <style>{STYLE}</style>
      <TickerBar stats={stats} />

      <div style={{ display:'flex', height:'calc(100vh - 36px)', overflow:'hidden' }}>

        {/* ── Sidebar ───────────────────────────────────────────────────── */}
        <aside style={{ width:220, flexShrink:0, background:G.surface, borderRight:`1px solid ${G.border}`, display:'flex', flexDirection:'column', overflow:'hidden' }}>
          {/* Logo */}
          <div style={{ padding:'22px 20px 18px', borderBottom:`1px solid ${G.border}` }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:34, height:34, borderRadius:9, background:G.accentBg, border:`1px solid ${G.accent}33`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>₿</div>
              <div>
                <div style={{ fontFamily:'var(--font-display)', fontSize:15, fontWeight:800, color:G.text, letterSpacing:'-.01em' }}>PigmyPay</div>
                <div style={{ fontSize:10, color:G.textSub, letterSpacing:'.05em' }}>COMMAND CENTER</div>
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
                fontSize:13, textAlign:'left', cursor:'pointer', transition:'all .15s',
              }}
              onMouseEnter={e => { if(tab !== t.id) e.currentTarget.style.color = G.text; }}
              onMouseLeave={e => { if(tab !== t.id) e.currentTarget.style.color = G.textSub; }}>
                <span style={{ fontSize:14, opacity:.8 }}>{t.icon}</span>
                {t.label}
                {t.id === 'customers' && customers.length > 0 && (
                  <span style={{ marginLeft:'auto', background:G.accentBg, color:G.accent, fontSize:10, padding:'2px 7px', borderRadius:10, border:`1px solid ${G.accent}33` }}>{customers.length}</span>
                )}
              </button>
            ))}
          </nav>

          {/* User card */}
          <div style={{ margin:10, padding:'12px 14px', background:G.card, border:`1px solid ${G.border}`, borderRadius:10 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
              <div style={{ width:32, height:32, borderRadius:8, background:G.accentBg, border:`1px solid ${G.accent}33`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:600, color:G.accent, fontFamily:'var(--font-display)' }}>
                {(user?.name || 'A').charAt(0).toUpperCase()}
              </div>
              <div style={{ minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:500, color:G.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.name || 'Admin'}</div>
                <div style={{ fontSize:10, color:G.textSub }}>{user?.role}</div>
              </div>
            </div>
            <div style={{ fontSize:10, color:G.muted, marginBottom:10, letterSpacing:'.03em' }}>
              {clock.toLocaleTimeString('en-IN', { hour12:false })}
            </div>
            <button className="btn-danger" style={{ width:'100%', fontSize:11, padding:'7px' }} onClick={handleLogout}>Sign out</button>
          </div>
        </aside>

        {/* ── Main ──────────────────────────────────────────────────────── */}
        <main style={{ flex:1, overflowY:'auto', padding:'28px 32px' }}>

          {/* ════ OVERVIEW ════════════════════════════════════════════════ */}
          {tab === 'overview' && (
            <div>
              <div className="fade-up" style={{ marginBottom:28 }}>
                <h1 style={{ fontFamily:'var(--font-display)', fontSize:26, fontWeight:800, letterSpacing:'-.02em' }}>
                  Good {greeting}, {(user?.name || 'Admin').split(' ')[0]}
                </h1>
                <p style={{ color:G.textSub, fontSize:13, marginTop:5 }}>
                  {clock.toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
                </p>
              </div>

              {/* ════ SETTLEMENTS (CASH HANDOVER) ════════════════════════════════ */}
                        {tab === 'settlements' && (
                          <div>
                            <div className="fade-up" style={{ marginBottom:24, display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
                              <div>
                                <h1 style={{ fontFamily:'var(--font-display)', fontSize:24, fontWeight:800, letterSpacing:'-.02em' }}>End of Day Settlement</h1>
                                <p style={{ color:G.textSub, fontSize:12, marginTop:4 }}>Verify physical cash handed over by field agents.</p>
                              </div>
                            </div>

                            <div className="fade-up-1" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px,1fr))', gap:16 }}>
                              {Object.keys(pendingCash).length === 0 ? (
                                <div style={{ gridColumn:'1/-1', padding:60, textAlign:'center', background:G.card, border:`1px dashed ${G.borderHi}`, borderRadius:G.rLg, color:G.muted, fontSize:13 }}>
                                  All agents are fully settled! No pending cash in transit.
                                </div>
                              ) : (
                                Object.entries(pendingCash).map(([agentKey, data]) => {
                                  const [agentName, agentId] = agentKey.split('|');
                                  return (
                                    <div key={agentId} style={{ background:G.card, border:`1px solid ${G.warn}44`, borderRadius:G.rLg, padding:22, position:'relative', overflow:'hidden' }}>
                                      <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${G.warn},${G.warn}44)` }}/>

                                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                                        <div>
                                          <div style={{ fontFamily:'var(--font-display)', fontSize:16, fontWeight:700, color:G.text }}>{agentName}</div>
                                          <div style={{ fontSize:11, color:G.textSub }}>Agent ID: {agentId}</div>
                                        </div>
                                        <span className="tag tag-amber">UNSETTLED</span>
                                      </div>

                                      <div style={{ background:G.surface, border:`1px solid ${G.border}`, borderRadius:8, padding:16, marginBottom:16 }}>
                                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                                          <span style={{ fontSize:12, color:G.textSub }}>Physical Cash Due</span>
                                          <span style={{ fontSize:16, fontWeight:700, color:G.warn, fontFamily:'var(--font-display)' }}>{fmtR(data.totalCash)}</span>
                                        </div>
                                        <div style={{ display:'flex', justifyContent:'space-between' }}>
                                          <span style={{ fontSize:12, color:G.textSub }}>Transactions</span>
                                          <span style={{ fontSize:12, color:G.text }}>{data.transactionCount} receipts</span>
                                        </div>
                                      </div>

                                      <button
                                        className="btn-primary"
                                        style={{ width:'100%', background:G.accent, color:'#000' }}
                                        onClick={async () => {
                                          if(window.confirm(`Did you physically receive exactly ${fmtR(data.totalCash)} from ${agentName}?`)) {
                                            await axios.post(`http://localhost:8085/api/settlements/confirm/${agentId}`, {}, authH);
                                            fetchAll(); // Refresh the board
                                          }
                                        }}
                                      >
                                        Verify & Settle Cash
                                      </button>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        )}


                    {/* ════ LOGISTICS & ROUTES ════════════════════════════════════════ */}
                              {tab === 'logistics' && (
                                <div>
                                  <div className="fade-up" style={{ marginBottom:24, display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
                                    <div>
                                      <h1 style={{ fontFamily:'var(--font-display)', fontSize:24, fontWeight:800, letterSpacing:'-.02em' }}>Route Management</h1>
                                      <p style={{ color:G.textSub, fontSize:12, marginTop:4 }}>Group customers geographically to optimize field collections.</p>
                                    </div>
                                    <button className="btn-primary" onClick={() => {
                                      const name = window.prompt("Enter new route name (e.g., Station Road):");
                                      if (name) axios.post('http://localhost:8085/api/routes', { name }, authH).then(fetchAll);
                                    }}>+ Create Route</button>
                                  </div>

                                  <div className="fade-up-1" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
                                    {/* Available Routes Panel */}
                                    <div style={{ background:G.card, border:`1px solid ${G.border}`, borderRadius:G.rLg, padding:20 }}>
                                      <h3 style={{ fontSize:14, marginBottom:16, color:G.text }}>Active Routes</h3>
                                      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                                        {/* Placeholder for Routes - Once you fetch routes, map them here! */}
                                        <div style={{ padding:16, background:G.surface, border:`1px solid ${G.border}`, borderRadius:8, display:'flex', justifyContent:'space-between' }}>
                                          <div>
                                            <div style={{ fontWeight:600, color:G.accent }}>Example: Shivaji Market Route</div>
                                            <div style={{ fontSize:11, color:G.textSub, marginTop:4 }}>0 customers assigned</div>
                                          </div>
                                          <button className="btn-ghost" style={{ fontSize:11, padding:'4px 10px' }}>Manage</button>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Unassigned Customers Panel */}
                                    <div style={{ background:G.card, border:`1px dashed ${G.borderHi}`, borderRadius:G.rLg, padding:20 }}>
                                      <h3 style={{ fontSize:14, marginBottom:16, color:G.warn }}>Unassigned Customers</h3>
                                      <p style={{ fontSize:12, color:G.textSub, marginBottom:16 }}>These customers are not on any walking route yet.</p>
                                      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                                        {customers.filter(c => !c.route).slice(0, 5).map(c => (
                                          <div key={c.id} style={{ padding:12, background:G.surface, borderRadius:6, fontSize:12, display:'flex', justifyContent:'space-between' }}>
                                            <span>{c.name} (ACC: {c.accountNumber})</span>
                                            <span style={{ color:G.muted }}>Need assignment</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}

              {/* Stat cards */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(210px, 1fr))', gap:16, marginBottom:28 }}>
                <StatCard label="Field agents"       value={stats?.agentCount    ?? agents.filter(a=>a.role==='AGENT').length} sub="Active collectors"   spark={SPARK}               color={G.accent}  icon="👤" delay={1} />
                <StatCard label="Total customers"    value={stats?.customerCount ?? customers.length} sub="Across all branches"  spark={SPARK.map(v=>v*.8)}  color={G.info}    icon="🧾" delay={2} />
                <StatCard label="Today's collection" value={stats?.todayCollection??0} prefix="₹" sub={`${stats?.todayTxnCount??0} transactions today`} spark={SPARK.map(v=>v*.9)} color={G.warn} icon="💰" delay={3}/>
                <StatCard label="Total portfolio"    value={stats?.totalPortfolio ?? 0} prefix="₹" sub="Cumulative balance"  spark={SPARK.map(v=>v*.85)} color={G.purple} icon="📊" delay={4}/>
                <StatCard label="Branches"           value={stats?.branchCount   ?? branches.length} sub="Active locations"    spark={SPARK.map(v=>v*.6)}  color="#06b6d4"   icon="🏢" delay={5} />
              </div>

              {/* Lower grid */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:20 }}>
                {/* Recent users */}
                <div className="fade-up-3" style={{ background:G.card, border:`1px solid ${G.border}`, borderRadius:G.rLg, overflow:'hidden' }}>
                  <div style={{ padding:'16px 20px', borderBottom:`1px solid ${G.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div>
                      <div style={{ fontFamily:'var(--font-display)', fontSize:15, fontWeight:700 }}>Recent users</div>
                      <div style={{ fontSize:11, color:G.textSub, marginTop:2 }}>Last onboarded</div>
                    </div>
                    <button className="btn-primary" style={{ fontSize:11, padding:'7px 14px' }} onClick={() => setShowAddAgent(true)}>+ Add user</button>
                  </div>
                  {loading
                    ? <div style={{ padding:20 }}>{[1,2,3].map(i => <div key={i} className="skeleton" style={{ height:52, marginBottom:10 }}/>)}</div>
                    : agents.length === 0
                      ? <div style={{ padding:40, textAlign:'center', color:G.muted, fontSize:13 }}>No users yet.</div>
                      : agents.slice(0,5).map((a,i) => (
                          <div key={a.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 20px', borderBottom:`1px solid ${G.border}` }}>
                            <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                              <div style={{ width:32, height:32, borderRadius:8, background:`${colors[i%colors.length]}22`, color:colors[i%colors.length], display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:600 }}>{initials(a.name)}</div>
                              <div><div style={{ fontSize:13, color:G.text }}>{a.name}</div><div style={{ fontSize:11, color:G.textSub }}>{a.role}</div></div>
                            </div>
                            <button className="btn-ghost" style={{ padding:'4px 10px', fontSize:10 }} onClick={() => setEditAgent(a)}>Edit</button>
                          </div>
                        ))
                  }
                </div>

                {/* Right column */}
                <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                  <div className="fade-up-4" style={{ background:G.card, border:`1px solid ${G.border}`, borderRadius:G.rLg, padding:20 }}>
                    <div style={{ fontFamily:'var(--font-display)', fontSize:14, fontWeight:700, marginBottom:14 }}>Quick actions</div>
                    {[
                      { label:'Add field agent',  icon:'👤', color:G.accent,  action:() => setShowAddAgent(true)  },
                      { label:'Create branch',    icon:'🏢', color:G.info,    action:() => setShowAddBranch(true) },
                      { label:'View customers',   icon:'🧾', color:G.purple,  action:() => setTab('customers')    },
                      { label:'View analytics',   icon:'📊', color:G.warn,    action:() => setTab('analytics')    },
                    ].map(q => (
                      <button key={q.label} onClick={q.action} style={{ display:'flex', alignItems:'center', gap:10, background:G.surface, border:`1px solid ${G.border}`, borderRadius:9, padding:'11px 14px', color:G.text, fontSize:12, cursor:'pointer', transition:'all .15s', textAlign:'left', width:'100%', marginBottom:8 }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor=`${q.color}44`; e.currentTarget.style.background=`${q.color}08`; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor=G.border; e.currentTarget.style.background=G.surface; }}>
                        <span style={{ fontSize:14 }}>{q.icon}</span>{q.label}
                        <span style={{ marginLeft:'auto', color:G.muted, fontSize:14 }}>›</span>
                      </button>
                    ))}
                  </div>

                  <div className="fade-up-5" style={{ background:G.card, border:`1px solid ${G.border}`, borderRadius:G.rLg, padding:20, flex:1 }}>
                    <div style={{ fontFamily:'var(--font-display)', fontSize:14, fontWeight:700, marginBottom:14 }}>Live activity</div>
                    {activity.length > 0 ? activity.map((t,i) => (
                      <div key={i} style={{ display:'flex', gap:10, padding:'10px 0', borderBottom:`1px solid ${G.border}` }}>
                        <div style={{ width:30, height:30, borderRadius:8, flexShrink:0, background:`${G.accent}15`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13 }}>💳</div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:12, color:G.text }}>
                            {t.customer?.name || 'Customer'} — <span style={{ color:G.accent }}>{fmtR(t.amount)}</span>
                          </div>
                          <div style={{ fontSize:11, color:G.muted, marginTop:2 }}>
                            {t.agent?.name || 'Agent'} · {t.paymentMode || 'CASH'}
                          </div>
                        </div>
                        <div style={{ fontSize:10, color:G.muted, flexShrink:0 }}>
                          {new Date(t.transactionDate).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}
                        </div>
                      </div>
                    )) : (
                      <>
                        <div style={{ display:'flex', gap:10, padding:'10px 0', borderBottom:`1px solid ${G.border}` }}>
                          <div style={{ width:30, height:30, borderRadius:8, background:`${G.accent}15`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13 }}>✅</div>
                          <div><div style={{ fontSize:12, color:G.text }}>System online</div><div style={{ fontSize:11, color:G.muted }}>All services healthy</div></div>
                        </div>
                        <div style={{ display:'flex', gap:10, padding:'10px 0', borderBottom:`1px solid ${G.border}` }}>
                          <div style={{ width:30, height:30, borderRadius:8, background:`${G.info}15`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13 }}>🔐</div>
                          <div><div style={{ fontSize:12, color:G.text }}>Admin login: {user?.name}</div><div style={{ fontSize:11, color:G.muted }}>{clock.toLocaleTimeString('en-IN')}</div></div>
                        </div>
                        <div style={{ display:'flex', gap:10, padding:'10px 0' }}>
                          <div style={{ width:30, height:30, borderRadius:8, background:`${G.purple}15`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13 }}>📡</div>
                          <div><div style={{ fontSize:12, color:G.text }}>No transactions today yet</div><div style={{ fontSize:11, color:G.muted }}>Activity will appear here</div></div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════ USERS ═══════════════════════════════════════════════════ */}
          {tab === 'agents' && (
            <div>
              <div className="fade-up" style={{ marginBottom:24, display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
                <div>
                  <h1 style={{ fontFamily:'var(--font-display)', fontSize:24, fontWeight:800, letterSpacing:'-.02em' }}>User management</h1>
                  <p style={{ color:G.textSub, fontSize:12, marginTop:4 }}>
                    {agents.length} total · {agents.filter(a=>a.role==='AGENT').length} agents · {agents.filter(a=>a.role==='MANAGER').length} managers
                  </p>
                </div>
                <button className="btn-primary" onClick={() => setShowAddAgent(true)}>+ Add user</button>
              </div>

              <div className="fade-up-1" style={{ display:'flex', gap:10, marginBottom:20 }}>
                <div style={{ flex:1, position:'relative' }}>
                  <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:G.muted, fontSize:13 }}>🔍</span>
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email…" style={{ paddingLeft:34 }}/>
                </div>
                {['ALL','AGENT','MANAGER','ADMIN'].map(r => (
                  <button key={r} onClick={() => setRoleFilter(r)} style={{
                    padding:'9px 16px', borderRadius:9, fontSize:11,
                    border:`1px solid ${roleFilter===r ? G.accent+'44' : G.border}`,
                    background: roleFilter===r ? G.accentBg : 'transparent',
                    color: roleFilter===r ? G.accent : G.textSub,
                    cursor:'pointer', transition:'all .15s', letterSpacing:'.04em',
                  }}>{r}</button>
                ))}
              </div>

              <div className="fade-up-2" style={{ background:G.card, border:`1px solid ${G.border}`, borderRadius:G.rLg, overflow:'hidden' }}>
                <div style={{ display:'grid', gridTemplateColumns:'44px 1fr 110px 90px 100px 100px', gap:16, padding:'10px 20px', borderBottom:`1px solid ${G.border}`, background:G.surface, fontSize:10, color:G.muted, letterSpacing:'.08em', textTransform:'uppercase' }}>
                  <div/><div>Name</div><div>Phone</div><div>Role</div><div>Branch</div><div>Action</div>
                </div>
                {loading
                  ? <div style={{ padding:20 }}>{[1,2,3,4].map(i=><div key={i} className="skeleton" style={{ height:56, marginBottom:8 }}/>)}</div>
                  : filteredAgents.length === 0
                    ? <div style={{ padding:60, textAlign:'center', color:G.muted, fontSize:13 }}>{search ? 'No users match.' : 'No users yet. Add your first agent.'}</div>
                    : filteredAgents.map((a,i) => (
                        <div key={a.id} style={{ display:'grid', gridTemplateColumns:'44px 1fr 110px 90px 100px 100px', alignItems:'center', gap:16, padding:'13px 20px', borderBottom:`1px solid ${G.border}` }}>
                          <div style={{ width:36, height:36, borderRadius:10, background:`${colors[i%colors.length]}22`, border:`1px solid ${colors[i%colors.length]}44`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:600, color:colors[i%colors.length] }}>{initials(a.name)}</div>
                          <div><div style={{ fontSize:13, color:G.text }}>{a.name}</div><div style={{ fontSize:11, color:G.textSub }}>{a.email}</div></div>
                          <div style={{ fontSize:12, color:G.textSub }}>{a.phoneNumber || '—'}</div>
                          <div><span className={`tag ${roleTag[a.role] || 'tag-blue'}`}>{a.role}</span></div>
                          <div style={{ fontSize:12, color:G.textSub }}>{a.branch?.name || '— HQ'}</div>
                          <button className="btn-ghost" style={{ padding:'5px 12px', fontSize:11 }} onClick={() => setEditAgent(a)}>Edit</button>
                        </div>
                      ))
                }
              </div>
            </div>
          )}

          {/* ════ CUSTOMERS ═══════════════════════════════════════════════ */}
          {tab === 'customers' && (
            <div>
              <div className="fade-up" style={{ marginBottom:24, display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
                <div>
                  <h1 style={{ fontFamily:'var(--font-display)', fontSize:24, fontWeight:800, letterSpacing:'-.02em' }}>Customer registry</h1>
                  <p style={{ color:G.textSub, fontSize:12, marginTop:4 }}>
                    {customers.length} customers · portfolio {fmtR(stats?.totalPortfolio || 0)}
                  </p>
                </div>
              </div>

              <div className="fade-up-1" style={{ marginBottom:20 }}>
                <div style={{ position:'relative' }}>
                  <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:G.muted, fontSize:13 }}>🔍</span>
                  <input value={custSearch} onChange={e => setCustSearch(e.target.value)} placeholder="Search by name or account number…" style={{ paddingLeft:34 }}/>
                </div>
              </div>

              <div className="fade-up-2" style={{ background:G.card, border:`1px solid ${G.border}`, borderRadius:G.rLg, overflow:'hidden' }}>
                <div style={{ display:'grid', gridTemplateColumns:'44px 1fr 130px 120px 140px', gap:16, padding:'10px 20px', borderBottom:`1px solid ${G.border}`, background:G.surface, fontSize:10, color:G.muted, letterSpacing:'.08em', textTransform:'uppercase' }}>
                  <div/><div>Name / Account</div><div>Phone</div><div>Balance</div><div>Agent</div>
                </div>
                {loading
                  ? <div style={{ padding:20 }}>{[1,2,3,4,5].map(i=><div key={i} className="skeleton" style={{ height:56, marginBottom:8 }}/>)}</div>
                  : filteredCustomers.length === 0
                    ? <div style={{ padding:60, textAlign:'center', color:G.muted, fontSize:13 }}>{custSearch ? 'No customers match.' : 'No customers yet. Agents must add them via mobile.'}</div>
                    : filteredCustomers.map((c,i) => (
                        <div key={c.id} style={{ display:'grid', gridTemplateColumns:'44px 1fr 130px 120px 140px', alignItems:'center', gap:16, padding:'13px 20px', borderBottom:`1px solid ${G.border}` }}>
                          <div style={{ width:36, height:36, borderRadius:10, background:`${colors[i%colors.length]}22`, color:colors[i%colors.length], display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:600 }}>{initials(c.name)}</div>
                          <div><div style={{ fontSize:13, color:G.text }}>{c.name}</div><div style={{ fontSize:11, color:G.textSub }}>ACC: {c.accountNumber}</div></div>
                          <div style={{ fontSize:12, color:G.textSub }}>{c.phoneNumber || '—'}</div>
                          <div style={{ fontSize:13, color:G.accent, fontWeight:500 }}>{fmtR(c.currentBalance)}</div>
                          <button className="btn-ghost" style={{ padding:'5px 12px', fontSize:11 }} onClick={() => setSelectedCustomer(c)}>Manage</button>
                        </div>
                      ))
                }
              </div>
            </div>
          )}

          {/* ════ BRANCHES ════════════════════════════════════════════════ */}
          {tab === 'branches' && (
            <div>
              <div className="fade-up" style={{ marginBottom:24, display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
                <div>
                  <h1 style={{ fontFamily:'var(--font-display)', fontSize:24, fontWeight:800, letterSpacing:'-.02em' }}>Branch management</h1>
                  <p style={{ color:G.textSub, fontSize:12, marginTop:4 }}>{branches.length} active branches</p>
                </div>
                <button className="btn-primary" onClick={() => setShowAddBranch(true)}>+ New branch</button>
              </div>

              <div className="fade-up-1" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px,1fr))', gap:16 }}>
                {branches.map((b,i) => {
                  const c = colors[i % colors.length];
                  const bAgents    = agents.filter(a => a.branch?.id === b.id);
                  const bCustomers = stats?.customersPerBranch?.[b.id] ?? 0;
                  return (
                    <div key={b.id} style={{ background:G.card, border:`1px solid ${G.border}`, borderRadius:G.rLg, padding:22, position:'relative', overflow:'hidden', transition:'all .2s', cursor:'default' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor=`${c}55`; e.currentTarget.style.boxShadow=`0 0 30px ${c}10`; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor=G.border; e.currentTarget.style.boxShadow='none'; }}>
                      <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${c},${c}44)`, borderRadius:'18px 18px 0 0' }}/>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:14 }}>
                        <div style={{ width:40, height:40, borderRadius:10, background:`${c}15`, border:`1px solid ${c}33`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>🏢</div>
                        <span className="tag tag-green">Active</span>
                      </div>
                      <div style={{ fontFamily:'var(--font-display)', fontSize:16, fontWeight:700, marginBottom:4 }}>{b.name}</div>
                      <div style={{ fontSize:12, color:G.textSub, marginBottom:16 }}>{b.city || 'City not set'}</div>
                      <div style={{ display:'flex', gap:24 }}>
                        <div><div style={{ fontSize:22, fontFamily:'var(--font-display)', fontWeight:700, color:c }}>{bAgents.length}</div><div style={{ fontSize:10, color:G.muted, letterSpacing:'.06em' }}>AGENTS</div></div>
                        <div><div style={{ fontSize:22, fontFamily:'var(--font-display)', fontWeight:700 }}>{bCustomers}</div><div style={{ fontSize:10, color:G.muted, letterSpacing:'.06em' }}>CUSTOMERS</div></div>
                      </div>
                    </div>
                  );
                })}
                {branches.length === 0 && (
                  <div style={{ gridColumn:'1/-1', padding:60, textAlign:'center', background:G.card, border:`1px dashed ${G.borderHi}`, borderRadius:G.rLg, color:G.muted, fontSize:13 }}>
                    No branches yet. Create your first branch.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ════ ANALYTICS ═══════════════════════════════════════════════ */}
          {tab === 'analytics' && (
            <div>
              <div className="fade-up" style={{ marginBottom:28 }}>
                <h1 style={{ fontFamily:'var(--font-display)', fontSize:24, fontWeight:800, letterSpacing:'-.02em' }}>Analytics</h1>
                <p style={{ color:G.textSub, fontSize:12, marginTop:4 }}>Portfolio performance overview</p>
              </div>

              {/* KPI strip */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:24 }}>
                {[
                  { label:'Avg balance / customer', value: customers.length > 0 ? Math.round((stats?.totalPortfolio||0)/customers.length) : 0, prefix:'₹', color:G.accent },
                  { label:'Customers / agent',      value: agents.filter(a=>a.role==='AGENT').length > 0 ? Math.round(customers.length/agents.filter(a=>a.role==='AGENT').length) : 0, color:G.info },
                  { label:'Branches active',        value: branches.length, color:G.purple },
                ].map((k,i) => (
                  <div key={i} style={{ background:G.card, border:`1px solid ${G.border}`, borderRadius:G.rLg, padding:'18px 22px' }}>
                    <div style={{ fontSize:11, color:G.textSub, letterSpacing:'.06em', textTransform:'uppercase', marginBottom:8 }}>{k.label}</div>
                    <div style={{ fontSize:26, fontFamily:'var(--font-display)', fontWeight:700, color:k.color }}>
                      {k.prefix||''}{k.value.toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
                {[
                  { label:'Collections trend',     data:[28,45,32,61,55,70,68,82,90,78,95,88], color:G.accent },
                  { label:'New customers / month', data:[5,8,6,12,10,15,14,18,20,17,22,19],   color:G.info   },
                  { label:'Active agents trend',   data:[2,2,3,3,4,4,5,5,6,6,7,7],            color:G.purple },
                  { label:'Portfolio growth (₹K)', data:[80,120,110,160,150,190,185,220,240,210,260,255], color:G.warn },
                ].map((c,i) => (
                  <div key={i} className={`fade-up-${i+1}`} style={{ background:G.card, border:`1px solid ${G.border}`, borderRadius:G.rLg, padding:22 }}>
                    <div style={{ fontFamily:'var(--font-display)', fontSize:14, fontWeight:700, marginBottom:4 }}>{c.label}</div>
                    <div style={{ fontSize:11, color:G.textSub, marginBottom:18 }}>Last 12 months (mock — live in Phase 3)</div>
                    <SparkBar data={c.data} color={c.color} height={80}/>
                    <div style={{ display:'flex', justifyContent:'space-between', marginTop:10, fontSize:10, color:G.muted }}>
                      <span>Jan</span><span>Mar</span><span>Jun</span><span>Sep</span><span>Dec</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="fade-up-5" style={{ marginTop:20, padding:24, background:G.card, border:`1px solid ${G.accentGlow}`, borderRadius:G.rLg, textAlign:'center' }}>
                <div style={{ fontSize:22, marginBottom:8 }}>📡</div>
                <div style={{ fontFamily:'var(--font-display)', fontSize:16, fontWeight:700, marginBottom:6 }}>Live chart data connects in Phase 3</div>
                <div style={{ fontSize:13, color:G.textSub }}>KPI strip above uses real data. Bar charts show historical trends — these will pull from a monthly aggregation endpoint once transaction volume grows.</div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ── MODALS ──────────────────────────────────────────────────────── */}
      {showAddAgent && (
        <Modal title="Add new user" onClose={() => setShowAddAgent(false)}>
          <AddAgentForm
            user={user} branches={branches}
            onSuccess={async () => {
              await new Promise(r => setTimeout(r, 300));
              await fetchAll();
              setShowAddAgent(false);
            }}
            onClose={() => setShowAddAgent(false)}
          />
        </Modal>
      )}

      {showAddBranch && (
        <Modal title="Create new branch" onClose={() => setShowAddBranch(false)} maxWidth={400}>
          <div style={{ marginBottom:14 }}>
            <label style={{ display:'block', fontSize:11, color:G.textSub, marginBottom:6, letterSpacing:'.06em', textTransform:'uppercase' }}>Branch name</label>
            <input value={branchName} onChange={e => setBranchName(e.target.value)} placeholder="e.g. Shivaji Nagar Branch"/>
          </div>
          <div style={{ marginBottom:20 }}>
            <label style={{ display:'block', fontSize:11, color:G.textSub, marginBottom:6, letterSpacing:'.06em', textTransform:'uppercase' }}>City</label>
            <input value={branchCity} onChange={e => setBranchCity(e.target.value)} placeholder="e.g. Pune"/>
          </div>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
            <button className="btn-ghost" onClick={() => setShowAddBranch(false)}>Cancel</button>
            <button className="btn-primary" onClick={addBranch}>Create branch</button>
          </div>
        </Modal>
      )}

      {editAgent && (
        <Modal title={`Edit — ${editAgent.name}`} onClose={() => setEditAgent(null)}>
          <EditUserModal
            agent={editAgent} branches={branches} token={token}
            onSuccess={async () => { await new Promise(r => setTimeout(r,300)); await fetchAll(); }}
            onClose={() => setEditAgent(null)}
          />
        </Modal>
      )}

      {selectedCustomer && (
        <Modal title="Financial Profile" onClose={() => setSelectedCustomer(null)}>
          <CustomerProfileModal
            customer={selectedCustomer} token={token}
            onSuccess={fetchAll} onClose={() => setSelectedCustomer(null)}
          />
        </Modal>
      )}
    </>
  );
}