# Schedule Next Interview Feature

## Overview
Added a "Schedule Next" button that appears when an interview is marked as passed, allowing users to quickly schedule the next stage interview based on the current one.

## Feature Description

When a user marks an interview as "Passed", they can now click a "Schedule Next" button to automatically schedule the next interview stage with pre-filled information from the current interview.

## Interview Progression Flow

```
HR Interview (Stage 1)
  ↓ Pass
Tech Interview 1 (Stage 2)
  ↓ Pass
Tech Interview 2 (Stage 3)
  ↓ Pass
Tech Interview 3 (Stage 4)
  ↓ Pass
Final Interview (Stage 5)
  ↓ Pass
Client Interview (Stage 6)
  ↓ Pass
Process Complete!
```

## Implementation Details

### 1. **Helper Function: getNextInterviewType**
Determines the next interview stage based on the current interview type:

```typescript
const getNextInterviewType = (currentType: InterviewType): InterviewType | null => {
  switch (currentType) {
    case InterviewType.HR:
      return InterviewType.TECH_INTERVIEW_1;
    case InterviewType.TECH_INTERVIEW_1:
      return InterviewType.TECH_INTERVIEW_2;
    case InterviewType.TECH_INTERVIEW_2:
      return InterviewType.TECH_INTERVIEW_3;
    case InterviewType.TECH_INTERVIEW_3:
      return InterviewType.FINAL_INTERVIEW;
    case InterviewType.FINAL_INTERVIEW:
      return InterviewType.CLIENT_INTERVIEW;
    case InterviewType.CLIENT_INTERVIEW:
      return null; // No next stage
    default:
      return null;
  }
};
```

### 2. **InterviewList Component**
- Added `onScheduleNext` prop to handle scheduling next interview
- Added `getNextInterviewType` helper function
- Updated actions column to show "Schedule Next" button for passed interviews
- Shows "Process Complete!" message after client interview is passed

**Button Logic:**
```typescript
{interview.status === InterviewStatus.COMPLETED_SUCCESS && getNextInterviewType(interview.interviewType) && (
  <Button
    onClick={(e) => {
      e.stopPropagation();
      onScheduleNext?.(interview);
    }}
    variant="contained"
    size="small"
    color="primary"
  >
    Schedule Next
  </Button>
)}
```

### 3. **InterviewDashboard Component**
- Added `scheduleNext` view mode
- Added `baseInterview` state to store the interview being used as base
- Added `handleScheduleNext` callback
- Passes `baseInterview` to InterviewForm when scheduling next interview

**View Modes:**
- `list` - Show interview list
- `create` - Create new interview from scratch
- `editDetail` - Edit interview details
- `scheduleNext` - Schedule next interview based on passed interview

### 4. **InterviewForm Component**
- Added `baseInterview` optional prop
- Added `getNextInterviewType` helper function
- Pre-fills form data when `baseInterview` is provided:
  - **Base:** Same as previous interview (BID or LINKEDIN_CHAT)
  - **Bid ID:** Same as previous interview
  - **Recruiter:** Same as previous interview
  - **Interview Type:** Automatically set to next stage
  - **Attendees:** Empty (user needs to add new attendees)
  - **Date:** Today's date

**Pre-fill Logic:**
```typescript
const [formData, setFormData] = useState<ScheduleInterviewRequest>({
  base: baseInterview?.base || InterviewBase.BID,
  bidId: baseInterview?.bidId,
  recruiter: baseInterview?.recruiter || '',
  attendees: [],
  interviewType: baseInterview 
    ? (getNextInterviewType(baseInterview.interviewType) || InterviewType.HR) 
    : InterviewType.HR,
  date: new Date().toISOString().split('T')[0]
});
```

## User Experience

### Scenario 1: Pass HR Interview
1. User marks HR interview as "Passed"
2. "Schedule Next" button appears
3. User clicks "Schedule Next"
4. Form opens with:
   - Interview Type: Tech Interview 1 (pre-selected)
   - Recruiter: Same as HR interview
   - Bid ID: Same as HR interview
   - Attendees: Empty (ready to add)
   - Date: Today
