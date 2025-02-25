import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Card,
  TextField,
  Button,
  Typography,
  List,
  ListItem,
  Divider,
  CircularProgress,
  Alert,
  Snackbar,
  IconButton,
  Paper,
  Tooltip,
  Badge,
  Tabs, Tab, Switch, FormControlLabel,
  Dialog, DialogTitle, DialogContent,
  DialogActions, Grid, Chip, Avatar,
  Menu, MenuItem, Fade, useTheme, ListItemIcon, ListItemText,
  InputLabel, FormControl, Select,
  TableContainer, Table, TableHead, TableBody, TableRow, TableCell
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SecurityIcon from '@mui/icons-material/Security';
import HistoryIcon from '@mui/icons-material/History';
import PersonIcon from '@mui/icons-material/Person';
import MoneyIcon from '@mui/icons-material/Money';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AddIcon from '@mui/icons-material/Add';
import DownloadIcon from '@mui/icons-material/Download';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import BlockIcon from '@mui/icons-material/Block';
import BackupIcon from '@mui/icons-material/Backup';
import { ColorModeContext } from '../App';
import { LineChart, PieChart } from '@mui/x-charts';

const AdminPanel = () => {
  const [upiDetails, setUpiDetails] = useState({
    upiId: '',
    name: ''
  });
  
  const [planAmounts, setPlanAmounts] = useState({
    demo: 99,
    paid: 999
  });

  const [utrForm, setUtrForm] = useState({
    utr: '',
    planType: 'demo' // 'demo' or 'paid'
  });

  const [utrList, setUtrList] = useState([]);
  const [token, setToken] = useState(localStorage.getItem('adminToken'));
  const [isLoggedIn, setIsLoggedIn] = useState(!!token);
  const [loginForm, setLoginForm] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState({
    login: false,
    upiUpdate: false,
    utrAdd: false,
    utrFetch: false,
    planUpdate: false
  });
  const [error, setError] = useState({
    message: '',
    show: false
  });
  const [copyFeedback, setCopyFeedback] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [darkMode, setDarkMode] = useState(true);
  const [settingsAnchor, setSettingsAnchor] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [actionToConfirm, setActionToConfirm] = useState(null);
  const [stats, setStats] = useState({
    totalTransactions: 0,
    activeUTRs: 0,
    todayTransactions: 0,
    usedUTRs: 0,
    demoCount: 0,
    premiumCount: 0,
    todayRevenue: 0
  });
  const [activeDetails, setActiveDetails] = useState({
    upi: {
      upiId: '',
      name: ''
    },
    plans: {
      demoAmount: 0,
      paidAmount: 0
    }
  });

  const [newUTR, setNewUTR] = useState('');
  const [isPaidPlan, setIsPaidPlan] = useState(true);
  const [gamesAllowed, setGamesAllowed] = useState(3);

  const [utrFilters, setUtrFilters] = useState({
    status: 'all',
    planType: 'all',
    search: ''
  });

  const [activityLogs, setActivityLogs] = useState([]);

  const [settings, setSettings] = useState({
    autoCleanup: true,
    notifyExpiry: true,
    telegramLink: '',
    lowUTRAlert: true,
    utrThreshold: 10,
    emailNotifications: true
  });

  const [activeUsers, setActiveUsers] = useState([]);

  const [revenueData, setRevenueData] = useState([]);
  const [dates, setDates] = useState([]);
  const [amounts, setAmounts] = useState([]);

  const { mode, toggleColorMode } = useContext(ColorModeContext);
  
  const theme = useTheme();
  
  const cardStyle = {
    background: theme.palette.background.paper,
    backdropFilter: 'blur(10px)',
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: '16px',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    overflow: 'hidden',
    boxShadow: theme.shadows[4],
    color: theme.palette.text.primary
  };

  const textFieldStyle = {
    '& .MuiOutlinedInput-root': {
      color: theme.palette.text.primary,
      '& fieldset': {
        borderColor: theme.palette.divider,
      },
      '&:hover fieldset': {
        borderColor: theme.palette.primary.main,
      },
      '&.Mui-focused fieldset': {
        borderColor: theme.palette.primary.main,
      },
    },
    '& .MuiInputLabel-root': {
      color: theme.palette.text.secondary,
    },
  };

  // Validation functions
  const validateUpiId = (upiId) => {
    const upiRegex = /^[\w.-]+@[\w.-]+$/;
    return upiRegex.test(upiId);
  };

  const validateAmount = (amount) => {
    const numAmount = Number(amount);
    return numAmount > 0 && numAmount <= 999999;
  };

  const validateUTR = (utr) => {
    // UTR numbers are typically 12-22 characters
    return /^[a-zA-Z0-9]{12,22}$/.test(utr);
  };

  const validatePlanAmount = (amount) => {
    const numAmount = Number(amount);
    return !isNaN(numAmount) && numAmount > 0 && numAmount <= 999999;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(prev => ({ ...prev, login: true }));
    try {
      if (!loginForm.username.trim() || !loginForm.password.trim()) {
        throw new Error('Username and password are required');
      }

      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: loginForm.username.trim(),
          password: loginForm.password.trim()
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      if (data.success) {
        localStorage.setItem('adminToken', data.token);
        setToken(data.token);
        setIsLoggedIn(true);
      }
    } catch (error) {
      console.error('Login error:', error);
      setError({
        message: error.message || 'Login failed. Please try again.',
        show: true
      });
    } finally {
      setLoading(prev => ({ ...prev, login: false }));
    }
  };

  const handleUpiUpdate = async () => {
    if (!validateUpiId(upiDetails.upiId)) {
      setError({
        message: 'Invalid UPI ID format',
        show: true
      });
      return;
    }

    if (!upiDetails.name.trim()) {
      setError({
        message: 'Name is required',
        show: true
      });
      return;
    }

    setLoading(prev => ({ ...prev, upiUpdate: true }));
    try {
      const response = await fetch('/api/admin/upi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          upiId: upiDetails.upiId.trim(),
          name: upiDetails.name.trim()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update UPI details');
      }

      const data = await response.json();
      if (data.success) {
        setError({
          message: 'UPI details updated successfully',
          show: true
        });

        // Refresh active details
        const detailsResponse = await fetch('/api/payment-details', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!detailsResponse.ok) {
          throw new Error('Failed to fetch updated details');
        }

        const detailsData = await detailsResponse.json();
        if (detailsData.success) {
          setActiveDetails(prev => ({
            ...prev,
            upi: detailsData.upi || { upiId: '', name: '' }
          }));
        }
      } else {
        throw new Error(data.message || 'Failed to update UPI details');
      }
    } catch (error) {
      console.error('UPI update error:', error);
      setError({
        message: error.message,
        show: true
      });
    } finally {
      setLoading(prev => ({ ...prev, upiUpdate: false }));
    }
  };

  const handlePlanAmountsUpdate = async () => {
    if (!validatePlanAmount(planAmounts.demo) || !validatePlanAmount(planAmounts.paid)) {
      setError({
        message: 'Invalid plan amounts. Amounts must be between 1 and 999999',
        show: true
      });
      return;
    }

    setLoading(prev => ({ ...prev, planUpdate: true }));
    try {
      const response = await fetch('/api/admin/plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          demoAmount: Number(planAmounts.demo),
          paidAmount: Number(planAmounts.paid)
        })
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned non-JSON response");
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update plan amounts');
      }

      setError({
        message: 'Plan amounts updated successfully',
        show: true
      });

      const detailsResponse = await fetch('/api/payment-details', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!detailsResponse.ok) {
        throw new Error('Failed to fetch updated details');
      }

      const detailsData = await detailsResponse.json();
      if (detailsData.success) {
        setActiveDetails(prev => ({
          ...prev,
          plans: detailsData.plans
        }));
      }
    } catch (error) {
      console.error('Plan update error:', error);
      setError({
        message: error.message || 'Failed to update plan amounts',
        show: true
      });
    } finally {
      setLoading(prev => ({ ...prev, planUpdate: false }));
    }
  };

  const fetchPlanAmounts = async () => {
    try {
      const response = await fetch('/api/admin/plans', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch plan amounts');
      }

      const data = await response.json();
      setPlanAmounts({
        demo: data.demoAmount,
        paid: data.paidAmount
      });
    } catch (error) {
      console.error('Failed to fetch plan amounts:', error);
    }
  };

  const handleAddUTR = async () => {
    if (!newUTR.trim()) {
      setError({
        message: 'Please enter UTR number',
        show: true
      });
      return;
    }

    setLoading(prev => ({ ...prev, utrAdd: true }));
    try {
      const response = await fetch('/api/admin/utr/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          utr: newUTR.trim(),
          planType: isPaidPlan ? 'premium' : 'demo',
          gamesAllowed: parseInt(gamesAllowed)
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to add UTR');
      }

      setNewUTR('');
      fetchUTRList();
      setError({
        message: 'UTR added successfully',
        show: true,
        severity: 'success'
      });
    } catch (error) {
      console.error('UTR add error:', error);
      setError({
        message: error.message,
        show: true
      });
    } finally {
      setLoading(prev => ({ ...prev, utrAdd: false }));
    }
  };

  const fetchUTRList = async () => {
    setLoading(prev => ({ ...prev, utrFetch: true }));
    try {
      const response = await fetch('/api/admin/utr/list', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch UTR list');
      }

      if (data.success) {
        setUtrList(data.utrs || []);
      } else {
        throw new Error(data.message || 'Failed to fetch UTR list');
      }
    } catch (error) {
      console.error('UTR fetch error:', error);
      setError({
        message: error.message,
        show: true
      });
    } finally {
      setLoading(prev => ({ ...prev, utrFetch: false }));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setToken(null);
    setIsLoggedIn(false);
    setSettingsAnchor(null);
  };

  const handleCopyUTR = (utr) => {
    navigator.clipboard.writeText(utr);
    setCopyFeedback('UTR copied to clipboard!');
    setTimeout(() => setCopyFeedback(''), 2000);
  };

  const handleDeleteUTR = async (utrNumber) => {
    try {
        // First check UTR status
        const checkResponse = await fetch(`/api/admin/utr/status`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                utr_number: utrNumber
            })
        });

        const checkData = await checkResponse.json();
        
        if (checkData.isActive) {
            setError({
                message: 'Cannot delete active UTR with remaining games',
                show: true,
                severity: 'error'
            });
            return;
        }

        if (!window.confirm('Are you sure you want to delete this UTR?')) {
            return;
        }

        const response = await fetch('/api/delete-utr', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                utr_number: utrNumber
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to delete UTR');
        }

        // Remove the deleted UTR from the list
        setUtrList(prevList => prevList.filter(utr => utr.number !== utrNumber));
        
        setError({
            message: 'UTR deleted successfully',
            show: true,
            severity: 'success'
        });
    } catch (error) {
        console.error('Delete error:', error);
        setError({
            message: error.message || 'Failed to delete UTR',
            show: true,
            severity: 'error'
        });
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleSettingsClick = (event) => {
    setSettingsAnchor(event.currentTarget);
  };

  const handleSettingsClose = () => {
    setSettingsAnchor(null);
  };

  const confirmAction = (action) => {
    setActionToConfirm(action);
    setShowConfirmDialog(true);
    setSettingsAnchor(null);
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchActiveDetails = async () => {
    try {
      const response = await fetch('/api/payment-details', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch payment details');
      }

      const data = await response.json();
      
      if (data.success) {
        setActiveDetails({
          upi: data.upi || { upiId: '', name: '' },
          plans: data.plans || { demoAmount: 99, paidAmount: 999 }
        });
      } else {
        throw new Error(data.message || 'Failed to fetch payment details');
      }
    } catch (error) {
      console.error('Failed to fetch active details:', error);
      setError({
        message: error.message,
        show: true
      });
    }
  };

  const fetchData = async () => {
    try {
      // Fetch stats
      const statsResponse = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!statsResponse.ok) {
        throw new Error('Failed to fetch stats');
      }

      const statsData = await statsResponse.json();
      if (statsData.success) {
        setStats(statsData.stats);
      }

      // Fetch active details
      const detailsResponse = await fetch('/api/payment-details', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!detailsResponse.ok) {
        throw new Error('Failed to fetch payment details');
      }

      const detailsData = await detailsResponse.json();
      if (detailsData.success) {
        setActiveDetails({
          upi: detailsData.upi || { upiId: '', name: '' },
          plans: detailsData.plans || { demoAmount: 99, paidAmount: 999 }
        });
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setError({
        message: error.message,
        show: true
      });
    }
  };

  const calculateTimeRemaining = (expiresAt) => {
    if (!expiresAt) return 'N/A';
    
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffInHours = Math.ceil((expiry - now) / (1000 * 60 * 60));
    
    if (diffInHours <= 0) return 'Expired';
    if (diffInHours < 24) return `${diffInHours}h remaining`;
    return `${Math.ceil(diffInHours/24)}d remaining`;
  };

  const handleBulkGenerate = async () => {
    try {
      const response = await fetch('/api/admin/utr/bulk-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          count,
          planType,
          gamesAllowed: planType === 'premium' ? -1 : gamesAllowed
        })
      });
      // Handle response...
    } catch (error) {
      console.error('Bulk generation error:', error);
    }
  };

  const handleExportUTRs = async () => {
    try {
      const response = await fetch('/api/admin/utr/export', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `utrs-${new Date().toISOString()}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Export failed:', error);
      setError({
        message: 'Failed to export UTRs',
        show: true,
        severity: 'error'
      });
    }
  };

  const handleBulkDelete = () => {
    // Implementation of handleBulkDelete
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'login':
        return <PersonIcon />;
      case 'upiUpdate':
        return <SettingsIcon />;
      case 'planUpdate':
        return <SecurityIcon />;
      case 'utrAdd':
        return <AddIcon />;
      case 'utrFetch':
        return <ReceiptIcon />;
      case 'logout':
        return <LogoutIcon />;
      default:
        return null;
    }
  };

  const renderActivityLogs = () => (
    <Card sx={{ ...cardStyle, p: 3, mt: 4 }}>
      <Typography variant="h6" sx={{ mb: 3 }}>Recent Activity</Typography>
      <List>
        {activityLogs.map((log) => (
          <ListItem
            key={log.id}
            sx={{
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              py: 2
            }}
          >
            <ListItemIcon>
              {getActivityIcon(log.type)}
            </ListItemIcon>
            <ListItemText
              primary={log.message}
              secondary={
                <Typography variant="caption" color="text.secondary">
                  {new Date(log.timestamp).toLocaleString()}
                </Typography>
              }
            />
          </ListItem>
        ))}
      </List>
    </Card>
  );

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const renderSystemSettings = () => (
    <Card sx={{ ...cardStyle, p: 3, mt: 4 }}>
      <Typography variant="h6" sx={{ mb: 3 }}>System Settings</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <FormControlLabel
            control={
              <Switch
                checked={settings.autoCleanup}
                onChange={(e) => handleSettingChange('autoCleanup', e.target.checked)}
              />
            }
            label="Auto Cleanup Expired UTRs"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControlLabel
            control={
              <Switch
                checked={settings.notifyExpiry}
                onChange={(e) => handleSettingChange('notifyExpiry', e.target.checked)}
              />
            }
            label="Notify Before UTR Expiry"
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Support Telegram Link"
            value={settings.telegramLink}
            onChange={(e) => handleSettingChange('telegramLink', e.target.value)}
            sx={textFieldStyle}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControlLabel
            control={
              <Switch
                checked={mode === 'dark'}
                onChange={toggleColorMode}
                icon={<Brightness7Icon />}
                checkedIcon={<Brightness4Icon />}
              />
            }
            label={`${mode.charAt(0).toUpperCase() + mode.slice(1)} Mode`}
          />
        </Grid>
      </Grid>
    </Card>
  );

  const renderNotificationSettings = () => (
    <Card sx={{ ...cardStyle, p: 3, mt: 3 }}>
      <Typography variant="h6" sx={{ mb: 3 }}>Notification Settings</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={settings.lowUTRAlert}
                onChange={(e) => handleSettingChange('lowUTRAlert', e.target.checked)}
              />
            }
            label="Alert when UTR count is low"
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            type="number"
            label="Low UTR Threshold"
            value={settings.utrThreshold}
            onChange={(e) => handleSettingChange('utrThreshold', e.target.value)}
          />
        </Grid>
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={settings.emailNotifications}
                onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
              />
            }
            label="Email Notifications"
          />
        </Grid>
      </Grid>
    </Card>
  );

  const renderAnalytics = () => (
    <Card sx={{ ...cardStyle, p: 3, mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 3 }}>Analytics Overview</Typography>
      <Grid container spacing={3}>
        {/* Revenue Stats Cards */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2, bgcolor: theme.palette.background.default }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Today's Revenue</Typography>
            <Typography variant="h4">₹{stats.todayRevenue || 0}</Typography>
            <Typography variant="caption" color="text.secondary">
              From {stats.todayTransactions || 0} transactions
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2, bgcolor: theme.palette.background.default }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Plan Distribution</Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', py: 2 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4">{stats.demoCount || 0}</Typography>
                <Typography variant="caption">Demo Plans</Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4">{stats.premiumCount || 0}</Typography>
                <Typography variant="caption">Premium Plans</Typography>
              </Box>
            </Box>
          </Card>
        </Grid>

        {/* UTR Status Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2, bgcolor: theme.palette.background.default }}>
            <Typography variant="subtitle2">Active UTRs</Typography>
            <Typography variant="h4">{stats.activeUTRs || 0}</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2, bgcolor: theme.palette.background.default }}>
            <Typography variant="subtitle2">Used UTRs</Typography>
            <Typography variant="h4">{stats.usedUTRs || 0}</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2, bgcolor: theme.palette.background.default }}>
            <Typography variant="subtitle2">Total UTRs</Typography>
            <Typography variant="h4">{stats.totalTransactions || 0}</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2, bgcolor: theme.palette.background.default }}>
            <Typography variant="subtitle2">Today's UTRs</Typography>
            <Typography variant="h4">{stats.todayTransactions || 0}</Typography>
          </Card>
        </Grid>

        {/* Revenue History */}
        <Grid item xs={12}>
          <Card sx={{ p: 2, bgcolor: theme.palette.background.default }}>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>Recent Revenue History</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell align="right">Demo Plans</TableCell>
                    <TableCell align="right">Premium Plans</TableCell>
                    <TableCell align="right">Total Revenue</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {revenueData.slice(0, 7).map((day) => (
                    <TableRow key={day.date}>
                      <TableCell>{new Date(day.date).toLocaleDateString()}</TableCell>
                      <TableCell align="right">{day.demoCount || 0}</TableCell>
                      <TableCell align="right">{day.premiumCount || 0}</TableCell>
                      <TableCell align="right">₹{day.amount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>
      </Grid>
    </Card>
  );

  const renderUserManagement = () => (
    <Card sx={{ ...cardStyle, p: 3, mt: 3 }}>
      <Typography variant="h6" sx={{ mb: 3 }}>Active Users</Typography>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User ID</TableCell>
              <TableCell>Plan Type</TableCell>
              <TableCell>Games Used</TableCell>
              <TableCell>Time Remaining</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {activeUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.id}</TableCell>
                <TableCell>{user.planType}</TableCell>
                <TableCell>{user.gamesUsed}/{user.gamesAllowed}</TableCell>
                <TableCell>{calculateTimeRemaining(user.expiresAt)}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleRevokeAccess(user.id)}>
                    <BlockIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );

  const renderBackupTools = () => (
    <Card sx={{ ...cardStyle, p: 3, mt: 3 }}>
      <Typography variant="h6" sx={{ mb: 3 }}>Backup & Export</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Button
            fullWidth
            variant="contained"
            startIcon={<BackupIcon />}
            onClick={handleBackupDatabase}
          >
            Backup Database
          </Button>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Button
            fullWidth
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleExportUTRs}
          >
            Export UTR List
          </Button>
        </Grid>
      </Grid>
    </Card>
  );

  const handleRevokeAccess = async (userId) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/revoke`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        setActiveUsers(prev => prev.filter(user => user.id !== userId));
        setError({
          message: 'Access revoked successfully',
          show: true,
          severity: 'success'
        });
      }
    } catch (error) {
      console.error('Failed to revoke access:', error);
      setError({
        message: 'Failed to revoke access',
        show: true,
        severity: 'error'
      });
    }
  };

  const handleBackupDatabase = async () => {
    try {
      const response = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup-${new Date().toISOString()}.db`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Backup failed:', error);
      setError({
        message: 'Failed to create backup',
        show: true,
        severity: 'error'
      });
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      if (token) {
        try {
          const response = await fetch('/api/admin/verify', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (!response.ok) {
            throw new Error('Session expired');
          }
          
          fetchUTRList();
        } catch (error) {
          localStorage.removeItem('adminToken');
          setToken(null);
          setIsLoggedIn(false);
        }
      }
    };
    
    checkSession();
  }, [token]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchStats();
      fetchPlanAmounts();
      fetchActiveDetails();
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn && token) {
      fetchData();
    }
  }, [isLoggedIn, token]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchUTRList();
    }
  }, [isLoggedIn]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('/api/admin/analytics', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        
        if (data.success) {
          setRevenueData(data.revenueData);
          setDates(data.revenueData.map(item => item.date));
          setAmounts(data.revenueData.map(item => item.amount));
          setStats(data.stats);
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      }
    };

    if (isLoggedIn) {
      fetchAnalytics();
    }
  }, [isLoggedIn, token]);

  const renderUPIManagement = () => (
    <Card sx={{ ...cardStyle, p: 3 }}>
      {/* Current Active Details Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Currently Active Details
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 2, bgcolor: theme.palette.background.default }}>
              <Typography variant="subtitle1" color="text.secondary">
                Active UPI Details
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Typography variant="body1">
                  <strong>UPI ID:</strong> {activeDetails.upi?.upiId || 'Not set'}
                </Typography>
                <Typography variant="body1">
                  <strong>Name:</strong> {activeDetails.upi?.name || 'Not set'}
                </Typography>
              </Box>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 2, bgcolor: theme.palette.background.default }}>
              <Typography variant="subtitle1" color="text.secondary">
                Active Plan Amounts
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Typography variant="body1">
                  <strong>Demo Plan:</strong> ₹{activeDetails.plans?.demoAmount || 99}
                </Typography>
                <Typography variant="body1">
                  <strong>Paid Plan:</strong> ₹{activeDetails.plans?.paidAmount || 999}
                </Typography>
              </Box>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Update UPI Details Section */}
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
        Update UPI Details
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="UPI ID"
            value={upiDetails.upiId}
            onChange={(e) => setUpiDetails(prev => ({ ...prev, upiId: e.target.value }))}
            sx={textFieldStyle}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Name"
            value={upiDetails.name}
            onChange={(e) => setUpiDetails(prev => ({ ...prev, name: e.target.value }))}
            sx={textFieldStyle}
          />
        </Grid>
      </Grid>
      <Button
        variant="contained"
        onClick={handleUpiUpdate}
        disabled={loading.upiUpdate}
      >
        {loading.upiUpdate ? <CircularProgress size={24} /> : 'Update UPI Details'}
      </Button>

      <Divider sx={{ my: 4 }} />

      {/* Update Plan Amounts Section */}
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
        Update Plan Amounts
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Demo Plan Amount"
            type="number"
            value={planAmounts.demo}
            onChange={(e) => setPlanAmounts(prev => ({ ...prev, demo: e.target.value }))}
            sx={textFieldStyle}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Paid Plan Amount"
            type="number"
            value={planAmounts.paid}
            onChange={(e) => setPlanAmounts(prev => ({ ...prev, paid: e.target.value }))}
            sx={textFieldStyle}
          />
        </Grid>
      </Grid>
      <Button
        variant="contained"
        onClick={handlePlanAmountsUpdate}
        disabled={loading.planUpdate}
      >
        {loading.planUpdate ? <CircularProgress size={24} /> : 'Update Plan Amounts'}
      </Button>
    </Card>
  );

  const renderUTRFilters = () => (
    <Box sx={{ mb: 3 }}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={4}>
          <TextField
            select
            fullWidth
            label="Status"
            value={utrFilters.status}
            onChange={(e) => setUtrFilters(prev => ({ ...prev, status: e.target.value }))}
            sx={textFieldStyle}
          >
            <MenuItem value="all">All UTRs</MenuItem>
            <MenuItem value="unused">Unused</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="expired">Expired</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            select
            fullWidth
            label="Plan Type"
            value={utrFilters.planType}
            onChange={(e) => setUtrFilters(prev => ({ ...prev, planType: e.target.value }))}
            sx={textFieldStyle}
          >
            <MenuItem value="all">All Plans</MenuItem>
            <MenuItem value="demo">Demo</MenuItem>
            <MenuItem value="premium">Premium</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label="Search UTR"
            value={utrFilters.search}
            onChange={(e) => setUtrFilters(prev => ({ ...prev, search: e.target.value }))}
            sx={textFieldStyle}
          />
        </Grid>
      </Grid>
    </Box>
  );

  const renderUTRManagement = () => (
    <Card sx={{ ...cardStyle, p: 3 }}>
      <Typography variant="h6" sx={{ mb: 3 }}>Add New UTR</Typography>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="UTR Number"
            value={newUTR}
            onChange={(e) => setNewUTR(e.target.value)}
            sx={textFieldStyle}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <FormControlLabel
            control={
              <Switch
                checked={isPaidPlan}
                onChange={(e) => {
                  setIsPaidPlan(e.target.checked);
                  setGamesAllowed(e.target.checked ? -1 : 3); // Reset games to default
                }}
                color="primary"
              />
            }
            label={isPaidPlan ? "Paid Plan" : "Demo Plan"}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            type="number"
            label="Games Allowed"
            value={gamesAllowed}
            onChange={(e) => setGamesAllowed(e.target.value)}
            disabled={isPaidPlan} // Disable for premium plan
            sx={textFieldStyle}
          />
        </Grid>
        <Grid item xs={12} md={2}>
          <Button
            variant="contained"
            onClick={handleAddUTR}
            disabled={loading.utrAdd}
            fullWidth
          >
            {loading.utrAdd ? <CircularProgress size={24} /> : 'ADD'}
          </Button>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2, bgcolor: theme.palette.background.default, mt: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ color: theme.palette.primary.main }}>
            Valid UTRs
          </Typography>
          {loading.utrFetch && <CircularProgress size={24} />}
        </Box>

        {utrList.length === 0 ? (
          <Typography variant="body2" sx={{ textAlign: 'center', py: 3, color: 'text.secondary' }}>
            No UTRs found
          </Typography>
        ) : (
          <List sx={{ maxHeight: '400px', overflowY: 'auto' }}>
            {utrList.map((utr) => {
              const timeRemaining = utr.usedAt ? calculateTimeRemaining(utr.expiresAt) : null;
              const isExpired = timeRemaining === 'Expired';
              
              return (
                <ListItem
                  key={utr.id}
                  sx={{
                    borderRadius: 1,
                    mb: 1,
                    bgcolor: theme.palette.action.hover,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography>{utr.number}</Typography>
                    <Chip 
                      size="small"
                      label={utr.planType === 'premium' ? 'Premium' : 'Demo'}
                      color={utr.planType === 'premium' ? 'primary' : 'default'}
                    />
                    {utr.usedAt && (
                      <Chip 
                        size="small"
                        label={timeRemaining}
                        color={isExpired ? 'error' : 'warning'}
                      />
                    )}
                    {!utr.usedAt && (
                      <Chip 
                        size="small"
                        label="Unused"
                        color="success"
                      />
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {new Date(utr.createdAt).toLocaleDateString()}
                    </Typography>
                    <Tooltip title="Copy UTR">
                      <IconButton 
                        onClick={() => handleCopyUTR(utr.number)}
                        sx={{ color: theme.palette.primary.main }}
                      >
                        <ContentCopyIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete UTR">
                      <IconButton 
                        onClick={() => handleDeleteUTR(utr.number)}
                        color="error"
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </ListItem>
              );
            })}
          </List>
        )}
      </Paper>
    </Card>
  );

  const renderBulkOperations = () => (
    <Box sx={{ mb: 3 }}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={4}>
          <Button
            fullWidth
            variant="contained"
            onClick={handleBulkGenerate}
            startIcon={<AddIcon />}
          >
            Generate Multiple UTRs
          </Button>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Button
            fullWidth
            variant="contained"
            onClick={handleExportUTRs}
            startIcon={<DownloadIcon />}
          >
            Export UTR List
          </Button>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Button
            fullWidth
            variant="contained"
            color="error"
            onClick={handleBulkDelete}
            startIcon={<DeleteIcon />}
          >
            Delete Selected
          </Button>
        </Grid>
      </Grid>
    </Box>
  );

  const renderDashboardStats = () => (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ ...cardStyle, p: 2 }}>
          <Typography variant="h6">Today's Revenue</Typography>
          <Typography variant="h4" sx={{ mt: 2 }}>
            ₹{stats.todayRevenue || 0}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            From {stats.todayTransactions || 0} transactions
          </Typography>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ ...cardStyle, p: 2 }}>
          <Typography variant="h6">Active Users</Typography>
          <Typography variant="h4" sx={{ mt: 2 }}>
            {stats.activeUsers || 0}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Currently using the hack
          </Typography>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ ...cardStyle, p: 2 }}>
          <Typography variant="h6">Unused UTRs</Typography>
          <Typography variant="h4" sx={{ mt: 2 }}>
            {stats.unusedUtrs || 0}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Available for use
          </Typography>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ ...cardStyle, p: 2 }}>
          <Typography variant="h6">Expiring Soon</Typography>
          <Typography variant="h4" sx={{ mt: 2 }}>
            {stats.expiringSoon || 0}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Within next 24 hours
          </Typography>
        </Card>
      </Grid>
    </Grid>
  );

  const BulkUTRDialog = () => {
    const [count, setCount] = useState(1);
    const [planType, setPlanType] = useState('demo');
    const [gamesAllowed, setGamesAllowed] = useState(3);

    const handleBulkGenerate = async () => {
      try {
        const response = await fetch('/api/admin/utr/bulk-generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            count,
            planType,
            gamesAllowed: planType === 'premium' ? -1 : gamesAllowed
          })
        });
        // Handle response...
      } catch (error) {
        console.error('Bulk generation error:', error);
      }
    };

    return (
      <Dialog open={open} onClose={onClose}>
        <DialogTitle>Generate Multiple UTRs</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                label="Number of UTRs"
                value={count}
                onChange={(e) => setCount(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Plan Type</InputLabel>
                <Select
                  value={planType}
                  onChange={(e) => setPlanType(e.target.value)}
                >
                  <MenuItem value="demo">Demo</MenuItem>
                  <MenuItem value="premium">Premium</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {planType === 'demo' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Games Allowed"
                  value={gamesAllowed}
                  onChange={(e) => setGamesAllowed(e.target.value)}
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={handleBulkGenerate} variant="contained">Generate</Button>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <Box sx={{ 
      maxWidth: 1200, 
      mx: 'auto', 
      mt: 4, 
      p: 2,
      minHeight: '90vh',
      background: theme.palette.background.default
    }}>
      <Snackbar 
        open={error.show} 
        autoHideDuration={6000} 
        onClose={() => setError(prev => ({ ...prev, show: false }))}
      >
        <Alert 
          severity={error.message.includes('success') ? 'success' : 'error'} 
          onClose={() => setError(prev => ({ ...prev, show: false }))}
        >
          {error.message}
        </Alert>
      </Snackbar>

      {!isLoggedIn ? (
        <Card sx={{ ...cardStyle, p: 4, maxWidth: 400, mx: 'auto' }}>
          <Typography variant="h4" sx={{ mb: 4, fontWeight: 600 }}>
            Admin Login
          </Typography>
          <form onSubmit={handleLogin}>
            <TextField
              fullWidth
              label="Username"
              value={loginForm.username}
              onChange={(e) => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
              sx={{ ...textFieldStyle, mb: 2 }}
              required
            />
            <TextField
              fullWidth
              type="password"
              label="Password"
              value={loginForm.password}
              onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
              sx={{ ...textFieldStyle, mb: 2 }}
              required
            />
            <Button 
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading.login}
              sx={{
                py: 1.5,
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              {loading.login ? <CircularProgress size={24} /> : 'Login'}
            </Button>
          </form>
        </Card>
      ) : (
        <>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 4,
            pb: 2
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                <PersonIcon />
              </Avatar>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                Admin Dashboard
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch 
                    checked={darkMode}
                    onChange={(e) => setDarkMode(e.target.checked)}
                  />
                }
                label="Dark Mode"
              />
              <Tooltip title="Settings">
                <IconButton onClick={handleSettingsClick}>
                  <SettingsIcon />
                </IconButton>
              </Tooltip>
              <Menu
                anchorEl={settingsAnchor}
                open={Boolean(settingsAnchor)}
                onClose={handleSettingsClose}
                TransitionComponent={Fade}
              >
                <MenuItem onClick={() => confirmAction('resetPassword')}>
                  Change Password
                </MenuItem>
                <MenuItem onClick={() => confirmAction('clearData')}>
                  Clear All Data
                </MenuItem>
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
              </Menu>
            </Box>
          </Box>

          {/* Stats Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {[
              { 
                title: 'Total Transactions', 
                value: stats.totalTransactions, 
                icon: <TrendingUpIcon />,
                color: theme.palette.primary.main,
                bgColor: theme.palette.primary.lighter
              },
              { 
                title: 'Active UTRs', 
                value: stats.activeUTRs, 
                icon: <ReceiptIcon />,
                color: theme.palette.success.main,
                bgColor: theme.palette.success.lighter
              },
              { 
                title: "Today's Transactions", 
                value: stats.todayTransactions, 
                icon: <AccountBalanceIcon />,
                color: theme.palette.info.main,
                bgColor: theme.palette.info.lighter
              },
              { 
                title: 'Total Amount', 
                value: `₹${stats.totalAmount}`, 
                icon: <MoneyIcon />,
                color: theme.palette.warning.main,
                bgColor: theme.palette.warning.lighter
              }
            ].map((stat, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card sx={{
                  ...cardStyle,
                  p: 3,
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar sx={{ bgcolor: stat.bgColor, color: stat.color }}>
                      {stat.icon}
                    </Avatar>
                    <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                      {stat.title}
                    </Typography>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 600 }}>
                    {stat.value}
                  </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Tabs with modern styling */}
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            sx={{
              mb: 3,
              borderBottom: 1,
              borderColor: 'divider',
              '& .MuiTab-root': { 
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '1rem'
              }
            }}
          >
            <Tab label="UPI Management" />
            <Tab label="UTR Management" />
            <Tab label="User Management" />
          </Tabs>

          {activeTab === 0 ? renderUPIManagement() : activeTab === 1 ? renderUTRManagement() : renderUserManagement()}

          {/* Modern dialog styling */}
          <Dialog 
            open={showConfirmDialog} 
            onClose={() => setShowConfirmDialog(false)}
            PaperProps={{
              sx: {
                borderRadius: 2,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                bgcolor: theme.palette.background.paper
              }
            }}
          >
            <DialogTitle>
              Confirm Action
            </DialogTitle>
            <DialogContent>
              <Typography>
                {actionToConfirm === 'resetPassword' 
                  ? 'Are you sure you want to change your password?'
                  : 'Are you sure you want to clear all data? This action cannot be undone.'}
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowConfirmDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  // Handle confirmation action
                  setShowConfirmDialog(false);
                }} 
                variant="contained"
                color="primary"
              >
                Confirm
              </Button>
            </DialogActions>
          </Dialog>

          {renderBulkOperations()}

          {renderDashboardStats()}

          {renderActivityLogs()}

          {renderSystemSettings()}

          {renderNotificationSettings()}

          {renderAnalytics()}

          {renderBackupTools()}
        </>
      )}
      
      <Snackbar
        open={!!copyFeedback}
        autoHideDuration={2000}
        onClose={() => setCopyFeedback('')}
        message={copyFeedback}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
};

export default AdminPanel; 