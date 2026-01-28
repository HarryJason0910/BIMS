import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  TextField, Button, Box, Typography, Alert, Paper, Link as MuiLink, Grid
} from '@mui/material';
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
                New Resume (PDF) *
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
