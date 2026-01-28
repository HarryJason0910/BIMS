import React, { useState, useCallback } from 'react';
import { Box, Fab, Zoom } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { InterviewList } from '../components/InterviewList';
import { InterviewForm } from '../components/InterviewForm';
import { InterviewFilters } from '../components/InterviewFilters';
import { EditInterviewDetailForm } from '../components/EditInterviewDetailForm';
import { Interview, InterviewFilters as InterviewFiltersType, SortOptions } from '../api/types';
import { apiClient } from '../api';
import { useQueryClient } from '@tanstack/react-query';

type ViewMode = 'list' | 'create' | 'editDetail' | 'scheduleNext' | 'reschedule';

export const InterviewDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [filters, setFilters] = useState<InterviewFiltersType>({});
  const [sort, setSort] = useState<SortOptions>({ field: 'date', order: 'desc' });
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [baseInterview, setBaseInterview] = useState<Interview | null>(null);
  const [rescheduleInterview, setRescheduleInterview] = useState<Interview | null>(null);

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

  const handleCreateSuccess = useCallback(() => {
    setViewMode('list');
  }, []);

  const handleEditDetailClick = useCallback((interview: Interview) => {
    setSelectedInterview(interview);
    setViewMode('editDetail');
  }, []);

  const handleEditDetailSuccess = useCallback(() => {
    setViewMode('list');
    setSelectedInterview(null);
  }, []);

  const handleScheduleNext = useCallback((interview: Interview) => {
    // Check if this is a reschedule (cancelled interview) or schedule next (passed interview)
    if (interview.status === 'CANCELLED' && interview.cancellationReason === 'Rescheduled') {
      // Reschedule the same interview type
      setRescheduleInterview(interview);
      setViewMode('reschedule');
    } else {
      // Schedule next stage
      setBaseInterview(interview);
      setViewMode('scheduleNext');
    }
  }, []);

  const handleScheduleNextSuccess = useCallback(() => {
    setViewMode('list');
    setBaseInterview(null);
  }, []);

  const handleRescheduleSuccess = useCallback(() => {
    setViewMode('list');
    setRescheduleInterview(null);
  }, []);

  const handleCancel = useCallback(async () => {
    // If we're in reschedule mode, revert the cancellation
    if (viewMode === 'reschedule' && rescheduleInterview) {
      try {
        await apiClient.revertCancelInterview(rescheduleInterview.id);
        // Refresh the interview list
        queryClient.invalidateQueries({ queryKey: ['interviews'] });
        queryClient.invalidateQueries({ queryKey: ['bids'] });
      } catch (error) {
        console.error('Failed to revert cancellation:', error);
        alert(`Failed to revert cancellation: ${(error as Error).message}`);
      }
    }
    
    setViewMode('list');
    setSelectedInterview(null);
    setBaseInterview(null);
    setRescheduleInterview(null);
  }, [viewMode, rescheduleInterview]);

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
            onScheduleNext={handleScheduleNext}
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

      {viewMode === 'scheduleNext' && baseInterview && (
        <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
          <InterviewForm
            baseInterview={baseInterview}
            onSuccess={handleScheduleNextSuccess}
            onCancel={handleCancel}
          />
        </Box>
      )}

      {viewMode === 'reschedule' && rescheduleInterview && (
        <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
          <InterviewForm
            rescheduleInterview={rescheduleInterview}
            onSuccess={handleRescheduleSuccess}
            onCancel={handleCancel}
          />
        </Box>
      )}
    </Box>
  );
};
