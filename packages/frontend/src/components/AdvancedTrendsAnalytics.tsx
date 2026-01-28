import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Paper,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Autocomplete
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { apiClient } from '../api';

export const AdvancedTrendsAnalytics: React.FC = () => {
  const [period, setPeriod] = useState<'week' | 'month'>('month');
  const [selectedStack, setSelectedStack] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedCompany, setSelectedCompany] = useState<string>('');

  // Fetch available options
  const { data: bids } = useQuery({
    queryKey: ['bids'],
    queryFn: () => apiClient.getBids()
  });

  const { data: techStacks } = useQuery({
    queryKey: ['techStacks'],
    queryFn: () => apiClient.getTechStacks()
  });

  // Get unique roles and companies from bids
  const roles = React.useMemo(() => {
    if (!bids) return [];
    return Array.from(new Set(bids.map(b => b.role))).sort();
  }, [bids]);

  const companies = React.useMemo(() => {
    if (!bids) return [];
    return Array.from(new Set(bids.map(b => b.company))).sort();
  }, [bids]);

  // Fetch advanced trends with filters
  const { data: trendsData, isLoading, refetch } = useQuery({
    queryKey: ['advanced-trends', period, selectedStack, selectedRole, selectedCompany],
    queryFn: () => apiClient.getAdvancedTrends({
      period,
      stack: selectedStack || undefined,
      role: selectedRole || undefined,
      company: selectedCompany || undefined
    })
  });

  const handleReset = () => {
    setSelectedStack('');
    setSelectedRole('');
    setSelectedCompany('');
  };

  const hasFilters = selectedStack || selectedRole || selectedCompany;

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
        Advanced Trends Analysis
      </Typography>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Filters
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Time Period</InputLabel>
              <Select
                value={period}
                label="Time Period"
                onChange={(e) => setPeriod(e.target.value as 'week' | 'month')}
              >
                <MenuItem value="week">Weekly</MenuItem>
                <MenuItem value="month">Monthly</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Autocomplete
              options={techStacks || []}
              value={selectedStack}
              onChange={(_, newValue) => setSelectedStack(newValue || '')}
              renderInput={(params) => (
                <TextField {...params} label="Tech Stack" placeholder="All stacks" />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Autocomplete
              options={roles}
              value={selectedRole}
              onChange={(_, newValue) => setSelectedRole(newValue || '')}
              renderInput={(params) => (
                <TextField {...params} label="Role" placeholder="All roles" />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Autocomplete
              options={companies}
              value={selectedCompany}
              onChange={(_, newValue) => setSelectedCompany(newValue || '')}
              renderInput={(params) => (
                <TextField {...params} label="Company" placeholder="All companies" />
              )}
            />
          </Grid>

          {hasFilters && (
            <Grid item xs={12}>
              <Button variant="outlined" onClick={handleReset}>
                Clear All Filters
              </Button>
            </Grid>
          )}
        </Grid>

        {hasFilters && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Active Filters:</strong>{' '}
              {selectedStack && `Stack: ${selectedStack} | `}
              {selectedRole && `Role: ${selectedRole} | `}
              {selectedCompany && `Company: ${selectedCompany}`}
            </Typography>
          </Alert>
        )}
      </Paper>

      {/* Charts */}
      {isLoading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : trendsData?.trends && trendsData.trends.length > 0 ? (
        <Grid container spacing={3}>
          {/* Total Bids and Interviews Over Time */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Total Bids & Interviews Over Time
              </Typography>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={trendsData.trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="totalBids" 
                    stroke="#1976d2" 
                    strokeWidth={2}
                    name="Total Bids"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="totalInterviews" 
                    stroke="#2e7d32" 
                    strokeWidth={2}
                    name="Total Interviews"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Success Rates Over Time */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Success Rates Over Time (%)
              </Typography>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={trendsData.trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="bidSuccessRate" 
                    stroke="#0288d1" 
                    strokeWidth={2}
                    name="Bid Success Rate %"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="hrSuccessRate" 
                    stroke="#d32f2f" 
                    strokeWidth={2}
                    name="HR Success Rate %"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="techSuccessRate" 
                    stroke="#f57c00" 
                    strokeWidth={2}
                    name="Tech Success Rate %"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* HR vs Tech Interviews Over Time */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                HR vs Tech Interviews Over Time
              </Typography>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={trendsData.trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="hrInterviews" 
                    stroke="#9c27b0" 
                    strokeWidth={2}
                    name="HR Interviews"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="techInterviews" 
                    stroke="#ff5722" 
                    strokeWidth={2}
                    name="Tech Interviews"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Summary Stats */}
          <Grid item xs={12}>
            <Alert severity="success">
              <Typography variant="body2">
                <strong>Data Summary:</strong> Showing {trendsData.trends.length} {period === 'week' ? 'weeks' : 'months'} of data
                {hasFilters && ' with active filters'}
              </Typography>
            </Alert>
          </Grid>
        </Grid>
      ) : (
        <Alert severity="info">
          No data available for the selected filters. Try adjusting your filter criteria.
        </Alert>
      )}
    </Box>
  );
};
