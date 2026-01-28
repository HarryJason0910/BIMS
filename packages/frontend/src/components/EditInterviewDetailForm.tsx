import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  TextField, Button, Box, Typography, Alert, Paper, Grid
} from '@mui/material';
import { apiClient } from '../api';
import { Interview } from '../api/types';

interface EditInterviewDetailFormProps {
  interview: Interview;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const EditInterviewDetailForm: React.FC<EditInterviewDetailFormProps> = ({ 
  interview, 
  onSuccess, 
  onCancel 
}) => {
  const queryClient = useQueryClient();
  const [detail, setDetail] = useState<string>(interview.detail || '');

  const updateDetailMutation = useMutation({
    mutationFn: (newDetail: string) => apiClient.updateInterview(interview.id, { detail: newDetail }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviews'] });
      onSuccess?.();
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateDetailMutation.mutate(detail);
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Edit Interview Details
      </Typography>
      
      <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
        <Grid container spacing={1}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2"><strong>Company:</strong> {interview.company}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2"><strong>Client:</strong> {interview.client}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2"><strong>Role:</strong> {interview.role}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2"><strong>Type:</strong> {interview.interviewType}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2"><strong>Date:</strong> {new Date(interview.date).toLocaleDateString()}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2"><strong>Status:</strong> {interview.status}</Typography>
          </Grid>
        </Grid>
      </Paper>

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Interview Details"
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              multiline
              rows={8}
              placeholder="Add notes about the interview, what was discussed, feedback, impressions, etc."
              helperText="These details can be edited at any time"
            />
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                type="submit"
                variant="contained"
                disabled={updateDetailMutation.isPending}
              >
                {updateDetailMutation.isPending ? 'Saving...' : 'Save Details'}
              </Button>
              {onCancel && (
                <Button variant="outlined" onClick={onCancel}>
                  Cancel
                </Button>
              )}
            </Box>
          </Grid>

          {updateDetailMutation.isError && (
            <Grid item xs={12}>
              <Alert severity="error">
                Error: {(updateDetailMutation.error as Error).message}
              </Alert>
            </Grid>
          )}

          {updateDetailMutation.isSuccess && (
            <Grid item xs={12}>
              <Alert severity="success">
                Interview details updated successfully!
              </Alert>
            </Grid>
          )}
        </Grid>
      </Box>
    </Box>
  );
};
