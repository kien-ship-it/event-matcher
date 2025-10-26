# Fix for Event Participants RLS Policy

## Problem
The RLS policy on `event_participants` table was blocking admins from viewing other users' event participations. The policy only checked for `create_events` privilege, but admins viewing the availability heatmap have `view_all_events` privilege instead.

## Root Cause
Inconsistent privilege checks between tables:
- **events table**: Checks for `view_all_events` ✓
- **event_participants table**: Only checks for `create_events` ✗

## Solution
Update the `event_participants` SELECT policy to also check for `view_all_events` privilege.

## How to Apply

### Option 1: Run Migration (Recommended)
```bash
# If using Supabase CLI
supabase migration up

# Or apply the specific migration
supabase db push
```

### Option 2: Run SQL Directly
Open your Supabase SQL Editor and run:

```sql
-- Drop the old policy
DROP POLICY IF EXISTS "Users can view their participations OR privileged users can man" ON event_participants;

-- Create new policy with proper privilege check
CREATE POLICY "Users can view their participations OR privileged users can view all" ON event_participants
  FOR SELECT USING (
    (SELECT auth.uid()) = user_id 
    OR user_has_privilege((SELECT auth.uid()), 'view_all_events')
    OR user_has_privilege((SELECT auth.uid()), 'create_events')
  );
```

## Verification

After applying the fix, check the browser console. You should now see:

```
🔍 getEventsForUsers called with: {userIds: [...], userCount: 2, ...}
📊 event_participants query result: {rowsFound: X, data: [...]}
📋 Found event IDs: [...]
getEventsForUsers: Found X events
  - Recurring: Y
  - One-off: Z
```

## Why This Works

The new policy allows three types of access:
1. **Users viewing their own participations**: `auth.uid() = user_id`
2. **Admins with view_all_events**: Can see all participations (for availability heatmap)
3. **Users with create_events**: Can see all participations (for event management)

This makes the policy consistent with the `events` table and allows the availability heatmap to function correctly.
