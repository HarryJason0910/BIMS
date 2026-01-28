import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  TextField, Button, Box, Typography, Alert, Paper,
  Radio, RadioGroup, FormControlLabel, FormControl, FormLabel, Grid
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import { apiClient } from '../api';
import { Interview, CompleteInterviewRequest } from '../api/types';

interface CompleteInterviewFormProps {
  interview: Interview;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const CompleteInterviewForm: React.FC<CompleteInterviewFormProps> = ({ 
  interview, 
  onSuccess, 
  onCancel 
}) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<CompleteInterviewRequest>({
    success: true,
    detail: interview.detail || ''
  });

  const completeInterviewMutation = useMutation({
    mutationFn: (data: CompleteInterviewRequest) => apiClient.completeInterview(interview.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviews'] });
      queryClient.invalidateQueries({ queryKey: ['bids'] });
      onSuccess?.();
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    completeInterviewMutation.mutate(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Complete Interview
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
            <Typography variant="body2"><strong>Recruiter:</strong> {interview.recruiter}</Typography>
          </Grid>
          {interview.attendees.length > 0 && (
            <Grid item xs={12}>
              <Typography variant="body2"><strong>Attendees:</strong> {interview.attendees.join(', ')}</Typography>
            </Grid>
          )}
        </Grid>
      </Paper>

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <FormControl component="fieldset">
              <FormLabel component="legend">Outcome *</FormLabel>
              <RadioGroup
                row
                value={formData.success}
                onChange={(e) => setFormData({ ...formData, success: e.target.value === 'true' })}
              >
                <FormControlLabel 
                  value={true} 
                  control={<Radio />} 
                  label="Success" 
                />
                <FormControlLabel 
                  value={false} 
                  control={<Radio />} 
                  label="Failure" 
                />
              </RadioGroup>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Interview Details (Notes)"
              name="detail"
              value={formData.detail}
              onChange={handleChange}
              multiline
              rows={6}
              placeholder="Add notes about the interview outcome, feedback, next steps, what was discussed, etc."
              helperText="Add or edit details about this interview"
            />
          </Grid>

          {!formData.success && (
            <Grid item xs={12}>
              <Alert severity="warning" icon={<WarningIcon />}>
                <Typography variant="subtitle2" gutterBottom>
                  Marking this interview as failed will:
                </Typography>
                <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                  <li>Record the failure in company history</li>
                  <li>Prevent future interviews with the same recruiter and overlapping attendees</li>
                </ul>
              </Alert>
            </Grid>
          )}

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                type="submit"
                variant="contained"
                disabled={completeInterviewMutation.isPending}
              >
                {completeInterviewMutation.isPending ? 'Completing...' : 'Complete Interview'}
              </Button>
              {onCancel && (
                <Button variant="outlined" onClick={onCancel}>
                  Cancel
                </Button>
              )}
            </Box>
          </Grid>

          {completeInterviewMutation.isError && (
            <Grid item xs={12}>
              <Alert severity="error">
                Error: {(completeInterviewMutation.error as Error).message}
              </Alert>
            </Grid>
          )}

          {completeInterviewMutation.isSuccess && (
            <Grid item xs={12}>
              <Alert severity="success">
                Interview completed successfully!
              </Alert>
            </Grid>
          )}
        </Grid>
      </Box>
    </Box>
  );
};
