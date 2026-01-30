import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  TextField, Button, Box, Typography, Alert, Chip, Stack, Grid, FormControl, InputLabel, Select, MenuItem, ToggleButton, ToggleButtonGroup
} from '@mui/material';
import { apiClient } from '../api';
import { CreateBidRequest, BidOrigin, Role } from '../api/types';
import { ResumeSelector } from './ResumeSelector';

interface BidFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

type InputMode = 'upload' | 'select';

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
  const [inputMode, setInputMode] = useState<InputMode>('upload');
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [stacksInput, setStacksInput] = useState<string>('');
  const [stacksError, setStacksError] = useState<string>('');

  const createBidMutation = useMutation({
    mutationFn: (data: CreateBidRequest) => apiClient.createBid(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bids'] });
      onSuccess?.();
    }
  });

  /**
   * Parse tech stacks from text input
   * Supports:
   * 1. Comma-separated: "java, spring boot, aws"
   * 2. JSON array: ["java", "spring boot", "aws"]
   */
  const parseStacksInput = (input: string): string[] => {
    const trimmed = input.trim();
    if (!trimmed) return [];

    // Try to parse as JSON array first
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed
            .map(item => String(item).trim())
            .filter(item => item.length > 0);
        }
      } catch (e) {
        // If JSON parsing fails, fall through to comma-separated parsing
      }
    }

    // Parse as comma-separated values
    return trimmed
      .split(',')
      .map(stack => stack.trim())
      .filter(stack => stack.length > 0);
  };

  const handleStacksInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setStacksInput(input);
    setStacksError('');

    try {
      const parsed = parseStacksInput(input);
      setFormData({
        ...formData,
        mainStacks: parsed
      });
    } catch (error) {
      setStacksError('Invalid format. Use comma-separated or JSON array format.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Submit with either uploaded file or selected resume ID
    if (resumeFile || selectedResumeId) {
      createBidMutation.mutate({
        ...formData,
        resumeFile: resumeFile || undefined,
        resumeId: selectedResumeId || undefined
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
      setSelectedResumeId(null); // Clear selected resume when uploading
    }
  };

  const handleModeChange = (_event: React.MouseEvent<HTMLElement>, newMode: InputMode | null) => {
    console.log('[BidForm] Mode change requested:', newMode);
    if (newMode !== null) {
      setInputMode(newMode);
      // Clear opposite input when switching modes
      if (newMode === 'upload') {
        setSelectedResumeId(null);
      } else {
        setResumeFile(null);
      }
      console.log('[BidForm] Mode changed to:', newMode, 'Tech stack:', formData.mainStacks);
    }
  };

  const handleResumeSelected = (resumeId: string) => {
    setSelectedResumeId(resumeId);
    setResumeFile(null); // Clear uploaded file when selecting resume
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };



  const isValid = formData.link && formData.company && formData.client && 
                  formData.role && formData.jobDescription && (resumeFile || selectedResumeId) &&
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
            <FormControl fullWidth required>
              <InputLabel>Role</InputLabel>
              <Select
                name="role"
                value={formData.role}
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
            <TextField
              fullWidth
              label="Main Stacks"
              name="mainStacks"
              value={stacksInput}
              onChange={handleStacksInputChange}
              required
              multiline
              rows={3}
              placeholder='Enter skills as comma-separated or JSON array:&#10;Examples:&#10;  java, spring boot, aws, docker&#10;  ["java", "spring boot", "aws", "docker"]'
              error={!!stacksError}
              helperText={
                stacksError || 
                (formData.mainStacks.length > 0 
                  ? `Parsed ${formData.mainStacks.length} skill${formData.mainStacks.length !== 1 ? 's' : ''}: ${formData.mainStacks.join(', ')}`
                  : 'Paste skills from ChatGPT or enter manually')
              }
            />
            {formData.mainStacks.length > 0 && (
              <Box sx={{ mt: 1 }}>
                <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                  {formData.mainStacks.map((stack, index) => (
                    <Chip
                      key={index}
                      label={stack}
                      color="primary"
                      size="small"
                      sx={{ mb: 0.5 }}
                    />
                  ))}
                </Stack>
              </Box>
            )}
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
              <Typography variant="body2" gutterBottom sx={{ mb: 1 }}>
                Resume (PDF) *
              </Typography>
              
              {/* Input Mode Toggle */}
              <ToggleButtonGroup
                value={inputMode}
                exclusive
                onChange={handleModeChange}
                aria-label="resume input mode"
                fullWidth
                sx={{ mb: 2 }}
              >
                <ToggleButton value="upload" aria-label="upload new resume">
                  Upload New Resume
                </ToggleButton>
                <ToggleButton 
                  value="select" 
                  aria-label="select from history"
                  disabled={formData.mainStacks.length === 0}
                >
                  Select from History
                </ToggleButton>
              </ToggleButtonGroup>

              {/* Conditional Rendering Based on Mode */}
              {inputMode === 'upload' ? (
                <Button
                  variant="outlined"
                  component="label"
                  fullWidth
                  sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                  disabled={selectedResumeId !== null}
                >
                  {resumeFile ? resumeFile.name : 'Choose PDF file'}
                  <input
                    type="file"
                    accept=".pdf"
                    hidden
                    onChange={handleFileChange}
                  />
                </Button>
              ) : (
                <ResumeSelector
                  techStack={formData.mainStacks}
                  onResumeSelected={handleResumeSelected}
                  disabled={formData.mainStacks.length === 0}
                />
              )}
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
