import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, Chip, CircularProgress, Alert, Button, Box, Typography, IconButton, ButtonGroup, Link 
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { apiClient } from '../api';
import { Bid, BidFilters, SortOptions, BidStatus } from '../api/types';

interface BidListProps {
  filters?: BidFilters;
  sort?: SortOptions;
  onBidSelect?: (bid: Bid) => void;
  onRebid?: (bid: Bid) => void;
}

export const BidList: React.FC<BidListProps> = ({ filters, sort, onBidSelect, onRebid }) => {
  const { data: bids, isLoading, error } = useQuery({
    queryKey: ['bids', filters, sort],
    queryFn: () => apiClient.getBids(filters, sort)
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: BidStatus): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    switch (status) {
      case BidStatus.NEW:
        return 'info';
      case BidStatus.SUBMITTED:
        return 'primary';
      case BidStatus.REJECTED:
        return 'error';
      case BidStatus.INTERVIEW_STAGE:
        return 'success';
      case BidStatus.CLOSED:
        return 'default';
      default:
        return 'default';
    }
  };

  const handleDownload = async (bidId: string, type: 'resume' | 'jd', filename: string, e: React.MouseEvent) => {
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

  const handleView = async (bidId: string, type: 'resume' | 'jd', e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const blob = type === 'resume' 
        ? await apiClient.downloadResume(bidId)
        : await apiClient.downloadJobDescription(bidId);
      
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      // Clean up after a delay to ensure the file opens
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error('View failed:', error);
      alert('Failed to view file');
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
        Error loading bids: {(error as Error).message}
      </Alert>
    );
  }

  if (!bids || bids.length === 0) {
    return (
      <Alert severity="info">
        No bids found
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
              <TableCell sx={{ width: 160 }}>Status</TableCell>
              <TableCell>Interview</TableCell>
              <TableCell>Resume Checker</TableCell>
              <TableCell>JD</TableCell>
              <TableCell>Resume</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {bids.map((bid) => (
              <TableRow 
                key={bid.id} 
                hover 
                onClick={() => onBidSelect?.(bid)}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell>{formatDate(bid.date)}</TableCell>
                <TableCell>
                  <Link
                    href={bid.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    underline="hover"
                    color="primary"
                  >
                    {bid.company}
                  </Link>
                </TableCell>
                <TableCell>{bid.client}</TableCell>
                <TableCell>{bid.role}</TableCell>
                <TableCell sx={{ width: 160 }}>
                  <Chip 
                    label={bid.status} 
                    color={getStatusColor(bid.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {bid.interviewWinning ? (
                    <Chip 
                      icon={<CheckCircleIcon />} 
                      label="Yes" 
                      color="success" 
                      size="small"
                    />
                  ) : (
                    <Chip 
                      icon={<CancelIcon />} 
                      label="No" 
                      color="default" 
                      size="small"
                    />
                  )}
                </TableCell>
                <TableCell>
                  {bid.resumeChecker && (
                    <Chip 
                      label={bid.resumeChecker} 
                      color={bid.resumeChecker === 'ATS' ? 'warning' : 'info'}
                      size="small"
                    />
                  )}
                </TableCell>
                <TableCell>
                  <ButtonGroup size="small" variant="outlined">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={(e) => handleView(bid.id, 'jd', e)}
                      title="View Job Description"
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={(e) => handleDownload(
                        bid.id,
                        'jd',
                        `JD_${bid.company}_${bid.role}_${formatDate(bid.date)}.txt`,
                        e
                      )}
                      title="Download Job Description"
                    >
                      <DownloadIcon fontSize="small" />
                    </IconButton>
                  </ButtonGroup>
                </TableCell>
                <TableCell>
                  <ButtonGroup size="small" variant="outlined">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={(e) => handleView(bid.id, 'resume', e)}
                      title="View Resume"
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={(e) => handleDownload(
                        bid.id,
                        'resume',
                        `Resume_${bid.company}_${bid.role}_${formatDate(bid.date)}.pdf`,
                        e
                      )}
                      title="Download Resume"
                    >
                      <DownloadIcon fontSize="small" />
                    </IconButton>
                  </ButtonGroup>
                </TableCell>
                <TableCell>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRebid?.(bid);
                    }}
                    disabled={bid.status !== BidStatus.REJECTED}
                    variant="outlined"
                    size="small"
                  >
                    Rebid
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      {bids.some(bid => bid.bidDetail) && (
        <Paper sx={{ mt: 2, p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Warnings
          </Typography>
          {bids.filter(bid => bid.bidDetail).map(bid => (
            <Alert key={bid.id} severity="warning" sx={{ mb: 1 }}>
              <strong>{bid.company} - {bid.role}:</strong> {bid.bidDetail}
            </Alert>
          ))}
        </Paper>
      )}
    </Box>
  );
};
