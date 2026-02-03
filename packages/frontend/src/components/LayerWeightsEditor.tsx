import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Alert
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { LayerWeights, TechLayer } from '../api/types';

interface LayerWeightsEditorProps {
  value: LayerWeights;
  onChange: (weights: LayerWeights) => void;
  disabled?: boolean;
}

const LAYERS: TechLayer[] = ['frontend', 'backend', 'database', 'cloud', 'devops', 'others'];

const LAYER_LABELS: Record<TechLayer, string> = {
  frontend: 'Frontend',
  backend: 'Backend',
  database: 'Database',
  cloud: 'Cloud',
  devops: 'DevOps',
  others: 'Others'
};

export const LayerWeightsEditor: React.FC<LayerWeightsEditorProps> = ({
  value,
  onChange,
  disabled = false
}) => {
  const [weights, setWeights] = useState<LayerWeights>(value);
  const [sum, setSum] = useState<number>(0);

  // Update local state when prop changes
  useEffect(() => {
    setWeights(value);
  }, [value]);

  // Calculate sum whenever weights change
  useEffect(() => {
    const total = LAYERS.reduce((acc, layer) => acc + weights[layer], 0);
    setSum(total);
  }, [weights]);

  const handleWeightChange = (layer: TechLayer, valueStr: string) => {
    const numValue = parseFloat(valueStr);
    
    // Allow empty or invalid input temporarily
    if (valueStr === '' || isNaN(numValue)) {
      const newWeights = { ...weights, [layer]: 0 };
      setWeights(newWeights);
      onChange(newWeights);
      return;
    }
    
    // Clamp value between 0 and 1
    const clampedValue = Math.max(0, Math.min(1, numValue));
    
    const newWeights = { ...weights, [layer]: clampedValue };
    setWeights(newWeights);
    onChange(newWeights);
  };

  const isValid = Math.abs(sum - 1.0) <= 0.001;

  return (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
          <Typography>Customize Layer Weights (Optional)</Typography>
          {!isValid && (
            <Typography variant="caption" color="error">
              Sum must equal 1.0
            </Typography>
          )}
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Adjust the importance of each technology layer. Weights must sum to 1.0.
          </Typography>
          
          <Grid container spacing={2}>
            {LAYERS.map((layer) => (
              <Grid item xs={12} sm={6} key={layer}>
                <TextField
                  fullWidth
                  label={LAYER_LABELS[layer]}
                  type="number"
                  value={weights[layer]}
                  onChange={(e) => handleWeightChange(layer, e.target.value)}
                  disabled={disabled}
                  inputProps={{
                    min: 0,
                    max: 1,
                    step: 0.05
                  }}
                  helperText={`${(weights[layer] * 100).toFixed(0)}%`}
                />
              </Grid>
            ))}
          </Grid>

          <Box sx={{ mt: 2 }}>
            {isValid ? (
              <Alert severity="success">
                Total: {sum.toFixed(3)} ✓
              </Alert>
            ) : (
              <Alert severity="error">
                Total: {sum.toFixed(3)} (must equal 1.0 ± 0.001)
              </Alert>
            )}
          </Box>
        </Box>
      </AccordionDetails>
    </Accordion>
  );
};
