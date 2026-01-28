import React, { useState } from 'react';
import { 
  Box, TextField, Select, MenuItem, FormControl, InputLabel, 
  Button, ButtonGroup, Typography, Grid
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { BidFilters as BidFiltersType, BidStatus, SortOptions } from '../api/types';

interface BidFiltersProps {
  onFiltersChange: (filters: BidFiltersType) => void;
  onSortChange: (sort: SortOptions) => void;
}

export const BidFilters: React.FC<BidFiltersProps> = ({ onFiltersChange, onSortChange }) => {
  // Calculate default date range: one week ago to tomorrow (to include today's data)
  const getDefaultDateRange = () => {
    const today = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(today.getDate() - 7);
    
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    
    return {
      dateFrom: weekAgo.toISOString().split('T')[0],
      dateTo: tomorrow.toISOString().split('T')[0]
    };
  };

  const defaultFilters = getDefaultDateRange();
  const [filters, setFilters] = useState<BidFiltersType>(defaultFilters);
  const [sort, setSort] = useState<SortOptions>({ field: 'date', order: 'desc' });

  // Apply default filters on mount
  React.useEffect(() => {
    onFiltersChange(defaultFilters);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFilterChange = (key: keyof BidFiltersType, value: string) => {
    const newFilters = {
      ...filters,
      [key]: value || undefined
    };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleSortChange = (field: string) => {
    const newSort: SortOptions = {
      field,
      order: sort.field === field && sort.order === 'asc' ? 'desc' : 'asc'
    };
    setSort(newSort);
    onSortChange(newSort);
  };

  const handleClearFilters = () => {
    const defaultFilters = getDefaultDateRange();
    setFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Filters
      </Typography>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            label="Company"
            value={filters.company || ''}
            onChange={(e) => handleFilterChange('company', e.target.value)}
            placeholder="Filter by company"
            size="small"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            label="Role"
            value={filters.role || ''}
            onChange={(e) => handleFilterChange('role', e.target.value)}
            placeholder="Filter by role"
            size="small"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={2.5}>
          <FormControl fullWidth size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filters.status || ''}
              label="Status"
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value={BidStatus.NEW}>New</MenuItem>
              <MenuItem value={BidStatus.SUBMITTED}>Submitted</MenuItem>
              <MenuItem value={BidStatus.REJECTED}>Rejected</MenuItem>
              <MenuItem value={BidStatus.INTERVIEW_STAGE}>Interview Stage</MenuItem>
              <MenuItem value={BidStatus.CLOSED}>Closed</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6} md={1.75}>
          <TextField
            fullWidth
            label="Date From"
            type="date"
            value={filters.dateFrom || ''}
            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={1.75}>
          <TextField
            fullWidth
            label="Date To"
            type="date"
            value={filters.dateTo || ''}
            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
          />
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2">Sort by:</Typography>
          <ButtonGroup size="small" variant="outlined">
            <Button
              onClick={() => handleSortChange('date')}
              variant={sort.field === 'date' ? 'contained' : 'outlined'}
              endIcon={sort.field === 'date' && (sort.order === 'asc' ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />)}
            >
              Date
            </Button>
            <Button
              onClick={() => handleSortChange('company')}
              variant={sort.field === 'company' ? 'contained' : 'outlined'}
              endIcon={sort.field === 'company' && (sort.order === 'asc' ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />)}
            >
              Company
            </Button>
            <Button
              onClick={() => handleSortChange('role')}
              variant={sort.field === 'role' ? 'contained' : 'outlined'}
              endIcon={sort.field === 'role' && (sort.order === 'asc' ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />)}
            >
              Role
            </Button>
            <Button
              onClick={() => handleSortChange('status')}
              variant={sort.field === 'status' ? 'contained' : 'outlined'}
              endIcon={sort.field === 'status' && (sort.order === 'asc' ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />)}
            >
              Status
            </Button>
          </ButtonGroup>
        </Box>
        <Button
          onClick={handleClearFilters}
          startIcon={<ClearIcon />}
          variant="outlined"
          size="small"
        >
          Clear Filters
        </Button>
      </Box>
    </Box>
  );
};
