import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, Chip, CircularProgress, Alert, Button, Box, Typography, IconButton, ButtonGroup 
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import { apiClient } from '../api';
import { Interview, InterviewFilters, SortOptions, InterviewStatus } from '../api/types';

interface InterviewListProps {
  filters?: InterviewFilters;
  sort?: SortOptions;
  onInterviewSelect?: (interview: Interview) => void;
}

export const InterviewList: React.FC<InterviewListProps> = ({ 
  filters, 
  sort, 
  onInterviewSelect
}) => {
  const [expandedInterviewId, setExpandedInterviewId] = React.useState<string | null>(null);
  
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
      await apiClient.attendInterview(interview.id);
      // Refresh the interview list
      window.location.reload();
    } catch (error) {
      console.error('Failed to mark interview as attended:', error);
      alert('Failed to mark interview as attended');
    }
  };

  const handleCloseInterview = async (interview: Interview, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiClient.closeInterview(interview.id);
      // Refresh the interview list
      window.location.reload();
    } catch (error) {
      console.error('Failed to close interview:', error);
      alert('Failed to close interview');
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
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Company</TableCell>
              <TableCell>Client</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Recruiter</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>JD</TableCell>
              <TableCell>Resume</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {interviews.map((interview) => (
              <React.Fragment key={interview.id}>
                <TableRow 
                  hover 
                  onClick={() => handleRowClick(interview)}
                  sx={{ cursor: 'pointer', backgroundColor: expandedInterviewId === interview.id ? '#f5f5f5' : 'inherit' }}
                >
                  <TableCell>{formatDate(interview.date)}</TableCell>
                  <TableCell>{interview.company}</TableCell>
                  <TableCell>{interview.client}</TableCell>
                  <TableCell>{interview.role}</TableCell>
                  <TableCell>{interview.interviewType}</TableCell>
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
                    {interview.status === InterviewStatus.SCHEDULED && !isInterviewExpired(interview) && (
                      <Button
                        onClick={(e) => handleAttendInterview(interview, e)}
                        variant="contained"
                        size="small"
                        color="primary"
                      >
                        Attended
                      </Button>
                    )}
                    {interview.status === InterviewStatus.PENDING && (
                      <Button
                        onClick={(e) => handleCloseInterview(interview, e)}
                        variant="outlined"
                        size="small"
                        color="secondary"
                      >
                        Close
                      </Button>
                    )}
                    {isInterviewExpired(interview) && (
                      <Chip label="Expired" color="default" size="small" />
                    )}
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
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
