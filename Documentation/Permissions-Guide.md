# Permission System Guide

## Overview

The application uses a **role-based access control (RBAC)** system with **additional user-specific privileges**. Each role has a predefined set of privileges, and users can be granted additional privileges beyond their role.

## How the Permission System Works

### Two Sources of Privileges

1. **Role Privileges** - Automatically granted based on user's role
2. **User Privileges** - Additional privileges granted to specific users

A user's total privileges = Role privileges + User-specific privileges

### There is NO "admin" role

Instead, certain privileges (like `assign_privileges`, `manage_users`, `view_audit_logs`) provide administrative capabilities. Users with these privileges have admin-level access.

### Role Hierarchy

```
admin         → Full system access (all privileges)
hr            → User management, class management, view all data
marketing     → View-only access to events and availability
operations    → View-only access to events and availability  
teacher       → View team availability, manage own classes
student       → Basic access only
```

## Roles and Their Privileges

### 1. **Admin Role** (`admin`)
**Full system access** - Has ALL privileges:
- ✅ `approve_events` - Approve event requests
- ✅ `create_events` - Create new events
- ✅ `manage_all_events` - Manage any event
- ✅ `view_all_events` - View all events
- ✅ `manage_users` - Create, edit, deactivate users
- ✅ `assign_privileges` - Change user roles
- ✅ `view_all_users` - View all user profiles
- ✅ `view_all_availability` - View everyone's availability
- ✅ `manage_classes` - Create and manage classes
- ✅ `view_audit_logs` - View system audit logs
- ✅ `manage_templates` - Manage event templates

**Route Access:**
- `/admin/*` - All admin routes
- `/admin/users` - User management
- `/admin/schedule` - Master schedule
- `/admin/audit-logs` - Audit logs
- `/dashboard/business` - Business dashboard
- All other authenticated routes

### 2. **HR Role** (`hr`)
**User and class management:**
- ✅ `view_all_events`
- ✅ `view_all_availability`
- ✅ `view_all_users`
- ✅ `manage_users` - Can create/edit users
- ✅ `manage_classes`

**Route Access:**
- `/admin/users` - User management
- `/admin/classes` - Class management
- `/admin/schedule` - Master schedule
- `/dashboard/business` - Business dashboard

### 3. **Marketing Role** (`marketing`)
**View-only access:**
- ✅ `view_all_events`
- ✅ `view_all_availability`

**Route Access:**
- `/dashboard/business` - Business dashboard
- `/schedule` - View schedules
- `/availability` - View availability

### 4. **Operations Role** (`operations`)
**View-only access:**
- ✅ `view_all_events`
- ✅ `view_all_availability`

**Route Access:**
- `/admin/schedule` - Master schedule
- `/dashboard/business` - Business dashboard
- `/schedule` - View schedules
- `/availability` - View availability

### 5. **Teacher Role** (`teacher`)
**Limited team access:**
- ✅ `view_team_availability` - View their students' availability

**Route Access:**
- `/dashboard/teacher` - Teacher dashboard
- `/dashboard/teacher/classes` - Their classes
- `/schedule` - Their schedule
- `/availability` - Their availability

### 6. **Student Role** (`student`)
**Basic access only:**
- ❌ No special privileges

**Route Access:**
- `/dashboard/student` - Student dashboard
- `/schedule` - Their schedule
- `/availability` - Their availability

## How to Assign Admin Privileges

### Option 1: Via Admin UI (Recommended)
1. Navigate to `/admin/users`
2. Click on the user you want to grant privileges to
3. Scroll to the "Privileges" section
4. Use the dropdown to select a privilege (e.g., `assign_privileges`, `manage_users`, `view_audit_logs`)
5. The privilege is granted immediately

To revoke a privilege, click the X button on the privilege badge.

### Option 2: Direct Database Insert
```sql
-- Grant a privilege to a user
INSERT INTO user_privileges (user_id, privilege_id, granted_by)
VALUES (
  'user-uuid-here',
  'assign_privileges',  -- or any other privilege
  'admin-user-uuid'
);
```

### Option 3: Via Supabase Dashboard
1. Go to Supabase Dashboard
2. Navigate to Table Editor → `user_privileges`
3. Insert a new row:
   - `user_id`: The user's UUID
   - `privilege_id`: The privilege to grant (e.g., 'assign_privileges')
   - `granted_by`: Your user UUID
4. Save

### Common Admin Privileges to Grant

- **`assign_privileges`** - Can grant/revoke privileges to other users (most powerful)
- **`manage_users`** - Can create, edit, and deactivate users
- **`view_audit_logs`** - Can view system audit logs
- **`manage_all_events`** - Can edit/delete any event
- **`approve_events`** - Can approve event requests

## Permission Checking in Code

