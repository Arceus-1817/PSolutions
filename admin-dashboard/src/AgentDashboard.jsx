import { useState, useEffect } from 'react';
import axios from 'axios';

const BASE_URL = 'http://localhost:8085';
const api = axios.create({ baseURL: BASE_URL });

export default function AgentDashboard({ user, handleLogout }) {
  const [customers, setCustomers]           = useState([]);
  const [selectedCustomer, setSelected]     = useState(null);
  const [depositAmount, setDepositAmount]   = useState('');
  const [paymentMode, setPaymentMode]       = useState('CASH');
  const [txType, setTxType]                 = useState('SAVINGS');
  const [activeLoan, setActiveLoan]         = useState(null);
  const [transactions, setTransactions]     = useState([]);
  const [status, setStatus]                 = useState({ type:'', message:'' });
  const [searchTerm, setSearch]             = useState('');
  const [loadingCustomers, setLoadingC]     = useState(true);
  const [isSaving, setIsSaving]             = useState(false);

  const getAuth = () => ({ headers: { Authorization: `Bearer ${user.token}` } });
  const agentId = user.id || user.userId;

  const fetchCustomers = async () => {
    setLoadingC(true);
    try {
      const ts = Date.now();
      // Fetches only the customers assigned to their specific route for today!
      const res = await api.get(`/api/customers/agent/${agentId}?t=${ts}`, getAuth());
      const myCustomers = Array.isArray(res.data) ? res.data : [];
      myCustomers.sort((a, b) => (a.routeSequence || 999) - (b.routeSequence || 999));
      setCustomers(myCustomers);
    } catch (e) {
      if (e.response?.status === 401 || e.response?.status === 403) handleLogout();
    } finally { setLoadingC(false); }
  };

  useEffect(() => { fetchCustomers(); }, []);

  const handleSelectCustomer = async (customer) => {
    setSelected(customer);
    setStatus({ type:'', message:'' });
    setTxType('SAVINGS');
    setDepositAmount('');
    setActiveLoan(null);

    const ts = Date.now();
    try {
      const txRes = await api.get(`/api/transactions/history/${customer.id}?t=${ts}`, getAuth());
      setTransactions(Array.isArray(txRes.data) ? txRes.data : []);

      const loanRes = await api.get(`/api/loans/customer/${customer.id}?t=${ts}`, getAuth());
      const loans = Array.isArray(loanRes.data) ? loanRes.data : [];
      const active = loans.find(l => l.status === 'ACTIVE');
      if (active) {
        setActiveLoan(active);
        setTxType('EMI');
        setDepositAmount(active.dailyEmiAmount || '');
      }
    } catch (e) {
      console.warn("Could not fetch history or loans", e);
      setTransactions([]);
    }
  };

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) return;
    setIsSaving(true);

    const body = {
      customerId: selectedCustomer.id,
      agentId: agentId,
      amount: parseFloat(depositAmount),
      paymentMode
    };

    try {
      if (txType === 'EMI') {
        await api.post('/api/transactions/loan-emi', body, getAuth());
        setStatus({ type:'success', message:`EMI of ₹${depositAmount} collected successfully!` });
      } else {
        await api.post('/api/transactions/deposit', body, getAuth());
        setStatus({ type:'success', message:`Savings deposit of ₹${depositAmount} successful!` });
      }

      setDepositAmount('');
      await fetchCustomers();
      handleSelectCustomer(selectedCustomer);
    } catch (e) {
      setStatus({ type:'error', message: e.response?.data || 'Transaction failed. Try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const filtered = customers.filter(c =>
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || c.accountNumber?.includes(searchTerm)
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
        .ag-confirm-btn:hover:not(:disabled) { background: #00cc6a; transform: translateY(-1px); box-shadow: 0 4px 20px rgba(0,255,136,.2); }
        .ag-confirm-btn:disabled { cursor: not-allowed; opacity: 0.7; }
        .ag-history-title { font-size: 12px; color: #4a5568; letter-spacing: .06em; text-transform: uppercase; margin-bottom: 14px; }
        .ag-txn-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #1e2530; align-items: center; }
        .ag-txn-amt { color: #00ff88; font-size: 14px; font-weight: 500; }
        .ag-txn-mode { font-size: 10px; color: #2d3748; background: #161b22; padding: 3px 8px; border-radius: 12px; border: 1px solid #1e2530; }
        .ag-txn-date { font-size: 11px; color: #4a5568; }
        .ag-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #2d3748; font-size: 13px; gap: 10px; text-align: center; padding: 40px; }
        .ag-empty-icon { font-size: 36px; opacity: .3; }
        .ag-loan-badge { background: rgba(255,165,2,.15); color: #ffa502; border: 1px solid rgba(255,165,2,.3); padding: 3px 8px; border-radius: 12px; font-size: 10px; font-weight: 600; letter-spacing: .05em; }
        .tx-toggle-container { display: flex; background: #111318; border: 1px solid #1e2530; border-radius: 8px; padding: 4px; margin-bottom: 16px; }
        .tx-toggle-btn { flex: 1; text-align: center; padding: 8px; font-size: 11px; font-weight: 600; border-radius: 6px; cursor: pointer; transition: all .2s; color: #718096; }
        .tx-toggle-btn.active.savings { background: rgba(0,255,136,.1); color: #00ff88; }
        .tx-toggle-btn.active.emi { background: rgba(255,165,2,.1); color: #ffa502; }
      `}</style>

      <div className="ag-wrap">
        <header className="ag-header">
          <div className="ag-logo">Pigmy<span>Pay</span> <span style={{ fontSize:11, color:'#2d3748' }}>/ Field</span></div>
          <div style={{ display:'flex', alignItems:'center', gap:20 }}>
            <div className="ag-user">Logged in as <strong>{user.name}</strong></div>
            <button className="ag-logout" onClick={handleLogout}>Sign out</button>
          </div>
        </header>

        <div className="ag-main">
          {/* LEFT SIDEBAR: CUSTOMER LIST */}
          <div className="ag-left">
            <div className="ag-portfolio">
              <div className="ag-portfolio-label">Total deposits</div>
              <div className="ag-portfolio-value"><span>₹</span>{totalPortfolio.toLocaleString('en-IN')}</div>
              <div className="ag-portfolio-sub">{customers.length} customers assigned to today's route</div>
            </div>

            <div className="ag-search-row">
              {/* 🚨 REMOVED THE + NEW BUTTON HERE 🚨 */}
              <input className="ag-search" placeholder="Search route customers…" value={searchTerm} onChange={e => setSearch(e.target.value)} />
            </div>

            <div className="ag-customer-list">
              {loadingCustomers ? <div style={{ padding:20, color:'#4a5568', fontSize:12 }}>Loading route assignments...</div> :
                filtered.map(c => (
                <div key={c.id} className={`ag-customer-item ${selectedCustomer?.id === c.id ? 'active' : ''}`} onClick={() => handleSelectCustomer(c)}>
                  <div>
                    <div className="ag-customer-name">
                      {/* Show the physical route sequence number next to their name */}
                      <span style={{ color:G.muted, marginRight:8, fontSize:11 }}>#{c.routeSequence || 0}</span>
                      {c.name}
                    </div>
                    <div className="ag-customer-acc">ACC: {c.accountNumber}</div>
                  </div>
                  <div className="ag-customer-bal">₹{(c.currentBalance || 0).toLocaleString('en-IN')}</div>
                </div>
              ))}
              {filtered.length === 0 && !loadingCustomers && (
                 <div style={{ padding:20, color:'#4a5568', fontSize:12, textAlign:'center' }}>No customers found on this route.</div>
              )}
            </div>
          </div>

          {/* RIGHT SIDEBAR: TRANSACTION ENGINE */}
          <div className="ag-right">
            {selectedCustomer ? (
              <>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
                  <div>
                    <div className="ag-detail-name">{selectedCustomer.name}</div>
                    <div className="ag-detail-phone">{selectedCustomer.phoneNumber ? `📞 ${selectedCustomer.phoneNumber}` : 'No phone linked'}</div>
                  </div>
                  {activeLoan && (
                    <div style={{ textAlign:'right' }}>
                      <div className="ag-loan-badge">ACTIVE LOAN</div>
                      <div style={{ fontSize:11, color:'#718096', marginTop:4 }}>Owes: ₹{activeLoan.totalAmountDue - activeLoan.amountPaid}</div>
                    </div>
                  )}
                </div>

                {status.message && status.type === 'success' && <div className="ag-status-ok">{status.message}</div>}
                {status.message && status.type === 'error' && <div className="ag-status-err">{status.message}</div>}

                <div className="ag-deposit-box">
                  <div className="ag-deposit-title">RECORD TRANSACTION</div>

                  <div className="tx-toggle-container">
                    <div className={`tx-toggle-btn ${txType === 'SAVINGS' ? 'active savings' : ''}`} onClick={() => { setTxType('SAVINGS'); setDepositAmount(''); }}>
                      SAVINGS
                    </div>
                    <div className={`tx-toggle-btn ${txType === 'EMI' ? 'active emi' : ''}`}
                          onClick={() => {
                            if (!activeLoan) return alert("This customer has no active loan.");
                            setTxType('EMI');
                            setDepositAmount(activeLoan.dailyEmiAmount);
                          }}>
                      LOAN EMI
                    </div>
                  </div>

                  <input className="ag-amount-input" type="number" placeholder="₹ Enter amount" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} disabled={isSaving} />

                  <div className="ag-mode-row">
                    {['CASH', 'UPI'].map(m => (
                      <button key={m} className={`ag-mode-btn ${paymentMode === m ? 'active' : ''}`} onClick={() => setPaymentMode(m)}>
                        {m === 'CASH' ? '💵' : '📱'} {m}
                      </button>
                    ))}
                  </div>
                  <button className="ag-confirm-btn" onClick={handleDeposit} disabled={isSaving}>
                    {isSaving ? 'Processing...' : txType === 'EMI' ? 'Collect EMI' : 'Confirm Deposit'}
                  </button>
                </div>

                <div className="ag-history-title">Recent history</div>
                {transactions.length === 0 ? <div style={{ color:'#2d3748', fontSize:12 }}>No transactions yet.</div> :
                  transactions.map((t, i) => (
                  <div key={i} className="ag-txn-row">
                    <div>
                      <div className="ag-txn-amt" style={{ color: t.transactionCategory === 'LOAN_REPAYMENT' ? '#ffa502' : '#00ff88' }}>
                        + ₹{parseFloat(t.amount).toLocaleString('en-IN')}
                      </div>
                      <div style={{ fontSize:10, color:'#718096', marginTop:2 }}>{t.transactionCategory?.replace('_', ' ') || 'SAVINGS DEPOSIT'}</div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <span className="ag-txn-mode">{t.paymentMode || 'CASH'}</span>
                      <div className="ag-txn-date" style={{ marginTop:4 }}>{new Date(t.transactionDate).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}</div>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="ag-empty"><div className="ag-empty-icon">◈</div><div>Select a customer from your route to collect</div></div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}