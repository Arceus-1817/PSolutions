import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './index.css';

// ==========================================
// 1. THE LOBBY (Public Landing Page)
// ==========================================
function LandingPage() {
  const navigate = useNavigate();
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#111827', color: 'white' }}>
      <h1 style={{ fontSize: '4rem', margin: '0 0 10px 0' }}>PigmyPay</h1>
      <p style={{ fontSize: '1.2rem', color: '#9ca3af', marginBottom: '40px' }}>The modern micro-finance infrastructure.</p>
      <button onClick={() => navigate('/login')} className="btn-primary" style={{ fontSize: '1.1rem', padding: '12px 32px' }}>
        Access Secure Portal
      </button>
    </div>
  );
}

// ==========================================
// 2. THE CHECKPOINT (Login Page)
// ==========================================
function LoginPage({ setUser }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = () => {
    axios.post('http://localhost:8085/api/auth/login', { email, password })
      .then(response => {
        const userData = response.data;
        setUser(userData); // Save to global memory

        // THE MAGIC BIFURCATION: Route based on Role!
        if (userData.role === 'ADMIN' || userData.role === 'MANAGER') {
          navigate('/admin');
        } else {
          navigate('/agent');
        }
      })
      .catch(error => alert("Login failed! Invalid credentials."));
  };

  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f7f9fc' }}>
      <div className="bento-box" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <h1 style={{ marginBottom: '8px' }}>Login</h1>
        <p style={{ color: '#6b7280', marginBottom: '32px' }}>Enter your credentials to continue</p>
        <input type="email" className="input-field" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="password" className="input-field" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
        <button className="btn-primary" onClick={handleLogin}>Log In</button>
      </div>
    </div>
  );
}

