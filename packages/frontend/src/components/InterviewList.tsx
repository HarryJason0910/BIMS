import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, Chip, CircularProgress, Alert, Button, Box, Typography, IconButton, ButtonGroup, Snackbar 
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import { apiClient } from '../api';
import { Interview, InterviewFilters, SortOptions, InterviewStatus, InterviewType, InterviewFailureReason, CancellationReason } from '../api/types';
import { InterviewFailureReasonModal } from './InterviewFailureReasonModal';
import { InterviewCancellationReasonModal } from './InterviewCancellationReasonModal';

interface InterviewListProps {
  filters?: InterviewFilters;
  sort?: SortOptions;
  onInterviewSelect?: (interview: Interview) => void;
  onScheduleNext?: (interview: Interview) => void;
}

// Helper function to get interview stage number and label
const getInterviewStage = (type: InterviewType): { stage: number; label: string } => {
  switch (type) {
    case InterviewType.HR:
      return { stage: 1, label: 'Stage 1: HR' };
    case InterviewType.TECH_INTERVIEW_1:
      return { stage: 2, label: 'Stage 2: Tech 1' };
    case InterviewType.TECH_INTERVIEW_2:
      return { stage: 3, label: 'Stage 3: Tech 2' };
    case InterviewType.TECH_INTERVIEW_3:
      return { stage: 4, label: 'Stage 4: Tech 3' };
    case InterviewType.FINAL_INTERVIEW:
      return { stage: 5, label: 'Stage 5: Final' };
    case InterviewType.CLIENT_INTERVIEW:
      return { stage: 6, label: 'Stage 6: Client' };
    default:
      return { stage: 0, label: 'Unknown' };
  }
};

// Helper function to get next interview type
const getNextInterviewType = (currentType: InterviewType): InterviewType | null => {
  switch (currentType) {
    case InterviewType.HR:
      return InterviewType.TECH_INTERVIEW_1;
    case InterviewType.TECH_INTERVIEW_1:
      return InterviewType.TECH_INTERVIEW_2;
    case InterviewType.TECH_INTERVIEW_2:
      return InterviewType.TECH_INTERVIEW_3;
    case InterviewType.TECH_INTERVIEW_3:
      return InterviewType.FINAL_INTERVIEW;
    case InterviewType.FINAL_INTERVIEW:
      return InterviewType.CLIENT_INTERVIEW;
    case InterviewType.CLIENT_INTERVIEW:
      return null; // No next stage after client interview
    default:
      return null;
  }
};

