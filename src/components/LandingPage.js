import React, { useEffect, useState } from 'react';
import { Box, Card, Typography, Button, Container, Grid, CircularProgress, ToggleButtonGroup, ToggleButton, Divider } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import IconButton from '@mui/material/IconButton';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { QRCodeSVG } from 'qrcode.react';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const cardStyle = {
  background: 'rgba(255, 255, 255, 0.05)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '16px',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  overflow: 'hidden',
  boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
  color: 'white'
};

const plans = [
  {
    title: 'Demo Version',
    features: [
      '3 Games Access',
      '24 Hours Access',
      'Basic Hack Features',
      'Basic Effects',
      'Community Support',
      'One-Time Payment'
    ],
    buttonText: 'Buy Demo',
    type: 'demo',
    gradient: 'linear-gradient(135deg, #9b3bff, #6600cc)'
  },
  {
    title: 'Premium Hack',
    features: [
      'Unlimited Games',
      '7 Days Access',
      'Advanced Hack Features',
      'Premium Effects',
      'Priority Support',
      'Instant Updates',
      'One-Time Payment'
    ],
    buttonText: 'Buy Now',
    type: 'premium',
    gradient: 'linear-gradient(135deg, #ff9966, #ff5e62)'
  }
];

const faqs = [
  {
    question: "How do I make a payment?",
    answer: "1. Copy the UPI ID shown above\n2. Open any UPI app (GPay, PhonePe, Paytm)\n3. Send the exact amount for your chosen plan\n4. After payment, click 'Buy Now' and verify your payment"
  },
  {
    question: "How long does it take to activate?",
    answer: "Your hack access will be activated instantly after successful payment verification. Demo version activates immediately without payment."
  },
  {
    question: "What if payment verification fails?",
    answer: "If your payment verification fails, please contact our support on Telegram with your payment screenshot and UTR number. We'll activate your account manually."
  },
  {
    question: "Is it safe to use?",
    answer: "Yes, our hack is completely safe and undetectable. We use advanced algorithms to ensure your account security. However, we recommend using it within reasonable limits."
  },
  {
    question: "Can I use it on multiple devices?",
    answer: "No, your hack access is limited to one device at a time for security reasons. You'll need to logout from other devices before using on a new device."
  },
  {
    question: "What's included in Premium vs Demo?",
    answer: "Demo version gives you 3 free games for 24 hours with basic features. Premium includes unlimited games for 7 days, advanced features, priority support, and instant updates."
  }
];

