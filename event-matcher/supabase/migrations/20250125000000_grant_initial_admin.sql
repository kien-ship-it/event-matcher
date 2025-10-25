-- ============================================================================
-- Grant Initial Admin Privileges
-- Run this migration to give the first user admin access
-- ============================================================================

-- IMPORTANT: Replace 'your-email@example.com' with your actual email address

DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Get the user ID by email (CHANGE THIS EMAIL!)
  SELECT id INTO admin_user_id
  FROM profiles
  WHERE email = 'k@mail.com'  -- ⚠️ CHANGE THIS TO YOUR EMAIL
  LIMIT 1;

  -- Check if user was found
  IF admin_user_id IS NULL THEN
    RAISE NOTICE 'User not found. Please update the email in this migration.';
    RETURN;
  END IF;

  -- Grant all admin privileges to this user
  INSERT INTO user_privileges (user_id, privilege_id, granted_by)
  VALUES
    (admin_user_id, 'assign_privileges', admin_user_id),
    (admin_user_id, 'manage_users', admin_user_id),
    (admin_user_id, 'view_audit_logs', admin_user_id),
    (admin_user_id, 'manage_all_events', admin_user_id),
    (admin_user_id, 'approve_events', admin_user_id),
    (admin_user_id, 'create_events', admin_user_id),
    (admin_user_id, 'view_all_events', admin_user_id),
    (admin_user_id, 'view_all_availability', admin_user_id),
    (admin_user_id, 'view_all_users', admin_user_id),
    (admin_user_id, 'manage_classes', admin_user_id),
    (admin_user_id, 'manage_templates', admin_user_id)
  ON CONFLICT (user_id, privilege_id) DO NOTHING;

  RAISE NOTICE 'Admin privileges granted to user: %', admin_user_id;
END $$;
