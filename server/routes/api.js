const express = require('express');
const router = express.Router();
const { verifyAdmin } = require('../middleware/auth');
const db = require('../utils/database');

// In-memory storage (replace with database in production)
let upiDetails = {
  upiId: '',
  name: '',
  amount: 999
};

let validUTRs = new Set();

// Admin Routes
router.post('/admin/login', async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: 'Request body is missing'
      });
    }

    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }
    
    console.log('Login attempt:', { username, password }); // Debug log

    // Admin credentials
    if (username === 'admin' && password === 'admin') {
      console.log('Login successful'); // Debug log
      res.json({
        success: true,
        token: 'admin_token'
      });
    } else {
      console.log('Login failed'); // Debug log
      res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

router.post('/admin/upi', verifyAdmin, (req, res) => {
  try {
    const { upiId, name } = req.body;
    
    if (!upiId || !name) {
      return res.status(400).json({
        success: false,
        message: 'Both UPI ID and name are required'
      });
    }

    db.run(
      `INSERT INTO upi_details (upi_id, name, updated_at) 
       VALUES (?, ?, CURRENT_TIMESTAMP)`,
      [upiId.trim(), name.trim()],
      (err) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({
            success: false,
            message: 'Failed to update UPI details'
          });
        }

        return res.json({
          success: true,
          message: 'UPI details updated successfully'
        });
      }
    );
  } catch (error) {
    console.error('Error in POST /admin/upi:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

router.post('/admin/utr/add', verifyAdmin, (req, res) => {
  const { utr, planType, gamesAllowed } = req.body;
  
  // Validate UTR
  if (!utr || typeof utr !== 'string' || utr.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Valid UTR number is required'
    });
  }

  // Validate plan type
  if (!['premium', 'demo'].includes(planType)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid plan type. Must be "premium" or "demo"'
    });
  }

  // Set duration based on plan type
  const durationHours = planType === 'demo' ? 24 : 168; // 24 hours for demo, 168 hours (7 days) for premium
  
  // Set default games allowed based on plan type if not provided
  const finalGamesAllowed = gamesAllowed !== undefined ? gamesAllowed : (planType === 'demo' ? 3 : -1);

  // Check if UTR already exists
  db.get('SELECT utr_number FROM utrs WHERE utr_number = ?', [utr.trim()], (err, row) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to check UTR'
      });
    }

    if (row) {
      return res.status(400).json({
        success: false,
        message: 'UTR number already exists'
      });
    }

    // Add new UTR with current timestamp and games allowed
    const now = new Date().toISOString();
    db.run(
      'INSERT INTO utrs (utr_number, plan_type, duration_hours, games_allowed, created_at) VALUES (?, ?, ?, ?, ?)',
      [utr.trim(), planType, durationHours, finalGamesAllowed, now],
      function(err) {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({
            success: false,
            message: 'Failed to add UTR',
            error: err.message
          });
        }

        res.json({
          success: true,
          message: 'UTR added successfully',
          utr: {
            id: this.lastID,
            number: utr.trim(),
            planType,
            durationHours,
            gamesAllowed: finalGamesAllowed,
            createdAt: now
          }
        });
      }
    );
  });
});

router.get('/admin/utr/list', verifyAdmin, (req, res) => {
  const { status = 'all', type } = req.query;
  let query = 'SELECT * FROM utrs';
  const params = [];

  // Build query based on filters
  const conditions = [];
  
  if (status === 'unused') {
    conditions.push('used_at IS NULL');
  } else if (status === 'used') {
    conditions.push('used_at IS NOT NULL');
  }

  if (type) {
    conditions.push('plan_type = ?');
    params.push(type);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY created_at DESC';

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch UTRs'
      });
    }

    const now = new Date();

    res.json({
      success: true,
      utrs: rows ? rows.map(row => {
        const expiresAt = row.expires_at ? new Date(row.expires_at) : null;
        const isExpired = expiresAt && expiresAt < now;

        return {
          id: row.id,
          number: row.utr_number,
          planType: row.plan_type,
          duration: row.duration_hours,
          gamesAllowed: row.games_allowed,
          createdAt: row.created_at,
          usedAt: row.used_at,
          expiresAt: row.expires_at,
          status: !row.used_at ? 'unused' : isExpired ? 'expired' : 'active'
        };
      }) : []
    });
  });
});

