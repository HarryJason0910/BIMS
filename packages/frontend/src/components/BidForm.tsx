import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  TextField, Button, Box, Typography, Alert, Chip, Stack, Grid, FormControl, InputLabel, Select, MenuItem, ToggleButton, ToggleButtonGroup
} from '@mui/material';
import { apiClient } from '../api';
import { CreateBidRequest, BidOrigin, LayerWeights, LayerSkills, SkillWeight, TechLayer } from '../api/types';
import { ResumeSelector } from './ResumeSelector';
import { RoleSelector } from './RoleSelector';
import { LayerWeightsEditor } from './LayerWeightsEditor';

interface BidFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

type InputMode = 'upload' | 'select';

// Default layer weights (will be overridden by role selection)
const DEFAULT_LAYER_WEIGHTS: LayerWeights = {
  frontend: 0.25,
  backend: 0.40,
  database: 0.15,
  cloud: 0.10,
  devops: 0.05,
  others: 0.05
};

// Role to layer weights mapping (matches backend ROLE_LAYER_WEIGHTS)
const ROLE_LAYER_WEIGHTS: Record<string, LayerWeights> = {
  'Software Engineer': { frontend: 0.25, backend: 0.40, database: 0.15, cloud: 0.10, devops: 0.05, others: 0.05 },
  'Backend Engineer': { frontend: 0.05, backend: 0.60, database: 0.20, cloud: 0.10, devops: 0.05, others: 0.00 },
  'Frontend Developer': { frontend: 0.70, backend: 0.10, database: 0.05, cloud: 0.05, devops: 0.05, others: 0.05 },
  'Balanced Full Stack Engineer': { frontend: 0.35, backend: 0.35, database: 0.15, cloud: 0.10, devops: 0.05, others: 0.00 },
  'Frontend Heavy Full Stack Engineer': { frontend: 0.50, backend: 0.25, database: 0.10, cloud: 0.10, devops: 0.05, others: 0.00 },
  'Backend Heavy Full Stack Engineer': { frontend: 0.25, backend: 0.50, database: 0.15, cloud: 0.05, devops: 0.05, others: 0.00 },
  'QA Automation Engineer': { frontend: 0.20, backend: 0.30, database: 0.10, cloud: 0.10, devops: 0.20, others: 0.10 },
  'DevOps Engineer': { frontend: 0.00, backend: 0.15, database: 0.10, cloud: 0.40, devops: 0.35, others: 0.00 },
  'Data Engineer': { frontend: 0.00, backend: 0.30, database: 0.50, cloud: 0.15, devops: 0.05, others: 0.00 },
  'Mobile Developer': { frontend: 0.60, backend: 0.15, database: 0.10, cloud: 0.10, devops: 0.00, others: 0.05 }
};

// Extract basic title from full role string (remove seniority prefix)
function extractBasicTitle(role: string): string {
  const seniorities = ['Junior', 'Mid', 'Senior', 'Lead', 'Staff'];
  for (const seniority of seniorities) {
    if (role.startsWith(seniority + ' ')) {
      return role.substring(seniority.length + 1);
    }
  }
  return role;
}

// Get default layer weights for a role
function getDefaultLayerWeights(role: string): LayerWeights {
  const basicTitle = extractBasicTitle(role);
  return ROLE_LAYER_WEIGHTS[basicTitle] || DEFAULT_LAYER_WEIGHTS;
}

