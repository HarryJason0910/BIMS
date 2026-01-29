import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  TextField, Button, Box, Typography, Alert, Chip, Stack, Grid,
  FormControl, InputLabel, Select, MenuItem 
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { apiClient } from '../api';
import { ScheduleInterviewRequest, InterviewBase, InterviewType, BidStatus, Role, Interview } from '../api/types';

interface InterviewFormProps {
  baseInterview?: Interview; // Optional: if provided, pre-fill form for next interview
  rescheduleInterview?: Interview; // Optional: if provided, pre-fill form for rescheduling same interview
  onSuccess?: () => void;
  onCancel?: () => void;
}

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
      return null;
    default:
      return null;
  }
};

export const InterviewForm: React.FC<InterviewFormProps> = ({ baseInterview, rescheduleInterview, onSuccess, onCancel }) => {
  const queryClient = useQueryClient();
  
  // Determine which interview to use for pre-filling
  const sourceInterview = rescheduleInterview || baseInterview;
  
  // Check if we're in reschedule mode
  const isRescheduleMode = !!rescheduleInterview;
  
  const [base, setBase] = useState<InterviewBase>(sourceInterview?.base || InterviewBase.BID);
  const [selectedBidId, setSelectedBidId] = useState<string>(sourceInterview?.bidId || '');
  const [formData, setFormData] = useState<ScheduleInterviewRequest>({
    base: sourceInterview?.base || InterviewBase.BID,
    bidId: sourceInterview?.bidId,
    recruiter: sourceInterview?.recruiter || '',
    attendees: rescheduleInterview?.attendees || [], // Pre-fill attendees for reschedule
    interviewType: rescheduleInterview 
      ? rescheduleInterview.interviewType // Keep same type for reschedule
      : baseInterview 
        ? (getNextInterviewType(baseInterview.interviewType) || InterviewType.HR) // Next type for schedule next
        : InterviewType.HR, // Default for new interview
    date: new Date().toISOString().slice(0, 16), // Format: YYYY-MM-DDTHH:mm
    baseInterviewId: baseInterview?.id // Pass the base interview ID if scheduling next (not for reschedule)
  });
  const [attendeeInput, setAttendeeInput] = useState('');
  const [eligibilityMessage, setEligibilityMessage] = useState<string>('');

  const { data: bids } = useQuery({
    queryKey: ['bids'],
    queryFn: () => apiClient.getBids(),
    enabled: base === InterviewBase.BID
  });

  const { data: allInterviews } = useQuery({
    queryKey: ['all-interviews'],
    queryFn: () => apiClient.getInterviews(),
    enabled: base === InterviewBase.BID
  });

  // Filter out bids that already have interviews or are rejected
  const availableBids = React.useMemo(() => {
    if (!bids || !allInterviews) return [];
    
    const bidIdsWithInterviews = new Set(
      allInterviews
        .filter(interview => interview.bidId)
        .map(interview => interview.bidId)
    );
    
    return bids.filter(bid => 
      !bidIdsWithInterviews.has(bid.id) && 
      bid.status !== BidStatus.REJECTED
    );
  }, [bids, allInterviews]);

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
    if (base === InterviewBase.BID && selectedBidId && availableBids) {
      const selectedBid = availableBids.find(b => b.id === selectedBidId);
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
  }, [base, selectedBidId, availableBids]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double submission
    if (scheduleInterviewMutation.isPending) {
      return;
    }
    
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
        {isRescheduleMode ? 'Reschedule Interview' : 'Schedule Interview'}
      </Typography>

      {isRescheduleMode && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Rescheduling interview - only date and attendees can be modified
        </Alert>
      )}

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
            <FormControl fullWidth disabled={isRescheduleMode}>
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
              <FormControl fullWidth required disabled={isRescheduleMode}>
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
                    const selectedBid = availableBids?.find(b => b.id === selected);
                    return selectedBid ? `${selectedBid.company} - ${selectedBid.role} (${new Date(selectedBid.date).toLocaleDateString()})` : '';
                  }}
                >
                  {availableBids && availableBids.length > 0 ? (
                    availableBids.map(bid => (
                      <MenuItem key={bid.id} value={bid.id}>
                        {bid.company} - {bid.role} ({new Date(bid.date).toLocaleDateString()})
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>No bids available (all bids already have interviews)</MenuItem>
                  )}
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
                  disabled={isRescheduleMode}
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
                  disabled={isRescheduleMode}
                />
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth required disabled={isRescheduleMode}>
                  <InputLabel>Role</InputLabel>
                  <Select
                    name="role"
                    value={formData.role || ''}
                    label="Role"
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    {Object.values(Role).map((role) => (
                      <MenuItem key={role} value={role}>
                        {role}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
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
              disabled={isRescheduleMode}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required disabled={isRescheduleMode}>
              <InputLabel>Interview Type</InputLabel>
              <Select
                name="interviewType"
                value={formData.interviewType}
                label="Interview Type"
                onChange={(e) => setFormData({ ...formData, interviewType: e.target.value as InterviewType })}
              >
                <MenuItem value={InterviewType.HR}>HR</MenuItem>
                <MenuItem value={InterviewType.TECH_INTERVIEW_1}>Tech Interview 1</MenuItem>
                <MenuItem value={InterviewType.TECH_INTERVIEW_2}>Tech Interview 2</MenuItem>
                <MenuItem value={InterviewType.TECH_INTERVIEW_3}>Tech Interview 3</MenuItem>
                <MenuItem value={InterviewType.FINAL_INTERVIEW}>Final Interview</MenuItem>
                <MenuItem value={InterviewType.CLIENT_INTERVIEW}>Client Interview</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <Box>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  fullWidth
                  label={formData.interviewType === InterviewType.HR ? "Attendees (Optional for HR)" : "Attendees"}
                  value={attendeeInput}
                  onChange={(e) => setAttendeeInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddAttendee();
                    }
                  }}
                  placeholder="Add an attendee"
                  helperText={formData.interviewType === InterviewType.HR ? "HR interviews typically don't require attendees" : "Add names of people who will attend the interview"}
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
              label="Interview Date & Time"
              name="date"
              type="datetime-local"
              value={formData.date}
              onChange={handleChange}
              required
              InputLabelProps={{ shrink: true }}
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
