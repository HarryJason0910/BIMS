import React, { useState } from 'react';
import { 
  Box, TextField, Select, MenuItem, FormControl, InputLabel, 
  Button, ButtonGroup, Typography, Grid, Accordion, AccordionSummary,
  AccordionDetails, Badge
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import FilterListIcon from '@mui/icons-material/FilterList';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { InterviewFilters as InterviewFiltersType, InterviewStatus, InterviewType, SortOptions } from '../api/types';

interface InterviewFiltersProps {
  onFiltersChange: (filters: InterviewFiltersType) => void;
  onSortChange: (sort: SortOptions) => void;
}

export const InterviewFilters: React.FC<InterviewFiltersProps> = ({ onFiltersChange, onSortChange }) => {
  // Calculate default date range: 3 days ago to 7 days later
  const getDefaultDateRange = () => {
    const today = new Date();
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(today.getDate() - 3);
    
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(today.getDate() + 7);
    
    return {
      dateFrom: threeDaysAgo.toISOString().split('T')[0],
      dateTo: sevenDaysLater.toISOString().split('T')[0]
    };
  };

  const defaultFilters = getDefaultDateRange();
  const [filters, setFilters] = useState<InterviewFiltersType>(defaultFilters);
  const [sort, setSort] = useState<SortOptions>({ field: 'date', order: 'desc' });
  const [expanded, setExpanded] = useState(false);

  // Apply default filters on mount
  React.useEffect(() => {
    onFiltersChange(defaultFilters);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFilterChange = (key: keyof InterviewFiltersType, value: string) => {
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

  // Count active filters
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.company) count++;
    if (filters.role) count++;
    if (filters.status) count++;
    if (filters.recruiter) count++;
    if (filters.interviewType) count++;
    if (filters.attendees) count++;
    // Don't count date filters as they're always set by default
    return count;
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Accordion expanded={expanded} onChange={() => setExpanded(!expanded)}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
            <FilterListIcon />
            <Typography variant="h6">Filters & Sorting</Typography>
            {getActiveFilterCount() > 0 && (
              <Badge badgeContent={getActiveFilterCount()} color="primary" sx={{ ml: 1 }}>
                <Box sx={{ width: 20 }} />
              </Badge>
            )}
          </Box>
        </AccordionSummary>
        <AccordionDetails>
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

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Recruiter"
                value={filters.recruiter || ''}
                onChange={(e) => handleFilterChange('recruiter', e.target.value)}
                placeholder="Filter by recruiter"
                size="small"
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Attendees"
                value={filters.attendees || ''}
                onChange={(e) => handleFilterChange('attendees', e.target.value)}
                placeholder="Filter by attendee name"
                size="small"
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Interview Type</InputLabel>
                <Select
                  value={filters.interviewType || ''}
                  label="Interview Type"
                  onChange={(e) => handleFilterChange('interviewType', e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value={InterviewType.HR}>HR</MenuItem>
                  <MenuItem value={InterviewType.TECH_INTERVIEW_1}>Tech Interview 1</MenuItem>
                  <MenuItem value={InterviewType.TECH_INTERVIEW_2}>Tech Interview 2</MenuItem>
                  <MenuItem value={InterviewType.TECH_INTERVIEW_3}>Tech Interview 3</MenuItem>
                  <MenuItem value={InterviewType.FINAL_INTERVIEW}>Final Interview</MenuItem>
                  <MenuItem value={InterviewType.CLIENT_INTERVIEW}>Client Interview</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status || ''}
                  label="Status"
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value={InterviewStatus.SCHEDULED}>Scheduled</MenuItem>
                  <MenuItem value={InterviewStatus.ATTENDED}>Attended</MenuItem>
                  <MenuItem value={InterviewStatus.PENDING}>Pending</MenuItem>
                  <MenuItem value={InterviewStatus.EXPIRED}>Expired</MenuItem>
                  <MenuItem value={InterviewStatus.COMPLETED_SUCCESS}>Completed Success</MenuItem>
                  <MenuItem value={InterviewStatus.COMPLETED_FAILURE}>Completed Failure</MenuItem>
                  <MenuItem value={InterviewStatus.CANCELLED}>Cancelled</MenuItem>
                  <MenuItem value={InterviewStatus.CLOSED}>Closed</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
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

            <Grid item xs={12} sm={6} md={3}>
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

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>Sort by:</Typography>
              <ButtonGroup size="small" variant="outlined">
                <Button
                  onClick={() => handleSortChange('date')}
                  variant={sort.field === 'date' ? 'contained' : 'outlined'}
                  endIcon={sort.field === 'date' && (sort.order === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />)}
                >
                  Date
                </Button>
                <Button
                  onClick={() => handleSortChange('company')}
                  variant={sort.field === 'company' ? 'contained' : 'outlined'}
                  endIcon={sort.field === 'company' && (sort.order === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />)}
                >
                  Company
                </Button>
                <Button
                  onClick={() => handleSortChange('role')}
                  variant={sort.field === 'role' ? 'contained' : 'outlined'}
                  endIcon={sort.field === 'role' && (sort.order === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />)}
                >
                  Role
                </Button>
                <Button
                  onClick={() => handleSortChange('status')}
                  variant={sort.field === 'status' ? 'contained' : 'outlined'}
                  endIcon={sort.field === 'status' && (sort.order === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />)}
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
              disabled={getActiveFilterCount() === 0}
            >
              Clear Filters
            </Button>
          </Box>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};
