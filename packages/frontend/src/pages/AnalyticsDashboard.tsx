import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WorkIcon from '@mui/icons-material/Work';
import InterviewIcon from '@mui/icons-material/Event';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { apiClient } from '../api';
import { AdvancedTrendsAnalytics } from '../components/AdvancedTrendsAnalytics';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export const AnalyticsDashboard: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['analytics-overview'],
    queryFn: () => apiClient.getAnalyticsOverview()
  });

  const { data: bidPerformance, isLoading: bidLoading } = useQuery({
    queryKey: ['analytics-bid-performance'],
    queryFn: () => apiClient.getBidPerformance()
  });

  const { data: interviewPerformance, isLoading: interviewLoading } = useQuery({
    queryKey: ['analytics-interview-performance'],
    queryFn: () => apiClient.getInterviewPerformance()
  });

  const { data: techStackAnalysis, isLoading: techStackLoading } = useQuery({
    queryKey: ['analytics-tech-stack'],
    queryFn: () => apiClient.getTechStackAnalysis()
  });

  const { data: companyPerformance, isLoading: companyLoading } = useQuery({
    queryKey: ['analytics-company'],
    queryFn: () => apiClient.getCompanyPerformance()
  });

  const { data: timeTrends, isLoading: trendsLoading } = useQuery({
    queryKey: ['analytics-time-trends'],
    queryFn: () => apiClient.getTimeTrends()
  });

  const { data: recruiterPerformance, isLoading: recruiterLoading } = useQuery({
    queryKey: ['analytics-recruiter'],
    queryFn: () => apiClient.getRecruiterPerformance()
  });

  const { data: originComparison, isLoading: originLoading } = useQuery({
    queryKey: ['analytics-origin'],
    queryFn: () => apiClient.getOriginComparison()
  });

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (overviewLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
        Analytics Dashboard
      </Typography>

      {/* Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="white">
                    {overview?.totalBids || 0}
                  </Typography>
                  <Typography variant="body2" color="white">Total Bids</Typography>
                </Box>
                <WorkIcon sx={{ fontSize: 48, opacity: 0.7, color: 'white' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'success.main', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="white">
                    {overview?.totalInterviews || 0}
                  </Typography>
                  <Typography variant="body2" color="white">Total Interviews</Typography>
                </Box>
                <InterviewIcon sx={{ fontSize: 48, opacity: 0.7, color: 'white' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'info.main', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="white">
                    {overview?.bidSuccessRate || 0}%
                  </Typography>
                  <Typography variant="body2" color="white">Bid Success Rate</Typography>
                </Box>
                <TrendingUpIcon sx={{ fontSize: 48, opacity: 0.7, color: 'white' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'warning.main', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="white">
                    {overview?.interviewSuccessRate || 0}%
                  </Typography>
                  <Typography variant="body2" color="white">Total Interview Success</Typography>
                </Box>
                <CheckCircleIcon sx={{ fontSize: 48, opacity: 0.7, color: 'white' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Additional Success Rate Cards */}
        <Grid item xs={12} sm={6} md={6}>
          <Card sx={{ bgcolor: 'secondary.main', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="white">
                    {overview?.hrSuccessRate || 0}%
                  </Typography>
                  <Typography variant="body2" color="white">HR Interview Success Rate</Typography>
                </Box>
                <CheckCircleIcon sx={{ fontSize: 48, opacity: 0.7, color: 'white' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={6}>
          <Card sx={{ bgcolor: 'error.main', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="white">
                    {overview?.techSuccessRate || 0}%
                  </Typography>
                  <Typography variant="body2" color="white">Tech Interview Success Rate</Typography>
                </Box>
                <CheckCircleIcon sx={{ fontSize: 48, opacity: 0.7, color: 'white' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs for detailed analytics */}
      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Bid Performance" />
          <Tab label="Interview Performance" />
          <Tab label="Tech Stack Analysis" />
          <Tab label="Company Performance" />
          <Tab label="Time Trends" />
          <Tab label="Recruiter Performance" />
          <Tab label="Origin Comparison" />
          <Tab label="Advanced Trends" />
        </Tabs>

        {/* Tab 0: Bid Performance */}
        <TabPanel value={tabValue} index={0}>
          {bidLoading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Bid Status Distribution
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={Object.entries(bidPerformance?.statusDistribution || {}).map(([name, value]) => ({
                          name,
                          value
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {Object.keys(bidPerformance?.statusDistribution || {}).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Success Rate by Origin
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={[
                        { name: 'LinkedIn', rate: bidPerformance?.successRateByOrigin?.linkedin || 0 },
                        { name: 'Direct Bid', rate: bidPerformance?.successRateByOrigin?.direct || 0 }
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="rate" fill="#8884d8" name="Success Rate %" />
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <Alert severity="info">
                  <Typography variant="body2">
                    <strong>Total Bids:</strong> {bidPerformance?.totalBids || 0} | 
                    <strong> Rejection Rate:</strong> {bidPerformance?.rejectionRate || 0}%
                  </Typography>
                </Alert>
              </Grid>
            </Grid>
          )}
        </TabPanel>

        {/* Tab 1: Interview Performance */}
        <TabPanel value={tabValue} index={1}>
          {interviewLoading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Interview Status Distribution
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={Object.entries(interviewPerformance?.statusDistribution || {})
                          .filter(([_, value]) => value > 0)
                          .map(([name, value]) => ({ name, value }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {Object.entries(interviewPerformance?.statusDistribution || {})
                          .filter(([_, value]) => value > 0)
                          .map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Pass Rate by Interview Stage
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={interviewPerformance?.stagePassRates || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="stage" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="passRate" fill="#00C49F" name="Pass Rate %" />
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>
            </Grid>
          )}
        </TabPanel>

        {/* Tab 2: Tech Stack Analysis */}
        <TabPanel value={tabValue} index={2}>
          {techStackLoading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Top Tech Stacks Performance
                  </Typography>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={techStackAnalysis?.topStacks || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="stack" angle={-45} textAnchor="end" height={100} />
                      <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                      <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="total" fill="#8884d8" name="Total Bids" />
                      <Bar yAxisId="right" dataKey="successRate" fill="#82ca9d" name="Success Rate %" />
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <Alert severity="info">
                  <Typography variant="body2">
                    <strong>Total Unique Tech Stacks:</strong> {techStackAnalysis?.totalUniqueStacks || 0}
                  </Typography>
                </Alert>
              </Grid>
            </Grid>
          )}
        </TabPanel>

        {/* Tab 3: Company Performance */}
        <TabPanel value={tabValue} index={3}>
          {companyLoading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Top Companies by Bid Volume
                  </Typography>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={companyPerformance?.topCompanies || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="company" angle={-45} textAnchor="end" height={100} />
                      <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                      <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="totalBids" fill="#8884d8" name="Total Bids" />
                      <Bar yAxisId="right" dataKey="bidSuccessRate" fill="#82ca9d" name="Bid Success Rate %" />
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <Alert severity="info">
                  <Typography variant="body2">
                    <strong>Total Companies:</strong> {companyPerformance?.totalCompanies || 0}
                  </Typography>
                </Alert>
              </Grid>
            </Grid>
          )}
        </TabPanel>

        {/* Tab 4: Time Trends */}
        <TabPanel value={tabValue} index={4}>
          {trendsLoading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Monthly Activity Trends
                  </Typography>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={timeTrends?.trends || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="bids" stroke="#8884d8" name="Bids" strokeWidth={2} />
                      <Line type="monotone" dataKey="interviews" stroke="#82ca9d" name="Interviews" strokeWidth={2} />
                      <Line type="monotone" dataKey="successfulInterviews" stroke="#ffc658" name="Successful Interviews" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>
            </Grid>
          )}
        </TabPanel>

        {/* Tab 5: Recruiter Performance */}
        <TabPanel value={tabValue} index={5}>
          {recruiterLoading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Top Recruiters Performance
                  </Typography>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={recruiterPerformance?.topRecruiters || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="recruiter" angle={-45} textAnchor="end" height={100} />
                      <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                      <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="total" fill="#8884d8" name="Total Interviews" />
                      <Bar yAxisId="right" dataKey="successRate" fill="#82ca9d" name="Success Rate %" />
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <Alert severity="info">
                  <Typography variant="body2">
                    <strong>Total Recruiters:</strong> {recruiterPerformance?.totalRecruiters || 0}
                  </Typography>
                </Alert>
              </Grid>
            </Grid>
          )}
        </TabPanel>

        {/* Tab 6: Origin Comparison */}
        <TabPanel value={tabValue} index={6}>
          {originLoading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    LinkedIn vs Direct Bid - Total Bids
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={[
                        { name: 'LinkedIn', value: originComparison?.linkedin?.total || 0 },
                        { name: 'Direct Bid', value: originComparison?.direct?.total || 0 }
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" fill="#8884d8" name="Total Bids" />
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Success Rate Comparison
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={[
                        { name: 'LinkedIn', rate: originComparison?.linkedin?.successRate || 0 },
                        { name: 'Direct Bid', rate: originComparison?.direct?.successRate || 0 }
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="rate" fill="#00C49F" name="Success Rate %" />
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Alert severity="info">
                      <Typography variant="subtitle2" gutterBottom>
                        <strong>LinkedIn Stats:</strong>
                      </Typography>
                      <Typography variant="body2">
                        Total: {originComparison?.linkedin?.total || 0} | 
                        With Interview: {originComparison?.linkedin?.withInterview || 0} | 
                        Rejected: {originComparison?.linkedin?.rejected || 0}
                      </Typography>
                    </Alert>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Alert severity="info">
                      <Typography variant="subtitle2" gutterBottom>
                        <strong>Direct Bid Stats:</strong>
                      </Typography>
                      <Typography variant="body2">
                        Total: {originComparison?.direct?.total || 0} | 
                        With Interview: {originComparison?.direct?.withInterview || 0} | 
                        Rejected: {originComparison?.direct?.rejected || 0}
                      </Typography>
                    </Alert>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          )}
        </TabPanel>

        {/* Tab 7: Advanced Trends */}
        <TabPanel value={tabValue} index={7}>
          <AdvancedTrendsAnalytics />
        </TabPanel>
      </Paper>
    </Container>
  );
};