// User Routes
router.get('/payment-details', (req, res) => {
  try {
    db.get('SELECT * FROM plan_settings ORDER BY updated_at DESC LIMIT 1', (err, planRow) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch payment details'
        });
      }

      // Get UPI details as well
      db.get('SELECT * FROM upi_details ORDER BY updated_at DESC LIMIT 1', (err, upiRow) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({
            success: false,
            message: 'Failed to fetch payment details'
          });
        }

        return res.json({
          success: true,
          plans: {
            demoAmount: planRow?.demo_amount || 99,
            paidAmount: planRow?.paid_amount || 999
          },
          upi: upiRow ? {
            upiId: upiRow.upi_id,
            name: upiRow.name
          } : null
        });
      });
    });
  } catch (error) {
    console.error('Error in /payment-details:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

router.post('/verify-utr', (req, res) => {
  const { utr, action, gamesUsed } = req.body;
  console.log('Received UTR:', utr, 'Action:', action, 'Games Used:', gamesUsed); // Debug log

  if (!utr) {
    return res.status(400).json({
      success: false,
      message: 'UTR number is required'
    });
  }

  const trimmedUTR = utr.trim();
  
  // Handle update-games action
  if (action === 'update-games' && gamesUsed !== undefined) {
    console.log('Handling update-games action with games used:', gamesUsed);
    
    db.run(
      'UPDATE utrs SET games_used = ? WHERE utr_number = ?',
      [gamesUsed, trimmedUTR],
      (err) => {
        if (err) {
          console.error('Database error updating games used:', err);
          return res.status(500).json({
            success: false,
            message: 'Failed to update games count'
          });
        }
        
        // Get updated UTR data
        db.get('SELECT * FROM utrs WHERE utr_number = ?', [trimmedUTR], (err, row) => {
          if (err || !row) {
            console.error('Database error fetching updated UTR:', err);
            return res.status(500).json({
              success: false,
              message: 'Failed to fetch updated UTR data'
            });
          }
          
          const response = {
            success: true,
            message: 'Games count updated successfully',
            utrNumber: trimmedUTR,
            planType: row.plan_type,
            gamesAllowed: row.games_allowed,
            gamesUsed: row.games_used,
            gamesRemaining: row.games_allowed - row.games_used,
            expiresAt: row.expires_at
          };
          
          console.log('Sending update-games response:', response);
          return res.json(response);
        });
        
        return;
      }
    );
    
    return;
  }
  
  // Continue with normal UTR verification
  db.get('SELECT * FROM utrs WHERE utr_number = ?', [trimmedUTR], (err, row) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to verify UTR'
      });
    }

    if (!row) {
      return res.status(400).json({
        success: false,
        message: 'Invalid UTR number'
      });
    }

    // Check if UTR is already used and not expired
    if (row.used_at) {
      const expiryDate = new Date(row.expires_at);
      const now = new Date();
      
      if (expiryDate > now) {
        const response = {
          success: true,
          message: 'Access restored',
          utrNumber: trimmedUTR, // Use the actual UTR number
          planType: row.plan_type,
          gamesAllowed: row.games_allowed,
          gamesUsed: row.games_used || 0,
          expiresAt: row.expires_at
        };
        console.log('Sending response:', response); // Debug log
        return res.json(response);
      } else {
        return res.status(400).json({
          success: false,
          message: 'UTR has expired'
        });
      }
    }

    // If UTR is unused, activate it
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setHours(expiresAt.getHours() + row.duration_hours);

    db.run(
      'UPDATE utrs SET used_at = ?, expires_at = ? WHERE utr_number = ?',
      [now.toISOString(), expiresAt.toISOString(), trimmedUTR],
      (err) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({
            success: false,
            message: 'Failed to activate UTR'
          });
        }

        const response = {
          success: true,
          message: 'UTR verified successfully',
          utrNumber: trimmedUTR, // Use the actual UTR number
          planType: row.plan_type,
          gamesAllowed: row.games_allowed,
          gamesUsed: 0,
          expiresAt: expiresAt.toISOString()
        };
        console.log('Sending response:', response); // Debug log
        res.json(response);
      }
    );
  });
});

