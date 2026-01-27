import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  TextField, Button, Box, Typography, Alert, Chip, Stack, Grid,
  FormControl, InputLabel, Select, MenuItem 
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { apiClient } from '../api';
import { ScheduleInterviewRequest, InterviewBase } from '../api/types';

interface InterviewFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const InterviewForm: React.FC<InterviewFormProps> = ({ onSuccess, onCancel }) => {
  const queryClient = useQueryClient();
  const [base, setBase] = useState<InterviewBase>(InterviewBase.BID);
  const [selectedBidId, setSelectedBidId] = useState<string>('');
  const [formData, setFormData] = useState<ScheduleInterviewRequest>({
    base: InterviewBase.BID,
    recruiter: '',
    attendees: [],
    interviewType: '',
    date: new Date().toISOString().split('T')[0],
    detail: ''
  });
  const [attendeeInput, setAttendeeInput] = useState('');
  const [eligibilityMessage, setEligibilityMessage] = useState<string>('');

  const { data: bids } = useQuery({
    queryKey: ['bids'],
    queryFn: () => apiClient.getBids(),
    enabled: base === InterviewBase.BID
  });

  const scheduleInterviewMutation = useMutation({
    mutationFn: (data: ScheduleInterviewRequest) => apiClient.scheduleInterview(data),
    onSuccess: (response) => {
      setEligibilityMessage(response.eligibilityResult.reason);
      queryClient.invalidateQueries({ queryKey: ['interviews'] });
      queryClient.invalidateQueries({ queryKey: ['bids'] });
      if (response.eligibilityResult.allowed) {
        setTimeout(() => onSuccess?.(), 1500);
      }
    }
  });

  useEffect(() => {
    if (base === InterviewBase.BID && selectedBidId && bids) {
      const selectedBid = bids.find(b => b.id === selectedBidId);
      if (selectedBid) {
        setFormData(prev => ({
          ...prev,
          base: InterviewBase.BID,
          bidId: selectedBidId,
          company: selectedBid.company,
          client: selectedBid.client,
          role: selectedBid.role
        }));
      }
    } else if (base === InterviewBase.LINKEDIN_CHAT) {
      setFormData(prev => ({
        ...prev,
        base: InterviewBase.LINKEDIN_CHAT,
        bidId: undefined
      }));
    }
  }, [base, selectedBidId, bids]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    scheduleInterviewMutation.mutate(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAddAttendee = () => {
    if (attendeeInput.trim()) {
      setFormData({
        ...formData,
        attendees: [...formData.attendees, attendeeInput.trim()]
      });
      setAttendeeInput('');
    }
  };

  const handleRemoveAttendee = (attendeeToRemove: string) => {
    setFormData({
      ...formData,
      attendees: formData.attendees.filter(a => a !== attendeeToRemove)
    });
  };

  const isValid = formData.recruiter && formData.interviewType && formData.date &&
    (base === InterviewBase.LINKEDIN_CHAT ? (formData.company && formData.client && formData.role) : selectedBidId);

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Schedule Interview
      </Typography>

      {eligibilityMessage && (
        <Alert 
          severity={scheduleInterviewMutation.data?.eligibilityResult.allowed ? 'success' : 'warning'}
          sx={{ mb: 2 }}
        >
          {eligibilityMessage}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Interview Base</InputLabel>
              <Select
                value={base}
                label="Interview Base"
                onChange={(e) => setBase(e.target.value as InterviewBase)}
              >
                <MenuItem value={InterviewBase.BID}>From Bid</MenuItem>
                <MenuItem value={InterviewBase.LINKEDIN_CHAT}>LinkedIn Chat</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {base === InterviewBase.BID && (
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Select Bid</InputLabel>
                <Select
                  value={selectedBidId}
                  label="Select Bid"
                  onChange={(e) => setSelectedBidId(e.target.value)}
                  displayEmpty
                  renderValue={(selected) => {
                    if (!selected) {
                      return <span style={{ color: '#9e9e9e' }}>Select Bid</span>;
                    }
                    const selectedBid = bids?.find(b => b.id === selected);
                    return selectedBid ? `${selectedBid.company} - ${selectedBid.role} (${new Date(selectedBid.date).toLocaleDateString()})` : '';
                  }}
                >
                  {bids?.map(bid => (
                    <MenuItem key={bid.id} value={bid.id}>
                      {bid.company} - {bid.role} ({new Date(bid.date).toLocaleDateString()})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}

          {base === InterviewBase.LINKEDIN_CHAT && (
            <>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Company"
                  name="company"
                  value={formData.company || ''}
                  onChange={handleChange}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Client"
                  name="client"
                  value={formData.client || ''}
                  onChange={handleChange}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Role"
                  name="role"
                  value={formData.role || ''}
                  onChange={handleChange}
                  required
                />
              </Grid>
            </>
          )}

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Recruiter"
              name="recruiter"
              value={formData.recruiter}
              onChange={handleChange}
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Interview Type"
              name="interviewType"
              value={formData.interviewType}
              onChange={handleChange}
              required
              placeholder="e.g., HR, Technical, Final"
            />
          </Grid>

          <Grid item xs={12}>
            <Box>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  fullWidth
                  label="Attendees"
                  value={attendeeInput}
                  onChange={(e) => setAttendeeInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddAttendee();
                    }
                  }}
                  placeholder="Add an attendee"
                />
                <Button 
                  variant="outlined" 
                  onClick={handleAddAttendee}
                  startIcon={<AddIcon />}
                >
                  Add
                </Button>
              </Box>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {formData.attendees.map((attendee, index) => (
                  <Chip
                    key={index}
                    label={attendee}
                    onDelete={() => handleRemoveAttendee(attendee)}
                    color="primary"
                    sx={{ mb: 1 }}
                  />
                ))}
              </Stack>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Interview Date"
              name="date"
              type="date"
              value={formData.date}
              onChange={handleChange}
              required
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Details"
              name="detail"
              value={formData.detail}
              onChange={handleChange}
              multiline
              rows={4}
              placeholder="Additional notes about the interview"
            />
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                type="submit"
                variant="contained"
                disabled={!isValid || scheduleInterviewMutation.isPending}
              >
                {scheduleInterviewMutation.isPending ? 'Scheduling...' : 'Schedule Interview'}
              </Button>
              {onCancel && (
                <Button variant="outlined" onClick={onCancel}>
                  Cancel
                </Button>
              )}
            </Box>
          </Grid>

          {scheduleInterviewMutation.isError && (
            <Grid item xs={12}>
              <Alert severity="error">
                Error: {(scheduleInterviewMutation.error as Error).message}
              </Alert>
            </Grid>
          )}
        </Grid>
      </Box>
    </Box>
  );
};
