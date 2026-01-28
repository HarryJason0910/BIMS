# Reschedule Mode - Disabled Fields Update

## Change Summary
Updated the InterviewForm to disable all fields except Interview Date and Attendees when in reschedule mode.

## What Changed

### InterviewForm.tsx

#### 1. Added Reschedule Mode Detection
```typescript
const isRescheduleMode = !!rescheduleInterview;
```

#### 2. Updated Title and Added Info Alert
```typescript
<Typography variant="h5" gutterBottom>
  {isRescheduleMode ? 'Reschedule Interview' : 'Schedule Interview'}
</Typography>

{isRescheduleMode && (
  <Alert severity="info" sx={{ mb: 2 }}>
    Rescheduling interview - only date and attendees can be modified
  </Alert>
)}
```

#### 3. Disabled Fields in Reschedule Mode

All fields now have `disabled={isRescheduleMode}` except Date and Attendees:

**Disabled Fields:**
- ❌ Interview Base (From Bid / LinkedIn Chat)
- ❌ Select Bid
- ❌ Company
- ❌ Client
- ❌ Role
- ❌ Recruiter
- ❌ Interview Type

**Editable Fields:**
- ✅ Interview Date
- ✅ Attendees (can add/remove)

## User Experience

### Before (Old Behavior)
- All fields were editable
- User could accidentally change company, role, interview type, etc.
- Risk of creating wrong interview

### After (New Behavior)
- Only date and attendees are editable
- All other fields are locked (grayed out)
- Clear visual indication that this is a reschedule, not a new interview
- Info alert explains what can be modified
- Prevents accidental changes to interview details

## Visual Changes

### Form Title
- Normal mode: "Schedule Interview"
- Reschedule mode: "Reschedule Interview"

### Info Alert (Reschedule Mode Only)
```
ℹ️ Rescheduling interview - only date and attendees can be modified
```

### Disabled Fields Appearance
- Grayed out text
- No cursor change on hover
- Cannot be clicked or edited
- Values are visible but locked

## Example Scenario

**User cancels HR interview for rescheduling:**

1. Clicks "Cancel" button on scheduled HR interview
2. Selects "Rescheduled" reason in modal
3. Form opens with:
   ```
   Title: "Reschedule Interview"
   Alert: "Rescheduling interview - only date and attendees can be modified"
   
   Interview Base: [From Bid] (disabled, grayed out)
   Select Bid: [Company X - Role Y] (disabled, grayed out)
   Recruiter: [John Doe] (disabled, grayed out)
   Interview Type: [HR] (disabled, grayed out)
   
   Attendees: [Alice, Bob] (editable - can add/remove)
   Interview Date: [2026-01-28] (editable - can change)
   ```
4. User changes date to 2026-02-05
5. User optionally adds/removes attendees
6. User clicks "Schedule Interview"
7. HR interview is rescheduled for new date with updated attendees

## Technical Implementation

### Disabled Prop Pattern
```typescript
<TextField
  disabled={isRescheduleMode}
  // ... other props
/>

<FormControl disabled={isRescheduleMode}>
  <Select>
    // ... options
  </Select>
</FormControl>
```

### Fields NOT Disabled
```typescript
// Date field - no disabled prop
<TextField
  label="Interview Date"
  type="date"
  // ... other props (no disabled)
/>

// Attendees input - no disabled prop
<TextField
  label="Attendees"
  // ... other props (no disabled)
/>

<Button onClick={handleAddAttendee}>
  Add
</Button>
```

## Benefits

1. **Prevents Errors**: Can't accidentally change interview type or company
2. **Clear Intent**: Visual indication that this is a reschedule operation
3. **Faster Workflow**: User focuses only on date and attendees
4. **Better UX**: Less cognitive load - fewer fields to review
5. **Data Integrity**: Ensures rescheduled interview maintains same details

## Files Modified
- `packages/frontend/src/components/InterviewForm.tsx`
- `INTERVIEW_CANCELLATION_FEATURE.md`
- `RESCHEDULE_CLARIFICATION.md`

## Compilation Status
✅ TypeScript diagnostics pass
✅ No errors
✅ Ready for testing

## Testing Checklist
- [ ] Cancel interview with "Rescheduled" reason
- [ ] Verify form title shows "Reschedule Interview"
- [ ] Verify info alert appears
- [ ] Verify all fields except date and attendees are disabled
- [ ] Verify date can be changed
- [ ] Verify attendees can be added/removed
- [ ] Verify disabled fields show correct pre-filled values
- [ ] Verify form submits successfully
- [ ] Verify new interview has same details except date/attendees
