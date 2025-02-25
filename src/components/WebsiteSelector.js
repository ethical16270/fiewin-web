import React, { useEffect, useState, useRef } from 'react';
import { Box, Grid, Card, Typography, Button, CircularProgress, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const websites = [
  {
    name: '91 Club',
    icon: 'https://ossimg.91admin123admin.com/91club/other/h5setting_20230714005937kuk1.png',
    url: 'https://91appw.com',
    description: '91 Club is a platform for all your needs. From gaming to slots, we have you covered.',
    available: true
  },
  {
    name: 'Acewin',
    icon: 'https://www.acewin.in/assets/logo-e3182546.png',
    url: 'https://www.acewin.in',
    description: 'Acewin - Premium gaming platform with extensive game selection.',
    available: false
  }
];

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { y: 30, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 12
    }
  }
};

const WebsiteSelector = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(false);
  const checkingRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    const checkAccess = async () => {
      // Prevent duplicate calls
      if (checkingRef.current) return;
      checkingRef.current = true;

      try {
        const accessToken = localStorage.getItem('hackAccess');
        
        if (!accessToken) {
          if (mountedRef.current) {
            navigate('/verify');
          }
          return;
        }

        const response = await fetch('/api/check-access', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (!mountedRef.current) return;

        const data = await response.json();

        if (!mountedRef.current) return;

        if (data.shouldClearStorage) {
          localStorage.clear();
          navigate('/verify');
          return;
        }

        if (!response.ok) {
          setError('Failed to verify access. Please try again.');
          setLoading(false);
          return;
        }

        if (data.success && data.access) {
          if (data.access.gamesUsed !== undefined) {
            localStorage.setItem('hackGamesUsed', data.access.gamesUsed.toString());
          }
          if (data.access.gamesAllowed !== undefined) {
            localStorage.setItem('hackGamesAllowed', data.access.gamesAllowed.toString());
          }
          if (data.access.expiresAt) {
            localStorage.setItem('hackExpiry', data.access.expiresAt);
          }
        }

        setLoading(false);

      } catch (error) {
        if (mountedRef.current) {
          console.error('Access check error:', error);
          setError('Connection error. Please try again.');
          setLoading(false);
        }
      } finally {
        checkingRef.current = false;
      }
    };

    checkAccess();

    return () => {
      mountedRef.current = false;
    };
  }, [navigate]);

  const handleSelect = (url) => {
    localStorage.setItem('selectedWebsite', url);
    navigate('/hack');
  };

  const handleBack = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
        }}
      >
        <CircularProgress 
          sx={{ 
            color: '#00ff00',
            filter: 'drop-shadow(0 0 10px #00ff00)'
          }} 
        />
        <Typography 
          sx={{ 
            mt: 2, 
            color: '#00ff00',
            fontFamily: 'monospace',
            textShadow: '0 0 10px #00ff00'
          }}
        >
          Loading...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <div>
        <p>Error: {error}</p>
        <button onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        py: 4,
        px: 2
      }}
    >
      <Container maxWidth="lg">
        {/* Back Button */}
        <Button
          onClick={handleBack}
          startIcon={<ArrowBackIcon />}
          sx={{
            color: '#00ff00',
            mb: 4,
            '&:hover': {
              background: 'rgba(0, 255, 0, 0.1)',
            }
          }}
        >
          Back to Home
        </Button>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {/* Title Section */}
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <motion.div variants={itemVariants}>
              <Typography
                variant="h2"
                sx={{
                  color: '#00ff00',
                  fontFamily: 'monospace',
                  fontWeight: 'bold',
                  textShadow: '0 0 20px rgba(0, 255, 0, 0.5)',
                  mb: 2
                }}
              >
                Select Website
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  color: '#4eff4e',
                  opacity: 0.8,
                  fontFamily: 'monospace'
                }}
              >
                Choose your target platform to begin
              </Typography>
            </motion.div>
          </Box>

          {/* Website Grid */}
          <Grid container spacing={4} justifyContent="center">
            {websites.map((website) => (
              <Grid item xs={12} sm={8} md={6} key={website.url}>
                <motion.div variants={itemVariants}>
                  <Card
                    sx={{
                      background: website.available ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)',
                      backdropFilter: 'blur(0px)',
                      border: '1px solid rgba(0, 255, 0, 0.2)',
                      borderRadius: '20px',
                      boxShadow: '0 8px 32px rgba(0, 255, 0, 0.1)',
                      overflow: 'hidden',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      opacity: website.available ? 1 : 1,
                      position: 'relative',
                      '&:hover': website.available ? {
                        transform: 'translateY(-8px) scale(1.02)',
                        boxShadow: '0 12px 48px rgba(0, 255, 0, 0.2)',
                        border: '1px solid rgba(0, 255, 0, 0.5)',
                      } : {}
                    }}
                  >
                    {!website.available && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'rgba(0, 0, 0, 0.7)',
                          zIndex: 2,
                          backdropFilter: 'blur(0px)'
                        }}
                      >
                        <Typography
                          variant="h5"
                          sx={{
                            color: '#ff4444',
                            fontFamily: 'monospace',
                            fontWeight: 'bold',
                            textShadow: '0 0 10px rgba(255, 0, 0, 0.5)',
                            transform: 'rotate(-10deg)',
                            border: '2px solid #ff4444',
                            padding: '8px 24px',
                            borderRadius: '4px',
                            boxShadow: '0 0 20px rgba(255, 0, 0, 0.2)'
                          }}
                        >
                          HACK NOT AVAILABLE
                        </Typography>
                      </Box>
                    )}

                    <Box sx={{ p: 4 }}>
                      {/* Website Icon */}
                      <Box
                        sx={{
                          mb: 3,
                          display: 'flex',
                          justifyContent: 'center',
                          position: 'relative',
                          '&::after': {
                            content: '""',
                            position: 'absolute',
                            bottom: -16,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '60%',
                            height: '1px',
                            background: 'linear-gradient(90deg, transparent, #00ff00, transparent)'
                          }
                        }}
                      >
                        <img 
                          src={website.icon} 
                          alt={`${website.name} icon`}
                          style={{
                            width: '300px',
                            height: '100px',
                            objectFit: 'contain',
                            filter: `drop-shadow(0 0 10px rgba(0, 255, 0, 0.3)) ${!website.available ? 'grayscale(1)' : ''}`
                          }}
                        />
                      </Box>

                      {/* Website Info */}
                      <Box sx={{ mb: 4, textAlign: 'center' }}>
                        <Typography
                          variant="h5"
                          sx={{
                            color: website.available ? '#00ff00' : '#666',
                            fontFamily: 'monospace',
                            fontWeight: 'bold',
                            mb: 1
                          }}
                        >
                          {website.name}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            color: website.available ? '#4eff4e' : '#888',
                            opacity: 0.8,
                            fontFamily: 'monospace'
                          }}
                        >
                          {website.description}
                        </Typography>
                      </Box>

                      {/* Select Button */}
                      <Button
                        fullWidth
                        variant="contained"
                        onClick={() => website.available && handleSelect(website.url)}
                        disabled={!website.available}
                        sx={{
                          background: website.available ? 'linear-gradient(45deg, #00cc00, #00ff00)' : 'linear-gradient(45deg, #666, #888)',
                          color: website.available ? '#000' : '#333',
                          fontWeight: 'bold',
                          fontFamily: 'monospace',
                          py: 1.5,
                          fontSize: '1.1rem',
                          textTransform: 'none',
                          borderRadius: '8px',
                          transition: 'all 0.3s ease',
                          opacity: website.available ? 1 : 0.7,
                          '&:hover': website.available ? {
                            background: 'linear-gradient(45deg, #00ff00, #00cc00)',
                            transform: 'scale(1.02)',
                            boxShadow: '0 0 20px rgba(0, 255, 0, 0.4)'
                          } : {}
                        }}
                      >
                        {website.available ? `Select ${website.name}` : 'Coming Soon'}
                      </Button>
                    </Box>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </motion.div>
      </Container>
    </Box>
  );
};

export default WebsiteSelector; 