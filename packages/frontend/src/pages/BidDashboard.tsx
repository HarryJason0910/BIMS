import React, { useState, useCallback } from 'react';
import { Box, Fab, Zoom } from '@mui/material';
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

  const handleCreateSuccess = useCallback(() => {
    setViewMode('list');
  }, []);

  const handleRebidClick = useCallback((bid: Bid) => {
    if (bid.interviewWinning) {
      alert('Cannot rebid: This bid has already won an interview');
      return;
    }
    setSelectedBid(bid);
    setViewMode('rebid');
  }, []);

  const handleRebidSuccess = useCallback(() => {
    setViewMode('list');
    setSelectedBid(null);
  }, []);

  const handleCancel = useCallback(() => {
    setViewMode('list');
    setSelectedBid(null);
  }, []);

  return (
    <Box sx={{ position: 'relative', pb: 10 }}>
      {viewMode === 'list' && (
        <>
          <BidFilters
            onFiltersChange={setFilters}
            onSortChange={setSort}
          />
          <BidList
            filters={filters}
            sort={sort}
            onRebid={handleRebidClick}
          />
          
          {/* Floating Action Button */}
          <Zoom in={true}>
            <Fab
              color="primary"
              aria-label="create bid"
              onClick={() => setViewMode('create')}
              sx={{
                position: 'fixed',
                bottom: 32,
                right: 32,
              }}
            >
              <AddIcon />
            </Fab>
          </Zoom>
        </>
      )}

      {viewMode === 'create' && (
        <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
          <BidForm
            onSuccess={handleCreateSuccess}
            onCancel={handleCancel}
          />
        </Box>
      )}

      {viewMode === 'rebid' && selectedBid && (
        <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
          <RebidForm
            bid={selectedBid}
            onSuccess={handleRebidSuccess}
            onCancel={handleCancel}
          />
        </Box>
      )}
    </Box>
  );
};
