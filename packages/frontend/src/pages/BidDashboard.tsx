import React, { useState } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { BidList } from '../components/BidList';
import { BidForm } from '../components/BidForm';
import { BidFilters } from '../components/BidFilters';
import { RebidForm } from '../components/RebidForm';
import { Bid, BidFilters as BidFiltersType, SortOptions } from '../api/types';

type ViewMode = 'list' | 'create' | 'rebid';

export const BidDashboard: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [filters, setFilters] = useState<BidFiltersType>({});
  const [sort, setSort] = useState<SortOptions>({ field: 'date', order: 'desc' });
  const [selectedBid, setSelectedBid] = useState<Bid | null>(null);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+Enter: Create new bid
      if (event.ctrlKey && event.key === 'Enter') {
        event.preventDefault();
        if (viewMode === 'list') {
          setViewMode('create');
        }
      }
      // ESC: Cancel and return to list
      if (event.key === 'Escape') {
        if (viewMode !== 'list') {
          handleCancel();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode]);

  const handleCreateSuccess = () => {
    setViewMode('list');
  };

  const handleRebidClick = (bid: Bid) => {
    if (bid.interviewWinning) {
      alert('Cannot rebid: This bid has already won an interview');
      return;
    }
    setSelectedBid(bid);
    setViewMode('rebid');
  };

  const handleRebidSuccess = () => {
    setViewMode('list');
    setSelectedBid(null);
  };

  const handleCancel = () => {
    setViewMode('list');
    setSelectedBid(null);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Bid Dashboard
        </Typography>
        {viewMode === 'list' && (
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => setViewMode('create')}
          >
            Create New Bid
          </Button>
        )}
      </Box>

      {viewMode === 'list' && (
        <>
          <Paper sx={{ p: 2, mb: 3 }}>
            <BidFilters
              onFiltersChange={setFilters}
              onSortChange={setSort}
            />
          </Paper>
          <BidList
            filters={filters}
            sort={sort}
            onRebid={handleRebidClick}
          />
        </>
      )}

      {viewMode === 'create' && (
        <Paper sx={{ p: 3 }}>
          <BidForm
            onSuccess={handleCreateSuccess}
            onCancel={handleCancel}
          />
        </Paper>
      )}

      {viewMode === 'rebid' && selectedBid && (
        <Paper sx={{ p: 3 }}>
          <RebidForm
            bid={selectedBid}
            onSuccess={handleRebidSuccess}
            onCancel={handleCancel}
          />
        </Paper>
      )}
    </Box>
  );
};
