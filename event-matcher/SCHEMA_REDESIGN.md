# Schema Redesign: Roles + Privileges Model

## Overview

The database schema has been redesigned from a simple role-based system to a flexible **roles + privileges** model. This allows for:

- **Extensible roles**: Easy to add new organizational roles (marketing, operations, etc.)
- **Granular privileges**: Specific capabilities that can be granted to roles or individual users
- **Admin as a privilege**: "Admin" is no longer a role but a set of privileges that can be assigned to anyone
- **Future-proof**: Can easily add new privileges without schema changes

## Key Changes

### Before (Simple Role Model)
```sql
profiles.role: 'admin' | 'hr' | 'teacher' | 'student'
```
- Admin was a role
- Limited flexibility
- Hard to add new organizational roles

### After (Roles + Privileges Model)
```sql
profiles.role_id: 'teacher' | 'student' | 'marketing' | 'hr' | 'operations'
+ roles table (extensible)
+ privileges table (granular capabilities)
+ role_privileges (default privileges per role)
+ user_privileges (additional privileges per user)
```

## New Tables

### `roles`
Defines organizational roles. System roles (teacher, student) are marked as `is_system_role = true`.

```sql
id: text PRIMARY KEY
name: text
description: text
is_system_role: boolean
```

**Default roles:**
- `teacher` - Instructors (system role)
- `student` - Students (system role)
- `marketing` - Marketing team
- `hr` - Human Resources
- `operations` - Operations team

### `privileges`
Defines specific capabilities users can have.

```sql
id: text PRIMARY KEY
name: text
description: text
category: text (events, users, availability, classes, system)
```

**Default privileges:**

**Events:**
- `approve_events` - Can approve and confirm event requests
- `create_events` - Can create events for others
- `manage_all_events` - Can edit/delete any event
- `view_all_events` - Can view all events in the system

**Users:**
- `manage_users` - Can create, edit, and deactivate users
- `assign_privileges` - Can grant/revoke privileges to users
- `view_all_users` - Can view all user profiles

**Availability:**
- `view_all_availability` - Can view everyone's availability
- `view_team_availability` - Can view assigned team members' availability

**Classes:**
- `manage_classes` - Can create and manage class assignments

**System:**
- `view_audit_logs` - Can view system audit logs
- `manage_templates` - Can create and edit event templates

### `role_privileges`
Default privileges granted to each role.

```sql
role_id: text REFERENCES roles(id)
privilege_id: text REFERENCES privileges(id)
```

**Default grants:**
- **Marketing**: `view_all_events`, `view_all_availability`
- **HR**: `view_all_events`, `view_all_availability`, `view_all_users`, `manage_users`, `manage_classes`
- **Operations**: `view_all_events`, `view_all_availability`
- **Teacher**: `view_team_availability`

### `user_privileges`
Additional privileges granted to specific users (overrides/additions to role defaults).

```sql
user_id: uuid REFERENCES profiles(id)
privilege_id: text REFERENCES privileges(id)
granted_by: uuid REFERENCES profiles(id)
granted_at: timestamptz
```

### `user_all_privileges` (View)
Combines role-based and user-specific privileges for easy querying.

```sql
SELECT * FROM user_all_privileges WHERE user_id = '...'
```

Returns all privileges a user has, with source ('role' or 'user').

## How It Works

### Granting "Admin" Privileges

Instead of setting `role = 'admin'`, you grant specific privileges:

```sql
-- Grant event approval privilege to a marketing user
INSERT INTO user_privileges (user_id, privilege_id, granted_by)
VALUES ('user-uuid', 'approve_events', 'admin-uuid');

-- Grant full admin capabilities to an HR user
INSERT INTO user_privileges (user_id, privilege_id, granted_by)
VALUES 
  ('user-uuid', 'approve_events', 'admin-uuid'),
  ('user-uuid', 'manage_users', 'admin-uuid'),
  ('user-uuid', 'assign_privileges', 'admin-uuid');
```

### Checking Privileges

Use the provided helper function:

```sql
SELECT user_has_privilege('user-uuid', 'approve_events');
```

Or query the view:

```sql
SELECT * FROM user_all_privileges 
WHERE user_id = 'user-uuid' AND privilege_id = 'approve_events';
```

### RLS Policies

All RLS policies now use `user_has_privilege()` function:

```sql
-- Old way
CREATE POLICY "Admins can manage events" ON events
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- New way
CREATE POLICY "Privileged users can manage events" ON events
  FOR UPDATE USING (user_has_privilege(auth.uid(), 'manage_all_events'));
```

## Application Layer

### RBAC Helpers (`lib/auth/rbac.ts`)

