# Schedule Next Interview Tracking - Implementation Complete

## Overview
Added permanent tracking for "Schedule Next" button status to prevent scheduling multiple next interviews from the same base interview. Similar to the `hasBeenRebid` implementation for bids.

## Problem
When a user passed an interview and clicked "Schedule Next", the button remained enabled, allowing them to schedule multiple next interviews from the same base interview.

## Solution
Added a `hasScheduledNext` boolean field to the Interview domain model that permanently tracks whether a next interview has been scheduled from this interview.

## Changes Made

### Backend Changes

#### 1. Domain Model (`packages/backend/src/domain/Interview.ts`)
- Added `_hasScheduledNext: boolean = false` private field to Interview constructor
- Added `hasScheduledNext` getter property
- Added `markAsScheduledNext()` method to permanently mark interview as having scheduled next
- Updated `toJSON()` to include `hasScheduledNext` field

#### 2. Use Case (`packages/backend/src/application/ScheduleInterviewUseCase.ts`)
- Added `baseInterviewId?: string` to `ScheduleInterviewRequest` interface
- Added step 8 in execute flow: When `baseInterviewId` is provided, fetch the base interview and call `markAsScheduledNext()`
- Updated the base interview in repository after marking

#### 3. Controller (`packages/backend/src/infrastructure/InterviewController.ts`)
- Added `baseInterviewId` to request body destructuring in `scheduleInterview` method
- Passed `baseInterviewId` to use case execution

#### 4. Repository (`packages/backend/src/infrastructure/MongoDBInterviewRepository.ts`)
- Added `hasScheduledNext: boolean` to `InterviewDocument` interface
- Updated `toDocument()` to include `hasScheduledNext` field
- Updated `toDomain()` to restore `_hasScheduledNext` field using `Object.defineProperty`

### Frontend Changes

#### 1. Types (`packages/frontend/src/api/types.ts`)
- Added `hasScheduledNext?: boolean` to `Interview` interface
- Added `baseInterviewId?: string` to `ScheduleInterviewRequest` interface

#### 2. Interview Form (`packages/frontend/src/components/InterviewForm.tsx`)
- Updated initial `formData` state to include `baseInterviewId: baseInterview?.id`
- This passes the base interview ID when scheduling next interview

#### 3. Interview List (`packages/frontend/src/components/InterviewList.tsx`)
- Updated "Schedule Next" button to check `interview.hasScheduledNext`
- Button is disabled when `hasScheduledNext` is true
- Button text changes to "Next Scheduled" when disabled

## Workflow

1. User passes an interview (status becomes COMPLETED_SUCCESS)
2. "Schedule Next" button appears (if there's a next stage)
3. User clicks "Schedule Next" → opens form pre-filled with base interview data
4. User submits form → new interview is created
5. Backend marks base interview as `hasScheduledNext = true`
6. Button becomes disabled and shows "Next Scheduled"
7. Status is permanent in database

## Database Field
- **Field**: `hasScheduledNext` (boolean)
- **Default**: `false`
- **Persistence**: Stored in MongoDB `interviews` collection
- **Behavior**: Once set to `true`, it remains permanent (cannot be undone)

## Benefits
- Prevents duplicate next interview scheduling
- Provides clear visual feedback to user
- Status persists across sessions (stored in database)
- Consistent with rebid tracking pattern

## Testing Recommendations
1. Pass an interview and verify "Schedule Next" button appears
2. Click "Schedule Next" and create next interview
3. Verify button becomes disabled with "Next Scheduled" text
4. Refresh page and verify button remains disabled
5. Check database to confirm `hasScheduledNext: true`

## Related Files
- Backend Domain: `packages/backend/src/domain/Interview.ts`
- Backend Use Case: `packages/backend/src/application/ScheduleInterviewUseCase.ts`
- Backend Controller: `packages/backend/src/infrastructure/InterviewController.ts`
- Backend Repository: `packages/backend/src/infrastructure/MongoDBInterviewRepository.ts`
- Frontend Types: `packages/frontend/src/api/types.ts`
- Frontend Form: `packages/frontend/src/components/InterviewForm.tsx`
- Frontend List: `packages/frontend/src/components/InterviewList.tsx`

## Implementation Date
January 28, 2026
