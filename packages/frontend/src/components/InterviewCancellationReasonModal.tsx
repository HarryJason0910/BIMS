import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Typography
} from '@mui/material';
import { CancellationReason } from '../api/types';

interface InterviewCancellationReasonModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: CancellationReason) => void;
  companyName: string;
  roleName: string;
}

export const InterviewCancellationReasonModal: React.FC<InterviewCancellationReasonModalProps> = ({
  open,
  onClose,
  onConfirm,
  companyName,
  roleName
}) => {
  const [selectedReason, setSelectedReason] = useState<CancellationReason | ''>('');

  const handleConfirm = () => {
    if (selectedReason) {
      onConfirm(selectedReason as CancellationReason);
      setSelectedReason('');
    }
  };

  const handleClose = () => {
    setSelectedReason('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Cancel Interview: {companyName} - {roleName}
      </DialogTitle>
      <DialogContent>
        <FormControl component="fieldset" sx={{ mt: 2 }}>
          <FormLabel component="legend">Select Cancellation Reason</FormLabel>
          <RadioGroup
            value={selectedReason}
            onChange={(e) => setSelectedReason(e.target.value as CancellationReason)}
          >
            <FormControlLabel
              value={CancellationReason.ROLE_CLOSED}
              control={<Radio />}
              label={
                <div>
                  <Typography variant="body1">{CancellationReason.ROLE_CLOSED}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Bid will be marked as failed and recorded in company history
                  </Typography>
                </div>
              }
            />
            <FormControlLabel
              value={CancellationReason.RESCHEDULED}
              control={<Radio />}
              label={
                <div>
                  <Typography variant="body1">{CancellationReason.RESCHEDULED}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Opens schedule form to reschedule the same interview stage
                  </Typography>
                </div>
              }
            />
          </RadioGroup>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="warning"
          disabled={!selectedReason}
        >
          Confirm Cancellation
        </Button>
      </DialogActions>
    </Dialog>
  );
};
