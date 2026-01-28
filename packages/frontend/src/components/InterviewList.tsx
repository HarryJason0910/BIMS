import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, Chip, CircularProgress, Alert, Button, Box, Typography, IconButton, ButtonGroup 
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import { apiClient } from '../api';
import { Interview, InterviewFilters, SortOptions, InterviewStatus, InterviewType } from '../api/types';

interface InterviewListProps {
  filters?: InterviewFilters;
  sort?: SortOptions;
  onInterviewSelect?: (interview: Interview) => void;
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

export const InterviewList: React.FC<InterviewListProps> = ({ 
  filters, 
  sort, 
  onInterviewSelect
}) => {
  const [expandedInterviewId, setExpandedInterviewId] = React.useState<string | null>(null);
  const [undoAction, setUndoAction] = React.useState<{ interviewId: string; action: string } | null>(null);
  
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
    return new Date(dateString).toLocaleDateString();
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    interviewDate.setHours(0, 0, 0, 0);
    return interviewDate < today && interview.status === InterviewStatus.SCHEDULED;
  };

  const handleAttendInterview = async (interview: Interview, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setUndoAction({ interviewId: interview.id, action: 'attended' });
      await apiClient.attendInterview(interview.id);
      window.location.reload();
    } catch (error) {
      console.error('Failed to mark interview as attended:', error);
      alert('Failed to mark interview as attended');
    }
  };

  const handlePassInterview = async (interview: Interview, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setUndoAction({ interviewId: interview.id, action: 'passed' });
      await apiClient.completeInterview(interview.id, { success: true });
      window.location.reload();
    } catch (error) {
      console.error('Failed to mark interview as passed:', error);
      alert('Failed to mark interview as passed');
    }
  };

  const handleFailInterview = async (interview: Interview, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setUndoAction({ interviewId: interview.id, action: 'failed' });
      await apiClient.completeInterview(interview.id, { success: false });
      window.location.reload();
    } catch (error) {
      console.error('Failed to mark interview as failed:', error);
      alert('Failed to mark interview as failed');
    }
  };

  const handleCancelInterview = async (interview: Interview, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setUndoAction({ interviewId: interview.id, action: 'cancelled' });
      await apiClient.cancelInterview(interview.id);
      window.location.reload();
    } catch (error) {
      console.error('Failed to cancel interview:', error);
      alert('Failed to cancel interview');
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
      {undoAction && (
        <Alert 
          severity="info" 
          sx={{ mb: 2 }}
          onClose={() => setUndoAction(null)}
        >
          Interview marked as {undoAction.action}
        </Alert>
      )}
      
      <TableContainer component={Paper}>
        <Table sx={{ '& .MuiTableCell-root': { borderRight: '1px solid rgba(224, 224, 224, 1)' } }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'rgba(33, 150, 243, 0.25)' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
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
                          >
                            Attended
                          </Button>
                          <Button
                            onClick={(e) => handleCancelInterview(interview, e)}
                            variant="outlined"
                            size="small"
                            color="error"
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
                          >
                            Passed
                          </Button>
                          <Button
                            onClick={(e) => handleFailInterview(interview, e)}
                            variant="contained"
                            size="small"
                            color="error"
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
                        <Typography variant="body2" color="text.secondary">
                          No actions available
                        </Typography>
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
    </Box>
  );
};
