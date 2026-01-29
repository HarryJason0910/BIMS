import React, { useState } from 'react';
import { 
  Box, TextField, Select, MenuItem, FormControl, InputLabel, 
  Button, ButtonGroup, Typography, Grid, Autocomplete, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions, Accordion, AccordionSummary,
  AccordionDetails, Badge
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import AddIcon from '@mui/icons-material/Add';
import FilterListIcon from '@mui/icons-material/FilterList';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { BidFilters as BidFiltersType, BidStatus, SortOptions } from '../api/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api';

interface BidFiltersProps {
  onFiltersChange: (filters: BidFiltersType) => void;
  onSortChange: (sort: SortOptions) => void;
}

export const BidFilters: React.FC<BidFiltersProps> = ({ onFiltersChange, onSortChange }) => {
  const queryClient = useQueryClient();
  
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
  const [selectedStacks, setSelectedStacks] = useState<string[]>([]);
  const [addStackDialogOpen, setAddStackDialogOpen] = useState(false);
  const [newStackName, setNewStackName] = useState('');
  const [expanded, setExpanded] = useState(false);

  // Fetch available tech stacks
  const { data: availableStacks = [] } = useQuery({
    queryKey: ['techStacks'],
    queryFn: () => apiClient.getTechStacks()
  });

  // Add new tech stack mutation
  const addStackMutation = useMutation({
    mutationFn: (stack: string) => apiClient.addTechStack(stack),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['techStacks'] });
      setAddStackDialogOpen(false);
      setNewStackName('');
    }
  });

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
    setSelectedStacks([]);
    onFiltersChange(defaultFilters);
  };

  const handleStacksChange = (_event: any, newValue: string[]) => {
    setSelectedStacks(newValue);
    const newFilters = {
      ...filters,
      mainStacks: newValue.length > 0 ? newValue : undefined
    };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleAddNewStack = () => {
    if (newStackName.trim()) {
      addStackMutation.mutate(newStackName.trim());
    }
  };

  // Count active filters
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.company) count++;
    if (filters.role) count++;
    if (filters.status) count++;
    if (selectedStacks.length > 0) count++;
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
                  <MenuItem value={BidStatus.INTERVIEW_FAILED}>Interview Failed</MenuItem>
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

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <Autocomplete
                  multiple
                  fullWidth
                  options={availableStacks}
                  value={selectedStacks}
                  onChange={handleStacksChange}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Tech Stacks (ALL must match)"
                      placeholder="Select stacks to filter"
                      size="small"
                    />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        label={option}
                        {...getTagProps({ index })}
                        size="small"
                        color="primary"
                      />
                    ))
                  }
                />
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => setAddStackDialogOpen(true)}
                  size="small"
                  sx={{ minWidth: '120px', height: '40px' }}
                >
                  Stacks
                </Button>
              </Box>
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

      {/* Add Stack Dialog */}
      <Dialog open={addStackDialogOpen} onClose={() => setAddStackDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Tech Stack</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Add a new technology stack to the system. It will be available for all users.
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Stack Name"
            fullWidth
            value={newStackName}
            onChange={(e) => setNewStackName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAddNewStack();
              }
            }}
            placeholder="e.g., Next.js, TailwindCSS, FastAPI"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddStackDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleAddNewStack} 
            variant="contained"
            disabled={!newStackName.trim() || addStackMutation.isPending}
          >
            {addStackMutation.isPending ? 'Adding...' : 'Add Stack'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
