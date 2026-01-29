import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Tabs, Tab, Container, Box } from '@mui/material';
import WorkIcon from '@mui/icons-material/Work';
import EventIcon from '@mui/icons-material/Event';
import AnalyticsIcon from '@mui/icons-material/Analytics';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const getCurrentTab = () => {
    if (location.pathname === '/bids') return 0;
    if (location.pathname === '/interviews') return 1;
    if (location.pathname === '/analytics') return 2;
    return 0;
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Job Bid & Interview Manager
          </Typography>
          <Tabs value={getCurrentTab()} textColor="inherit" indicatorColor="secondary">
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
            <Tab 
              label="Analytics" 
              icon={<AnalyticsIcon />} 
              iconPosition="start"
              component={Link} 
              to="/analytics"
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
