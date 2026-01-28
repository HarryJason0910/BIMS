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
import { InterviewType, HRFailureReason, TechFailureReason, FinalClientFailureReason, InterviewFailureReason } from '../api/types';

interface InterviewFailureReasonModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: InterviewFailureReason) => void;
  interviewType: InterviewType;
  companyName: string;
  roleName: string;
}

export const InterviewFailureReasonModal: React.FC<InterviewFailureReasonModalProps> = ({
  open,
  onClose,
  onConfirm,
  interviewType,
  companyName,
  roleName
}) => {
  const [selectedReason, setSelectedReason] = useState<InterviewFailureReason | ''>('');

  const getAvailableReasons = (): { value: InterviewFailureReason; label: string; allowsRebid: boolean }[] => {
    if (interviewType === InterviewType.HR) {
      return [
        { value: HRFailureReason.BILINGUAL, label: 'Bilingual', allowsRebid: false },
        { value: HRFailureReason.NOT_REMOTE, label: 'Not Remote', allowsRebid: false },
        { value: HRFailureReason.SELF_MISTAKE, label: 'Self Mistake (Rebid Allowed)', allowsRebid: true }
      ];
    } else if (
      interviewType === InterviewType.TECH_INTERVIEW_1 ||
      interviewType === InterviewType.TECH_INTERVIEW_2 ||
      interviewType === InterviewType.TECH_INTERVIEW_3
    ) {
      return [
        { value: TechFailureReason.LIVE_CODING, label: 'Live Coding (Rebid Allowed)', allowsRebid: true },
        { value: TechFailureReason.ANSWERING, label: 'Answering (Rebid Allowed)', allowsRebid: true }
      ];
    } else {
      // Final or Client Interview
      return [
        { value: FinalClientFailureReason.BACKGROUND_CHECK, label: 'Background Check (Rebid Allowed)', allowsRebid: true },
        { value: FinalClientFailureReason.CONVERSATION_ISSUE, label: 'Conversation Issue (Rebid Allowed)', allowsRebid: true }
      ];
    }
  };

  const handleConfirm = () => {
    if (selectedReason) {
      onConfirm(selectedReason as InterviewFailureReason);
      setSelectedReason('');
    }
  };

  const handleClose = () => {
    setSelectedReason('');
    onClose();
  };

  const reasons = getAvailableReasons();

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Mark Interview as Failed: {companyName} - {roleName}
      </DialogTitle>
      <DialogContent>
        <FormControl component="fieldset" sx={{ mt: 2 }}>
          <FormLabel component="legend">Select Failure Reason</FormLabel>
          <RadioGroup
            value={selectedReason}
            onChange={(e) => setSelectedReason(e.target.value as InterviewFailureReason)}
          >
            {reasons.map((reason) => (
              <FormControlLabel
                key={reason.value}
                value={reason.value}
                control={<Radio />}
                label={reason.label}
              />
            ))}
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
          Confirm Failure
        </Button>
      </DialogActions>
    </Dialog>
  );
};
