# Reschedule Cancel and Date Field Fix

## Issues Fixed

### Issue 1: Cancel Button in Reschedule Form
**Problem**: When user clicks "Cancel" in the reschedule form, the interview remains cancelled in the database.

**Expected Behavior**: Interview should be reverted back to SCHEDULED status (un-cancelled).

**Solution**: Added backend endpoint and logic to revert cancellation.

### Issue 2: Date Field Shows Wrong Date
**Problem**: Interview list shows created date instead of interview date.

**Expected Behavior**: Should show the actual interview date (the date when the interview is scheduled to happen).

**Solution**: Updated Interview domain model and use case to accept and use the interview date from the request.

## Changes Made

### Backend Changes

#### 1. Interview Domain Model (`packages/backend/src/domain/Interview.ts`)

**Added date field to CreateInterviewData:**
```typescript
export interface CreateInterviewData {
  // ... other fields
  date?: Date; // Optional - defaults to today if not provided
}
```

**Updated Interview.create() to use provided date:**
```typescript
// Use provided date or default to today
const interviewDate = data.date || new Date();
interviewDate.setHours(0, 0, 0, 0);

return new Interview(
  id,
  interviewDate, // Use the provided or default date
  // ... other fields
);
```

**Added revertCancellation() method:**
```typescript
/**
 * Revert cancelled interview back to scheduled
 * Can only be called when status is CANCELLED with RESCHEDULED reason
 */
revertCancellation(): void {
  if (this._status !== InterviewStatus.CANCELLED) {
    throw new Error('Can only revert CANCELLED interviews');
  }
  if (this._cancellationReason !== CancellationReason.RESCHEDULED) {
    throw new Error('Can only revert interviews cancelled for rescheduling');
  }
  
  this._status = InterviewStatus.SCHEDULED;
  this._cancellationReason = null;
}
```

#### 2. ScheduleInterviewUseCase (`packages/backend/src/application/ScheduleInterviewUseCase.ts`)

**Added date field to request interface:**
```typescript
export interface ScheduleInterviewRequest {
  // ... other fields
  date?: string; // Optional - interview date in ISO format, defaults to today if not provided
}
```

**Updated Interview.create() call to pass date:**
```typescript
const interview = Interview.create({
  // ... other fields
  date: request.date ? new Date(request.date) : undefined, // Use provided date or default to today
});
```

#### 3. InterviewController (`packages/backend/src/infrastructure/InterviewController.ts`)

**Added new route:**
```typescript
this.router.post('/:id/revert-cancel', this.revertCancellation.bind(this));
```

**Added revertCancellation endpoint:**
```typescript
private async revertCancellation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const interview = await this.interviewRepository.findById(id);

    if (!interview) {
      res.status(404).json({
        error: 'Not Found',
        message: `Interview with id ${id} not found`,
      });
      return;
    }

    interview.revertCancellation();
    
    await this.interviewRepository.update(interview);
    res.json({ success: true, status: interview.status });
  } catch (error) {
    next(error);
  }
}
```

### Frontend Changes

#### 1. API Client (`packages/frontend/src/api/client.ts`)

**Added revertCancelInterview method:**
```typescript
/**
 * Revert a cancelled interview back to scheduled
 * Note: Does not use retry logic as this is a state-changing operation
 */
async revertCancelInterview(id: string): Promise<{ success: boolean; status: string }> {
  const response = await this.client.post<{ success: boolean; status: string }>(`/api/interviews/${id}/revert-cancel`);
  return response.data;
}
```

#### 2. InterviewDashboard (`packages/frontend/src/pages/InterviewDashboard.tsx`)

**Added imports:**
```typescript
import { apiClient } from '../api';
import { useQueryClient } from '@tanstack/react-query';
```

**Updated handleCancel to revert cancellation:**
```typescript
const handleCancel = useCallback(async () => {
  // If we're in reschedule mode, revert the cancellation
  if (viewMode === 'reschedule' && rescheduleInterview) {
    try {
      await apiClient.revertCancelInterview(rescheduleInterview.id);
      // Refresh the interview list
      queryClient.invalidateQueries({ queryKey: ['interviews'] });
      queryClient.invalidateQueries({ queryKey: ['bids'] });
    } catch (error) {
      console.error('Failed to revert cancellation:', error);
      alert(`Failed to revert cancellation: ${(error as Error).message}`);
    }
  }
  
  setViewMode('list');
  setSelectedInterview(null);
  setBaseInterview(null);
  setRescheduleInterview(null);
}, [viewMode, rescheduleInterview]);
```

## User Flow

### Reschedule Cancel Flow
1. User clicks "Cancel" on a SCHEDULED interview
2. Selects "Rescheduled" reason
3. Reschedule form opens with all fields pre-filled
4. User decides not to reschedule and clicks "Cancel" button
5. **Backend reverts the interview status from CANCELLED back to SCHEDULED**
6. User returns to interview list
7. Interview appears as SCHEDULED with "Cancel" button available again

### Interview Date Display
1. User schedules an interview for a future date (e.g., Feb 5, 2026)
2. Interview is created with the specified date
3. Interview list shows the actual interview date (Feb 5, 2026)
4. NOT the created date (today's date)

## API Changes

### New Endpoint: POST /api/interviews/:id/revert-cancel

**Purpose**: Revert a cancelled interview back to scheduled status

**Request**: No body required

**Response**:
```json
{
  "success": true,
  "status": "SCHEDULED"
}
```

**Validation**:
- Interview must exist
- Interview must be in CANCELLED status
- Interview must have cancellationReason = "Rescheduled"

**Errors**:
- 404: Interview not found
- 400: Can only revert CANCELLED interviews
- 400: Can only revert interviews cancelled for rescheduling

## Testing

### Test 1: Cancel Reschedule Form
1. Schedule an interview for tomorrow
2. Click "Cancel" button on the interview
3. Select "Rescheduled" reason
4. Reschedule form opens
5. Click "Cancel" button in the form
6. Return to interview list
7. **Verify**: Interview shows as SCHEDULED (not CANCELLED)
8. **Verify**: "Cancel" button is available

### Test 2: Interview Date Display
1. Schedule an interview for Feb 10, 2026
2. Go to interview list
3. **Verify**: Date column shows "2/10/2026" (or your locale format)
4. **Verify**: NOT today's date

### Test 3: Reschedule with Date Change
1. Schedule interview for Feb 5
2. Cancel with "Rescheduled"
3. Change date to Feb 12
4. Submit
5. **Verify**: New interview shows Feb 12 in the list

## Files Modified

### Backend
- `packages/backend/src/domain/Interview.ts`
- `packages/backend/src/application/ScheduleInterviewUseCase.ts`
- `packages/backend/src/infrastructure/InterviewController.ts`

### Frontend
- `packages/frontend/src/api/client.ts`
- `packages/frontend/src/pages/InterviewDashboard.tsx`

## Compilation Status
✅ All files compile without errors
✅ TypeScript diagnostics pass

## Next Steps
1. Restart backend server
2. Restart frontend dev server
3. Test cancel reschedule flow
4. Test interview date display
5. Verify interviews show correct dates in the list
