# Reschedule Clarification Fix

## Issue
The initial implementation had a misunderstanding about what "reschedule" means. It was thought to be about progressing to the next interview stage, but actually:

**Rescheduling = Changing the time/date of the SAME interview stage**

## What Was Fixed

### InterviewForm.tsx
**Changes made:**

1. **Added reschedule mode detection:**
```typescript
const isRescheduleMode = !!rescheduleInterview;
```

2. **Pre-filled attendees for reschedule:**
```typescript
attendees: rescheduleInterview?.attendees || [], // Pre-fill attendees for reschedule
```

3. **Disabled all fields except date and attendees in reschedule mode:**
- Interview Base: `disabled={isRescheduleMode}`
- Select Bid: `disabled={isRescheduleMode}`
- Company: `disabled={isRescheduleMode}`
- Client: `disabled={isRescheduleMode}`
- Role: `disabled={isRescheduleMode}`
- Recruiter: `disabled={isRescheduleMode}`
- Interview Type: `disabled={isRescheduleMode}`
- Date: **NOT disabled** (editable)
- Attendees: **NOT disabled** (can add/remove)

4. **Updated UI for reschedule mode:**
- Title changes to "Reschedule Interview"
- Shows info alert: "Rescheduling interview - only date and attendees can be modified"

## Correct Behavior Now

### When Rescheduling (RESCHEDULED cancellation reason):
1. Interview is cancelled with reason "Rescheduled"
2. Schedule form opens with ALL fields pre-filled:
   - ✅ Same company, client, role
   - ✅ Same recruiter
   - ✅ **Same interview type** (HR stays HR, Tech 1 stays Tech 1, etc.)
   - ✅ **Same attendees** (pre-filled, can be modified)
   - ✅ Same bid ID
   - ✅ Today's date as default (user can change)
3. User can modify any field (especially the date) and submit
4. New interview is created with the SAME stage, just different time/date

### When Scheduling Next (after passing an interview):
1. Interview is marked as COMPLETED_SUCCESS
2. "Schedule Next" button appears
3. Schedule form opens with:
   - ✅ Same company, client, role, recruiter, bid ID
   - ✅ **Next interview type** (HR → Tech 1, Tech 1 → Tech 2, etc.)
   - ✅ **Empty attendees** (different people may attend next stage)
   - ✅ Today's date as default

## Key Difference

| Aspect | Reschedule | Schedule Next |
|--------|-----------|---------------|
| Interview Type | **Same stage** | **Next stage** |
| Attendees | **Pre-filled** | **Empty** |
| Trigger | Cancel with "Rescheduled" | Pass interview |
| Purpose | Change time/date | Progress to next round |

## Files Modified
- `packages/frontend/src/components/InterviewForm.tsx` - Pre-fill attendees for reschedule
- `INTERVIEW_CANCELLATION_FEATURE.md` - Updated documentation to clarify behavior

## Compilation Status
✅ TypeScript diagnostics pass
✅ No errors

## User Experience
When a user cancels an interview for rescheduling:
1. They see the modal with "Rescheduled" option
2. They select it and confirm
3. The schedule form opens with:
   - Title: "Reschedule Interview"
   - Info alert: "Rescheduling interview - only date and attendees can be modified"
   - All fields pre-filled and **disabled** except:
     - Interview Date (editable)
     - Attendees (can add/remove)
4. They change the date and optionally modify attendees
5. They submit and the interview is rescheduled at the same stage

This makes rescheduling very quick and easy - just change the date and submit! The disabled fields prevent accidental changes to the interview details.
