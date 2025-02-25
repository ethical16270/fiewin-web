import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Typography, CircularProgress, Card, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const UTRVerification = () => {
  const [utr, setUtr] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [planDetails, setPlanDetails] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkExistingAccess = async () => {
      const accessToken = localStorage.getItem('hackAccess');
      if (!accessToken) {
        return;
      }

      try {
        const response = await fetch('/api/check-access', {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        
        const data = await response.json();
        if (data.success && !data.access.expired) {
          navigate('/select-website');
          return;
        }
        
        // Clear invalid access data
        localStorage.clear();
      } catch (error) {
        console.error('Access check failed:', error);
        localStorage.clear();
      }
    };

    checkExistingAccess();
    
    // Load payment details
    setLoadingDetails(true);
    fetch('/api/payment-details')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setPaymentDetails(data.upi);
        }
      })
      .catch(error => {
        console.error('Failed to load payment details:', error);
      })
      .finally(() => {
        setLoadingDetails(false);
      });
  }, [navigate]);

  const handleVerify = async () => {
    setLoading(true);
    setError('');
    
    try {
      const trimmedUTR = utr.trim();
      console.log('Submitting UTR:', trimmedUTR);

      const response = await fetch('/api/verify-utr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ utr: trimmedUTR })
      });

      const data = await response.json();
      console.log('Verify response:', data);

      if (data.success) {
        // Clear any existing data first
        localStorage.clear();
        
        // Store all relevant data
        localStorage.setItem('hackAccess', data.utrNumber);
        localStorage.setItem('hackPlanType', data.planType);
        localStorage.setItem('hackGamesAllowed', data.gamesAllowed.toString());
        localStorage.setItem('hackGamesUsed', (data.gamesUsed || 0).toString());
        localStorage.setItem('hackExpiry', data.expiresAt);
        
        console.log('Stored values:', {
          access: localStorage.getItem('hackAccess'),
          planType: localStorage.getItem('hackPlanType'),
          gamesAllowed: localStorage.getItem('hackGamesAllowed'),
          gamesUsed: localStorage.getItem('hackGamesUsed'),
          expiry: localStorage.getItem('hackExpiry')
        });

        navigate('/select-website');
      } else {
        setError(data.message || 'Verification failed');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    setShowSuccessDialog(false);
    navigate('/select-website');
  };

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 8 }}>
      {loadingDetails ? (
        <CircularProgress />
      ) : paymentDetails ? (
        <Card
          sx={{
            mb: 4,
            p: 3,
            background: 'rgba(0, 0, 0, 0.8)',
            border: '1px solid #00ff00',
          }}
        >
          <Typography variant="h6" sx={{ color: '#00ff00', mb: 2 }}>
            Payment Details
          </Typography>
          <Typography sx={{ color: 'white', mb: 1 }}>
            UPI ID: {paymentDetails.id}
          </Typography>
          <Typography sx={{ color: 'white', mb: 1 }}>
            Name: {paymentDetails.name}
          </Typography>
          <Typography sx={{ color: 'white', mb: 1 }}>
            Amount: ₹{paymentDetails.amount}
          </Typography>
        </Card>
      ) : (
        <Typography color="error">
          Failed to load payment details. Please try again later.
        </Typography>
      )}

      <Box
        sx={{
          maxWidth: 400,
          mx: 'auto',
          mt: 8,
          p: 4,
          background: 'rgba(0, 0, 0, 0.8)',
          border: '1px solid #00ff00',
          borderRadius: '10px',
          boxShadow: '0 0 20px rgba(0, 255, 0, 0.2)',
        }}
      >
        <Typography
          variant="h4"
          sx={{
            mb: 4,
            color: '#00ff00',
            textAlign: 'center',
            fontFamily: 'monospace',
            textShadow: '0 0 10px #00ff00'
          }}
        >
          Verify Payment
        </Typography>

        <TextField
          fullWidth
          value={utr}
          onChange={(e) => setUtr(e.target.value)}
          placeholder="Enter UTR Number"
          sx={{
            mb: 3,
            '& .MuiInputBase-root': {
              color: 'white',
              fontFamily: 'monospace',
            },
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: '#00ff00',
              },
              '&:hover fieldset': {
                borderColor: '#00ff00',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#00ff00',
              },
            },
          }}
        />

        {error && (
          <Typography
            color="error"
            sx={{ mb: 2, fontFamily: 'monospace' }}
          >
            {error}
          </Typography>
        )}

        <Button
          fullWidth
          variant="contained"
          onClick={handleVerify}
          disabled={loading || !utr}
          sx={{
            background: 'linear-gradient(45deg, #00cc00, #00ff00)',
            color: 'black',
            fontWeight: 'bold',
            fontFamily: 'monospace',
            '&:hover': {
              background: 'linear-gradient(45deg, #00ff00, #00cc00)',
            }
          }}
        >
          {loading ? <CircularProgress size={24} /> : 'Verify UTR'}
        </Button>
      </Box>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onClose={() => setShowSuccessDialog(false)}>
        <DialogTitle sx={{ color: '#00ff00', fontFamily: 'monospace' }}>
          Payment Verified Successfully
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Your premium plan has been activated!
          </Typography>
          {planDetails && (
            <>
              <Typography sx={{ mb: 1 }}>
                Plan Duration: {planDetails.duration} hours
              </Typography>
              <Typography sx={{ mb: 1 }}>
                Expires: {new Date(planDetails.expiresAt).toLocaleString()}
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleContinue}
            sx={{
              background: 'linear-gradient(45deg, #00cc00, #00ff00)',
              color: 'black',
              '&:hover': {
                background: 'linear-gradient(45deg, #00ff00, #00cc00)',
              }
            }}
          >
            Continue to Hack
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UTRVerification; 