5. User adds attendees and submits
6. Tech Interview 1 is scheduled

### Scenario 2: Pass Client Interview
1. User marks Client Interview as "Passed"
2. "Process Complete!" message appears (no Schedule Next button)
3. Interview process is finished

### Scenario 3: Fail Interview
1. User marks interview as "Failed"
2. No "Schedule Next" button appears
3. Shows "No actions available"

## Files Modified

### Frontend Components
1. **`packages/frontend/src/components/InterviewList.tsx`**
   - Added `onScheduleNext` prop
   - Added `getNextInterviewType` helper function
   - Updated actions column with "Schedule Next" button
   - Added "Process Complete!" message for final stage

2. **`packages/frontend/src/components/InterviewForm.tsx`**
   - Added `baseInterview` optional prop
   - Added `getNextInterviewType` helper function
   - Pre-fills form data when baseInterview is provided
   - Automatically selects next interview type

### Frontend Pages
3. **`packages/frontend/src/pages/InterviewDashboard.tsx`**
   - Added `scheduleNext` view mode
   - Added `baseInterview` state
   - Added `handleScheduleNext` callback
   - Added `handleScheduleNextSuccess` callback
   - Passes `baseInterview` to InterviewForm

## Benefits

### 1. **Faster Workflow**
- No need to manually re-enter company, role, recruiter information
- Interview type automatically selected
- Reduces data entry errors

### 2. **Clear Progression**
- Visual indication of interview stages
- "Process Complete!" message when done
- Easy to track interview pipeline

### 3. **Maintains Context**
- All information from previous interview carried forward
- Linked to same bid
- Same recruiter contact

### 4. **Flexible**
- Can still create interviews from scratch using FAB button
- Can edit pre-filled information before submitting
- Works with both BID and LINKEDIN_CHAT based interviews

## Testing Checklist

### Happy Path
- [x] Pass HR interview → Schedule Next shows Tech Interview 1
- [x] Pass Tech Interview 1 → Schedule Next shows Tech Interview 2
- [x] Pass Tech Interview 2 → Schedule Next shows Tech Interview 3
- [x] Pass Tech Interview 3 → Schedule Next shows Final Interview
- [x] Pass Final Interview → Schedule Next shows Client Interview
- [x] Pass Client Interview → Shows "Process Complete!"

### Edge Cases
- [x] Fail interview → No Schedule Next button
- [x] Cancel interview → No Schedule Next button
- [x] Scheduled interview → No Schedule Next button
- [x] Pending interview → No Schedule Next button

### Form Pre-fill
- [x] Recruiter name pre-filled
- [x] Bid ID pre-filled (if from BID)
- [x] Interview type auto-selected to next stage
- [x] Attendees list empty (ready for new attendees)
- [x] Date set to today
- [x] Can edit all pre-filled fields

### Integration
- [x] Schedule Next opens form in dashboard
- [x] Cancel returns to list view
- [x] Submit creates new interview
- [x] New interview appears in list
- [x] Bid status updates if needed

## Future Enhancements

### Potential Improvements
1. **Auto-suggest Attendees:** Based on previous interviews at same company
2. **Interview Templates:** Save common interview configurations
3. **Bulk Scheduling:** Schedule multiple stages at once
4. **Calendar Integration:** Sync with external calendars
5. **Reminder Notifications:** Alert before upcoming interviews
6. **Interview Notes:** Carry forward notes from previous stages

## Summary

The "Schedule Next Interview" feature streamlines the interview scheduling process by:
- ✅ Automatically determining the next interview stage
- ✅ Pre-filling form with relevant information
- ✅ Reducing manual data entry
- ✅ Providing clear visual progression
- ✅ Maintaining context across interview stages

This feature significantly improves the user experience for managing multi-stage interview processes.
