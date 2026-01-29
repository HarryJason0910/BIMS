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
  Radio
} from '@mui/material';
import { RejectionReason } from '../api/types';

interface RejectionReasonModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: RejectionReason) => void;
  companyName: string;
  roleName: string;
}

export const RejectionReasonModal: React.FC<RejectionReasonModalProps> = ({
  open,
  onClose,
  onConfirm,
  companyName,
  roleName
}) => {
  const [selectedReason, setSelectedReason] = useState<RejectionReason | ''>('');

  const handleConfirm = () => {
    if (selectedReason) {
      onConfirm(selectedReason as RejectionReason);
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
        Mark as Rejected: {companyName} - {roleName}
      </DialogTitle>
      <DialogContent>
        <FormControl component="fieldset" sx={{ mt: 2 }}>
          <FormLabel component="legend">Select Rejection Reason</FormLabel>
          <RadioGroup
            value={selectedReason}
            onChange={(e) => setSelectedReason(e.target.value as RejectionReason)}
          >
            <FormControlLabel
              value={RejectionReason.ROLE_CLOSED}
              control={<Radio />}
              label="Role Closed"
            />
            <FormControlLabel
              value={RejectionReason.UNSATISFIED_RESUME}
              control={<Radio />}
              label="Unsatisfied Resume (Rebid Allowed)"
            />
          </RadioGroup>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="error"
          disabled={!selectedReason}
        >
          Confirm Rejection
        </Button>
      </DialogActions>
    </Dialog>
  );
};
