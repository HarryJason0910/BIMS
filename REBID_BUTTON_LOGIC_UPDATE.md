# Rebid Button Logic Update

## Changes Implemented

### 1. ✅ New Bid Date is Today
**Status:** Already implemented

When a rebid is created, the `Bid.create()` method automatically sets the date to today:
```typescript
// Set date to today
const today = new Date();
today.setHours(0, 0, 0, 0);
```

This means every new bid (including rebids) will have today's date, not the original bid's date.

### 2. ✅ Rebid Status Tracked in Database
**Status:** Newly implemented

Added `hasBeenRebid` field to the Bid domain model to permanently track whether a bid has been rebid on.

**Implementation:**
- Added `hasBeenRebid` boolean field to Bid domain model
- Added `markAsRebid()` method to set this flag (cannot be unset once set)
- Updated `RebidWithNewResumeUseCase` to mark original bid as rebid after creating new bid
- Updated frontend to check `hasBeenRebid` field instead of checking for active bids
- Once a bid is rebid, the Rebid button is permanently disabled for that bid

**Backend Changes:**
```typescript
// Bid domain model
private _hasBeenRebid: boolean = false

get hasBeenRebid(): boolean {
  return this._hasBeenRebid;
}

markAsRebid(): void {
  this._hasBeenRebid = true;
}
```

**Use Case Update:**
```typescript
// After creating new bid, mark original as rebid
originalBid.markAsRebid();
await this.bidRepository.update(originalBid);
```

**Frontend Logic:**
```typescript
const canRebid = (bid: Bid): boolean => {
  // Cannot rebid if this bid has already been rebid
  if (bid.hasBeenRebid) {
    return false;
  }
  return true;
};
```

## User Experience

### Scenario 1: First Rebid
- User has a rejected bid for "Company A - Full Stack Engineer"
- `hasBeenRebid` is `false`
- **Result:** Rebid button is **enabled** ✅
- User clicks Rebid and creates new bid
- Original bid's `hasBeenRebid` is set to `true` in database
- Rebid button becomes **permanently disabled** ❌

### Scenario 2: After Rebid
- User has a rejected bid with `hasBeenRebid = true`
- **Result:** Rebid button is **disabled** with tooltip: "Cannot rebid - this bid has already been rebid" ❌
- This status persists even if:
  - The new bid is rejected
  - The new bid is deleted
  - User refreshes the page
  - User logs out and back in

### Scenario 3: New Bid Created from Rebid
- New bid has:
  - **Date:** Today's date (not the original bid's date)
  - **Status:** NEW
  - **originalBidId:** Points to the original rejected bid
  - **hasBeenRebid:** false (can be rebid again if rejected)

## Business Logic

### Rebid Allowed When:
1. ✅ Bid is REJECTED
2. ✅ Rejection reason is "Unsatisfied Resume" OR interview failed with rebiddable reason
3. ✅ **NEW:** `hasBeenRebid` is `false`

### Rebid Blocked When:
1. ❌ Bid is not REJECTED
2. ❌ Rejection reason is "Role Closed"
3. ❌ Interview failed with non-rebiddable reason (HR: Bilingual/Not Remote)
4. ❌ **NEW:** `hasBeenRebid` is `true` (bid has already been rebid)

## Database Schema

### Bid Collection
```typescript
{
  id: string,
  date: Date,
  company: string,
  role: string,
  status: BidStatus,
  rejectionReason: RejectionReason | null,
  originalBidId: string | null,
  hasBeenRebid: boolean,  // NEW FIELD
  // ... other fields
}
```

## Files Modified

### Backend
- `packages/backend/src/domain/Bid.ts`
  - Added `_hasBeenRebid` private field
  - Added `hasBeenRebid` getter
  - Added `markAsRebid()` method
  - Updated constructor to include `hasBeenRebid` parameter
  - Updated `toJSON()` to include `hasBeenRebid`

- `packages/backend/src/application/RebidWithNewResumeUseCase.ts`
  - Added logic to mark original bid as rebid after creating new bid
  - Calls `originalBid.markAsRebid()` and updates repository

- `packages/backend/src/infrastructure/BidController.ts`
  - Updated serialization to include `hasBeenRebid` field

### Frontend
- `packages/frontend/src/api/types.ts`
  - Added `hasBeenRebid?: boolean` to Bid interface

- `packages/frontend/src/components/BidList.tsx`
  - Updated `canRebid()` to check `hasBeenRebid` field
  - Updated tooltip message
  - Removed complex active bid checking logic

## Testing Instructions

1. **Test Rebid Status Persistence:**
   - Create Bid A for "Company X - Role Y"
   - Reject Bid A with "Unsatisfied Resume"
   - Verify Rebid button is **enabled**
   - Click Rebid and create Bid B
   - Verify Rebid button on Bid A is now **disabled**
   - Refresh the page
   - Verify Rebid button on Bid A is still **disabled** (persisted in DB)

2. **Test New Bid Date:**
   - Create a bid on Day 1
   - Reject it with "Unsatisfied Resume"
   - Wait until Day 2
   - Click Rebid
   - Verify new bid has Day 2 as the date (not Day 1)

3. **Test Rebid Chain:**
   - Create Bid A, reject it, rebid → creates Bid B
   - Bid A: `hasBeenRebid = true`, Rebid button disabled
   - Bid B: `hasBeenRebid = false`, `originalBidId = Bid A's ID`
   - Reject Bid B with "Unsatisfied Resume"
   - Verify Rebid button on Bid B is **enabled**
   - Click Rebid on Bid B → creates Bid C
   - Bid B: `hasBeenRebid = true`, Rebid button disabled
   - Bid C: `hasBeenRebid = false`, `originalBidId = Bid B's ID`

4. **Test Tooltip:**
   - Hover over disabled Rebid button
   - Verify tooltip shows: "Cannot rebid - this bid has already been rebid"

## Migration Notes

**Important:** Existing bids in the database will not have the `hasBeenRebid` field. The system will treat `undefined` as `false`, so existing rejected bids will still show the Rebid button enabled (which is correct behavior).

If you need to migrate existing data:
```javascript
// MongoDB migration script
db.bids.updateMany(
  { hasBeenRebid: { $exists: false } },
  { $set: { hasBeenRebid: false } }
);
```

## Summary

Both requirements have been implemented with proper database persistence:
1. ✅ New rebid date is today (already working)
2. ✅ Rebid status tracked in database with `hasBeenRebid` field (newly added)

The system now:
- Permanently tracks which bids have been rebid on
- Prevents multiple rebids on the same bid
- Persists rebid status across sessions
- Provides clear feedback with tooltips
- Maintains data integrity in the database

This is a much more robust solution than checking for active bids, as it:
- Works even if the new bid is deleted
- Persists across page refreshes and sessions
- Provides accurate historical tracking
- Prevents edge cases and race conditions

