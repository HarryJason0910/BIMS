import React from 'react';
import { Card, CardContent, Typography, Chip, Box, Stack, Divider, IconButton, Tooltip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import DownloadIcon from '@mui/icons-material/Download';
import { ResumeMetadata } from '../api/types';
import { apiClient } from '../api/client';

interface ResumeCardProps {
  resume: ResumeMetadata;
  selected: boolean;
  onSelect: () => void;
}

export const ResumeCard: React.FC<ResumeCardProps> = ({ resume, selected, onSelect }) => {
  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card selection when clicking download
    
    try {
      const blob = await apiClient.get<Blob>(`/api/resumes/file/${resume.id}`, {
        responseType: 'blob'
      } as any);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${resume.company}_${resume.role}_resume.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download resume:', error);
      alert('Failed to download resume. Please try again.');
    }
  };

  return (
    <Card
      onClick={onSelect}
      sx={{
        cursor: 'pointer',
        border: selected ? '2px solid #1976d2' : '1px solid rgba(0, 0, 0, 0.12)',
        backgroundColor: selected ? 'rgba(25, 118, 210, 0.08)' : 'white',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: 3,
          transform: 'translateY(-2px)',
          borderColor: selected ? '#1976d2' : 'rgba(0, 0, 0, 0.23)',
        },
        mb: 2,
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', mb: 0.5 }}>
              {resume.company}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
              {resume.role}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="Download Resume">
              <IconButton
                size="small"
                onClick={handleDownload}
                sx={{
                  color: 'primary.main',
                  '&:hover': {
                    backgroundColor: 'primary.light',
                  },
                }}
              >
                <DownloadIcon />
              </IconButton>
            </Tooltip>
            <Chip
              label={`${resume.score}% Match`}
              color={resume.score === 100 ? 'success' : resume.score >= 75 ? 'primary' : 'warning'}
              sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}
            />
          </Box>
        </Box>

        {/* Matched Skills */}
        {resume.matchedSkills && resume.matchedSkills.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <CheckCircleIcon sx={{ fontSize: 18, color: 'success.main', mr: 0.5 }} />
              <Typography variant="body2" sx={{ fontWeight: 'medium', color: 'success.main' }}>
                Matched Skills ({resume.matchedSkills.length})
              </Typography>
            </Box>
            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
              {resume.matchedSkills.map((skill, index) => (
                <Chip
                  key={index}
                  label={skill}
                  size="small"
                  sx={{ 
                    mb: 0.5,
                    backgroundColor: 'success.light',
                    color: 'success.contrastText',
                    fontWeight: 'medium'
                  }}
                />
              ))}
            </Stack>
          </Box>
        )}

        {/* Missing Skills */}
        {resume.missingSkills && resume.missingSkills.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <CancelIcon sx={{ fontSize: 18, color: 'error.main', mr: 0.5 }} />
              <Typography variant="body2" sx={{ fontWeight: 'medium', color: 'error.main' }}>
                Missing Skills ({resume.missingSkills.length})
              </Typography>
            </Box>
            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
              {resume.missingSkills.map((skill, index) => (
                <Chip
                  key={index}
                  label={skill}
                  size="small"
                  sx={{ 
                    mb: 0.5,
                    backgroundColor: 'error.light',
                    color: 'error.contrastText',
                    fontWeight: 'medium'
                  }}
                />
              ))}
            </Stack>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        {/* All Resume Skills */}
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 'medium' }}>
            Resume Tech Stack:
          </Typography>
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
            {resume.techStack.map((tech, index) => (
              <Chip
                key={index}
                label={tech}
                size="small"
                variant="outlined"
                sx={{ mb: 0.5 }}
              />
            ))}
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
};
