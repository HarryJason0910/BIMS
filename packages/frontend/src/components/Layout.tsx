import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Tabs, Tab, Container, Box, Chip, Tooltip } from '@mui/material';
import WorkIcon from '@mui/icons-material/Work';
import EventIcon from '@mui/icons-material/Event';
import EmailIcon from '@mui/icons-material/Email';
import { apiClient } from '../api';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const currentTab = location.pathname === '/bids' ? 0 : 1;
  const [emailConnected, setEmailConnected] = useState<boolean | null>(null);
  const [emailError, setEmailError] = useState<string>('');

  useEffect(() => {
    // Check email status on mount and every 30 seconds
    const checkEmailStatus = async () => {
      try {
        const status = await apiClient.getEmailStatus();
        setEmailConnected(status.connected);
        setEmailError(status.error || '');
      } catch (error) {
        setEmailConnected(false);
        setEmailError('Failed to check status');
      }
    };

    checkEmailStatus();
    const interval = setInterval(checkEmailStatus, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const getEmailStatusChip = () => {
    if (emailConnected === null) {
      return (
        <Chip
          icon={<EmailIcon />}
          size="small"
          sx={{ ml: 2 }}
        />
      );
    }

    if (emailConnected) {
      return (
        <Tooltip title="Email integration is active">
          <Chip
            icon={<EmailIcon />}
            color="success"
            size="small"
            sx={{ ml: 2 }}
          />
        </Tooltip>
      );
    }

    return (
      <Tooltip title={emailError || 'Email integration is not configured'}>
        <Chip
          icon={<EmailIcon />}
          color="error"
          size="small"
          sx={{ ml: 2 }}
        />
      </Tooltip>
    );
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Job Bid & Interview Manager
          </Typography>
          {getEmailStatusChip()}
          <Tabs value={currentTab} textColor="inherit" indicatorColor="secondary" sx={{ ml: 2 }}>
            <Tab 
              label="Bids" 
              icon={<WorkIcon />} 
              iconPosition="start"
              component={Link} 
              to="/bids"
            />
            <Tab 
              label="Interviews" 
              icon={<EventIcon />} 
              iconPosition="start"
              component={Link} 
              to="/interviews"
            />
          </Tabs>
        </Toolbar>
      </AppBar>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
        {children}
      </Container>
    </Box>
  );
};
