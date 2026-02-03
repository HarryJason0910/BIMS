import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  LinearProgress,
  Chip,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  CircularProgress
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { apiClient } from '../api';
import { TechLayer } from '../api/types';

interface BidMatchRateDisplayProps {
  bidId: string;
  open: boolean;
  onClose: () => void;
}

const LAYER_LABELS: Record<TechLayer, string> = {
  frontend: 'Frontend',
  backend: 'Backend',
  database: 'Database',
  cloud: 'Cloud',
  devops: 'DevOps',
  others: 'Others'
};

export const BidMatchRateDisplay: React.FC<BidMatchRateDisplayProps> = ({
  bidId,
  open,
  onClose
}) => {
  const { data: matchRates, isLoading, error } = useQuery({
    queryKey: ['bidMatchRate', bidId],
    queryFn: () => apiClient.getBidMatchRate(bidId),
    enabled: open && !!bidId
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Similar Bids - Match Rate Analysis</DialogTitle>
      <DialogContent>
        {isLoading && (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error">
            Error loading match rates: {(error as Error).message}
          </Alert>
        )}

        {matchRates && matchRates.length === 0 && (
          <Alert severity="info">
            No other bids found to compare
          </Alert>
        )}

        {matchRates && matchRates.length > 0 && (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Showing {matchRates.length} bid{matchRates.length !== 1 ? 's' : ''} sorted by match rate
            </Typography>

            {matchRates.map((result) => (
              <Accordion key={result.bidId} sx={{ mb: 1 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {result.company} - {result.role}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Overall Match: {result.matchRatePercentage.toFixed(1)}%
                      </Typography>
                    </Box>
                    <Box sx={{ width: 200 }}>
                      <LinearProgress
                        variant="determinate"
                        value={result.matchRatePercentage}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: 'rgba(0, 0, 0, 0.1)',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor:
                              result.matchRatePercentage >= 70
                                ? 'success.main'
                                : result.matchRatePercentage >= 40
                                ? 'warning.main'
                                : 'error.main'
                          }
                        }}
                      />
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Layer Breakdown:
                    </Typography>

                    {result.layerBreakdown.map((layerResult) => (
                      <Box key={layerResult.layer} sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography variant="body2" fontWeight="bold" sx={{ minWidth: 80 }}>
                            {LAYER_LABELS[layerResult.layer]}:
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {(layerResult.matchRate * 100).toFixed(1)}% match
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            (weight: {(layerResult.weight * 100).toFixed(0)}%)
                          </Typography>
                        </Box>

                        {layerResult.matchingSkills.length > 0 && (
                          <Box sx={{ mb: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                              Matching Skills:
                            </Typography>
                            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
                              {layerResult.matchingSkills.map((skill, index) => (
                                <Chip
                                  key={index}
                                  label={skill}
                                  color="success"
                                  size="small"
                                  sx={{ mb: 0.5 }}
                                />
                              ))}
                            </Stack>
                          </Box>
                        )}

                        {layerResult.missingSkills.length > 0 && (
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Missing Skills:
                            </Typography>
                            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
                              {layerResult.missingSkills.map((skill, index) => (
                                <Chip
                                  key={index}
                                  label={skill}
                                  color="error"
                                  size="small"
                                  variant="outlined"
                                  sx={{ mb: 0.5 }}
                                />
                              ))}
                            </Stack>
                          </Box>
                        )}
                      </Box>
                    ))}
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};
