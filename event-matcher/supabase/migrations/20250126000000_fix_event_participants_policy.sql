-- Fix event_participants RLS policy to allow users with view_all_events privilege
-- This allows admins to see all event participations when building availability heatmaps

-- Drop the old policy
DROP POLICY IF EXISTS "Users can view their participations OR privileged users can man" ON event_participants;

-- Create new policy with proper privilege check
CREATE POLICY "Users can view their participations OR privileged users can view all" ON event_participants
  FOR SELECT USING (
    (SELECT auth.uid()) = user_id 
    OR user_has_privilege((SELECT auth.uid()), 'view_all_events')
    OR user_has_privilege((SELECT auth.uid()), 'create_events')
  );
