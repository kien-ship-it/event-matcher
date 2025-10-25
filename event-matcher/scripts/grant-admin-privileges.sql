-- ============================================================================
-- Quick Script: Grant Admin Privileges to First User
-- ============================================================================
-- Run this in Supabase SQL Editor to give yourself admin access
-- 
-- INSTRUCTIONS:
-- 1. Go to Supabase Dashboard → SQL Editor
-- 2. Replace 'your-email@example.com' with YOUR email
-- 3. Run this script
-- 4. Refresh your app - you now have admin access!
-- ============================================================================

-- Option 1: Grant to specific email
INSERT INTO user_privileges (user_id, privilege_id, granted_by)
SELECT 
  p.id as user_id,
  priv.privilege_id,
  p.id as granted_by
FROM profiles p
CROSS JOIN (
  VALUES 
    ('assign_privileges'),
    ('manage_users'),
    ('view_audit_logs'),
    ('manage_all_events'),
    ('approve_events'),
    ('create_events'),
    ('view_all_events'),
    ('view_all_availability'),
    ('view_all_users'),
    ('manage_classes'),
    ('manage_templates')
) AS priv(privilege_id)
WHERE p.email = 'your-email@example.com'  -- ⚠️ CHANGE THIS TO YOUR EMAIL
ON CONFLICT (user_id, privilege_id) DO NOTHING;

-- Verify it worked
SELECT 
  p.email,
  p.full_name,
  COUNT(*) as privilege_count
FROM profiles p
JOIN user_privileges up ON up.user_id = p.id
WHERE p.email = 'your-email@example.com'  -- ⚠️ CHANGE THIS TO YOUR EMAIL
GROUP BY p.email, p.full_name;

-- ============================================================================
-- Alternative: Grant to the FIRST user in the system
-- (Use this if you're the only user)
-- ============================================================================

-- Uncomment the lines below to use this method instead:

-- INSERT INTO user_privileges (user_id, privilege_id, granted_by)
-- SELECT 
--   p.id as user_id,
--   priv.privilege_id,
--   p.id as granted_by
-- FROM profiles p
-- CROSS JOIN (
--   VALUES 
--     ('assign_privileges'),
--     ('manage_users'),
--     ('view_audit_logs'),
--     ('manage_all_events'),
--     ('approve_events'),
--     ('create_events'),
--     ('view_all_events'),
--     ('view_all_availability'),
--     ('view_all_users'),
--     ('manage_classes'),
--     ('manage_templates')
-- ) AS priv(privilege_id)
-- ORDER BY p.created_at ASC
-- LIMIT 11  -- 11 privileges for 1 user
-- ON CONFLICT (user_id, privilege_id) DO NOTHING;
