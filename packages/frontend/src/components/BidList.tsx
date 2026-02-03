import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, Chip, CircularProgress, Alert, Button, Box, Typography, IconButton, ButtonGroup, Link, Snackbar,
  Select, MenuItem, FormControl, Pagination
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RestoreIcon from '@mui/icons-material/Restore';
import { apiClient } from '../api';
import { Bid, BidFilters, SortOptions, BidStatus, ResumeCheckerType, RejectionReason, PaginatedResponse } from '../api/types';
import { RejectionReasonModal } from './RejectionReasonModal';
import { BidMatchRateDisplay } from './BidMatchRateDisplay';

interface BidListProps {
  filters?: BidFilters;
  sort?: SortOptions;
  onBidSelect?: (bid: Bid) => void;
  onRebid?: (bid: Bid) => void;
}

export const BidList: React.FC<BidListProps> = ({ filters, sort, onBidSelect, onRebid }) => {
  const [page, setPage] = React.useState(1);
  const [pageSize] = React.useState(20);
  const [undoAction, setUndoAction] = React.useState<{ bidId: string; previousStatus: BidStatus } | null>(null);
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [rejectionModalOpen, setRejectionModalOpen] = React.useState(false);
  const [selectedBidForRejection, setSelectedBidForRejection] = React.useState<Bid | null>(null);
  const [matchRateDialogOpen, setMatchRateDialogOpen] = React.useState(false);
  const [selectedBidForMatchRate, setSelectedBidForMatchRate] = React.useState<string | null>(null);
  const queryClient = useQueryClient();
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['bids', filters, sort, page, pageSize],
    queryFn: () => apiClient.getBids(filters, sort, { page, pageSize })
  });

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setPage(1);
  }, [filters, sort]);

  const bids = data && 'items' in data ? data.items : (data as Bid[] || []);
  const paginationInfo = data && 'items' in data ? data as PaginatedResponse<Bid> : null;

  // Helper function to check if rebid is allowed for a rejected bid
  const canRebid = React.useCallback((bid: Bid): boolean => {
    // Cannot rebid if this bid has already been rebid
    if (bid.hasBeenRebid) {
      return false;
    }
    
    return true;
  }, []);

  const formatDate = React.useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  }, []);

  const handleMarkRejectedClick = React.useCallback((bid: Bid) => {
    setSelectedBidForRejection(bid);
    setRejectionModalOpen(true);
  }, []);

  const handleMarkRejected = async (reason: RejectionReason) => {
    if (!selectedBidForRejection) return;
    
    try {
      // Store previous status for undo
      setUndoAction({ bidId: selectedBidForRejection.id, previousStatus: selectedBidForRejection.status });
      setSnackbarOpen(true);
      
      await apiClient.markBidRejected(selectedBidForRejection.id, reason);
      setRejectionModalOpen(false);
      setSelectedBidForRejection(null);
      
      // Invalidate queries to refresh data without full page reload
      queryClient.invalidateQueries({ queryKey: ['bids'] });
    } catch (error) {
      console.error('Failed to mark bid as rejected:', error);
      alert('Failed to mark bid as rejected');
    }
  };

  const handleUndo = async () => {
    if (!undoAction) return;
    
    try {
      // Restore previous status
      await apiClient.updateBid(undoAction.bidId, { status: undoAction.previousStatus });
      setUndoAction(null);
      setSnackbarOpen(false);
      
      // Invalidate queries to refresh data without full page reload
      queryClient.invalidateQueries({ queryKey: ['bids'] });
    } catch (error) {
      console.error('Failed to undo action:', error);
      alert('Failed to undo action');
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
    setUndoAction(null);
  };

  const handleResumeCheckerChange = async (bidId: string, resumeChecker: ResumeCheckerType | null) => {
    try {
      await apiClient.updateBid(bidId, { resumeChecker: resumeChecker || undefined });
      queryClient.invalidateQueries({ queryKey: ['bids'] });
    } catch (error) {
      console.error('Failed to update resume checker:', error);
      alert('Failed to update resume checker');
    }
  };

  const handleRestoreBid = async (bidId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to restore this bid? It will be moved back to SUBMITTED status.')) {
      return;
    }

    try {
      await apiClient.restoreBid(bidId);
      queryClient.invalidateQueries({ queryKey: ['bids'] });
      alert('Bid restored successfully');
    } catch (error) {
      console.error('Failed to restore bid:', error);
      alert('Failed to restore bid: ' + (error as Error).message);
    }
  };

  const handleFindSimilarBids = (bidId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedBidForMatchRate(bidId);
    setMatchRateDialogOpen(true);
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
      case BidStatus.INTERVIEW_FAILED:
        return 'warning';
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
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        message="Bid marked as rejected"
        action={
          <Button color="inherit" size="small" onClick={handleUndo}>
            UNDO
          </Button>
        }
      />
      
      <TableContainer component={Paper}>
        <Table sx={{ '& .MuiTableCell-root': { borderRight: '1px solid rgba(224, 224, 224, 1)' } }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'rgba(33, 150, 243, 0.25)' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Company</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Client</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Role</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Origin</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Recruiter</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Interview</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Resume Checker</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>JD</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Resume</TableCell>
              <TableCell sx={{ fontWeight: 'bold', borderRight: 'none' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {bids.map((bid, index) => (
              <TableRow 
                key={bid.id} 
                hover 
                onClick={() => onBidSelect?.(bid)}
                sx={{ 
                  cursor: 'pointer',
                  backgroundColor: index % 2 === 1 ? 'rgba(33, 150, 243, 0.08)' : 'inherit'
                }}
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
                <TableCell>
                  <Chip 
                    label={bid.origin} 
                    color={bid.origin === 'LINKEDIN' ? 'primary' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{bid.recruiter || '-'}</TableCell>
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
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <FormControl size="small" fullWidth>
                    <Select
                      value={bid.resumeChecker || ''}
                      onChange={(e) => handleResumeCheckerChange(bid.id, e.target.value as ResumeCheckerType || null)}
                      displayEmpty
                      sx={{ minWidth: 120 }}
                    >
                      <MenuItem value="">
                        <em>Not set</em>
                      </MenuItem>
                      <MenuItem value={ResumeCheckerType.ATS}>
                        <Chip label="ATS" color="warning" size="small" />
                      </MenuItem>
                      <MenuItem value={ResumeCheckerType.RECRUITER}>
                        <Chip label="Recruiter" color="info" size="small" />
                      </MenuItem>
                    </Select>
                  </FormControl>
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
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      onClick={(e) => handleFindSimilarBids(bid.id, e)}
                      variant="outlined"
                      size="small"
                      color="info"
                    >
                      Similar
                    </Button>
                    {(bid.status === BidStatus.NEW || bid.status === BidStatus.SUBMITTED) && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkRejectedClick(bid);
                        }}
                        variant="contained"
                        size="small"
                        color="error"
                      >
                        Rejected
                      </Button>
                    )}
                    {bid.status === BidStatus.REJECTED && (
                      <>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (canRebid(bid)) {
                              onRebid?.(bid);
                            }
                          }}
                          variant="outlined"
                          size="small"
                          disabled={!canRebid(bid)}
                          title={!canRebid(bid) ? 'Cannot rebid - this bid has already been rebid' : 'Rebid with new resume'}
                        >
                          Rebid
                        </Button>
                        <Button
                          onClick={(e) => handleRestoreBid(bid.id, e)}
                          variant="outlined"
                          size="small"
                          color="success"
                          startIcon={<RestoreIcon />}
                          title="Restore bid to SUBMITTED status"
                        >
                          Restore
                        </Button>
                      </>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {paginationInfo && paginationInfo.totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 2, gap: 2 }}>
          <Pagination 
            count={paginationInfo.totalPages} 
            page={page} 
            onChange={(_, value) => setPage(value)}
            color="primary"
            showFirstButton
            showLastButton
          />
          <Typography variant="body2" color="text.secondary">
            Showing {((page - 1) * pageSize) + 1}-{Math.min(page * pageSize, paginationInfo.total)} of {paginationInfo.total} bids
          </Typography>
        </Box>
      )}
      
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

      <RejectionReasonModal
        open={rejectionModalOpen}
        onClose={() => {
          setRejectionModalOpen(false);
          setSelectedBidForRejection(null);
        }}
        onConfirm={handleMarkRejected}
        companyName={selectedBidForRejection?.company || ''}
        roleName={selectedBidForRejection?.role || ''}
      />

      {selectedBidForMatchRate && (
        <BidMatchRateDisplay
          bidId={selectedBidForMatchRate}
          open={matchRateDialogOpen}
          onClose={() => {
            setMatchRateDialogOpen(false);
            setSelectedBidForMatchRate(null);
          }}
        />
      )}
    </Box>
  );
};
