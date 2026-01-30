import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import { ResumeCard } from './ResumeCard';
import { ResumeMetadata } from '../api/types';
import { apiClient } from '../api/client';

interface ResumeSelectorProps {
  techStack: string[];
  onResumeSelected: (resumeId: string) => void;
  disabled: boolean;
}

export const ResumeSelector: React.FC<ResumeSelectorProps> = ({
  techStack,
  onResumeSelected,
  disabled,
}) => {
  const [resumes, setResumes] = useState<ResumeMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  console.log('[ResumeSelector] Render:', { techStack, disabled, resumesCount: resumes.length, loading, error });

  useEffect(() => {
    console.log('[ResumeSelector] Effect triggered:', { techStack, disabled, techStackLength: techStack.length });
    
    if (techStack.length === 0 || disabled) {
      setResumes([]);
      setSelectedId(null);
      return;
    }

    const fetchResumes = async () => {
      setLoading(true);
      setError(null);
      try {
        const techStackParam = techStack.join(',');
        console.log('[ResumeSelector] Fetching resumes with tech stack:', techStackParam);
        
        // Use axios params to properly encode query parameters
        const response = await apiClient.get<ResumeMetadata[]>('/api/resumes/metadata', {
          params: { techStack: techStackParam }
        });
        
        console.log('[ResumeSelector] Received resumes:', response);
        setResumes(response);
      } catch (err) {
        console.error('[ResumeSelector] Failed to fetch resumes:', err);
        setError('Failed to load matching resumes. Please try again.');
        setResumes([]);
      } finally {
        setLoading(false);
      }
    };

    // Debounce API calls by 500ms
    const debounceTimer = setTimeout(fetchResumes, 500);
    return () => clearTimeout(debounceTimer);
  }, [techStack, disabled]);

  const handleSelect = (resumeId: string) => {
    setSelectedId(resumeId);
    onResumeSelected(resumeId);
  };

  if (disabled) {
    return (
      <Box sx={{ p: 3, textAlign: 'center', bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          Enter tech stack to see matching resumes
        </Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center', bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, minHeight: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
          Loading matching resumes...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (resumes.length === 0 && techStack.length > 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center', bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No matching resumes found. Upload a new resume.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, minHeight: '200px' }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Select from {resumes.length} matching resumes
      </Typography>
      <Box sx={{ maxHeight: '500px', overflowY: 'auto' }}>
        {resumes.map((resume) => (
          <ResumeCard
            key={resume.id}
            resume={resume}
            selected={selectedId === resume.id}
            onSelect={() => handleSelect(resume.id)}
          />
        ))}
      </Box>
    </Box>
  );
};
