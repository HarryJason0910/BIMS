import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  TextField, Button, Box, Typography, Alert, Chip, Stack, Grid 
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { apiClient } from '../api';
import { CreateBidRequest } from '../api/types';

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
    jobDescription: ''
  });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [stackInput, setStackInput] = useState('');

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

  const handleAddStack = () => {
    if (stackInput.trim()) {
      setFormData({
        ...formData,
        mainStacks: [...formData.mainStacks, stackInput.trim()]
      });
      setStackInput('');
    }
  };

  const handleRemoveStack = (stackToRemove: string) => {
    setFormData({
      ...formData,
      mainStacks: formData.mainStacks.filter(stack => stack !== stackToRemove)
    });
  };

  const isValid = formData.link && formData.company && formData.client && 
                  formData.role && formData.jobDescription && resumeFile;

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

          <Grid item xs={12}>
            <Box>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  fullWidth
                  label="Main Stacks"
                  value={stackInput}
                  onChange={(e) => setStackInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddStack();
                    }
                  }}
                  placeholder="Add a technology stack"
                />
                <Button 
                  variant="outlined" 
                  onClick={handleAddStack}
                  startIcon={<AddIcon />}
                >
                  Add
                </Button>
              </Box>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {formData.mainStacks.map((stack, index) => (
                  <Chip
                    key={index}
                    label={stack}
                    onDelete={() => handleRemoveStack(stack)}
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
