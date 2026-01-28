# Interview Cancellation with Reasons Feature

## Overview
Implemented interview cancellation with two distinct reasons that trigger different business logic:
- **ROLE_CLOSED**: Treats cancellation like a failure - marks bid as INTERVIEW_FAILED and records in company history
- **RESCHEDULED**: Opens schedule form to reschedule the same interview stage, keeping bid in INTERVIEW_STAGE

## Implementation Details

### Backend Changes

#### 1. Domain Model (`packages/backend/src/domain/Interview.ts`)
- Added `CancellationReason` enum with two values: `ROLE_CLOSED` and `RESCHEDULED`
- Added private `_cancellationReason` field to Interview class
- Added getter `cancellationReason()` for the field
- Updated `markAsCancelled()` method to accept optional `cancellationReason` parameter
- Updated `toJSON()` to include `cancellationReason` in serialization

#### 2. Use Case (`packages/backend/src/application/CancelInterviewUseCase.ts`)
**NEW FILE** - Handles interview cancellation business logic:
- Accepts `interviewId` and `cancellationReason` as input
- Marks interview as cancelled with the provided reason
- **If ROLE_CLOSED**:
  - Marks associated bid as INTERVIEW_FAILED (if bid is in INTERVIEW_STAGE)
  - Records failure in company history (company, role, recruiter, attendees)
- **If RESCHEDULED**:
  - Keeps bid in INTERVIEW_STAGE for rescheduling
  - No additional action needed

#### 3. Controller (`packages/backend/src/infrastructure/InterviewController.ts`)
- Updated imports to include `CancelInterviewUseCase` and `CancellationReason`
- Added `cancelInterviewUseCase` to constructor parameters
- Updated `cancelInterview()` endpoint to:
  - Accept `cancellationReason` in request body
  - Validate that reason is either "Role Closed" or "Rescheduled"
  - Delegate to `CancelInterviewUseCase` instead of directly calling domain method

#### 4. Repository (`packages/backend/src/infrastructure/MongoDBInterviewRepository.ts`)
- Added `cancellationReason` field to `InterviewDocument` interface
- Updated `toDocument()` to include `cancellationReason` in MongoDB document
- Updated `toDomain()` to restore `_cancellationReason` field when reconstructing Interview object

#### 5. Dependency Injection (`packages/backend/src/infrastructure/container.ts`)
- Added import for `CancelInterviewUseCase`
- Added `cancelInterviewUseCase` property to Container class
- Initialized `cancelInterviewUseCase` in `initialize()` method with required dependencies

#### 6. Server (`packages/backend/src/infrastructure/server.ts`)
- Updated `InterviewController` instantiation to pass `cancelInterviewUseCase` parameter

### Frontend Changes

#### 1. Types (`packages/frontend/src/api/types.ts`)
- Added `CancellationReason` enum matching backend
- Added `cancellationReason` optional field to `Interview` interface

#### 2. API Client (`packages/frontend/src/api/client.ts`)
- Updated `cancelInterview()` method signature to accept `cancellationReason` parameter
- Changed return type to `{ success: boolean; message: string }` to match backend response

#### 3. Cancellation Modal (`packages/frontend/src/components/InterviewCancellationReasonModal.tsx`)
**NEW FILE** - Modal component for selecting cancellation reason:
- Displays two radio options: "Role Closed" and "Rescheduled"
- Shows descriptive text for each option explaining the consequences
- Validates that a reason is selected before allowing confirmation
- Styled similar to `InterviewFailureReasonModal` for consistency

#### 4. Interview List (`packages/frontend/src/components/InterviewList.tsx`)
- Added imports for `CancellationReason` and `InterviewCancellationReasonModal`
- Added state for cancellation modal: `cancellationModalOpen` and `selectedInterviewForCancellation`
- Changed Cancel button to open modal instead of directly calling API
- Added `handleCancelInterviewClick()` to show modal
- Replaced `handleCancelInterview()` to:
  - Accept `CancellationReason` parameter
  - Call API with selected reason
  - If RESCHEDULED: trigger `onScheduleNext` with the same interview (not next stage)
  - If ROLE_CLOSED: just refresh data
  - Show appropriate snackbar message
- Added `InterviewCancellationReasonModal` component at bottom of render

#### 5. Interview Dashboard (`packages/frontend/src/pages/InterviewDashboard.tsx`)
- Added `'reschedule'` to `ViewMode` type
- Added `rescheduleInterview` state variable
- Updated `handleScheduleNext()` to detect reschedule vs schedule next:
  - If interview status is CANCELLED with reason RESCHEDULED: set reschedule mode
  - Otherwise: set schedule next mode
- Added `handleRescheduleSuccess()` callback
- Updated `handleCancel()` to clear `rescheduleInterview` state
- Added reschedule view mode rendering with `InterviewForm` component

