import * as SQLite from 'expo-sqlite';

// Open (or create) the local database on the phone
const db = SQLite.openDatabaseSync('pigmypay.db');

export const initDB = () => {

    db.execSync('DROP TABLE IF EXISTS local_customers;');
    db.execSync('DROP TABLE IF EXISTS pending_sync;');

    db.execSync(`
    CREATE TABLE IF NOT EXISTS local_customers (
      id INTEGER PRIMARY KEY NOT NULL,
      name TEXT,
      accountNumber TEXT,
      phoneNumber TEXT,
      currentBalance REAL,
      routeSequence INTEGER,
      activeDailyEmi REAL
    );
    
    CREATE TABLE IF NOT EXISTS pending_sync (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customerId INTEGER,
      amount REAL,
      paymentMode TEXT,
      type TEXT, 
      status TEXT,
      timestamp TEXT
    );
  `);
    console.log("✅ Local SQLite Database Initialized");
};

// Wipe yesterday's route and save today's fresh route
export const saveRouteToLocal = (customers) => {
    db.withTransactionSync(() => {
        db.execSync('DELETE FROM local_customers;');
        const statement = db.prepareSync(
            // 🚨 Add activeDailyEmi to the INSERT statement
            'INSERT INTO local_customers (id, name, accountNumber, phoneNumber, currentBalance, routeSequence, activeDailyEmi) VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        for (const c of customers) {
            statement.executeSync([
                c.id, c.name, c.accountNumber, c.phoneNumber || '',
                c.currentBalance || 0, c.routeSequence || 99,
                c.activeDailyEmi || 0 // 🚨 Add this variable
            ]);
        }
    });
};

// 🚨 ADD THIS: Safely record an offline transaction to the queue
export const saveOfflineTransaction = (customerId, amount, paymentMode, type, status = 'PENDING') => {
    const statement = db.prepareSync(
        'INSERT INTO pending_sync (customerId, amount, paymentMode, type, status, timestamp) VALUES (?, ?, ?, ?, ?, ?)'
    );
    statement.executeSync([
        customerId,
        parseFloat(amount),
        paymentMode,
        type,
        status,
        new Date().toISOString()
    ]);
};

// 🚨 ADD THIS: Wipe the phone clean when an agent logs out!
export const clearLocalData = () => {
    db.execSync('DELETE FROM local_customers;');
    db.execSync('DELETE FROM pending_sync;'); // 🚨 ADD THIS LINE TO CLEAR THE CLOG
    console.log("🧹 Device memory completely wiped.");
    // Optional: You could also delete pending_sync here, but usually, 
    // you want to force them to sync before allowing logout so money isn't lost!
};

// Fetch customers instantly from the phone (no internet required)
export const getLocalRoute = () => {
    return db.getAllSync('SELECT * FROM local_customers ORDER BY routeSequence ASC');
};

// Get the number of transactions waiting to be synced to the cloud
export const getPendingSyncCount = () => {
    const result = db.getFirstSync('SELECT COUNT(*) as count FROM pending_sync');
    return result.count;
};

// 🚨 ADD THESE TWO FUNCTIONS TO THE BOTTOM

// 1. UPDATE THIS: Only grab transactions that haven't been synced yet
export const getPendingTransactions = () => {
  return db.getAllSync("SELECT * FROM pending_sync WHERE status = 'PENDING'");
};

// 2. DELETE the old `removePendingTransaction` function and REPLACE it with this:
export const markTransactionSynced = (id) => {
  db.execSync(`UPDATE pending_sync SET status = 'SYNCED' WHERE id = ${id}`);
};

// 3. ADD THIS: The math engine for the Ledger
export const getLedgerStats = () => {
  // Sum up all Cash and UPI for today (ignoring skipped customers)
  const cashResult = db.getFirstSync("SELECT SUM(amount) as total FROM pending_sync WHERE paymentMode = 'CASH' AND status != 'SKIPPED_CLOSED'");
  const upiResult = db.getFirstSync("SELECT SUM(amount) as total FROM pending_sync WHERE paymentMode = 'UPI' AND status != 'SKIPPED_CLOSED'");
  
  return { 
    cash: cashResult.total || 0, 
    upi: upiResult.total || 0 
  };
};

