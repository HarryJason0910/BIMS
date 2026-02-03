import React, { useState, useEffect } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  SelectChangeEvent
} from '@mui/material';

interface RoleSelectorProps {
  value: string;
  onChange: (role: string) => void;
  disabled?: boolean;
}

// Seniority levels
const SENIORITY_LEVELS = ['Junior', 'Mid', 'Senior', 'Lead', 'Staff'];

// Basic titles
const BASIC_TITLES = [
  'Software Engineer',
  'Backend Engineer',
  'Frontend Developer',
  'Full Stack Engineer',
  'QA Automation Engineer',
  'DevOps Engineer',
  'Data Engineer',
  'Mobile Developer'
];

// Full Stack modifiers (only for Full Stack Engineer)
const FULL_STACK_MODIFIERS = ['Balanced', 'Frontend Heavy', 'Backend Heavy'];

export const RoleSelector: React.FC<RoleSelectorProps> = ({ value, onChange, disabled = false }) => {
  const [seniority, setSeniority] = useState<string>('');
  const [basicTitle, setBasicTitle] = useState<string>('');
  const [fullStackModifier, setFullStackModifier] = useState<string>('');

  // Parse initial value
  useEffect(() => {
    if (value) {
      parseRole(value);
    }
  }, [value]);

  // Parse role string into components
  const parseRole = (roleString: string) => {
    let remaining = roleString;
    
    // Extract seniority
    for (const sen of SENIORITY_LEVELS) {
      if (roleString.startsWith(sen + ' ')) {
        setSeniority(sen);
        remaining = roleString.substring(sen.length + 1);
        break;
      }
    }
    
    // Check if it's a Full Stack Engineer with modifier
    if (remaining.includes('Full Stack Engineer')) {
      setBasicTitle('Full Stack Engineer');
      
      // Extract modifier
      for (const modifier of FULL_STACK_MODIFIERS) {
        if (remaining.startsWith(modifier + ' ')) {
          setFullStackModifier(modifier);
          break;
        }
      }
    } else {
      // Regular title
      for (const title of BASIC_TITLES) {
        if (remaining === title) {
          setBasicTitle(title);
          break;
        }
      }
    }
  };

  // Compute role string from components
  const computeRole = (sen: string, title: string, modifier: string): string => {
    if (!sen || !title) return '';
    
    if (title === 'Full Stack Engineer' && modifier) {
      return `${sen} ${modifier} ${title}`;
    }
    
    return `${sen} ${title}`;
  };

  // Handle seniority change
  const handleSeniorityChange = (event: SelectChangeEvent) => {
    const newSeniority = event.target.value;
    setSeniority(newSeniority);
    
    const newRole = computeRole(newSeniority, basicTitle, fullStackModifier);
    if (newRole) {
      onChange(newRole);
    }
  };

  // Handle basic title change
  const handleBasicTitleChange = (event: SelectChangeEvent) => {
    const newTitle = event.target.value;
    setBasicTitle(newTitle);
    
    // Reset modifier if not Full Stack Engineer
    if (newTitle !== 'Full Stack Engineer') {
      setFullStackModifier('');
      const newRole = computeRole(seniority, newTitle, '');
      if (newRole) {
        onChange(newRole);
      }
    } else {
      // For Full Stack Engineer, require modifier
      if (fullStackModifier) {
        const newRole = computeRole(seniority, newTitle, fullStackModifier);
        if (newRole) {
          onChange(newRole);
        }
      }
    }
  };

  // Handle Full Stack modifier change
  const handleModifierChange = (event: SelectChangeEvent) => {
    const newModifier = event.target.value;
    setFullStackModifier(newModifier);
    
    const newRole = computeRole(seniority, basicTitle, newModifier);
    if (newRole) {
      onChange(newRole);
    }
  };

  const computedRole = computeRole(seniority, basicTitle, fullStackModifier);
  const isFullStack = basicTitle === 'Full Stack Engineer';

  return (
    <Box>
      <FormControl fullWidth required disabled={disabled} sx={{ mb: 2 }}>
        <InputLabel>Seniority</InputLabel>
        <Select
          value={seniority}
          label="Seniority"
          onChange={handleSeniorityChange}
        >
          {SENIORITY_LEVELS.map((level) => (
            <MenuItem key={level} value={level}>
              {level}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth required disabled={disabled} sx={{ mb: 2 }}>
        <InputLabel>Title</InputLabel>
        <Select
          value={basicTitle}
          label="Title"
          onChange={handleBasicTitleChange}
        >
          {BASIC_TITLES.map((title) => (
            <MenuItem key={title} value={title}>
              {title}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {isFullStack && (
        <FormControl fullWidth required disabled={disabled} sx={{ mb: 2 }}>
          <InputLabel>Full Stack Type</InputLabel>
          <Select
            value={fullStackModifier}
            label="Full Stack Type"
            onChange={handleModifierChange}
          >
            {FULL_STACK_MODIFIERS.map((modifier) => (
              <MenuItem key={modifier} value={modifier}>
                {modifier}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {computedRole && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Role: <strong>{computedRole}</strong>
        </Typography>
      )}
    </Box>
  );
};
