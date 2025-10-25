-- ============================================================================
-- QUICK: Grant Admin Privileges
-- Copy this entire script and run it in Supabase SQL Editor
-- ============================================================================

-- Replace 'k@mail.com' with your email if different
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
    ('view_all_users'),
    ('view_audit_logs'),
    ('manage_all_events'),
    ('approve_events'),
    ('create_events'),
    ('view_all_events'),
    ('view_all_availability'),
    ('manage_classes'),
    ('manage_templates')
) AS priv(privilege_id)
WHERE p.email = 'k@mail.com'
ON CONFLICT (user_id, privilege_id) DO NOTHING;

-- Verify it worked - should show 11 privileges
SELECT 
  p.email,
  p.full_name,
  COUNT(*) as privilege_count,
  array_agg(pr.name) as privileges
FROM profiles p
JOIN user_privileges up ON up.user_id = p.id
JOIN privileges pr ON pr.id = up.privilege_id
WHERE p.email = 'k@mail.com'
GROUP BY p.email, p.full_name;