### In Components (Frontend)
```tsx
import { usePermissions } from '@/hooks/usePermissions'

function MyComponent() {
  const permissions = usePermissions()
  
  // Check if user is admin
  if (permissions.isAdmin) {
    return <AdminPanel />
  }
  
  // Check specific privilege
  if (permissions.hasPrivilege('manage_users')) {
    return <UserManagementButton />
  }
  
  // Check route access
  if (permissions.canAccessRoute('/admin/users')) {
    // Allow navigation
  }
  
  return <RegularView />
}
```

### In API Functions (Backend)
```tsx
import { hasPrivilege } from '@/lib/auth/permissions'

export async function deleteUser(userId: string, currentUserRole: Role) {
  // Check permission before action
  if (!hasPrivilege(currentUserRole, 'manage_users')) {
    throw new Error('Insufficient privileges')
  }
  
  // Perform action
  await supabase.from('profiles').delete().eq('id', userId)
}
```

### In Route Protection (Middleware)
The proxy automatically checks route permissions:
```tsx
// In proxy.ts
if (!canAccessRoute(userRole, pathname)) {
  return Response.redirect('/unauthorized')
}
```

## Permission System Files

### Core Files
- **`lib/auth/permissions.ts`** - Permission definitions and checking logic
- **`hooks/usePermissions.ts`** - React hooks for permission checks
- **`proxy.ts`** - Route-level permission enforcement

### Database Tables
- **`roles`** - Defines all available roles
- **`role_privileges`** - Maps privileges to roles
- **`profiles`** - User profiles with `role_id` foreign key

## Common Scenarios

### Scenario 1: Make a user an admin
```tsx
// In admin UI or via API
await updateUser(userId, { role_id: 'admin' }, currentAdminId)
```

### Scenario 2: Check if current user can manage users
```tsx
const permissions = usePermissions()
const canManage = permissions.hasPrivilege('manage_users')
// Returns true for admin and hr roles
```

### Scenario 3: Restrict a component to admins only
```tsx
function AdminOnlyComponent() {
  const permissions = usePermissions()
  
  if (!permissions.isAdmin) {
    return <AccessDenied />
  }
  
  return <AdminContent />
}
```

### Scenario 4: Allow multiple roles to access a feature
```tsx
const permissions = usePermissions()
const canAccess = permissions.hasAnyPrivilege([
  'manage_users',
  'view_all_users'
])
// Returns true for admin and hr
```

## Security Notes

### ✅ Best Practices
1. **Always check permissions on both frontend and backend**
2. **Use the permission system, don't hardcode role checks**
3. **Log all admin actions via audit logs**
4. **Validate role changes carefully**

### ⚠️ Important
- Changing a user's role **immediately** changes their permissions
- There's no "pending" state - role changes are instant
- Admin role has **full system access** - assign carefully
- Audit logs track all user management actions

## Extending the Permission System

### Adding a New Privilege
1. Add to `PRIVILEGES` in `lib/auth/permissions.ts`:
```tsx
export const PRIVILEGES = {
  // ... existing
  MY_NEW_PRIVILEGE: 'my_new_privilege',
}
```

2. Assign to roles in `ROLE_PERMISSIONS`:
```tsx
[ROLES.ADMIN]: [
  // ... existing privileges
  PRIVILEGES.MY_NEW_PRIVILEGE,
],
```

3. Use in code:
```tsx
if (permissions.hasPrivilege('my_new_privilege')) {
  // Show feature
}
```

### Adding a New Role
1. Add to `ROLES` constant
2. Define privileges in `ROLE_PERMISSIONS`
3. Add route access in `ROUTE_PERMISSIONS`
4. Update dashboard redirect logic
5. Add to database `roles` table

## Summary

**The system uses role-based privileges PLUS user-specific privileges.**

### To give someone admin access:

**Method 1: Grant specific admin privileges (Recommended)**
1. Go to `/admin/users` and click on the user
2. In the "Privileges" section, grant privileges like:
   - `assign_privileges` (most powerful - can manage other users' privileges)
   - `manage_users` (can create/edit users)
   - `view_audit_logs` (can view system logs)
3. Changes take effect immediately

**Method 2: Direct database**
```sql
INSERT INTO user_privileges (user_id, privilege_id, granted_by)
VALUES ('user-uuid', 'assign_privileges', 'your-uuid');
```

### Key Points

- ✅ **No "admin" role** - Admin capabilities come from specific privileges
- ✅ **Two sources** - Users get privileges from their role + user-specific grants
- ✅ **Flexible** - Grant only the privileges needed
- ✅ **Audited** - All privilege grants/revokes are logged
- ✅ **Immediate** - Changes take effect instantly

The system is designed to be flexible - assign roles for baseline permissions, then grant additional privileges as needed.
