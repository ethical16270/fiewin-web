const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const initializeDatabase = () => {
  return new Promise((resolve, reject) => {
    try {
      // Create data directory if it doesn't exist
      const dataDir = path.resolve(__dirname, '../data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const dbPath = path.join(dataDir, 'hack.db');
      const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          console.error('Database creation error:', err);
          reject(err);
          return;
        }
        console.log('Database created successfully');

        // Create tables
        db.serialize(() => {
          // Create UTR table
          db.run(`
            CREATE TABLE IF NOT EXISTS utrs (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              utr_number TEXT UNIQUE NOT NULL,
              plan_type TEXT NOT NULL,
              duration_hours INTEGER NOT NULL,
              games_allowed INTEGER DEFAULT 3,
              games_used INTEGER DEFAULT 0,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              used_at DATETIME,
              used_by TEXT,
              expires_at DATETIME,
              status TEXT DEFAULT 'active'
            )
          `, (err) => {
            if (err) console.error('Error creating UTR table:', err);
            else console.log('UTR table created/verified');
          });

          // Create UPI details table
          db.run(`
            CREATE TABLE IF NOT EXISTS upi_details (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              upi_id TEXT NOT NULL,
              name TEXT NOT NULL,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
          `, (err) => {
            if (err) console.error('Error creating UPI details table:', err);
            else console.log('UPI details table created/verified');
          });

          // Create plan settings table
          db.run(`
            CREATE TABLE IF NOT EXISTS plan_settings (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              demo_amount INTEGER NOT NULL DEFAULT 99,
              paid_amount INTEGER NOT NULL DEFAULT 999,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
          `, (err) => {
            if (err) console.error('Error creating plan settings table:', err);
            else console.log('Plan settings table created/verified');
          });

          // Insert default values if tables are empty
          db.get('SELECT COUNT(*) as count FROM plan_settings', (err, row) => {
            if (err) reject(err);
            if (row.count === 0) {
              db.run('INSERT INTO plan_settings (demo_amount, paid_amount) VALUES (?, ?)', [99, 999]);
            }
          });

          // Create transactions table
          db.run(`
            CREATE TABLE IF NOT EXISTS transactions (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              utr TEXT NOT NULL,
              amount INTEGER NOT NULL,
              plan_type TEXT NOT NULL,
              status TEXT DEFAULT 'active',
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
          `, (err) => {
            if (err) console.error('Error creating transactions table:', err);
            else console.log('Transactions table created/verified');
            
            // Resolve after all tables are created
            resolve(db);
          });
        });
      });
    } catch (error) {
      console.error('Database initialization error:', error);
      reject(error);
    }
  });
};

module.exports = { initializeDatabase }; 