-- ============================================================================
-- Event Matcher Database Schema v2.0
-- Flexible Roles + Privileges Model
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Roles table: Defines organizational roles (extensible)
CREATE TABLE roles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_system_role BOOLEAN DEFAULT false, -- true for teacher/student
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default roles
INSERT INTO roles (id, name, description, is_system_role) VALUES
  ('teacher', 'Teacher', 'Instructors who teach classes', true),
  ('student', 'Student', 'Students enrolled in classes', true),
  ('marketing', 'Marketing', 'Marketing team members', false),
  ('hr', 'Human Resources', 'HR team members', false),
  ('operations', 'Operations', 'Operations team members', false);

-- Privileges table: Defines specific capabilities
CREATE TABLE privileges (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- e.g., 'events', 'users', 'availability', 'system'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default privileges
INSERT INTO privileges (id, name, description, category) VALUES
  -- Event management
  ('approve_events', 'Approve Events', 'Can approve and confirm event requests', 'events'),
  ('create_events', 'Create Events', 'Can create events for others', 'events'),
  ('manage_all_events', 'Manage All Events', 'Can edit/delete any event', 'events'),
  ('view_all_events', 'View All Events', 'Can view all events in the system', 'events'),
  
  -- User management
  ('manage_users', 'Manage Users', 'Can create, edit, and deactivate users', 'users'),
  ('assign_privileges', 'Assign Privileges', 'Can grant/revoke privileges to users', 'users'),
  ('view_all_users', 'View All Users', 'Can view all user profiles', 'users'),
  
  -- Availability
  ('view_all_availability', 'View All Availability', 'Can view everyone''s availability', 'availability'),
  ('view_team_availability', 'View Team Availability', 'Can view availability of assigned team members', 'availability'),
  
  -- Classes
  ('manage_classes', 'Manage Classes', 'Can create and manage class assignments', 'classes'),
  
  -- System
  ('view_audit_logs', 'View Audit Logs', 'Can view system audit logs', 'system'),
  ('manage_templates', 'Manage Templates', 'Can create and edit event templates', 'system');

-- Role privileges: Default privileges granted to each role
CREATE TABLE role_privileges (
  role_id TEXT REFERENCES roles(id) ON DELETE CASCADE,
  privilege_id TEXT REFERENCES privileges(id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (role_id, privilege_id)
);

-- Grant default privileges to roles
INSERT INTO role_privileges (role_id, privilege_id) VALUES
  -- Marketing: Can view calendars and availability
  ('marketing', 'view_all_events'),
  ('marketing', 'view_all_availability'),
  
  -- HR: Can view everything, manage users and classes
  ('hr', 'view_all_events'),
  ('hr', 'view_all_availability'),
  ('hr', 'view_all_users'),
  ('hr', 'manage_users'),
  ('hr', 'manage_classes'),
  
  -- Operations: Can view calendars and availability
  ('operations', 'view_all_events'),
  ('operations', 'view_all_availability'),
  
  -- Teachers: Can view assigned students' availability
  ('teacher', 'view_team_availability');

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role_id TEXT NOT NULL REFERENCES roles(id),
  avatar_url TEXT,
  notification_preferences JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- User privileges: Additional privileges granted to specific users
CREATE TABLE user_privileges (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  privilege_id TEXT REFERENCES privileges(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  granted_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, privilege_id)
);

-- Helper view: All privileges a user has (role + user-specific)
CREATE VIEW user_all_privileges AS
SELECT DISTINCT
  p.id AS user_id,
  priv.id AS privilege_id,
  priv.name AS privilege_name,
  priv.category,
  CASE 
    WHEN up.user_id IS NOT NULL THEN 'user'
    ELSE 'role'
  END AS source
FROM profiles p
JOIN roles r ON p.role_id = r.id
LEFT JOIN role_privileges rp ON rp.role_id = r.id
LEFT JOIN user_privileges up ON up.user_id = p.id
LEFT JOIN privileges priv ON priv.id = COALESCE(up.privilege_id, rp.privilege_id)
WHERE priv.id IS NOT NULL;

-- ============================================================================
-- DOMAIN TABLES
-- ============================================================================

-- Classes table
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  teacher_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Class enrollments
CREATE TABLE class_enrollments (
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (class_id, student_id)
);

-- Availability
CREATE TABLE availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  is_recurring BOOLEAN DEFAULT false,
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
  recurrence_end_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Events
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (length(title) <= 100),
  event_type TEXT NOT NULL CHECK (event_type IN ('class', 'meeting', 'training', 'internal')),
  subject TEXT,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  location TEXT,
  meeting_link TEXT,
  attachments TEXT[],
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern JSONB,
  recurrence_end_date DATE,
  parent_event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT valid_event_duration CHECK (end_time > start_time)
);

-- Event participants
CREATE TABLE event_participants (
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (event_id, user_id)
);

-- Event requests
CREATE TABLE event_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requestor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  requested_participants UUID[] NOT NULL,
  proposed_start_time TIMESTAMPTZ NOT NULL,
  proposed_end_time TIMESTAMPTZ NOT NULL,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
  decline_reason TEXT,
  processed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT valid_decline CHECK (status != 'declined' OR decline_reason IS NOT NULL)
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_id UUID,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Event templates
CREATE TABLE event_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('class', 'meeting', 'training', 'internal')),
  subject TEXT,
  description TEXT,
  default_duration_minutes INTEGER NOT NULL,
  location TEXT,
  recurrence_pattern JSONB,
  category TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Filter presets
