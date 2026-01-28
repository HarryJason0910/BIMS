import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { 
  TextField, Button, Box, Typography, Alert, Paper, Link as MuiLink, Grid,
  List, ListItem, ListItemText, ListItemButton, Chip, CircularProgress, Divider
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { apiClient } from '../api';
import { Bid, RebidRequest } from '../api/types';

interface RebidFormProps {
  bid: Bid;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const RebidForm: React.FC<RebidFormProps> = ({ bid, onSuccess, onCancel }) => {
  const queryClient = useQueryClient();
  const [jobDescription, setJobDescription] = useState<string>(bid.jobDescriptionPath);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);

  // Fetch candidate resumes based on stack matching
  const { data: candidateData, isLoading: loadingCandidates } = useQuery({
    queryKey: ['candidateResumes', bid.id],
    queryFn: () => apiClient.getCandidateResumes(bid.id)
  });

  const rebidMutation = useMutation({
    mutationFn: (data: RebidRequest) => apiClient.rebid(bid.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bids'] });
      onSuccess?.();
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (resumeFile) {
      rebidMutation.mutate({
        resumeFile,
        jobDescription: jobDescription || undefined
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        alert('Please upload a PDF file');
        return;
      }
      setResumeFile(file);
      setSelectedCandidate(null); // Clear candidate selection when uploading new file
    }
  };

  const handleDownloadCandidate = async (resumePath: string) => {
    try {
      const blob = await apiClient.downloadResumeByPath(resumePath);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = resumePath.split('/').pop() || 'resume.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download resume');
    }
  };

  const handleSelectCandidate = async (resumePath: string) => {
    try {
      // Download the resume and convert to File object
      const blob = await apiClient.downloadResumeByPath(resumePath);
      const fileName = resumePath.split('/').pop() || 'resume.pdf';
      const file = new File([blob], fileName, { type: 'application/pdf' });
      setResumeFile(file);
      setSelectedCandidate(resumePath);
    } catch (error) {
      console.error('Failed to select candidate:', error);
      alert('Failed to select candidate resume');
    }
  };

  const isValid = resumeFile !== null;

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Rebid: {bid.company} - {bid.role}
      </Typography>
      
      <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
        <Grid container spacing={1}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2"><strong>Original Bid Date:</strong> {new Date(bid.date).toLocaleDateString()}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2"><strong>Company:</strong> {bid.company}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2"><strong>Client:</strong> {bid.client}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2"><strong>Role:</strong> {bid.role}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body2">
              <strong>Link:</strong>{' '}
              <MuiLink href={bid.link} target="_blank" rel="noopener noreferrer">
                {bid.link}
              </MuiLink>
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Grid container spacing={2}>
          {/* Candidate Resumes Section */}
          {candidateData && candidateData.candidates.length > 0 && (
            <Grid item xs={12}>
              <Paper sx={{ p: 2, bgcolor: 'info.lighter' }}>
                <Typography variant="h6" gutterBottom>
                  Candidate Resumes (Based on Stack Matching)
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Select a resume from previous bids with matching tech stacks, or upload a new one below.
                </Typography>
                {loadingCandidates ? (
                  <Box display="flex" justifyContent="center" p={2}>
                    <CircularProgress size={24} />
                  </Box>
                ) : (
                  <List sx={{ maxHeight: '400px', overflow: 'auto' }}>
                    {candidateData.candidates.map((candidate, index) => (
                      <React.Fragment key={candidate.resumePath}>
                        <ListItem
                          disablePadding
                          secondaryAction={
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Button
                                size="small"
                                startIcon={<DownloadIcon />}
                                onClick={() => handleDownloadCandidate(candidate.resumePath)}
                              >
                                Download
                              </Button>
                              <Button
                                size="small"
                                variant={selectedCandidate === candidate.resumePath ? 'contained' : 'outlined'}
                                startIcon={selectedCandidate === candidate.resumePath ? <CheckCircleIcon /> : null}
                                onClick={() => handleSelectCandidate(candidate.resumePath)}
                              >
                                {selectedCandidate === candidate.resumePath ? 'Selected' : 'Use This'}
                              </Button>
                            </Box>
                          }
                        >
                          <ListItemButton onClick={() => handleSelectCandidate(candidate.resumePath)}>
                            <ListItemText
                              primary={candidate.folderName}
                              secondary={
                                <Box sx={{ mt: 0.5 }}>
                                  <Typography variant="caption" display="block">
                                    Matching Stacks ({candidate.matchCount}):
                                  </Typography>
                                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                                    {candidate.matchingStacks.map((stack, idx) => (
                                      <Chip key={idx} label={stack} size="small" color="primary" />
                                    ))}
                                  </Box>
                                </Box>
                              }
                            />
                          </ListItemButton>
                        </ListItem>
                        {index < candidateData.candidates.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </Paper>
            </Grid>
          )}

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Job Description (Optional - Update if changed)"
              name="jobDescription"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              multiline
              rows={6}
            />
          </Grid>

          <Grid item xs={12}>
            <Box>
              <Typography variant="body2" gutterBottom>
                {candidateData && candidateData.candidates.length > 0 
                  ? 'Or Upload New Resume (PDF)' 
                  : 'New Resume (PDF) *'}
              </Typography>
              <Button
                variant="outlined"
                component="label"
                fullWidth
                sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
              >
                {resumeFile ? resumeFile.name : 'Choose PDF file'}
                <input
                  type="file"
                  accept=".pdf"
                  hidden
                  onChange={handleFileChange}
                />
              </Button>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                type="submit"
                variant="contained"
                disabled={!isValid || rebidMutation.isPending}
              >
                {rebidMutation.isPending ? 'Submitting...' : 'Submit Rebid'}
              </Button>
              {onCancel && (
                <Button variant="outlined" onClick={onCancel}>
                  Cancel
                </Button>
              )}
            </Box>
          </Grid>

          {rebidMutation.isError && (
            <Grid item xs={12}>
              <Alert severity="error">
                Error: {(rebidMutation.error as Error).message}
              </Alert>
            </Grid>
          )}

          {rebidMutation.isSuccess && (
            <Grid item xs={12}>
              <Alert severity="success">
                Rebid submitted successfully!
              </Alert>
            </Grid>
          )}
        </Grid>
      </Box>
    </Box>
  );
};
