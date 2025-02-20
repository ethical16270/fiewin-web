const db = require('../utils/database');

const cleanupExpiredUTRs = async () => {
  try {
    // First ensure the table exists
    await new Promise((resolve, reject) => {
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
        if (err) reject(err);
        else resolve();
      });
    });

    // Then perform the cleanup
    await new Promise((resolve, reject) => {
      db.run(
        'DELETE FROM utrs WHERE used_at IS NOT NULL AND expires_at < ?',
        [new Date().toISOString()],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    console.log('Expired UTRs cleaned up successfully');
  } catch (error) {
    console.error('Failed to cleanup expired UTRs:', error);
  }
};

// Run cleanup daily
setInterval(cleanupExpiredUTRs, 24 * 60 * 60 * 1000);

module.exports = { cleanupExpiredUTRs }; 