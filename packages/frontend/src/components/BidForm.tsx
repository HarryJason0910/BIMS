import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { 
  TextField, Button, Box, Typography, Alert, Chip, Stack, Grid, FormControl, InputLabel, Select, MenuItem, Autocomplete
} from '@mui/material';
import { apiClient } from '../api';
import { CreateBidRequest, BidOrigin } from '../api/types';

interface BidFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const BidForm: React.FC<BidFormProps> = ({ onSuccess, onCancel }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Omit<CreateBidRequest, 'resumeFile'>>({
    link: '',
    company: '',
    client: '',
    role: '',
    mainStacks: [],
    jobDescription: '',
    origin: BidOrigin.BID,
    recruiter: ''
  });
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  // Fetch available tech stacks
  const { data: availableStacks = [] } = useQuery({
    queryKey: ['techStacks'],
    queryFn: () => apiClient.getTechStacks()
  });

  const createBidMutation = useMutation({
    mutationFn: (data: CreateBidRequest) => apiClient.createBid(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bids'] });
      onSuccess?.();
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (resumeFile) {
      createBidMutation.mutate({
        ...formData,
        resumeFile
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };



  const isValid = formData.link && formData.company && formData.client && 
                  formData.role && formData.jobDescription && resumeFile &&
                  (formData.origin === BidOrigin.BID || (formData.origin === BidOrigin.LINKEDIN && formData.recruiter));

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Create New Bid
      </Typography>

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Job Link"
              name="link"
              type="url"
              value={formData.link}
              onChange={handleChange}
              required
              placeholder="https://..."
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Company"
              name="company"
              value={formData.company}
              onChange={handleChange}
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Client"
              name="client"
              value={formData.client}
              onChange={handleChange}
              required
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Origin</InputLabel>
              <Select
                name="origin"
                value={formData.origin}
                label="Origin"
                onChange={(e) => setFormData({ ...formData, origin: e.target.value as BidOrigin, recruiter: '' })}
              >
                <MenuItem value={BidOrigin.BID}>Bid</MenuItem>
                <MenuItem value={BidOrigin.LINKEDIN}>LinkedIn</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Recruiter"
              name="recruiter"
              value={formData.recruiter}
              onChange={handleChange}
              required={formData.origin === BidOrigin.LINKEDIN}
              disabled={formData.origin === BidOrigin.BID}
              placeholder={formData.origin === BidOrigin.LINKEDIN ? "Recruiter name" : "Not applicable"}
            />
          </Grid>

          <Grid item xs={12}>
            <Autocomplete
              multiple
              options={availableStacks}
              value={formData.mainStacks}
              onChange={(_, newValue) => {
                setFormData({
                  ...formData,
                  mainStacks: newValue
                });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Main Stacks"
                  placeholder="Select tech stacks"
                  required={formData.mainStacks.length === 0}
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    label={option}
                    {...getTagProps({ index })}
                    color="primary"
                    size="small"
                  />
                ))
              }
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Job Description"
              name="jobDescription"
              value={formData.jobDescription}
              onChange={handleChange}
              required
              multiline
              rows={6}
            />
          </Grid>

          <Grid item xs={12}>
            <Box>
              <Typography variant="body2" gutterBottom>
                Resume (PDF) *
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
                disabled={!isValid || createBidMutation.isPending}
              >
                {createBidMutation.isPending ? 'Creating...' : 'Create Bid'}
              </Button>
              {onCancel && (
                <Button variant="outlined" onClick={onCancel}>
                  Cancel
                </Button>
              )}
            </Box>
          </Grid>

          {createBidMutation.isError && (
            <Grid item xs={12}>
              <Alert severity="error">
                Error: {(createBidMutation.error as Error).message}
              </Alert>
            </Grid>
          )}
        </Grid>
      </Box>
    </Box>
  );
};