// Update plan amounts
router.post('/admin/plans', verifyAdmin, (req, res) => {
  try {
    const { demoAmount, paidAmount } = req.body;
    
    if (!demoAmount || !paidAmount) {
      return res.status(400).json({
        success: false,
        message: 'Both demo and paid amounts are required'
      });
    }

    db.run(
      `INSERT OR REPLACE INTO plan_settings (demo_amount, paid_amount, updated_at) 
       VALUES (?, ?, CURRENT_TIMESTAMP)`,
      [Number(demoAmount), Number(paidAmount)],
      (err) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({
            success: false,
            message: 'Failed to update plan amounts'
          });
        }

        // Always return JSON response
        return res.json({
          success: true,
          message: 'Plan amounts updated successfully'
        });
      }
    );
  } catch (error) {
    console.error('Error in POST /admin/plans:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get plan amounts
router.get('/admin/plans', verifyAdmin, (req, res) => {
  try {
    db.get(
      'SELECT * FROM plan_settings ORDER BY updated_at DESC LIMIT 1',
      (err, row) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({
            success: false,
            message: 'Failed to fetch plan amounts'
          });
        }

        // Always return JSON response
        return res.json({
          success: true,
          demoAmount: row?.demo_amount || 99,
          paidAmount: row?.paid_amount || 999
        });
      }
    );
  } catch (error) {
    console.error('Error in /admin/plans:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get dashboard stats
router.get('/admin/stats', verifyAdmin, (req, res) => {
  try {
    db.get(
      `SELECT 
        (SELECT COUNT(*) FROM utrs) as totalTransactions,
        (SELECT COUNT(*) FROM utrs WHERE used_at IS NULL) as activeUTRs,
        (SELECT COUNT(*) FROM utrs WHERE date(created_at) = date('now')) as todayTransactions,
        (SELECT COUNT(*) FROM utrs WHERE used_at IS NOT NULL) as usedUTRs
      `,
      (err, stats) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({
            success: false,
            message: 'Failed to fetch stats'
          });
        }

        // Always return a JSON response with default values if null
        return res.json({
          success: true,
          stats: {
            totalTransactions: stats?.totalTransactions || 0,
            activeUTRs: stats?.activeUTRs || 0,
            todayTransactions: stats?.todayTransactions || 0,
            usedUTRs: stats?.usedUTRs || 0
          }
        });
      }
    );
  } catch (error) {
    console.error('Error in /admin/stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Analytics endpoint
router.get('/admin/analytics', verifyAdmin, (req, res) => {
  try {
    db.all(`
      SELECT 
        date(created_at) as date,
        COUNT(*) as count,
        SUM(CASE WHEN plan_type = 'demo' THEN 1 ELSE 0 END) as demo_count,
        SUM(CASE WHEN plan_type = 'premium' THEN 1 ELSE 0 END) as premium_count
      FROM utrs
      GROUP BY date(created_at)
      ORDER BY date(created_at) DESC
      LIMIT 30
    `, [], (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch analytics'
        });
      }

      // Calculate revenue data
      const revenueData = rows.map(row => ({
        date: row.date,
        amount: (row.demo_count * 99) + (row.premium_count * 999)
      }));

      // Get overall stats
      db.get(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN used_at IS NULL THEN 1 ELSE 0 END) as unused,
          SUM(CASE WHEN plan_type = 'demo' THEN 1 ELSE 0 END) as demo_count,
          SUM(CASE WHEN plan_type = 'premium' THEN 1 ELSE 0 END) as premium_count,
          COUNT(CASE WHEN date(created_at) = date('now') THEN 1 END) as today_count
        FROM utrs
      `, [], (err, stats) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({
            success: false,
            message: 'Failed to fetch stats'
          });
        }

        res.json({
          success: true,
          revenueData,
          stats: {
            totalTransactions: stats.total,
            activeUTRs: stats.unused,
            demoCount: stats.demo_count,
            premiumCount: stats.premium_count,
            todayTransactions: stats.today_count,
            todayRevenue: (stats.today_demo * 99) + (stats.today_premium * 999)
          }
        });
      });
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update the check-access endpoint
router.get('/check-access', async (req, res) => {
  try {
    console.log('Headers:', req.headers); // Log all headers
    const authHeader = req.headers.authorization;
    console.log('Auth header:', authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Invalid auth header format');
      return res.status(401).json({
        success: false,
        message: 'Invalid authorization header'
      });
    }

    const token = authHeader.split(' ')[1].trim(); // Ensure token is trimmed
    console.log('Extracted token:', token);

    // Get UTR details and validate expiry
    db.get(
      `SELECT * FROM utrs WHERE utr_number = ?`,
      [token],
      (err, utr) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({
            success: false,
            message: 'Failed to check access'
          });
        }

        console.log('Found UTR:', utr);

        if (!utr) {
          console.log('No UTR found for token:', token);
          return res.status(401).json({
            success: false,
            message: 'Invalid or expired access'
          });
        }

        const now = new Date();
        const expiresAt = new Date(utr.expires_at);
        console.log('Checking expiry:', { now, expiresAt });

        if (expiresAt < now) {
          console.log('Access expired');
          return res.json({
            success: false,
            message: 'Access expired',
            access: {
              expired: true
            }
          });
        }

        // Valid access
        console.log('Access valid');
        res.json({
          success: true,
          access: {
            planType: utr.plan_type,
            expiresAt: utr.expires_at,
            gamesRemaining: utr.plan_type === 'demo' ? 
              Math.max(0, utr.games_allowed - (utr.games_used || 0)) : -1,
            expired: false
          }
        });
      }
    );
  } catch (error) {
    console.error('Access check error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Add this endpoint to track game usage
router.post('/game/start', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No access token provided'
    });
  }

  try {
    db.get(
      `SELECT * FROM utrs WHERE utr_number = ? AND used_at IS NOT NULL`,
      [token],
      (err, utr) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({
            success: false,
            message: 'Failed to check access'
          });
        }

        if (!utr) {
          return res.status(401).json({
            success: false,
            message: 'Invalid or expired access'
          });
        }

        const now = new Date();
        const expiresAt = new Date(utr.expires_at);
        
        if (expiresAt < now) {
          return res.status(403).json({
            success: false,
            message: 'Access expired'
          });
        }

        // For demo users, check game limit
        if (utr.plan_type === 'demo') {
          if (utr.games_used >= utr.games_allowed) {
            return res.status(403).json({
              success: false,
              message: 'Game limit reached'
            });
          }

          // Increment games used
          db.run(
            'UPDATE utrs SET games_used = games_used + 1 WHERE utr_number = ?',
            [token],
            (err) => {
              if (err) {
                console.error('Database error:', err);
                return res.status(500).json({
                  success: false,
                  message: 'Failed to update game count'
                });
              }

              res.json({
                success: true,
                gamesRemaining: utr.games_allowed - (utr.games_used + 1)
              });
            }
          );
        } else {
          // Premium users have unlimited access
          res.json({
            success: true,
            gamesRemaining: -1
          });
        }
      }
    );
  } catch (error) {
    console.error('Game start error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Add new route for deleting UTR
router.post('/delete-utr', async (req, res) => {
    try {
        const { utr_number } = req.body;
        
        if (!utr_number) {
            return res.status(400).json({
                success: false,
                message: 'UTR number is required'
            });
        }

        // Delete the UTR from database
        db.run(
            'DELETE FROM utrs WHERE utr_number = ?',
            [utr_number],
            function(err) {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to delete UTR'
                    });
                }

                if (this.changes === 0) {
                    return res.status(404).json({
                        success: false,
                        message: 'UTR not found'
                    });
                }

                console.log('UTR deleted successfully:', utr_number);
                res.json({
                    success: true,
                    message: 'UTR deleted successfully'
                });
            }
        );
    } catch (error) {
        console.error('Delete UTR error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Add admin verify route
router.get('/admin/verify', verifyAdmin, (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authorization header'
      });
    }

    const token = authHeader.split(' ')[1];
    
    // For now, just verify if it's the admin token
    if (token === 'admin_token') {
      return res.json({
        success: true,
        message: 'Admin verified'
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid admin token'
    });
  } catch (error) {
    console.error('Admin verify error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Add error handler middleware at the end of your routes
router.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

module.exports = router; 