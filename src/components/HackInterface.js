import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import GamesIcon from '@mui/icons-material/Games';
import TimerIcon from '@mui/icons-material/Timer';
import StarIcon from '@mui/icons-material/Star';
import WebView from './WebView';
import Watermark from './Watermark';
import ScrollingHeadline from './ScrollingHeadline';
import HackButton from './HackButton';

const HackInterface = () => {
  const navigate = useNavigate();
  const [accessInfo, setAccessInfo] = useState(null);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [loading, setLoading] = useState(true);
  const [gamesUsed, setGamesUsed] = useState(0);
  const [gamesAllowed, setGamesAllowed] = useState(0);
  const [upgradeTimer, setUpgradeTimer] = useState(null);
  
  useEffect(() => {
    const checkAccess = async () => {
      try {
        const accessToken = localStorage.getItem('hackAccess');
        console.log('Checking access with token:', accessToken);

        if (!accessToken || accessToken === 'undefined' || accessToken === 'null') {
          console.log('No valid access token found');
          localStorage.clear();
          navigate('/verify');
          return;
        }

        const response = await fetch('/api/check-access', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken.trim()}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();
        console.log('Found UTR:', data.utr);

        // If access is expired, delete the UTR
        if (!response.ok || !data.success || data.access?.expired) {
          console.log('Access expired, deleting UTR');
          if (data.utr?.id) {
            try {
              const deleteResponse = await fetch(`/api/admin/utr/${data.utr.id}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'Content-Type': 'application/json'
                }
              });
              console.log('Delete UTR response:', deleteResponse.status);
            } catch (error) {
              console.error('Failed to delete UTR:', error);
            }
          }
          localStorage.clear();
          navigate('/verify');
          return;
        }

        const planType = localStorage.getItem('hackPlanType');
        const storedGamesUsed = parseInt(localStorage.getItem('hackGamesUsed') || '0');
        const maxGames = planType === 'demo' ? 3 : Infinity;
        
        console.log('Current games:', { used: storedGamesUsed, allowed: maxGames });
        
        setGamesUsed(storedGamesUsed);
        setGamesAllowed(maxGames);

        // Update games tracking with server data if available
        const serverGamesUsed = parseInt(data.access?.gamesUsed || '0');
        const currentGamesUsed = Math.max(serverGamesUsed, storedGamesUsed);
        
        // Sync the games count
        localStorage.setItem('hackGamesUsed', currentGamesUsed.toString());
        setGamesUsed(currentGamesUsed);
        
        // Store the UTR ID from the correct location in the response
        setAccessInfo({
          ...data.access,
          gamesRemaining: maxGames - currentGamesUsed,
          id: data.utr?.id // Get ID from the utr object
        });
        
        updateTimeRemaining(data.access.expiresAt);
        setLoading(false);

      } catch (error) {
        console.error('Access check failed:', error);
        localStorage.clear();
        navigate('/verify');
      }
    };

    checkAccess();
    const interval = setInterval(checkAccess, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [navigate]);

  useEffect(() => {
    const syncGamesCount = async () => {
      if (!accessInfo?.planType === 'demo') return;
      
      try {
        const accessToken = localStorage.getItem('hackAccess');
        const response = await fetch('/api/check-access', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();
        if (data.success && data.access) {
          const serverCount = parseInt(data.access.gamesUsed || '0');
          const localCount = parseInt(localStorage.getItem('hackGamesUsed') || '0');
          
          if (serverCount !== localCount) {
            console.log('Syncing games count:', { server: serverCount, local: localCount });
            setGamesUsed(serverCount);
            localStorage.setItem('hackGamesUsed', serverCount.toString());
          }
        }
      } catch (error) {
        console.error('Failed to sync games count:', error);
      }
    };

    const syncInterval = setInterval(syncGamesCount, 30000); // Sync every 30 seconds
    return () => clearInterval(syncInterval);
  }, [accessInfo?.planType]);

  const updateTimeRemaining = (expiresAt) => {
    const expiry = new Date(expiresAt);
    const now = new Date();
    const diffHours = Math.ceil((expiry - now) / (1000 * 60 * 60));
    
    if (diffHours <= 0) {
      setTimeRemaining('Expired');
      setShowUpgradeDialog(true);
    } else if (diffHours < 24) {
      setTimeRemaining(`${diffHours}h remaining`);
    } else {
      setTimeRemaining(`${Math.ceil(diffHours/24)}d remaining`);
    }
  };

  const handleGamePlayed = async () => {
    try {
        // Debug current state
        console.log('handleGamePlayed triggered', {
            gamesUsed,
            planType: accessInfo?.planType,
            gamesAllowed,
            storedGames: localStorage.getItem('hackGamesUsed')
        });

        // Validate access info
        if (!accessInfo) {
            console.error('No access info available');
            return;
        }

        // Increment games used first
        const newGamesUsed = gamesUsed + 1;
        
        // Check if this game will reach the limit
        if (accessInfo.planType === 'demo' && newGamesUsed >= 3) {
            console.log('Demo limit reached, showing upgrade dialog');
            
            // Update local state
            setGamesUsed(newGamesUsed);
            localStorage.setItem('hackGamesUsed', newGamesUsed.toString());
            
            // Send final update to server before starting timer
            try {
                const accessToken = localStorage.getItem('hackAccess');
                await fetch('/api/verify-utr', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        utr: accessToken,
                        gamesUsed: newGamesUsed,
                        planType: 'demo',
                        action: 'update-games'
                    })
                });
            } catch (error) {
                console.error('Failed to update final game count:', error);
            }
            
            // Show dialog and start timer
            setShowUpgradeDialog(true);
            setUpgradeTimer(10);
            return;
        }

        // Update local state first
        setGamesUsed(newGamesUsed);
        localStorage.setItem('hackGamesUsed', newGamesUsed.toString());

        // Get access token
        const accessToken = localStorage.getItem('hackAccess');
        if (!accessToken) {
            throw new Error('No access token found');
        }

        // Send update to server with the correct endpoint
        const response = await fetch('/api/verify-utr', { // Changed to /api/verify-utr
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                utr: accessToken,
                gamesUsed: newGamesUsed,
                planType: accessInfo.planType,
                action: 'update-games'
            })
        });

        if (!response.ok) {
            throw new Error(`Server returned ${response.status}`);
        }

        const data = await response.json();
        console.log('Server response:', data);

        if (!data.success) {
            throw new Error(data.message || 'Failed to update games count');
        }

        // Update access info state
        setAccessInfo(prev => ({
            ...prev,
            gamesRemaining: gamesAllowed - newGamesUsed
        }));

    } catch (error) {
        console.error('Failed to update games count:', error);
        // Revert local changes on failure
        const storedGames = parseInt(localStorage.getItem('hackGamesUsed') || '0');
        setGamesUsed(storedGames);
        // Don't show alert to user, just handle silently
        console.warn('Reverting to stored games count:', storedGames);
    }
  };

  // Modify the timer effect to use new delete endpoint
  useEffect(() => {
    let interval;
    if (upgradeTimer !== null && upgradeTimer > 0) {
        interval = setInterval(() => {
            setUpgradeTimer(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    
                    const deleteUTR = async () => {
                        try {
                            const accessToken = localStorage.getItem('hackAccess');
                            
                            // Use new dedicated delete endpoint
                            const deleteResponse = await fetch('/api/delete-utr', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    utr_number: accessToken
                                })
                            });
                            
                            if (!deleteResponse.ok) {
                                throw new Error('Failed to delete UTR');
                            }
                            
                            console.log('UTR deleted successfully');
                            
                        } catch (error) {
                            console.error('Failed to delete UTR:', error);
                        } finally {
                            console.log('Cleaning up and redirecting...');
                            localStorage.clear();
                            navigate('/verify');
                        }
                    };
                    
                    deleteUTR();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }
    
    return () => {
        if (interval) {
            clearInterval(interval);
        }
    };
  }, [upgradeTimer, navigate]);

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <CircularProgress sx={{ color: '#00ff00' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ 
        width: '100%',
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        isolation: 'isolate',
        pb: 'env(safe-area-inset-bottom, 0px)',
        '@supports (-webkit-touch-callout: none)': {
            height: '-webkit-fill-available',
            minHeight: '-webkit-fill-available'
        }
    }}>
        {/* Background Website Layer */}
        <Box sx={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 'env(safe-area-inset-bottom, 0px)',
            zIndex: 1,
            '@supports (-webkit-touch-callout: none)': {
                height: '-webkit-fill-available'
            }
        }}>
            <WebView 
                onGameComplete={handleGamePlayed} 
                style={{
                    width: '100%',
                    height: '100%',
                    border: 'none'
                }}
            />
        </Box>

        {/* Scrolling Headline Layer */}
        <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '24px',
            background: 'linear-gradient(90deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.6) 100%)',
            backdropFilter: 'blur(5px)',
            zIndex: 30,
            display: 'flex',
            alignItems: 'center',
            overflow: 'hidden'
        }}>
            <ScrollingHeadline 
                text="This hack is made by JITU contact on telegram @smsn_knt"
            />
        </Box>

        {/* Overlay Layer */}
        <Box sx={{ 
            position: 'absolute',
            top: 24, // Keep 24px from top for headline
            left: 0,
            right: 0,
            bottom: 'env(safe-area-inset-bottom, 0px)',
            zIndex: 2,
            pointerEvents: 'none',
            '@supports (-webkit-touch-callout: none)': {
                height: '-webkit-fill-available'
            }
        }}>
            {/* Header Section - Always visible and properly positioned */}
            <Box sx={{ 
                position: 'absolute',
                top: 24, // Keep 24px from top for headline
                left: 0,
                right: 0,
                background: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(10px)',
                pointerEvents: 'auto',
                zIndex: 10, // Ensure it's above other elements
                padding: '8px',
                borderBottom: '1px solid rgba(0, 255, 0, 0.1)'
            }}>
                {accessInfo && (
                    <>
                        <Card sx={{ 
                            m: 1, 
                            bgcolor: 'rgba(18, 18, 18, 0.9)', // Increased opacity
                            color: 'white',
                            backdropFilter: 'blur(10px)',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                            border: '1px solid rgba(0, 255, 0, 0.1)'
                        }}>
                            <Box sx={{ 
                                display: 'flex', 
                                flexDirection: 'column',
                                gap: 1,
                                p: 2, // Increased padding
                            }}>
                                {/* Plan Type and Time Remaining */}
                                <Box sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    mb: 1
                                }}>
                                    <Typography variant="subtitle1" sx={{ 
                                        fontWeight: 600,
                                        color: '#00ff00',
                                        textShadow: '0 0 10px rgba(0, 255, 0, 0.3)'
                                    }}>
                                        {accessInfo.planType === 'premium' ? '🌟 Premium Access' : '🎮 Demo Access'}
                                    </Typography>
                                    <Chip
                                        label={timeRemaining}
                                        color={timeRemaining === 'Expired' ? 'error' : 'warning'}
                                        icon={<TimerIcon />}
                                        size="small"
                                        sx={{
                                            transition: 'all 0.3s ease',
                                            animation: timeRemaining === 'Expired' ? 'pulse 2s infinite' : 'none',
                                            fontWeight: 500
                                        }}
                                    />
                                </Box>

                                {/* Games Usage Indicator for Demo Users */}
                                {accessInfo.planType === 'demo' && (
                                    <Box sx={{ width: '100%' }}>
                                        <Box sx={{ 
                                            display: 'flex', 
                                            justifyContent: 'space-between', 
                                            alignItems: 'center',
                                            mb: 1
                                        }}>
                                            <Typography sx={{ 
                                                color: '#4eff4e',
                                                fontSize: '0.9rem',
                                                fontWeight: 500
                                            }}>
                                                Games Remaining: {3 - gamesUsed}
                                            </Typography>
                                            <Typography sx={{ 
                                                color: gamesUsed >= 3 ? '#ff4444' : '#666',
                                                fontSize: '0.9rem',
                                                fontWeight: 500
                                            }}>
                                                {gamesUsed}/3 Used
                                            </Typography>
                                        </Box>
                                        <Box sx={{ 
                                            width: '100%', 
                                            height: '6px', // Increased height
                                            bgcolor: 'rgba(0,0,0,0.5)',
                                            borderRadius: '3px',
                                            overflow: 'hidden',
                                            border: '1px solid rgba(0, 255, 0, 0.1)'
                                        }}>
                                            <Box sx={{
                                                width: `${(gamesUsed / 3) * 100}%`,
                                                height: '100%',
                                                bgcolor: gamesUsed >= 3 ? '#ff4444' : '#4eff4e',
                                                transition: 'width 0.3s ease',
                                                boxShadow: '0 0 10px rgba(0,255,0,0.3)',
                                            }} />
                                        </Box>
                                        {gamesUsed >= 3 && (
                                            <Typography 
                                                sx={{ 
                                                    color: '#ff4444',
                                                    fontSize: '0.9rem',
                                                    fontWeight: 500,
                                                    textAlign: 'center',
                                                    mt: 1,
                                                    animation: 'pulse 1.5s infinite',
                                                    '@keyframes pulse': {
                                                        '0%': { opacity: 0.6 },
                                                        '50%': { opacity: 1 },
                                                        '100%': { opacity: 0.6 }
                                                    }
                                                }}
                                            >
                                                ⚠️ Demo limit reached! Upgrade to Premium for unlimited access
                                            </Typography>
                                        )}
                                    </Box>
                                )}
                            </Box>
                        </Card>

                        {/* Upgrade Button */}
                        {accessInfo.planType === 'demo' && gamesUsed >= 2 && (
                            <Button
                                fullWidth
                                variant="contained"
                                startIcon={<StarIcon />}
                                onClick={() => setShowUpgradeDialog(true)}
                                sx={{
                                    mx: 1,
                                    mt: 1,
                                    background: 'linear-gradient(45deg, #9333EA, #7928CA)',
                                    animation: 'pulse 2s infinite',
                                    py: 1,
                                    fontWeight: 600,
                                    '@keyframes pulse': {
                                        '0%': { transform: 'scale(1)' },
                                        '50%': { transform: 'scale(1.02)' },
                                        '100%': { transform: 'scale(1)' }
                                    }
                                }}
                            >
                                🌟 Upgrade to Premium for Unlimited Access
                            </Button>
                        )}
                    </>
                )}
            </Box>

            {/* Hack Controls Layer - Adjust position for safe area */}
            <Box sx={{ 
                position: 'absolute',
                bottom: 'max(16px, env(safe-area-inset-bottom, 16px))',
                right: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                pointerEvents: 'auto'
            }}>
                <HackButton />
            </Box>

            {/* Watermark Layer */}
            <Box sx={{ 
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%) rotate(-45deg)',
                opacity: 0.1,
                pointerEvents: 'none'
            }}>
                <Watermark />
            </Box>
        </Box>

        {/* Dialog Layer */}
        <Dialog 
            open={showUpgradeDialog} 
            onClose={() => {
                // Only allow closing if timer is not active
                if (upgradeTimer === null) {
                    setShowUpgradeDialog(false);
                }
            }}
            maxWidth="sm"
            fullWidth
            disableEscapeKeyDown={upgradeTimer !== null}
            sx={{
                '& .MuiDialog-paper': {
                    bgcolor: 'rgba(18, 18, 18, 0.9)',
                    backdropFilter: 'blur(10px)',
                    color: 'white'
                }
            }}
        >
            <DialogTitle sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center' 
            }}>
                <Typography variant="h6">Upgrade to Premium Access</Typography>
                {upgradeTimer !== null && (
                    <Chip
                        label={`${upgradeTimer}s`}
                        color="warning"
                        sx={{
                            animation: 'pulse 1s infinite',
                            '@keyframes pulse': {
                                '0%': { opacity: 0.6 },
                                '50%': { opacity: 1 },
                                '100%': { opacity: 0.6 }
                            }
                        }}
                    />
                )}
            </DialogTitle>
            <DialogContent>
                <Box sx={{ py: 2 }}>
                    {upgradeTimer !== null && (
                        <Alert 
                            severity="warning" 
                            sx={{ 
                                mb: 2,
                                animation: 'fadeIn 0.5s',
                                '@keyframes fadeIn': {
                                    '0%': { opacity: 0 },
                                    '100%': { opacity: 1 }
                                }
                            }}
                        >
                            ⚠️ Your session will expire in {upgradeTimer} seconds. Upgrade now to continue!
                        </Alert>
                    )}
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        Premium Benefits:
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Typography>✓ Unlimited games access</Typography>
                        <Typography>✓ 7 days validity</Typography>
                        <Typography>✓ All premium features</Typography>
                        <Typography>✓ Priority support</Typography>
                    </Box>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button 
                    onClick={() => setShowUpgradeDialog(false)}
                    disabled={upgradeTimer !== null}
                >
                    Maybe Later
                </Button>
                <Button 
                    variant="contained"
                    color="primary"
                    onClick={() => {
                        setShowUpgradeDialog(false);
                        navigate('/');
                    }}
                    sx={{
                        background: upgradeTimer !== null ? 
                            'linear-gradient(45deg, #FF6B6B, #FF8E53)' : 
                            undefined,
                        animation: upgradeTimer !== null ? 
                            'pulse 1.5s infinite' : undefined
                    }}
                >
                    Upgrade Now
                </Button>
            </DialogActions>
        </Dialog>
    </Box>
  );
};

export default HackInterface; 