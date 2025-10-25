# Bootstrap Initial Admin User

## The Problem

You can't access `/admin/users` because you don't have the `view_all_users` or `assign_privileges` privilege yet. This is a chicken-and-egg problem - you need admin privileges to grant admin privileges!

## The Solution

Grant yourself admin privileges directly via the database.

---

## Method 1: Via Supabase SQL Editor (Easiest)

### Steps:

1. **Go to Supabase Dashboard**
   - Open your project at https://supabase.com
   - Navigate to **SQL Editor**

2. **Run the Bootstrap Script**
   - Copy the contents of `scripts/grant-admin-privileges.sql`
   - **IMPORTANT:** Change `'your-email@example.com'` to YOUR actual email
   - Paste and run the script

3. **Verify**
   - The script will show how many privileges were granted
   - Should see: `privilege_count: 11`

4. **Refresh Your App**
   - Log out and log back in (or just refresh)
   - Navigate to `/admin/users`
   - You now have full admin access! 🎉

### Quick Copy-Paste Version:

```sql
-- Replace YOUR-EMAIL@EXAMPLE.COM with your actual email!
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
WHERE p.email = 'YOUR-EMAIL@EXAMPLE.COM'
ON CONFLICT (user_id, privilege_id) DO NOTHING;
```

---

## Method 2: Via Supabase Table Editor

### Steps:

1. **Go to Supabase Dashboard**
   - Navigate to **Table Editor**
   - Open the `profiles` table

2. **Find Your User ID**
   - Find your email in the profiles table
   - Copy your `id` (UUID)

3. **Add Privileges**
   - Go to `user_privileges` table
   - Click "Insert row"
   - For each privilege, add a row:
     - `user_id`: Your UUID
     - `privilege_id`: The privilege name (see list below)
     - `granted_by`: Your UUID (same as user_id)

4. **Privileges to Add:**
   - `assign_privileges` ⭐ (Most important - lets you grant others)
   - `manage_users`
   - `view_all_users`
   - `view_audit_logs`
   - `manage_all_events`
   - `approve_events`
   - `create_events`
   - `view_all_events`
   - `view_all_availability`
   - `manage_classes`
   - `manage_templates`

---

## Method 3: Via Migration (For Production)

### Steps:

1. **Edit the Migration File**
   - Open `supabase/migrations/20250125000000_grant_initial_admin.sql`
   - Change `'your-email@example.com'` to your actual email

2. **Run Migration**
   ```bash
   cd event-matcher
   supabase db push
   ```

3. **Verify**
   - Check Supabase logs for success message
   - Refresh your app

---

## Verification

After granting privileges, verify they worked:

### In Supabase SQL Editor:
```sql
-- Check your privileges
SELECT 
  p.email,
  p.full_name,
  pr.name as privilege_name,
  pr.description
FROM profiles p
JOIN user_privileges up ON up.user_id = p.id
JOIN privileges pr ON pr.id = up.privilege_id
WHERE p.email = 'YOUR-EMAIL@EXAMPLE.COM'
ORDER BY pr.name;
```

### In Your App:
1. Navigate to `/admin/users`
2. If you can see the page → Success! ✅
3. If you get "Access Denied" → Privileges not granted yet

---

## What Each Privilege Does

| Privilege | Description |
|-----------|-------------|
| `assign_privileges` | **Most powerful** - Can grant/revoke privileges to other users |
| `manage_users` | Can create, edit, and deactivate users |
| `view_all_users` | Can view all user profiles (needed for `/admin/users`) |
| `view_audit_logs` | Can view system audit logs |
| `manage_all_events` | Can edit/delete any event |
| `approve_events` | Can approve event requests |
| `create_events` | Can create events for others |
| `view_all_events` | Can view all events in the system |
| `view_all_availability` | Can view everyone's availability |
| `manage_classes` | Can create and manage class assignments |
| `manage_templates` | Can create and edit event templates |

---

## After Bootstrap

Once you have admin access:

1. **Grant privileges to others** via the UI:
   - Go to `/admin/users`
   - Click on a user
   - Use the "Privileges" section to grant/revoke

2. **No more database access needed!**
   - Everything can be managed through the UI
   - All actions are audited

---

## Troubleshooting

### "User not found" error
- Make sure you've created an account and logged in at least once
- Check that your email in the SQL matches exactly (case-sensitive)

### Still can't access `/admin/users`
- Clear your browser cache
- Log out and log back in
- Check that privileges were actually inserted (run verification query)

### Need to grant to multiple users
- Run the SQL script multiple times with different emails
- Or use the UI after you have access

---

## Security Note

⚠️ **The `assign_privileges` privilege is very powerful!**

- Only grant it to trusted administrators
- All privilege grants/revokes are logged in `audit_logs`
- You can revoke privileges anytime via the UI

---

## Quick Reference

**Minimum privileges needed for basic admin access:**
- `view_all_users` (to see `/admin/users` page)
- `manage_users` (to edit users)
- `assign_privileges` (to grant privileges to others)

**Full admin privileges:**
All 11 privileges listed in the scripts above.
