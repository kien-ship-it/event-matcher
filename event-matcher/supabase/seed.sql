-- Seed file for local development
-- Creates a test admin user with all privileges

-- Create a test admin user in auth.users
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'admin@test.com',
  crypt('admin123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Admin User","role_id":"hr"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- The profile should be created automatically by the trigger
-- But let's make sure it exists
INSERT INTO public.profiles (id, email, full_name, role_id)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
  'admin@test.com',
  'Admin User',
  'hr'
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role_id = EXCLUDED.role_id;

-- Grant all admin privileges
INSERT INTO user_privileges (user_id, privilege_id, granted_by)
VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'assign_privileges', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'manage_users', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'view_audit_logs', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'manage_all_events', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'approve_events', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'create_events', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'view_all_events', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'view_all_availability', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'view_all_users', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'manage_classes', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'manage_templates', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid)
ON CONFLICT (user_id, privilege_id) DO NOTHING;

-- Create some test users
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'teacher1@test.com', crypt('test123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Teacher One","role_id":"teacher"}', NOW(), NOW(), '', '', '', ''),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'student1@test.com', crypt('test123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Student One","role_id":"student"}', NOW(), NOW(), '', '', '', ''),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'student2@test.com', crypt('test123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Student Two","role_id":"student"}', NOW(), NOW(), '', '', '', '')
ON CONFLICT DO NOTHING;
