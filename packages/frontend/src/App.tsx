import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { useEffect } from 'react';
import { Layout } from './components/Layout';
import { BidDashboard } from './pages/BidDashboard';
import { InterviewDashboard } from './pages/InterviewDashboard';
import { AnalyticsDashboard } from './pages/AnalyticsDashboard';
import { JDSpecificationPage } from './pages/JDSpecificationPage';
import { SkillDictionaryPage } from './pages/SkillDictionaryPage';
import { SkillReviewPage } from './pages/SkillReviewPage';
import { SkillStatisticsPage } from './pages/SkillStatisticsPage';
import { UserGuidePage } from './pages/UserGuidePage';
import { apiClient } from './api';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  // Auto-reject old bids on app startup
  useEffect(() => {
    const autoRejectOldBids = async () => {
      try {
        const result = await apiClient.autoRejectOldBids();
        if (result.rejectedCount > 0) {
          console.log(`Auto-rejected ${result.rejectedCount} old bids`);
        }
      } catch (error) {
        console.error('Failed to auto-reject old bids:', error);
      }
    };

    autoRejectOldBids();
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/bids" replace />} />
            <Route path="/bids" element={<BidDashboard />} />
            <Route path="/interviews" element={<InterviewDashboard />} />
            <Route path="/analytics" element={<AnalyticsDashboard />} />
            <Route path="/jd-specifications" element={<JDSpecificationPage />} />
            <Route path="/skill-dictionary" element={<SkillDictionaryPage />} />
            <Route path="/skill-review" element={<SkillReviewPage />} />
            <Route path="/skill-statistics" element={<SkillStatisticsPage />} />
            <Route path="/user-guide" element={<UserGuidePage />} />
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  );
}

export default App;
