-- Diagnostic queries to check why events aren't showing in availability heatmap
-- Run these in your Supabase SQL Editor

-- 1. Check if any events exist in the database
SELECT 
  id,
  title,
  is_recurring,
  recurrence_pattern,
  start_time,
  end_time,
  created_at
FROM events
ORDER BY created_at DESC
LIMIT 10;

-- 2. Check if any event_participants exist
SELECT 
  ep.event_id,
  ep.user_id,
  p.full_name,
  p.email,
  e.title as event_title,
  e.is_recurring
FROM event_participants ep
JOIN profiles p ON p.id = ep.user_id
JOIN events e ON e.id = ep.event_id
ORDER BY ep.added_at DESC
LIMIT 20;

-- 3. Check specific users (replace with actual user IDs from console log)
-- Look for user IDs in the browser console: "getEventsForUsers called with: { userIds: [...] }"
SELECT 
  p.id,
  p.full_name,
  p.email,
  COUNT(ep.event_id) as event_count
FROM profiles p
LEFT JOIN event_participants ep ON ep.user_id = p.id
WHERE p.id IN (
  -- Replace these with actual user IDs from your console log
  'user-id-1',
  'user-id-2'
)
GROUP BY p.id, p.full_name, p.email;

-- 4. Check for recurring events specifically
SELECT 
  e.id,
  e.title,
  e.is_recurring,
  e.recurrence_pattern,
  e.start_time,
  e.end_time,
  COUNT(ep.user_id) as participant_count
FROM events e
LEFT JOIN event_participants ep ON ep.event_id = e.id
WHERE e.is_recurring = true
GROUP BY e.id, e.title, e.is_recurring, e.recurrence_pattern, e.start_time, e.end_time;

-- 5. Check RLS policies (to see if permissions are blocking access)
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('events', 'event_participants')
ORDER BY tablename, policyname;

-- 6. Check current user's privileges
SELECT 
  up.privilege_id,
  pr.name as privilege_name,
  pr.description
FROM user_privileges up
JOIN privileges pr ON pr.id = up.privilege_id
WHERE up.user_id = auth.uid();

-- 7. Create a test recurring event (if none exist)
-- Uncomment and modify as needed:
/*
INSERT INTO events (
  title,
  event_type,
  start_time,
  end_time,
  is_recurring,
  recurrence_pattern,
  created_by
) VALUES (
  'Test Weekly Meeting',
  'meeting',
  '2025-10-27 09:00:00+00',
  '2025-10-27 10:00:00+00',
  true,
  '{"frequency": "weekly", "daysOfWeek": [1]}'::jsonb,  -- Every Monday
  auth.uid()
) RETURNING id;

-- Then add participants (replace event_id and user_ids):
INSERT INTO event_participants (event_id, user_id)
VALUES 
  ('event-id-from-above', 'user-id-1'),
  ('event-id-from-above', 'user-id-2');
*/
