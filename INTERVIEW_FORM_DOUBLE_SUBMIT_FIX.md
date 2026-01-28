# Interview Form Double Submit Fix

## Problem
When scheduling an interview, if the user clicks the "Schedule Interview" button multiple times (due to slow response), multiple identical interviews are created in the database.

## Root Cause
Interview scheduling takes time (eligibility checks, database operations), allowing users to click submit button multiple times before the first request completes.

## Solution - Two-Layer Defense

### Layer 1: Frontend Protection (Primary)
**File**: `packages/frontend/src/components/InterviewForm.tsx`

Added early return guard in `handleSubmit`:
```typescript
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  
  // Prevent double submission
  if (scheduleInterviewMutation.isPending) {
    return;
  }
  
  scheduleInterviewMutation.mutate(formData);
};
```

**Existing Protection** (already in place):
- Button already has `disabled={!isValid || scheduleInterviewMutation.isPending}`
- Button text changes to "Scheduling..." during submission

### Layer 2: Backend Idempotency (Safety Net)
**File**: `packages/backend/src/application/ScheduleInterviewUseCase.ts`

Added duplicate detection before creating interview:
```typescript
// IDEMPOTENCY CHECK: Check if interview already exists for this bid + type
if (bidId) {
  const existingInterviews = await this.interviewRepository.findByBidId(bidId);
  const duplicateInterview = existingInterviews.find(
    interview => interview.interviewType === request.interviewType && 
                interview.status === 'SCHEDULED'
  );
  
  if (duplicateInterview) {
    // Return existing interview instead of creating duplicate
    return {
      interviewId: duplicateInterview.id,
      eligibilityResult: {
        allowed: true,
        reason: 'Interview already scheduled (duplicate request prevented)'
      }
    };
  }
}
```

## How It Works

### Frontend Protection:
1. User clicks "Schedule Interview"
2. `scheduleInterviewMutation.isPending` becomes `true`
3. Button becomes disabled
4. Button text changes to "Scheduling..."
5. If user clicks again, `handleSubmit` returns early
6. No additional API calls are made

### Backend Protection (if frontend fails):
1. First request arrives → Creates interview
2. Second request arrives (duplicate)
3. Backend checks: "Does interview with same bidId + interviewType + SCHEDULED status exist?"
4. If yes → Returns existing interview ID (no duplicate created)
5. If no → Creates new interview (legitimate request)

## Benefits

1. **Prevents duplicate interviews** - Both frontend and backend protection
2. **Better UX** - Visual feedback (disabled button, "Scheduling..." text)
3. **Idempotent API** - Safe to retry, won't create duplicates
4. **Graceful handling** - Returns existing interview if duplicate detected
5. **Defense in depth** - Works even if frontend protection fails

## Edge Cases Handled

### Case 1: Rapid Clicks
- **Frontend**: Early return prevents multiple mutations
- **Backend**: First request creates, subsequent return existing

### Case 2: Network Issues
- **Frontend**: Button stays disabled until response
- **Backend**: Duplicate detection prevents multiple creations

### Case 3: Browser Back/Forward
- **Frontend**: Form resets, mutation state clears
- **Backend**: Checks for existing scheduled interview

## Limitations

### Backend Idempotency Scope:
- Only checks for `bidId` + `interviewType` + `SCHEDULED` status
- Does NOT prevent scheduling same interview type after cancellation (intentional)
- Does NOT prevent scheduling if previous interview is COMPLETED/CANCELLED (intentional)

### Why This Scope:
- Allows rescheduling after cancellation
- Allows scheduling same type after completion (e.g., multiple tech rounds)
- Only prevents true duplicates (same bid, same type, still scheduled)

## Testing Recommendations

1. **Rapid Click Test**:
   - Click "Schedule Interview" button 5 times rapidly
   - Verify only 1 interview is created
   - Check network tab: should see only 1 request sent

2. **Slow Network Test**:
   - Throttle network to Slow 3G
   - Click submit button twice before response
   - Verify only 1 interview created

3. **Legitimate Reschedule Test**:
   - Schedule interview
   - Cancel it
   - Schedule same type again
   - Verify new interview is created (not blocked)

4. **Multiple Interview Types Test**:
   - Schedule HR interview
   - Schedule Tech Interview 1 (different type)
   - Verify both are created (not blocked)

## Related Files
- `packages/frontend/src/components/InterviewForm.tsx` - Frontend protection
- `packages/backend/src/application/ScheduleInterviewUseCase.ts` - Backend idempotency

## Implementation Date
January 28, 2026