```typescript
import * as rbac from '@/lib/auth/rbac'

// Check privileges
rbac.hasPrivilege(userPrivileges, 'approve_events')
rbac.canApproveEvents(userPrivileges)
rbac.canManageUsers(userPrivileges)

// Check roles
rbac.hasRole(profile, 'teacher')
rbac.isTeacher(profile)
rbac.isBusinessRole(profile)

// Check admin-level access
rbac.hasAdminPrivileges(userPrivileges)
```

### React Hooks (`hooks/useAuth.ts`)

```typescript
import { useCanApproveEvents, useIsTeacher, useProfile } from '@/hooks/useAuth'

function MyComponent() {
  const { data: profile } = useProfile()
  const canApprove = useCanApproveEvents()
  const isTeacher = useIsTeacher()

  if (canApprove) {
    return <ApproveButton />
  }
  
  return null
}
```

## Use Cases

### 1. Marketing User Needs to Schedule Internal Meetings

**Problem**: Marketing team member needs to schedule meetings but shouldn't have full admin access.

**Solution**:
```sql
-- Grant only the necessary privilege
INSERT INTO user_privileges (user_id, privilege_id)
VALUES ('marketing-user-uuid', 'approve_events');
```

Now they can:
- ✅ View all calendars (from role)
- ✅ View all availability (from role)
- ✅ Approve and schedule meetings (from user privilege)

But cannot:
- ❌ Manage users
- ❌ Assign privileges to others
- ❌ View audit logs

### 2. HR Manager Needs Full Admin Access

**Problem**: HR manager needs to manage users and approve events.

**Solution**:
```sql
-- HR role already has: view_all_events, view_all_availability, manage_users, manage_classes
-- Just add event approval
INSERT INTO user_privileges (user_id, privilege_id)
VALUES ('hr-manager-uuid', 'approve_events');
```

### 3. Operations Lead Needs to Manage Event Templates

**Problem**: Operations lead wants to create reusable event templates.

**Solution**:
```sql
INSERT INTO user_privileges (user_id, privilege_id)
VALUES ('ops-lead-uuid', 'manage_templates');
```

### 4. Teacher Needs to View Student Availability

**Problem**: Teachers should only see their assigned students' availability.

**Solution**: Already handled by role! Teachers have `view_team_availability` privilege, and RLS policy restricts to assigned students:

```sql
-- RLS policy automatically checks class assignments
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
```

## Adding New Roles

To add a new role (e.g., "finance"):

```sql
-- 1. Add the role
INSERT INTO roles (id, name, description, is_system_role)
VALUES ('finance', 'Finance', 'Finance team members', false);

-- 2. Grant default privileges
INSERT INTO role_privileges (role_id, privilege_id)
VALUES 
  ('finance', 'view_all_events'),
  ('finance', 'view_all_users');

-- 3. Update TypeScript types
-- In types/database.ts:
export type RoleId = 'teacher' | 'student' | 'marketing' | 'hr' | 'operations' | 'finance'
```

## Adding New Privileges

To add a new privilege (e.g., "export_reports"):

```sql
-- 1. Add the privilege
INSERT INTO privileges (id, name, description, category)
VALUES ('export_reports', 'Export Reports', 'Can export data reports', 'system');

-- 2. Grant to roles as needed
INSERT INTO role_privileges (role_id, privilege_id)
VALUES ('hr', 'export_reports');

-- 3. Update TypeScript types
-- In types/database.ts:
export type PrivilegeId = '...' | 'export_reports'

-- 4. Add helper function (optional)
-- In lib/auth/rbac.ts:
export function canExportReports(userPrivileges: UserPrivilege[]): boolean {
  return hasPrivilege(userPrivileges, 'export_reports')
}
```

## Migration Path

If you already have data with the old schema:

```sql
-- Migrate existing admin users to HR role with admin privileges
UPDATE profiles SET role_id = 'hr' WHERE role = 'admin';

INSERT INTO user_privileges (user_id, privilege_id)
SELECT id, 'approve_events' FROM profiles WHERE role = 'admin'
UNION ALL
SELECT id, 'manage_users' FROM profiles WHERE role = 'admin'
UNION ALL
SELECT id, 'assign_privileges' FROM profiles WHERE role = 'admin';
```

## Benefits

1. **Flexibility**: Can grant specific capabilities without creating new roles
2. **Scalability**: Easy to add new roles and privileges
3. **Security**: Granular control over who can do what
4. **Auditability**: Track who granted privileges and when
5. **Maintainability**: Clear separation between organizational roles and capabilities
6. **Future-proof**: Can evolve permissions without schema changes

## Next Steps

1. Run the new migration: `supabase db push`
2. Generate new types: `supabase gen types typescript --local > types/database.ts`
3. Use RBAC helpers in your components
4. Grant privileges to users as needed via admin UI (to be built in Phase 2)
