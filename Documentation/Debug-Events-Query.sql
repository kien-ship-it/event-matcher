-- Diagnostic queries to check why getEventsForUsers returns 0 events

-- 1. Check if there are any events in the database
SELECT 
  id, 
  title, 
  event_type,
  is_recurring,
  start_time,
  end_time,
  recurrence_pattern,
  created_at
FROM events
ORDER BY created_at DESC
LIMIT 10;

-- 2. Check if there are any event participants
SELECT 
  ep.event_id,
  ep.user_id,
  e.title as event_title,
  e.is_recurring,
  p.full_name as participant_name,
  p.email as participant_email
FROM event_participants ep
JOIN events e ON ep.event_id = e.id
JOIN profiles p ON ep.user_id = p.id
ORDER BY ep.added_at DESC
LIMIT 10;

-- 3. Check specific users (replace with actual user IDs from your participants)
-- Get this from the console log: "Querying event_participants table for user IDs: [...]"
SELECT 
  p.id,
  p.full_name,
  p.email,
  COUNT(ep.event_id) as event_count
FROM profiles p
LEFT JOIN event_participants ep ON p.id = ep.user_id
WHERE p.id IN (
  -- Replace these with actual user IDs from the console log
  'user-id-1',
  'user-id-2'
)
GROUP BY p.id, p.full_name, p.email;

-- 4. Check if events exist but aren't linked to participants
SELECT 
  e.id,
  e.title,
  e.event_type,
  e.is_recurring,
  e.created_by,
  COUNT(ep.user_id) as participant_count
FROM events e
LEFT JOIN event_participants ep ON e.id = ep.event_id
GROUP BY e.id, e.title, e.event_type, e.is_recurring, e.created_by
HAVING COUNT(ep.user_id) = 0
ORDER BY e.created_at DESC;

-- 5. Check recurring events specifically
SELECT 
  e.id,
  e.title,
  e.is_recurring,
  e.recurrence_pattern,
  e.start_time,
  e.end_time,
  e.recurrence_end_date,
  COUNT(ep.user_id) as participant_count
FROM events e
LEFT JOIN event_participants ep ON e.id = ep.event_id
WHERE e.is_recurring = true
GROUP BY e.id, e.title, e.is_recurring, e.recurrence_pattern, e.start_time, e.end_time, e.recurrence_end_date;