#### 6. Interview Form (`packages/frontend/src/components/InterviewForm.tsx`)
- Added `rescheduleInterview` optional prop
- Added `isRescheduleMode` flag to detect reschedule mode
- Updated logic to use `rescheduleInterview || baseInterview` as source
- For reschedule: keeps same `interviewType` AND pre-fills attendees (doesn't advance to next stage)
- For schedule next: advances to next `interviewType` with empty attendees
- Only passes `baseInterviewId` for schedule next (not for reschedule)
- **Disabled fields in reschedule mode**: All fields except Interview Date and Attendees
- Shows "Reschedule Interview" title and info alert in reschedule mode

## User Flow

### Cancelling an Interview
1. User clicks "Cancel" button on a SCHEDULED interview
2. Modal appears with two options:
   - **Role Closed**: "Bid will be marked as failed and recorded in company history"
   - **Rescheduled**: "Opens schedule form to reschedule the same interview stage"
3. User selects a reason and clicks "Confirm Cancellation"
4. Interview is marked as CANCELLED with the selected reason

### After Cancellation - Role Closed
- Bid status changes to INTERVIEW_FAILED
- Failure is recorded in company history
- Interview appears as CANCELLED in the list
- No further actions available

### After Cancellation - Rescheduled
- Bid status remains in INTERVIEW_STAGE
- Schedule form opens automatically with:
  - Same company, client, role, recruiter
  - **Same interview type** (e.g., if HR was cancelled, reschedule HR - NOT the next stage)
  - Same attendees list (pre-filled from cancelled interview)
  - Today's date as default
- **All fields are disabled except**:
  - Interview Date (can be changed)
  - Attendees (can be added/removed)
- User changes the date and optionally modifies attendees, then submits
- **Important**: Rescheduling does NOT progress the interview stage - it's just changing the time/date

## Business Rules

### Role Closed Cancellation
- Treated exactly like an interview failure
- Bid must be in INTERVIEW_STAGE to be marked as INTERVIEW_FAILED
- Records in company history prevent future interviews with same recruiter/attendees
- Cannot rebid unless failure reason would have allowed it

### Rescheduled Cancellation
- Does NOT affect bid status
- Does NOT record in company history
- Allows immediate rescheduling of the same interview stage
- **Does NOT progress to next stage** - keeps the same interview type (just changing time/date)
- Pre-fills all interview details including attendees for easy rescheduling

## Testing Considerations

### Backend Tests Needed
- `CancelInterviewUseCase` unit tests:
  - Test ROLE_CLOSED marks bid as failed
  - Test ROLE_CLOSED records in company history
  - Test RESCHEDULED keeps bid in INTERVIEW_STAGE
  - Test RESCHEDULED does not record in company history
  - Test error handling for invalid interview ID

### Frontend Tests Needed
- `InterviewCancellationReasonModal` component tests:
  - Test modal opens and closes correctly
  - Test reason selection
  - Test confirm button disabled when no reason selected
- `InterviewList` integration tests:
  - Test cancel button opens modal
  - Test ROLE_CLOSED flow
  - Test RESCHEDULED flow triggers schedule form

## Database Schema Changes

### MongoDB Interview Collection
Added field:
- `cancellationReason`: string | null (values: "Role Closed" or "Rescheduled")

No migration needed - field is optional and defaults to null for existing documents.

## API Changes

### POST /api/interviews/:id/cancel
**Request Body:**
```json
{
  "cancellationReason": "Role Closed" | "Rescheduled"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Interview cancelled due to role closure. Bid marked as failed and recorded in company history."
}
```
or
```json
{
  "success": true,
  "message": "Interview cancelled for rescheduling. Bid remains in interview stage."
}
```

**Validation:**
- `cancellationReason` is required
- Must be either "Role Closed" or "Rescheduled"

## Files Modified

### Backend
- `packages/backend/src/domain/Interview.ts`
- `packages/backend/src/application/CancelInterviewUseCase.ts` (NEW)
- `packages/backend/src/infrastructure/InterviewController.ts`
- `packages/backend/src/infrastructure/MongoDBInterviewRepository.ts`
- `packages/backend/src/infrastructure/container.ts`
- `packages/backend/src/infrastructure/server.ts`

### Frontend
- `packages/frontend/src/api/types.ts`
- `packages/frontend/src/api/client.ts`
- `packages/frontend/src/components/InterviewCancellationReasonModal.tsx` (NEW)
- `packages/frontend/src/components/InterviewList.tsx`
- `packages/frontend/src/components/InterviewForm.tsx`
- `packages/frontend/src/pages/InterviewDashboard.tsx`

## Compilation Status
✅ All backend files compile without errors
✅ All frontend files compile without errors
✅ TypeScript diagnostics pass for all modified files

## Next Steps
1. Test the feature manually:
   - Cancel an interview with "Role Closed" reason
   - Verify bid status changes to INTERVIEW_FAILED
   - Verify company history is updated
   - Cancel an interview with "Rescheduled" reason
   - Verify schedule form opens with correct pre-filled data
   - Verify bid status remains in INTERVIEW_STAGE
2. Write unit tests for `CancelInterviewUseCase`
3. Write component tests for `InterviewCancellationReasonModal`
4. Consider adding property-based tests for cancellation logic