export const BidForm: React.FC<BidFormProps> = ({ onSuccess, onCancel }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Omit<CreateBidRequest, 'resumeFile'>>({
    link: '',
    company: '',
    client: '',
    role: '',
    mainStacks: {} as LayerSkills, // Use LayerSkills format
    layerWeights: DEFAULT_LAYER_WEIGHTS,
    jobDescription: '',
    origin: BidOrigin.BID,
    recruiter: ''
  });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [inputMode, setInputMode] = useState<InputMode>('upload');
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [stacksInput, setStacksInput] = useState<string>('');
  const [stacksError, setStacksError] = useState<string>('');

  // Update layer weights when role changes
  useEffect(() => {
    if (formData.role) {
      const defaultWeights = getDefaultLayerWeights(formData.role);
      setFormData(prev => ({
        ...prev,
        layerWeights: defaultWeights
      }));
    }
  }, [formData.role]);

  const createBidMutation = useMutation({
    mutationFn: (data: CreateBidRequest) => apiClient.createBid(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bids'] });
      onSuccess?.();
    }
  });

  /**
   * Parse tech stacks from text input
   * Supports weighted skills format:
   * {
   *   "frontend": [{ "skill": "react", "weight": 0.5 }, ...],
   *   "backend": [...],
   *   ...
   * }
   */
  const parseStacksInput = (input: string): LayerSkills | null => {
    const trimmed = input.trim();
    if (!trimmed) return null;

    try {
      const parsed = JSON.parse(trimmed);
      
      // Validate structure
      if (typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('Must be an object with layer keys');
      }
      
      const requiredLayers: TechLayer[] = ['frontend', 'backend', 'database', 'cloud', 'devops', 'others'];
      
      // Check all required keys exist
      for (const layer of requiredLayers) {
        if (!(layer in parsed)) {
          throw new Error(`Missing required layer: ${layer}`);
        }
        
        if (!Array.isArray(parsed[layer])) {
          throw new Error(`Layer ${layer} must be an array`);
        }
        
        // Validate each skill in the layer
        for (const item of parsed[layer]) {
          if (typeof item !== 'object' || !item.skill || typeof item.weight !== 'number') {
            throw new Error(`Each skill must have {skill: string, weight: number} format in layer ${layer}`);
          }
        }
        
        // Validate weights sum to 1.0 (or layer is empty)
        if (parsed[layer].length > 0) {
          const sum = parsed[layer].reduce((acc: number, item: SkillWeight) => acc + item.weight, 0);
          if (Math.abs(sum - 1.0) > 0.001) {
            throw new Error(`Skill weights in ${layer} layer must sum to 1.0 (current: ${sum.toFixed(3)})`);
          }
        }
      }
      
      return parsed as LayerSkills;
    } catch (error) {
      throw error;
    }
  };

  const handleStacksInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setStacksInput(input);
    setStacksError('');

    if (!input.trim()) {
      setFormData({
        ...formData,
        mainStacks: {} as LayerSkills
      });
      return;
    }

    try {
      const parsed = parseStacksInput(input);
      if (parsed) {
        setFormData({
          ...formData,
          mainStacks: parsed
        });
      }
    } catch (error) {
      setStacksError((error as Error).message);
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

  const handleRoleChange = (role: string) => {
    setFormData({
      ...formData,
      role
    });
  };

  const handleLayerWeightsChange = (weights: LayerWeights) => {
    setFormData({
      ...formData,
      layerWeights: weights
    });
  };

  // Helper to check if mainStacks is valid
  const hasValidMainStacks = (): boolean => {
    if (!formData.mainStacks || typeof formData.mainStacks !== 'object') return false;
    
    const layers: TechLayer[] = ['frontend', 'backend', 'database', 'cloud', 'devops', 'others'];
    return layers.every(layer => layer in formData.mainStacks);
  };

  // Helper to get all skills as flat array for display
  const getAllSkills = (): string[] => {
    if (!hasValidMainStacks()) return [];
    
    const skills: string[] = [];
    const layers: TechLayer[] = ['frontend', 'backend', 'database', 'cloud', 'devops', 'others'];
    
    for (const layer of layers) {
      const layerSkills = (formData.mainStacks as LayerSkills)[layer];
      if (Array.isArray(layerSkills)) {
        skills.push(...layerSkills.map((s: SkillWeight) => s.skill));
      }
    }
    
    return skills;
  };

  const isValid = formData.link && formData.company && formData.client && 
                  formData.role && formData.jobDescription && (resumeFile || selectedResumeId) &&
                  hasValidMainStacks() &&
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
            <RoleSelector
              value={formData.role}
              onChange={handleRoleChange}
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
            <TextField
              fullWidth
              label="Main Stacks (JSON Object with Weights from ChatGPT)"
              name="mainStacks"
              value={stacksInput}
              onChange={handleStacksInputChange}
              required
              multiline
              rows={15}
              placeholder={`Paste JSON object from ChatGPT:
{
  "frontend": [
    { "skill": "react", "weight": 0.5 },
    { "skill": "typescript", "weight": 0.3 },
    { "skill": "javascript", "weight": 0.2 }
  ],
  "backend": [
    { "skill": "python", "weight": 0.4 },
    { "skill": "fastapi", "weight": 0.6 }
  ],
  "database": [
    { "skill": "postgresql", "weight": 1.0 }
  ],
  "cloud": [
    { "skill": "aws", "weight": 1.0 }
  ],
  "devops": [],
  "others": []
}`}
              error={!!stacksError}
              helperText={
                stacksError || 
                (hasValidMainStacks()
                  ? `Parsed ${getAllSkills().length} skill${getAllSkills().length !== 1 ? 's' : ''} across all layers`
                  : 'Format: JSON object with weighted skills. Weights per layer must sum to 1.0')
              }
            />
            {hasValidMainStacks() && (
              <Box sx={{ mt: 1 }}>
                {(['frontend', 'backend', 'database', 'cloud', 'devops', 'others'] as TechLayer[]).map((layer) => {
                  const layerSkills = (formData.mainStacks as LayerSkills)[layer];
                  if (!layerSkills || layerSkills.length === 0) return null;
                  
                  return (
                    <Box key={layer} sx={{ mb: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                        {layer}:
                      </Typography>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
                        {layerSkills.map((skillWeight: SkillWeight, index: number) => (
                          <Chip
                            key={index}
                            label={`${skillWeight.skill} (${(skillWeight.weight * 100).toFixed(0)}%)`}
                            color="primary"
                            size="small"
                            sx={{ mb: 0.5 }}
                          />
                        ))}
                      </Stack>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Grid>

          <Grid item xs={12}>
            <LayerWeightsEditor
              value={formData.layerWeights || DEFAULT_LAYER_WEIGHTS}
              onChange={handleLayerWeightsChange}
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
                  disabled={!hasValidMainStacks()}
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
                  techStack={getAllSkills()}
                  onResumeSelected={handleResumeSelected}
                  disabled={!hasValidMainStacks()}
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
