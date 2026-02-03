import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Tabs, Tab, Container, Box } from '@mui/material';
import WorkIcon from '@mui/icons-material/Work';
import EventIcon from '@mui/icons-material/Event';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import DescriptionIcon from '@mui/icons-material/Description';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import RateReviewIcon from '@mui/icons-material/RateReview';
import BarChartIcon from '@mui/icons-material/BarChart';
import HelpIcon from '@mui/icons-material/Help';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const getCurrentTab = () => {
    if (location.pathname === '/bids') return 0;
    if (location.pathname === '/interviews') return 1;
    if (location.pathname === '/analytics') return 2;
    if (location.pathname === '/jd-specifications') return 3;
    if (location.pathname === '/skill-dictionary') return 4;
    if (location.pathname === '/skill-review') return 5;
    if (location.pathname === '/skill-statistics') return 6;
    if (location.pathname === '/user-guide') return 7;
    return 0;
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar sx={{ flexWrap: 'wrap', minHeight: { xs: 'auto', sm: 64 } }}>
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              flexGrow: { xs: 1, md: 0 },
              mr: { md: 2 },
              mb: { xs: 1, md: 0 },
              width: { xs: '100%', md: 'auto' }
            }}
          >
            Job Bid & Interview Manager
          </Typography>
          <Box sx={{ flexGrow: 1, width: { xs: '100%', md: 'auto' } }}>
            <Tabs 
              value={getCurrentTab()} 
              textColor="inherit" 
              indicatorColor="secondary"
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              sx={{
                '& .MuiTabs-scrollButtons': {
                  color: 'white',
                },
              }}
            >
              <Tab 
                label="Bids" 
                icon={<WorkIcon />} 
                iconPosition="start"
                component={Link} 
                to="/bids"
                sx={{ minWidth: { xs: 'auto', sm: 120 } }}
              />
              <Tab 
                label="Interviews" 
                icon={<EventIcon />} 
                iconPosition="start"
                component={Link} 
                to="/interviews"
                sx={{ minWidth: { xs: 'auto', sm: 120 } }}
              />
              <Tab 
                label="Analytics" 
                icon={<AnalyticsIcon />} 
                iconPosition="start"
                component={Link} 
                to="/analytics"
                sx={{ minWidth: { xs: 'auto', sm: 120 } }}
              />
              <Tab 
                label="JD Specs" 
                icon={<DescriptionIcon />} 
                iconPosition="start"
                component={Link} 
                to="/jd-specifications"
                sx={{ minWidth: { xs: 'auto', sm: 120 } }}
              />
              <Tab 
                label="Dictionary" 
                icon={<LibraryBooksIcon />} 
                iconPosition="start"
                component={Link} 
                to="/skill-dictionary"
                sx={{ minWidth: { xs: 'auto', sm: 120 } }}
              />
              <Tab 
                label="Review" 
                icon={<RateReviewIcon />} 
                iconPosition="start"
                component={Link} 
                to="/skill-review"
                sx={{ minWidth: { xs: 'auto', sm: 120 } }}
              />
              <Tab 
                label="Stats" 
                icon={<BarChartIcon />} 
                iconPosition="start"
                component={Link} 
                to="/skill-statistics"
                sx={{ minWidth: { xs: 'auto', sm: 120 } }}
              />
              <Tab 
                label="Help" 
                icon={<HelpIcon />} 
                iconPosition="start"
                component={Link} 
                to="/user-guide"
                sx={{ minWidth: { xs: 'auto', sm: 120 } }}
              />
            </Tabs>
          </Box>
        </Toolbar>
      </AppBar>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
        {children}
      </Container>
    </Box>
  );
};