CREATE TABLE filter_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  filter_config JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Audit logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_profiles_role ON profiles(role_id);
CREATE INDEX idx_profiles_active ON profiles(is_active);
CREATE INDEX idx_user_privileges_user ON user_privileges(user_id);
CREATE INDEX idx_availability_user_time ON availability(user_id, start_time, end_time);
CREATE INDEX idx_events_time ON events(start_time, end_time);
CREATE INDEX idx_events_recurring ON events(is_recurring, parent_event_id);
CREATE INDEX idx_events_created_by ON events(created_by);
CREATE INDEX idx_event_participants_user ON event_participants(user_id);
CREATE INDEX idx_event_requests_status ON event_requests(status, created_at);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read, created_at);
CREATE INDEX idx_event_templates_created_by ON event_templates(created_by);
CREATE INDEX idx_filter_presets_user ON filter_presets(user_id);
CREATE INDEX idx_classes_teacher ON classes(teacher_id);
CREATE INDEX idx_class_enrollments_student ON class_enrollments(student_id);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to check if user has a specific privilege
CREATE OR REPLACE FUNCTION user_has_privilege(user_uuid UUID, privilege_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_all_privileges
    WHERE user_id = user_uuid AND privilege_id = privilege_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'role_id', 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_availability_updated_at BEFORE UPDATE ON availability
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_templates_updated_at BEFORE UPDATE ON event_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_filter_presets_updated_at BEFORE UPDATE ON filter_presets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE privileges ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_privileges ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_privileges ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE filter_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Roles: Everyone can view roles
CREATE POLICY "Anyone can view roles" ON roles FOR SELECT USING (true);

-- Privileges: Everyone can view privileges
CREATE POLICY "Anyone can view privileges" ON privileges FOR SELECT USING (true);

-- Role privileges: Everyone can view role privileges
CREATE POLICY "Anyone can view role privileges" ON role_privileges FOR SELECT USING (true);

-- Profiles: Users can view own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Profiles: Users with view_all_users privilege can view all
CREATE POLICY "Privileged users can view all profiles" ON profiles
  FOR SELECT USING (user_has_privilege(auth.uid(), 'view_all_users'));

-- Profiles: Users with manage_users can insert/update/delete
CREATE POLICY "Privileged users can manage profiles" ON profiles
  FOR ALL USING (user_has_privilege(auth.uid(), 'manage_users'));

-- User privileges: Users can view own privileges
CREATE POLICY "Users can view own privileges" ON user_privileges
  FOR SELECT USING (auth.uid() = user_id);

-- User privileges: Users with assign_privileges can manage
CREATE POLICY "Privileged users can manage user privileges" ON user_privileges
  FOR ALL USING (user_has_privilege(auth.uid(), 'assign_privileges'));

-- Classes: Everyone can view classes
CREATE POLICY "Anyone can view classes" ON classes FOR SELECT USING (true);

-- Classes: Users with manage_classes can manage
CREATE POLICY "Privileged users can manage classes" ON classes
  FOR ALL USING (user_has_privilege(auth.uid(), 'manage_classes'));

-- Class enrollments: Everyone can view enrollments
CREATE POLICY "Anyone can view enrollments" ON class_enrollments FOR SELECT USING (true);

-- Class enrollments: Users with manage_classes can manage
CREATE POLICY "Privileged users can manage enrollments" ON class_enrollments
  FOR ALL USING (user_has_privilege(auth.uid(), 'manage_classes'));

-- Availability: Users can manage own availability
CREATE POLICY "Users can manage own availability" ON availability
  FOR ALL USING (auth.uid() = user_id);

-- Availability: Users with view_all_availability can view all
CREATE POLICY "Privileged users can view all availability" ON availability
  FOR SELECT USING (user_has_privilege(auth.uid(), 'view_all_availability'));

-- Availability: Teachers can view assigned students' availability
CREATE POLICY "Teachers can view assigned students availability" ON availability
  FOR SELECT USING (
    user_has_privilege(auth.uid(), 'view_team_availability')
    AND EXISTS (
      SELECT 1 FROM class_enrollments ce
      JOIN classes c ON c.id = ce.class_id
      WHERE ce.student_id = availability.user_id
        AND c.teacher_id = auth.uid()
    )
  );

-- Events: Users can view events they participate in
CREATE POLICY "Users can view their events" ON events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM event_participants
      WHERE event_id = events.id AND user_id = auth.uid()
    )
  );

