import React, { useState } from 'react';
import { Box, Card, TextField, Button, Typography, Container, CircularProgress } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const PlanVerification = () => {
  const navigate = useNavigate();
  const [utr, setUtr] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    if (!utr.trim()) {
      setError('Please enter UTR number');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/verify-utr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ utr: utr.trim() })
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('hackAccess', data.utrNumber);
        localStorage.setItem('hackPlanType', data.planType);
        localStorage.setItem('hackExpiry', data.expiresAt);
        localStorage.setItem('hackGamesAllowed', data.gamesAllowed);
        localStorage.setItem('hackGamesUsed', data.gamesUsed || 0);
        
        const expiryDate = new Date(data.expiresAt);
        const days = data.planType === 'demo' ? '24 hours' : '7 days';
        const timeLeft = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60)); // Hours left
        
        setError('');
        
        // Show different messages for new vs existing UTR
        if (data.message.includes('existing')) {
          alert(`Welcome back! Your ${data.planType} access is still valid for ${timeLeft} hours`);
        } else {
          alert(`Access granted! Your ${data.planType} access is valid for ${days}`);
        }
        
        navigate('/select-website');
      } else {
        setError(data.message || 'Invalid UTR number');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setError('Failed to verify UTR. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #2A1B3D, #1A1A2E)',
        py: 4,
        color: 'white'
      }}
    >
      <Container maxWidth="sm">
        <Button
          onClick={() => navigate('/')}
          sx={{ color: 'white', mb: 3 }}
          startIcon={<ArrowBackIcon />}
        >
          Back to Plans
        </Button>

        <Card sx={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          p: 4,
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
        }}>
          <Typography variant="h5" sx={{ mb: 3, textAlign: 'center' }}>
            Verify Your Payment
          </Typography>

          <Typography variant="body2" sx={{ mb: 3, color: '#B8B8B8', textAlign: 'center' }}>
            Enter the UTR number from your payment to activate your premium access
          </Typography>

          <TextField
            fullWidth
            label="UTR Number"
            value={utr}
            onChange={(e) => setUtr(e.target.value)}
            error={!!error}
            helperText={error}
            sx={{
              mb: 3,
              '& .MuiOutlinedInput-root': {
                transition: 'all 0.3s ease',
                color: 'white',
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.23)',
                  transition: 'border-color 0.3s ease',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#9333EA',
                  borderWidth: '2px',
                },
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(255, 255, 255, 0.7)',
                transition: 'color 0.3s ease',
                '&.Mui-focused': {
                  color: '#9333EA',
                }
              },
              '& .MuiFormHelperText-root': {
                color: '#ff6b6b',
                transition: 'opacity 0.3s ease',
                opacity: error ? 1 : 0,
              },
            }}
          />

          <Button
            fullWidth
            variant="contained"
            onClick={handleVerify}
            disabled={loading}
            sx={{
              background: 'linear-gradient(135deg, #9333EA, #7928CA)',
              py: 1.5,
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden',
              '&:hover': {
                background: 'linear-gradient(135deg, #7928CA, #5B21B6)',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 20px rgba(147, 51, 234, 0.3)',
              },
              '&:active': {
                transform: 'translateY(0)',
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent)',
                transition: 'transform 0.3s ease',
                transform: 'translateX(-100%)',
              },
              '&:hover::after': {
                transform: 'translateX(100%)',
              },
            }}
          >
            {loading ? (
              <CircularProgress 
                size={24} 
                color="inherit" 
                sx={{
                  animation: 'pulse 1.5s ease-in-out infinite',
                  '@keyframes pulse': {
                    '0%': { opacity: 0.6 },
                    '50%': { opacity: 1 },
                    '100%': { opacity: 0.6 }
                  }
                }}
              />
            ) : 'Verify Payment'}
          </Button>

          <Typography variant="caption" sx={{ display: 'block', mt: 2, textAlign: 'center', color: '#B8B8B8' }}>
            The UTR number can be found in your payment confirmation message
          </Typography>
        </Card>
      </Container>
    </Box>
  );
};

export default PlanVerification; 