export const InterviewList: React.FC<InterviewListProps> = ({ 
  filters, 
  sort, 
  onInterviewSelect,
  onScheduleNext
}) => {
  const [expandedInterviewId, setExpandedInterviewId] = React.useState<string | null>(null);
  const [snackbarMessage, setSnackbarMessage] = React.useState<string>('');
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [failureModalOpen, setFailureModalOpen] = React.useState(false);
  const [selectedInterviewForFailure, setSelectedInterviewForFailure] = React.useState<Interview | null>(null);
  const [cancellationModalOpen, setCancellationModalOpen] = React.useState(false);
  const [selectedInterviewForCancellation, setSelectedInterviewForCancellation] = React.useState<Interview | null>(null);
  const [processingInterviewId, setProcessingInterviewId] = React.useState<string | null>(null);
  const queryClient = useQueryClient();
  
  const { data: interviews, isLoading, error } = useQuery({
    queryKey: ['interviews', filters, sort],
    queryFn: () => apiClient.getInterviews(filters, sort)
  });

  const handleViewFile = async (bidId: string, type: 'resume' | 'jd', e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const blob = type === 'resume' 
        ? await apiClient.downloadResume(bidId)
        : await apiClient.downloadJobDescription(bidId);
      
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error('View failed:', error);
      alert('Failed to view file');
    }
  };

  const handleDownloadFile = async (bidId: string, type: 'resume' | 'jd', filename: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const blob = type === 'resume' 
        ? await apiClient.downloadResume(bidId)
        : await apiClient.downloadJobDescription(bidId);
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download file');
    }
  };

  const handleRowClick = (interview: Interview) => {
    // Toggle: if clicking the same row, collapse it; otherwise expand the new one
    setExpandedInterviewId(expandedInterviewId === interview.id ? null : interview.id);
    onInterviewSelect?.(interview);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusColor = (status: InterviewStatus): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    switch (status) {
      case InterviewStatus.SCHEDULED:
        return 'info';
      case InterviewStatus.ATTENDED:
        return 'primary';
      case InterviewStatus.PENDING:
        return 'warning';
      case InterviewStatus.EXPIRED:
        return 'default';
      case InterviewStatus.CLOSED:
        return 'secondary';
      case InterviewStatus.COMPLETED_SUCCESS:
        return 'success';
      case InterviewStatus.COMPLETED_FAILURE:
        return 'error';
      case InterviewStatus.CANCELLED:
        return 'default';
      default:
        return 'default';
    }
  };

  const isInterviewExpired = (interview: Interview): boolean => {
    const interviewDate = new Date(interview.date);
    const now = new Date();
    return interviewDate < now && interview.status === InterviewStatus.SCHEDULED;
  };

  const handleAttendInterview = async (interview: Interview, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Prevent double submission
    if (processingInterviewId === interview.id) return;
    
    setProcessingInterviewId(interview.id);
    
    try {
      await apiClient.attendInterview(interview.id);
      
      setSnackbarMessage('Interview marked as attended');
      setSnackbarOpen(true);
      
      // Invalidate queries to refresh data without full page reload
      await queryClient.invalidateQueries({ queryKey: ['interviews'] });
      await queryClient.invalidateQueries({ queryKey: ['bids'] });
    } catch (error) {
      console.error('Failed to mark interview as attended:', error);
      alert(`Failed to mark interview as attended: ${(error as Error).message}`);
    } finally {
      setProcessingInterviewId(null);
    }
  };

  const handlePassInterview = async (interview: Interview, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Prevent double submission
    if (processingInterviewId === interview.id) return;
    
    setProcessingInterviewId(interview.id);
    
    try {
      await apiClient.completeInterview(interview.id, { success: true });
      
      setSnackbarMessage('Interview marked as passed');
      setSnackbarOpen(true);
      
      // Invalidate queries to refresh data without full page reload
      await queryClient.invalidateQueries({ queryKey: ['interviews'] });
      await queryClient.invalidateQueries({ queryKey: ['bids'] });
    } catch (error) {
      console.error('Failed to mark interview as passed:', error);
      alert(`Failed to mark interview as passed: ${(error as Error).message}`);
    } finally {
      setProcessingInterviewId(null);
    }
  };

  const handleFailInterviewClick = (interview: Interview, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedInterviewForFailure(interview);
    setFailureModalOpen(true);
  };

  const handleFailInterview = async (reason: InterviewFailureReason) => {
    if (!selectedInterviewForFailure) return;
    
    // Prevent double submission
    if (processingInterviewId === selectedInterviewForFailure.id) return;
    
    setProcessingInterviewId(selectedInterviewForFailure.id);
    
    try {
      await apiClient.completeInterview(selectedInterviewForFailure.id, { 
        success: false,
        failureReason: reason
      });
      
      // Close modal and show success message first
      setFailureModalOpen(false);
      setSelectedInterviewForFailure(null);
      setSnackbarMessage('Interview marked as failed');
      setSnackbarOpen(true);
      
      // Invalidate queries to refresh data without full page reload
      await queryClient.invalidateQueries({ queryKey: ['interviews'] });
      await queryClient.invalidateQueries({ queryKey: ['bids'] });
    } catch (error) {
      console.error('Failed to mark interview as failed:', error);
      alert(`Failed to mark interview as failed: ${(error as Error).message}`);
      // Don't close modal on error so user can retry
    } finally {
      setProcessingInterviewId(null);
    }
  };

  const handleCancelInterviewClick = (interview: Interview, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedInterviewForCancellation(interview);
    setCancellationModalOpen(true);
  };

  const handleCancelInterview = async (reason: CancellationReason) => {
    if (!selectedInterviewForCancellation) return;
    
    // Prevent double submission
    if (processingInterviewId === selectedInterviewForCancellation.id) return;
    
    setProcessingInterviewId(selectedInterviewForCancellation.id);
    
    try {
      await apiClient.cancelInterview(selectedInterviewForCancellation.id, reason);
      
      // Close modal first
      setCancellationModalOpen(false);
      
      // If rescheduled, trigger the schedule form immediately with the interview data
      if (reason === CancellationReason.RESCHEDULED) {
        setSnackbarMessage('Interview cancelled for rescheduling');
        setSnackbarOpen(true);
        
        // Create a copy of the interview with updated status and cancellation reason
        const rescheduledInterview: Interview = {
          ...selectedInterviewForCancellation,
          status: InterviewStatus.CANCELLED,
          cancellationReason: CancellationReason.RESCHEDULED
        };
        
        // Trigger reschedule with the updated interview object
        onScheduleNext?.(rescheduledInterview);
        
        // Invalidate queries after opening the form
        await queryClient.invalidateQueries({ queryKey: ['interviews'] });
        await queryClient.invalidateQueries({ queryKey: ['bids'] });
      } else {
        setSnackbarMessage('Interview cancelled - role closed');
        setSnackbarOpen(true);
        
        // Invalidate queries to refresh data
        await queryClient.invalidateQueries({ queryKey: ['interviews'] });
        await queryClient.invalidateQueries({ queryKey: ['bids'] });
      }
      
      setSelectedInterviewForCancellation(null);
    } catch (error) {
      console.error('Failed to cancel interview:', error);
      alert(`Failed to cancel interview: ${(error as Error).message}`);
      // Don't close modal on error so user can retry
    } finally {
      setProcessingInterviewId(null);
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Error loading interviews: {(error as Error).message}
      </Alert>
    );
  }

  if (!interviews || interviews.length === 0) {
    return (
      <Alert severity="info">
        No interviews found
      </Alert>
    );
  }

  return (
    <Box>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        message={snackbarMessage}
      />
      
      <TableContainer component={Paper}>
        <Table sx={{ '& .MuiTableCell-root': { borderRight: '1px solid rgba(224, 224, 224, 1)' } }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'rgba(33, 150, 243, 0.25)' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>Date & Time</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Company</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Client</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Role</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Stage</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Recruiter</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>JD</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Resume</TableCell>
              <TableCell sx={{ fontWeight: 'bold', borderRight: 'none' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {interviews.map((interview, index) => {
              const stageInfo = getInterviewStage(interview.interviewType);
              return (
              <React.Fragment key={interview.id}>
                <TableRow 
                  hover 
                  onClick={() => handleRowClick(interview)}
                  sx={{ 
                    cursor: 'pointer', 
                    backgroundColor: expandedInterviewId === interview.id 
                      ? '#f5f5f5' 
                      : index % 2 === 1 
                        ? 'rgba(33, 150, 243, 0.08)' 
                        : 'inherit'
                  }}
                >
                  <TableCell>{formatDate(interview.date)}</TableCell>
                  <TableCell>{interview.company}</TableCell>
                  <TableCell>{interview.client}</TableCell>
                  <TableCell>{interview.role}</TableCell>
                  <TableCell>
                    <Chip 
                      label={stageInfo.label}
                      color="info"
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{interview.recruiter}</TableCell>
                  <TableCell>
                    <Chip 
                      label={interview.status.replace('_', ' ')} 
                      color={getStatusColor(interview.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    {interview.bidId ? (
                      <ButtonGroup size="small">
                        <IconButton
                          size="small"
                          onClick={(e) => handleViewFile(interview.bidId!, 'jd', e)}
                          title="View Job Description"
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={(e) => handleDownloadFile(interview.bidId!, 'jd', `${interview.company}_${interview.role}_JD.txt`, e)}
                          title="Download Job Description"
                        >
                          <DownloadIcon fontSize="small" />
                        </IconButton>
                      </ButtonGroup>
                    ) : (
                      <Typography variant="body2" color="text.secondary">N/A</Typography>
                    )}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    {interview.bidId ? (
                      <ButtonGroup size="small">
                        <IconButton
                          size="small"
                          onClick={(e) => handleViewFile(interview.bidId!, 'resume', e)}
                          title="View Resume"
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={(e) => handleDownloadFile(interview.bidId!, 'resume', `${interview.company}_${interview.role}_Resume.pdf`, e)}
                          title="Download Resume"
                        >
                          <DownloadIcon fontSize="small" />
                        </IconButton>
                      </ButtonGroup>
                    ) : (
                      <Typography variant="body2" color="text.secondary">N/A</Typography>
                    )}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {interview.status === InterviewStatus.SCHEDULED && !isInterviewExpired(interview) && (
                        <>
                          <Button
                            onClick={(e) => handleAttendInterview(interview, e)}
                            variant="contained"
                            size="small"
                            color="primary"
                            disabled={processingInterviewId === interview.id}
                          >
                            {processingInterviewId === interview.id ? 'Processing...' : 'Attended'}
                          </Button>
                          <Button
                            onClick={(e) => handleCancelInterviewClick(interview, e)}
                            variant="outlined"
                            size="small"
                            color="error"
                            disabled={processingInterviewId === interview.id}
                          >
                            Cancel
                          </Button>
                        </>
                      )}
                      {interview.status === InterviewStatus.PENDING && (
                        <>
                          <Button
                            onClick={(e) => handlePassInterview(interview, e)}
                            variant="contained"
                            size="small"
                            color="success"
                            disabled={processingInterviewId === interview.id}
                          >
                            {processingInterviewId === interview.id ? 'Processing...' : 'Passed'}
                          </Button>
                          <Button
                            onClick={(e) => handleFailInterviewClick(interview, e)}
                            variant="contained"
                            size="small"
                            color="error"
                            disabled={processingInterviewId === interview.id}
                          >
                            Failed
                          </Button>
                        </>
                      )}
                      {isInterviewExpired(interview) && (
                        <Chip label="Expired" color="default" size="small" />
                      )}
                      {(interview.status === InterviewStatus.COMPLETED_SUCCESS || 
                        interview.status === InterviewStatus.COMPLETED_FAILURE ||
                        interview.status === InterviewStatus.CANCELLED) && (
                        <>
                          {interview.status === InterviewStatus.COMPLETED_SUCCESS && getNextInterviewType(interview.interviewType) && (
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                onScheduleNext?.(interview);
                              }}
                              variant="contained"
                              size="small"
                              color="primary"
                              disabled={interview.hasScheduledNext}
                            >
                              {interview.hasScheduledNext ? 'Next Scheduled' : 'Schedule Next'}
                            </Button>
                          )}
                          {interview.status === InterviewStatus.COMPLETED_SUCCESS && !getNextInterviewType(interview.interviewType) && (
                            <Typography variant="body2" color="success.main" fontWeight="bold">
                              Process Complete!
                            </Typography>
                          )}
                          {(interview.status === InterviewStatus.COMPLETED_FAILURE || interview.status === InterviewStatus.CANCELLED) && (
                            <Typography variant="body2" color="text.secondary">
                              No actions available
                            </Typography>
                          )}
                        </>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
                {expandedInterviewId === interview.id && interview.detail && (
                  <TableRow>
                    <TableCell colSpan={10} sx={{ backgroundColor: '#fafafa', borderBottom: '2px solid #e0e0e0' }}>
                      <Box sx={{ p: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          <strong>Interview Details:</strong>
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {interview.detail}
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <InterviewFailureReasonModal
        open={failureModalOpen}
        onClose={() => {
          setFailureModalOpen(false);
          setSelectedInterviewForFailure(null);
        }}
        onConfirm={handleFailInterview}
        interviewType={selectedInterviewForFailure?.interviewType || InterviewType.HR}
        companyName={selectedInterviewForFailure?.company || ''}
        roleName={selectedInterviewForFailure?.role || ''}
      />

      <InterviewCancellationReasonModal
        open={cancellationModalOpen}
        onClose={() => {
          setCancellationModalOpen(false);
          setSelectedInterviewForCancellation(null);
        }}
        onConfirm={handleCancelInterview}
        companyName={selectedInterviewForCancellation?.company || ''}
        roleName={selectedInterviewForCancellation?.role || ''}
      />
    </Box>
  );
};