-- Events: Users with view_all_events can view all
CREATE POLICY "Privileged users can view all events" ON events
  FOR SELECT USING (user_has_privilege(auth.uid(), 'view_all_events'));

-- Events: Users with create_events can create
CREATE POLICY "Privileged users can create events" ON events
  FOR INSERT WITH CHECK (user_has_privilege(auth.uid(), 'create_events'));

-- Events: Users with manage_all_events can update/delete
CREATE POLICY "Privileged users can manage events" ON events
  FOR UPDATE USING (user_has_privilege(auth.uid(), 'manage_all_events'));

CREATE POLICY "Privileged users can delete events" ON events
  FOR DELETE USING (user_has_privilege(auth.uid(), 'manage_all_events'));

-- Event participants: Users can view their participations
CREATE POLICY "Users can view their participations" ON event_participants
  FOR SELECT USING (auth.uid() = user_id);

-- Event participants: Users with create_events can manage
CREATE POLICY "Privileged users can manage participants" ON event_participants
  FOR ALL USING (user_has_privilege(auth.uid(), 'create_events'));

-- Event requests: Users can view own requests
CREATE POLICY "Users can view own requests" ON event_requests
  FOR SELECT USING (auth.uid() = requestor_id);

-- Event requests: Users can create requests
CREATE POLICY "Users can create requests" ON event_requests
  FOR INSERT WITH CHECK (auth.uid() = requestor_id);

-- Event requests: Users with approve_events can view all
CREATE POLICY "Privileged users can view all requests" ON event_requests
  FOR SELECT USING (user_has_privilege(auth.uid(), 'approve_events'));

-- Event requests: Users with approve_events can update
CREATE POLICY "Privileged users can manage requests" ON event_requests
  FOR UPDATE USING (user_has_privilege(auth.uid(), 'approve_events'));

-- Notifications: Users can view own notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Notifications: Users can update own notifications
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Notifications: System can create notifications
CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- Event templates: Everyone can view templates
CREATE POLICY "Anyone can view templates" ON event_templates FOR SELECT USING (true);

-- Event templates: Users with manage_templates can manage
CREATE POLICY "Privileged users can manage templates" ON event_templates
  FOR ALL USING (user_has_privilege(auth.uid(), 'manage_templates'));

-- Filter presets: Users can manage own filter presets
CREATE POLICY "Users can manage own filter presets" ON filter_presets
  FOR ALL USING (auth.uid() = user_id);

-- Audit logs: Users with view_audit_logs can view
CREATE POLICY "Privileged users can view audit logs" ON audit_logs
  FOR SELECT USING (user_has_privilege(auth.uid(), 'view_audit_logs'));

-- Audit logs: System can create audit logs
CREATE POLICY "System can create audit logs" ON audit_logs
  FOR INSERT WITH CHECK (true);
