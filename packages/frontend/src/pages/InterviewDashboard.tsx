import React, { useState } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { InterviewList } from '../components/InterviewList';
import { InterviewForm } from '../components/InterviewForm';
import { InterviewFilters } from '../components/InterviewFilters';
import { CompleteInterviewForm } from '../components/CompleteInterviewForm';
import { Interview, InterviewFilters as InterviewFiltersType, SortOptions } from '../api/types';

type ViewMode = 'list' | 'create' | 'complete';

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

  const handleCompleteClick = (interview: Interview) => {
    setSelectedInterview(interview);
    setViewMode('complete');
  };

  const handleCompleteSuccess = () => {
    setViewMode('list');
    setSelectedInterview(null);
  };

  const handleCancel = () => {
    setViewMode('list');
    setSelectedInterview(null);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Interview Dashboard
        </Typography>
        {viewMode === 'list' && (
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => setViewMode('create')}
          >
            Schedule Interview
          </Button>
        )}
      </Box>

      {viewMode === 'list' && (
        <>
          <Paper sx={{ p: 2, mb: 3 }}>
            <InterviewFilters
              onFiltersChange={setFilters}
              onSortChange={setSort}
            />
          </Paper>
          <InterviewList
            filters={filters}
            sort={sort}
            onComplete={handleCompleteClick}
          />
        </>
      )}

      {viewMode === 'create' && (
        <Paper sx={{ p: 3 }}>
          <InterviewForm
            onSuccess={handleCreateSuccess}
            onCancel={handleCancel}
          />
        </Paper>
      )}

      {viewMode === 'complete' && selectedInterview && (
        <Paper sx={{ p: 3 }}>
          <CompleteInterviewForm
            interview={selectedInterview}
            onSuccess={handleCompleteSuccess}
            onCancel={handleCancel}
          />
        </Paper>
      )}
    </Box>
  );
};