const LandingPage = () => {
  const navigate = useNavigate();
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState('demo');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [planAmounts, setPlanAmounts] = useState({
    demo: 99,
    paid: 999
  });

  const [activeDetails, setActiveDetails] = useState({
    upi: null,
    plans: {
      demoAmount: 99,
      paidAmount: 999
    }
  });

  const [showPlanDetails, setShowPlanDetails] = useState(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        console.log('Fetching payment details...');
        const response = await fetch('/api/payment-details');
        const data = await response.json();
        console.log('Received data:', data);
        
        if (data.success) {
          setPaymentDetails(data.upi);
          if (data.plans) {
            console.log('Setting plan amounts:', data.plans);
            setPlanAmounts({
              demo: data.plans.demoAmount,
              paid: data.plans.paidAmount
            });
          }
          setActiveDetails({
            upi: data.upi,
            plans: data.plans
          });
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Add a console log when planAmounts changes
  useEffect(() => {
    console.log('Plan amounts updated:', planAmounts);
  }, [planAmounts]);

  // Admin key handler
  useEffect(() => {
    let keys = '';
    const handleKeyPress = (e) => {
      keys += e.key;
      if (keys.includes('admin')) {
        navigate('/admin');
      }
      setTimeout(() => {
        keys = '';
      }, 2000);
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [navigate]);

  const handlePlanChange = (event, newPlan) => {
    if (newPlan !== null) {
      setSelectedPlan(newPlan);
    }
  };

  const handlePlanSelect = (planType) => {
    setShowPlanDetails(planType);
  };

  const handleBack = () => {
    setShowPlanDetails(null);
  };

  const currentPlan = plans.find(plan => plan.type === selectedPlan);

  const generateUpiUrl = (amount) => {
    if (!activeDetails.upi) return '';
    const upiUrl = `upi://pay?pa=${activeDetails.upi.upiId}&pn=${encodeURIComponent(activeDetails.upi.name)}&am=${amount}&cu=INR`;
    return upiUrl;
  };

  const handleVerification = (planType) => {
    if (planType === 'demo') {
      localStorage.setItem('hackAccess', 'demo');
      navigate('/select-website');
    } else {
      navigate('/verify');
    }
  };

  const renderPlanCard = (plan) => {
    const amount = plan.type === 'premium' ? activeDetails.plans.paidAmount : activeDetails.plans.demoAmount;
    const upiUrl = generateUpiUrl(amount);

    return (
      <Box sx={{ p: 3 }}>
        {/* Plan Title */}
        <Typography 
          variant="h5" 
          sx={{ 
            textAlign: 'center',
            background: plan.gradient,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 'bold',
            mb: 2
          }}
        >
          {plan.title}
        </Typography>

        {/* Plan Price */}
        <Typography 
          variant="h3" 
          sx={{ 
            textAlign: 'center',
            fontWeight: 'bold',
            mb: 3
          }}
        >
          ₹{amount}
        </Typography>

        {/* Features List */}
        <Box sx={{ mb: 4 }}>
          {plan.features.map((feature, index) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: plan.gradient,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 2,
                  flexShrink: 0
                }}
              >
                ✓
              </Box>
              <Typography variant="body2">{feature}</Typography>
            </Box>
          ))}
        </Box>

        {/* Payment Section - Show for both plans */}
        <Box sx={{ mb: 3 }}>
          <Divider sx={{ mb: 3 }} />
          <Typography variant="subtitle1" sx={{ mb: 2, textAlign: 'center', fontWeight: 'bold' }}>
            Payment Details
          </Typography>
          
          {/* UPI Details */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              <strong>UPI ID:</strong> {activeDetails.upi?.upiId}
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              <strong>Name:</strong> {activeDetails.upi?.name}
            </Typography>
          </Box>

          {/* QR Code */}
          {activeDetails.upi && (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              mb: 2
            }}>
              <QRCodeSVG 
                value={upiUrl}
                size={200}
                level="H"
                includeMargin={true}
                style={{
                  width: '100%',
                  maxWidth: '180px',
                  height: 'auto',
                  background: 'white',
                  padding: '8px',
                  borderRadius: '8px'
                }}
              />
              <Typography 
                variant="caption" 
                sx={{ 
                  mt: 1,
                  textAlign: 'center',
                  color: 'text.secondary'
                }}
              >
                Scan to pay ₹{amount}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Action Button */}
        <Button
          variant="contained"
          fullWidth
          onClick={() => handleVerification(plan.type)}
          sx={{
            background: plan.gradient,
            py: 1.5,
            fontWeight: 'bold',
            '&:hover': {
              opacity: 0.9,
            }
          }}
        >
          {plan.buttonText}
        </Button>

        {/* Payment Instructions */}
        <Typography 
          variant="caption" 
          sx={{ 
            display: 'block', 
            textAlign: 'center', 
            mt: 2,
            color: 'text.secondary'
          }}
        >
          After payment, click '{plan.buttonText}' to verify your purchase
        </Typography>
      </Box>
    );
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #2A1B3D, #1A1A2E)',
        py: { xs: 2, md: 4 },
        color: 'white',
        overflowY: 'auto',
        overflowX: 'hidden',
        position: 'relative'
      }}
    >
      <Container maxWidth="lg">
        {/* Mobile Menu */}
        {isMobile && (
          <>
            <IconButton
              sx={{ 
                position: 'absolute', 
                top: 16, 
                right: 16,
                color: 'white'
              }}
              onClick={() => setDrawerOpen(true)}
            >
              <MenuIcon />
            </IconButton>
            
            <SwipeableDrawer
              anchor="right"
              open={drawerOpen}
              onClose={() => setDrawerOpen(false)}
              onOpen={() => setDrawerOpen(true)}
              sx={{
                '& .MuiDrawer-paper': {
                  background: 'linear-gradient(135deg, #2A1B3D, #1A1A2E)',
                  color: 'white',
                  width: 250,
                  p: 2
                }
              }}
            >
              {/* Mobile Menu Content */}
              <Box sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Menu</Typography>
                <Button 
                  fullWidth 
                  sx={{ mb: 1, color: 'white' }}
                  onClick={() => {
                    setDrawerOpen(false);
                    navigate('/support');
                  }}
                >
                  Support
                </Button>
                <Button 
                  fullWidth 
                  sx={{ mb: 1, color: 'white' }}
                  onClick={() => {
                    setDrawerOpen(false);
                    navigate('/faq');
                  }}
                >
                  FAQ
                </Button>
              </Box>
            </SwipeableDrawer>
          </>
        )}

        {!showPlanDetails ? (
          <>
            <Typography 
              variant="h2" 
              align="center" 
              sx={{ 
                mb: 2,
                color: '#fff',
                textShadow: '0 0 20px rgba(147, 51, 234, 0.5)',
                fontFamily: 'monospace',
                fontWeight: 'bold',
                fontSize: { xs: '2rem', sm: '3rem', md: '3.75rem' }
              }}
            >
              91Club Hack
            </Typography>

            <Typography 
              align="center" 
              sx={{ 
                mb: { xs: 3, md: 6 },
                color: '#B8B8B8',
                fontFamily: 'monospace',
                fontSize: { xs: '1rem', md: '1.2rem' },
                px: 2
              }}
            >
              Reduce Negativity • Increase Positivity • Achieve Goals
            </Typography>

            {/* Plan Toggle */}
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              mb: { xs: 3, md: 4 }
            }}>
              <ToggleButtonGroup
                value={selectedPlan}
                exclusive
                onChange={handlePlanChange}
                sx={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: { xs: 0.5, md: 1 },
                  borderRadius: 3,
                  '& .MuiToggleButton-root': {
                    border: 'none',
                    borderRadius: 2,
                    mx: { xs: 0.5, md: 1 },
                    px: { xs: 2, md: 4 },
                    py: 1,
                    color: 'white',
                    fontSize: { xs: '0.875rem', md: '1rem' },
                    '&.Mui-selected': {
                      background: '#9333EA',
                      color: 'white',
                      '&:hover': {
                        background: '#7928CA',
                      }
                    }
                  }
                }}
              >
                <ToggleButton value="demo">Demo</ToggleButton>
                <ToggleButton value="premium">Premium</ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {/* Show only the selected plan */}
            <Grid container justifyContent="center" sx={{ mt: 4 }}>
              {plans
                .filter(plan => plan.type === selectedPlan)
                .map((plan) => (
                  <Grid item xs={12} sm={8} md={6} key={plan.type}>
                    <Card sx={{
                      ...cardStyle,
                      transform: 'scale(1)',
                      '&:hover': {
                        transform: 'scale(1.02)',
                      }
                    }}>
                      <Box sx={{ p: 3 }}>
                        <Typography 
                          variant="h5" 
                          sx={{ 
                            textAlign: 'center',
                            background: plan.gradient,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            fontWeight: 'bold',
                            mb: 2
                          }}
                        >
                          {plan.title}
                        </Typography>

                        <Typography 
                          variant="h3" 
                          sx={{ 
                            textAlign: 'center',
                            fontWeight: 'bold',
                            mb: 3
                          }}
                        >
                          ₹{plan.type === 'premium' ? activeDetails.plans?.paidAmount : activeDetails.plans?.demoAmount}
                        </Typography>

                        {/* Features List */}
                        <Box sx={{ mb: 4 }}>
                          {plan.features.map((feature, index) => (
                            <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                              <Box
                                sx={{
                                  width: 20,
                                  height: 20,
                                  borderRadius: '50%',
                                  background: plan.gradient,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  mr: 2,
                                  flexShrink: 0
                                }}
                              >
                                ✓
                              </Box>
                              <Typography variant="body2">{feature}</Typography>
                            </Box>
                          ))}
                        </Box>

                        <Button
                          variant="contained"
                          fullWidth
                          onClick={() => handlePlanSelect(plan.type)}
                          sx={{
                            background: plan.gradient,
                            py: 1.5,
                            fontWeight: 'bold',
                            '&:hover': {
                              opacity: 0.9,
                            }
                          }}
                        >
                          View Details
                        </Button>
                      </Box>
                    </Card>
                  </Grid>
                ))}
            </Grid>
          </>
        ) : (
          <Box>
            <Button
              onClick={handleBack}
              sx={{ mb: 3, color: 'white' }}
              startIcon={<ArrowBackIcon />}
            >
              Back to Plans
            </Button>

            <Card sx={{ ...cardStyle, maxWidth: 600, mx: 'auto' }}>
              <Box sx={{ p: 4 }}>
                {renderPlanCard(plans.find(p => p.type === showPlanDetails))}
              </Box>
            </Card>
          </Box>
        )}

        {/* FAQ Section */}
        <Box sx={{ 
          maxWidth: 800, 
          mx: 'auto', 
          mt: { xs: 4, md: 6 },
          mb: { xs: 4, md: 6 }
        }}>
          <Typography 
            variant="h4" 
            sx={{ 
              mb: 3,
              textAlign: 'center',
              fontSize: { xs: '1.5rem', md: '2rem' },
              color: '#fff',
              textShadow: '0 0 10px rgba(147, 51, 234, 0.3)'
            }}
          >
            Frequently Asked Questions
          </Typography>

          {faqs.map((faq, index) => (
            <Accordion
              key={index}
              sx={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                color: 'white',
                mb: 1,
                border: '1px solid rgba(255, 255, 255, 0.1)',
                '&:before': {
                  display: 'none',
                },
                '& .MuiAccordionSummary-root': {
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                },
                '& .MuiAccordionSummary-expandIconWrapper': {
                  color: 'white',
                },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon sx={{ color: 'white' }} />}
                sx={{
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.05)',
                  }
                }}
              >
                <Typography sx={{ 
                  fontWeight: 'bold',
                  fontSize: { xs: '0.9rem', md: '1rem' }
                }}>
                  {faq.question}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography sx={{ 
                  color: '#B8B8B8',
                  whiteSpace: 'pre-line',
                  fontSize: { xs: '0.85rem', md: '0.95rem' }
                }}>
                  {faq.answer}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>

        {/* Support Contact */}
        <Box
          sx={{
            maxWidth: 800,
            mx: 'auto',
            mb: 4,
            p: { xs: 2, md: 3 },
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            textAlign: 'center'
          }}
        >
          <Typography 
            variant="h6"
            sx={{ 
              mb: 1,
              fontSize: { xs: '1rem', md: '1.25rem' }
            }}
          >
            Need Help?
          </Typography>
          <Typography 
            sx={{ 
              color: '#B8B8B8',
              fontSize: { xs: '0.9rem', md: '1rem' }
            }}
          >
            Contact our support team on Telegram for instant assistance
          </Typography>
          <Button
            variant="contained"
            href="https://t.me/ethicalh4cker"
            target="_blank"
            sx={{
              mt: 2,
              background: 'linear-gradient(135deg, #9b3bff, #6600cc)',
              '&:hover': {
                background: 'linear-gradient(135deg, #8833ff, #5500aa)',
              }
            }}
          >
            Join Telegram Support
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default LandingPage; 