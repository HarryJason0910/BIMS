import React, { useState } from 'react';
import { Box, Fab, Zoom } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { InterviewList } from '../components/InterviewList';
import { InterviewForm } from '../components/InterviewForm';
import { InterviewFilters } from '../components/InterviewFilters';
import { EditInterviewDetailForm } from '../components/EditInterviewDetailForm';
import { Interview, InterviewFilters as InterviewFiltersType, SortOptions } from '../api/types';

type ViewMode = 'list' | 'create' | 'editDetail';

export const InterviewDashboard: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [filters, setFilters] = useState<InterviewFiltersType>({});
  const [sort, setSort] = useState<SortOptions>({ field: 'date', order: 'desc' });
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+Enter: Schedule new interview
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

  const handleEditDetailClick = (interview: Interview) => {
    setSelectedInterview(interview);
    setViewMode('editDetail');
  };

  const handleEditDetailSuccess = () => {
    setViewMode('list');
    setSelectedInterview(null);
  };

  const handleCancel = () => {
    setViewMode('list');
    setSelectedInterview(null);
  };

  return (
    <Box sx={{ position: 'relative', pb: 10 }}>
      {viewMode === 'list' && (
        <>
          <InterviewFilters
            onFiltersChange={setFilters}
            onSortChange={setSort}
          />
          <InterviewList
            filters={filters}
            sort={sort}
            onInterviewSelect={handleEditDetailClick}
          />
          
          {/* Floating Action Button */}
          <Zoom in={true}>
            <Fab
              color="primary"
              aria-label="schedule interview"
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
          <InterviewForm
            onSuccess={handleCreateSuccess}
            onCancel={handleCancel}
          />
        </Box>
      )}

      {viewMode === 'editDetail' && selectedInterview && (
        <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
          <EditInterviewDetailForm
            interview={selectedInterview}
            onSuccess={handleEditDetailSuccess}
            onCancel={handleCancel}
          />
        </Box>
      )}
    </Box>
  );
};