// ==========================================
// 3. THE MANAGER'S OFFICE (Admin Dashboard)
// ==========================================
function AdminDashboard({ user, handleLogout }) {
  return (
    <div className="dashboard-wrapper">
      <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0 }}>Command Center</h1>
          <p style={{ color: '#6b7280', marginTop: '8px' }}>Logged in as: <strong>{user.name}</strong> ({user.role})</p>
        </div>
        <button onClick={handleLogout} style={{ padding: '8px 16px', backgroundColor: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Logout</button>
      </div>

      <div className="bento-grid">
        <div className="bento-box" style={{ textAlign: 'center', padding: '50px' }}>
          <h2>Admin Controls Coming Soon</h2>
          <p style={{ color: '#6b7280' }}>This is where we will build the "Create New Agent" form and view global charts.</p>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 4. THE FIELD FLOOR (Agent Dashboard)
// ==========================================
function AgentDashboard({ user, handleLogout }) {
  // All the state strictly belongs to the Agent Dashboard now!
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', accountNumber: '', phoneNumber: '', currentBalance: 0 });

  const getAuthHeader = () => ({ headers: { 'Authorization': `Bearer ${user.token}` } });

  const fetchCustomers = () => {
    axios.get(`http://localhost:8085/api/customers/agent/${user.userId}`, getAuthHeader())
      .then(response => setCustomers(typeof response.data === 'string' ? [] : response.data))
      .catch(error => { if (error.response?.status === 403) handleLogout(); });
  };

  useEffect(() => { fetchCustomers(); }, []);

  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setShowAddForm(false);
    setStatus({ type: '', message: '' });
    axios.get(`http://localhost:8085/api/transactions/history/${customer.id}`, getAuthHeader())
      .then(response => setTransactions(response.data)).catch(() => setTransactions([]));
  };

  const handleDeposit = () => {
    if (!depositAmount || depositAmount <= 0) return;
    const requestBody = { customerId: selectedCustomer.id, agentId: user.userId, amount: parseFloat(depositAmount), paymentMode: 'CASH' };
    axios.post('http://localhost:8085/api/transactions/deposit', requestBody, getAuthHeader())
      .then(() => {
        setStatus({ type: 'success', message: `₹${depositAmount} deposited successfully!` });
        setDepositAmount(''); fetchCustomers(); handleSelectCustomer(selectedCustomer);
      }).catch(() => setStatus({ type: 'error', message: 'Deposit failed.' }));
  };

  const handleAddCustomer = () => {
    if (!newCustomer.name || !newCustomer.accountNumber) return;
    const payload = { ...newCustomer, assignedAgent: { id: user.userId } };
    axios.post('http://localhost:8085/api/customers', payload, getAuthHeader())
      .then(() => {
        setStatus({ type: 'success', message: `${newCustomer.name} added successfully!` });
        setShowAddForm(false); setNewCustomer({ name: '', accountNumber: '', phoneNumber: '', currentBalance: 0 }); fetchCustomers();
      }).catch(() => setStatus({ type: 'error', message: 'Failed to add customer.' }));
  };

  const filteredCustomers = customers.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.accountNumber.includes(searchTerm));
  const totalPortfolio = customers.reduce((sum, cust) => sum + cust.currentBalance, 0);

  return (
    <div className="dashboard-wrapper">
      <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0 }}>Field Dashboard</h1>
          <p style={{ color: '#6b7280', marginTop: '8px' }}>Logged in as: <strong>{user.name}</strong> ({user.role})</p>
        </div>
        <button onClick={handleLogout} style={{ padding: '8px 16px', backgroundColor: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Logout</button>
      </div>

      <div className="bento-grid">
        <div className="bento-box">
          <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, color: '#6b7280', fontSize: '14px', textTransform: 'uppercase' }}>Total Portfolio</h3>
              <h2 style={{ margin: '4px 0 0 0', fontSize: '36px' }}>₹{totalPortfolio.toLocaleString()}</h2>
            </div>
            <button onClick={() => { setShowAddForm(!showAddForm); setSelectedCustomer(null); setStatus({type:'', message:''}); }} style={{ backgroundColor: showAddForm ? '#f3f4f6' : '#111827', color: showAddForm ? '#111827' : 'white', padding: '10px 15px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
              {showAddForm ? 'Cancel' : '+ New Customer'}
            </button>
          </div>

          {showAddForm && (
            <div style={{ backgroundColor: '#f9fafb', padding: '15px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #e5e7eb' }}>
              <input className="input-field" placeholder="Full Name" value={newCustomer.name} onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})} />
              <input className="input-field" placeholder="Account Number" value={newCustomer.accountNumber} onChange={(e) => setNewCustomer({...newCustomer, accountNumber: e.target.value})} />
              <input className="input-field" placeholder="Phone Number" value={newCustomer.phoneNumber} onChange={(e) => setNewCustomer({...newCustomer, phoneNumber: e.target.value})} />
              <button className="btn-primary" onClick={handleAddCustomer}>Save Customer</button>
            </div>
          )}

          <h3 style={{ borderBottom: '1px solid #f3f4f6', paddingBottom: '12px' }}>Your Customers</h3>
          <input type="text" className="input-field" placeholder="🔍 Search by name or account..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ marginBottom: '16px', backgroundColor: '#f9fafb' }} />
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {filteredCustomers.map(customer => (
              <div key={customer.id} className={`customer-card ${selectedCustomer?.id === customer.id ? 'active' : ''}`} onClick={() => handleSelectCustomer(customer)}>
                <div>
                  <strong style={{ display: 'block' }}>{customer.name}</strong>
                  <span style={{ fontSize: '12px', opacity: selectedCustomer?.id === customer.id ? 0.8 : 0.5 }}>ACC: {customer.accountNumber}</span>
                </div>
                <div style={{ textAlign: 'right', fontWeight: 'bold' }}>₹{customer.currentBalance.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>

        {selectedCustomer ? (
          <div className="bento-box" style={{ display: 'flex', flexDirection: 'column' }}>
            <h2>{selectedCustomer.name}</h2>
            {selectedCustomer.phoneNumber && <p style={{ margin: '0 0 16px 0', color: '#6b7280', fontSize: '14px' }}>📞 {selectedCustomer.phoneNumber}</p>}
            {status.message && <div className={`status-message ${status.type}`}>{status.message}</div>}

            <div style={{ backgroundColor: '#f9fafb', padding: '20px', borderRadius: '12px', marginBottom: '24px' }}>
              <h3 style={{ marginTop: 0 }}>Record Collection</h3>
              <input type="number" className="input-field" placeholder="Enter deposit amount (₹)" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} />
              <button className="btn-primary" onClick={handleDeposit}>Confirm Deposit</button>
            </div>

            <h3 style={{ borderBottom: '1px solid #f3f4f6', paddingBottom: '12px' }}>Recent History</h3>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {transactions.map((txn, index) => (
                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
                  <span style={{ color: '#10b981', fontWeight: 'bold' }}>+ ₹{txn.amount}</span>
                  <span style={{ color: '#6b7280', fontSize: '14px' }}>{new Date(txn.transactionDate).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bento-box" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', border: '2px dashed #d1d5db', boxShadow: 'none' }}>
            <p style={{ color: '#9ca3af' }}>Select a customer to view details, or add a new one.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 5. THE ROUTER (The Master Switchboard)
// ==========================================
function App() {
  const [user, setUser] = useState(null);

  const handleLogout = () => {
    setUser(null);
    window.location.href = "/login"; // Force redirect to login on logout
  };

  return (
    <Router>
      <Routes>

        <Route path="/" element="{<LandingPage"/>} />


        <Route path="/login" element="{<LoginPage" setUser="{setUser}"/>} />


        <Route path="/admin" element="{" user?.role="==" 'ADMIN' ? <AdminDashboard user="{user}" handleLogout="{handleLogout}"/> : <Navigate to="/login"/>
        } />


        <Route path="/agent" element="{" (user?.role="==" 'AGENT' || user?.role="==" 'ADMIN') ? <AgentDashboard user="{user}" handleLogout="{handleLogout}"/> : <Navigate to="/login"/>
        } />
      </Routes>
    </Router>
  );
}

export default App;