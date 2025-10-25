# Event Matcher: Technical Specification

**Version:** 1.1  
**Last Updated:** October 2025

## 1. Executive Summary

This document outlines the technical architecture and specifications for the "Event Matcher" web application. The application will be built using a modern full-stack architecture, prioritizing performance, developer experience, type safety, and low operational costs.

### Technology Stack

*   **Front-End Framework:** Next.js 14+ (App Router)
*   **Language:** TypeScript (strict mode)
*   **Styling:** Tailwind CSS
*   **UI Components:** shadcn/ui
*   **Front-End Hosting:** Vercel
*   **Back-End & Database Services:** Supabase
*   **Primary Database:** PostgreSQL 15+
*   **Authentication:** Supabase Auth
*   **Real-time:** Supabase Realtime
*   **Serverless Functions:** Supabase Edge Functions (Deno)

This stack leverages serverless technologies to ensure the application is scalable, secure, type-safe, and remains free or very low-cost during its initial growth phase.

---

## 2. System Architecture

The application follows a modern serverless architecture with clear separation of concerns.

### Architecture Overview

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       ├────────────────────────────────┐
       │                                │
       ▼                                ▼
┌──────────────────┐          ┌──────────────────┐
│  Marketing Site  │          │   Next.js App    │
│   (Next.js)      │          │   (Vercel)       │
│  www.domain.com  │          │  app.domain.com  │
└──────────────────┘          └────────┬─────────┘
                                       │
                                       │ API Calls
                                       │
                              ┌────────▼─────────┐
                              │    Supabase      │
                              ├──────────────────┤
                              │ • Auth           │
                              │ • PostgreSQL     │
                              │ • Realtime       │
                              │ • Edge Functions │
                              │ • Storage        │
                              └──────────────────┘
```

### Layer Breakdown

1.  **User Interaction:** Users access via modern web browsers
    *   Marketing site: `www.yourtutoringservice.com`
    *   Application: `app.yourtutoringservice.com`

2.  **Front-End Layer (Vercel):**
    *   Two separate Next.js projects
    *   Marketing: Static/SSG pages with SEO optimization
    *   Application: Dynamic app with SSR, CSR, and ISR
    *   No direct database connections from client

3.  **Back-End Layer (Supabase):**
    *   PostgreSQL with Row Level Security (RLS)
    *   Supabase Auth for authentication
    *   Auto-generated REST APIs
    *   Realtime subscriptions for live updates
    *   Edge Functions for complex business logic

---

## 3. Technology Stack Breakdown

### 3.1. Front-End (Hosted on Vercel)

**Framework: Next.js 14+ (App Router)**
*   Server-side rendering for better SEO and performance
*   Built-in API routes
*   Excellent TypeScript support
*   Optimized production builds
*   Rendering strategies: SSR, SSG, ISR, CSR

**Language: TypeScript (Strict Mode)**
*   Type safety reduces bugs
*   Better IDE support and developer experience
*   Comprehensive type checking enabled

**Styling: Tailwind CSS**
*   Utility-first CSS framework
*   Rapid UI development
*   Consistent design system
*   Custom theme configuration

**UI Components: shadcn/ui**
*   High-quality, accessible components
*   Built on Radix UI primitives
*   Full customization control

**Key Libraries:**
*   **Routing:** Next.js App Router (file-based)
*   **Calendar:** `@fullcalendar/react` v6+
*   **Data Fetching:** `@tanstack/react-query` v5
*   **Forms:** `react-hook-form` with `zod` validation
*   **Date/Time:** `date-fns`
*   **Icons:** `lucide-react`
*   **Notifications:** `sonner` for toasts
*   **Supabase Client:** `@supabase/ssr`

**Code Quality:**
*   ESLint with Next.js and TypeScript rules
*   Prettier for consistent formatting
*   Vitest for unit tests
*   Playwright for E2E tests
*   Husky + lint-staged for pre-commit hooks

**Deployment:**
*   GitHub with branch protection
*   Vercel automatic deployments:
    *   `main` → Production
    *   `develop` → Staging
    *   PRs → Preview deployments

### 3.2. Back-End & Database (Hosted on Supabase)

**Core Database: PostgreSQL 15+**

#### Database Schema

**`roles`** (organizational roles - extensible)
```sql
id: text PRIMARY KEY
name: text NOT NULL
description: text
is_system_role: boolean DEFAULT false
created_at: timestamptz DEFAULT now()
```

**`privileges`** (specific capabilities)
```sql
id: text PRIMARY KEY
name: text NOT NULL
description: text
category: text (events, users, availability, classes, system)
created_at: timestamptz DEFAULT now()
```

**`role_privileges`** (default privileges per role)
```sql
role_id: text REFERENCES roles(id)
privilege_id: text REFERENCES privileges(id)
granted_at: timestamptz DEFAULT now()
PRIMARY KEY (role_id, privilege_id)
```

**`profiles`** (extends auth.users)
```sql
id: uuid PRIMARY KEY REFERENCES auth.users
email: text NOT NULL
full_name: text NOT NULL
role_id: text NOT NULL REFERENCES roles(id)
avatar_url: text
notification_preferences: jsonb DEFAULT '{}'
is_active: boolean DEFAULT true
created_at: timestamptz DEFAULT now()
updated_at: timestamptz DEFAULT now()
```

**`user_privileges`** (additional user-specific privileges)
```sql
user_id: uuid REFERENCES profiles(id)
privilege_id: text REFERENCES privileges(id)
granted_by: uuid REFERENCES profiles(id)
granted_at: timestamptz DEFAULT now()
PRIMARY KEY (user_id, privilege_id)
```

**`classes`** (teacher-student assignments)
```sql
id: uuid PRIMARY KEY DEFAULT gen_random_uuid()
name: text NOT NULL
subject: text NOT NULL
teacher_id: uuid REFERENCES profiles(id)
created_at: timestamptz DEFAULT now()
```

**`class_enrollments`**
```sql
class_id: uuid REFERENCES classes(id) ON DELETE CASCADE
student_id: uuid REFERENCES profiles(id) ON DELETE CASCADE
enrolled_at: timestamptz DEFAULT now()
PRIMARY KEY (class_id, student_id)
```

**`availability`**
```sql
id: uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id: uuid REFERENCES profiles(id) ON DELETE CASCADE
start_time: timestamptz NOT NULL
end_time: timestamptz NOT NULL
is_recurring: boolean DEFAULT false
day_of_week: integer CHECK (day_of_week BETWEEN 0 AND 6)
recurrence_end_date: date
created_at: timestamptz DEFAULT now()
updated_at: timestamptz DEFAULT now()
CONSTRAINT valid_time_range CHECK (end_time > start_time)
```

**`events`**
```sql
id: uuid PRIMARY KEY DEFAULT gen_random_uuid()
title: text NOT NULL CHECK (length(title) <= 100)
event_type: text NOT NULL CHECK (event_type IN ('class', 'meeting', 'training'))
subject: text
description: text
start_time: timestamptz NOT NULL
end_time: timestamptz NOT NULL
location: text
meeting_link: text
attachments: text[]
is_recurring: boolean DEFAULT false
recurrence_pattern: jsonb
recurrence_end_date: date
parent_event_id: uuid REFERENCES events(id)
created_by: uuid REFERENCES profiles(id)
created_at: timestamptz DEFAULT now()
updated_at: timestamptz DEFAULT now()
CONSTRAINT valid_event_duration CHECK (end_time > start_time)
```

**Note on `recurrence_pattern` jsonb structure:**
```json
{
  "type": "daily|weekly|monthly|custom",
  "interval": 1,
  "days_of_week": [0,1,2,3,4,5,6],
  "day_of_month": 15,
  "week_of_month": 2,
  "exceptions": ["2025-12-25", "2025-01-01"]
}
```

**`event_participants`**
```sql
event_id: uuid REFERENCES events(id) ON DELETE CASCADE
user_id: uuid REFERENCES profiles(id) ON DELETE CASCADE
PRIMARY KEY (event_id, user_id)
added_at: timestamptz DEFAULT now()
```

**`event_requests`**
```sql
id: uuid PRIMARY KEY DEFAULT gen_random_uuid()
requestor_id: uuid REFERENCES profiles(id)
requested_participants: uuid[] NOT NULL
proposed_start_time: timestamptz NOT NULL
proposed_end_time: timestamptz NOT NULL
event_type: text NOT NULL
title: text NOT NULL
description: text
status: text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined'))
decline_reason: text
processed_by: uuid REFERENCES profiles(id)
processed_at: timestamptz
created_at: timestamptz DEFAULT now()
CONSTRAINT valid_decline CHECK (status != 'declined' OR decline_reason IS NOT NULL)
```

**`notifications`**
```sql
id: uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id: uuid REFERENCES profiles(id) ON DELETE CASCADE
type: text NOT NULL
title: text NOT NULL
message: text NOT NULL
related_id: uuid
is_read: boolean DEFAULT false
created_at: timestamptz DEFAULT now()
```

**`event_templates`**
```sql
id: uuid PRIMARY KEY DEFAULT gen_random_uuid()
name: text NOT NULL
event_type: text NOT NULL CHECK (event_type IN ('class', 'meeting', 'training'))
subject: text
description: text
default_duration_minutes: integer NOT NULL
location: text
recurrence_pattern: jsonb
category: text
created_by: uuid REFERENCES profiles(id)
usage_count: integer DEFAULT 0
last_used_at: timestamptz
created_at: timestamptz DEFAULT now()
updated_at: timestamptz DEFAULT now()
```

**`filter_presets`**
```sql
id: uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id: uuid REFERENCES profiles(id) ON DELETE CASCADE
name: text NOT NULL
filter_config: jsonb NOT NULL
created_at: timestamptz DEFAULT now()
updated_at: timestamptz DEFAULT now()
UNIQUE(user_id, name)
```

**Note on `filter_config` jsonb structure:**
```json
{
  "users": ["uuid1", "uuid2"],
  "roles": ["teacher", "student"],
  "event_types": ["class", "meeting"],
  "subjects": ["Math", "Science"],
  "classes": ["uuid1", "uuid2"],
  "date_range": {"start": "2025-01-01", "end": "2025-12-31"}
}
```

**`audit_logs`**
```sql
id: uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id: uuid REFERENCES profiles(id)
action: text NOT NULL
resource_type: text NOT NULL
resource_id: uuid
details: jsonb
created_at: timestamptz DEFAULT now()
```

#### Indexes
```sql
CREATE INDEX idx_availability_user_time ON availability(user_id, start_time, end_time);
CREATE INDEX idx_events_time ON events(start_time, end_time);
CREATE INDEX idx_events_recurring ON events(is_recurring, parent_event_id);
CREATE INDEX idx_event_participants_user ON event_participants(user_id);
CREATE INDEX idx_event_requests_status ON event_requests(status, created_at);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read, created_at);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_event_templates_created_by ON event_templates(created_by);
CREATE INDEX idx_filter_presets_user ON filter_presets(user_id);
```

**Authentication: Supabase Auth**
*   Email/password authentication
*   JWT tokens with automatic refresh
*   Password policy: 8+ chars, uppercase, lowercase, number
*   Session duration: 24 hours
*   Email-based password reset
*   User role in JWT `app_metadata`

**Row Level Security (RLS) Policies:**
*   **profiles:** Users read own, users with `view_all_users` privilege read all
*   **availability:** Users manage own, users with `view_all_availability` privilege read all, teachers with `view_team_availability` can view assigned students
*   **events:** Users read participating events, users with `view_all_events` privilege read all
*   **event_requests:** Requestors read own, users with `approve_events` privilege read/manage all
*   **notifications:** Users access only their own
*   **audit_logs:** Users with `view_audit_logs` privilege only
*   **user_privileges:** Users view own, users with `assign_privileges` can manage all

**Key Privileges:**
*   **Events:** `approve_events`, `create_events`, `manage_all_events`, `view_all_events`
*   **Users:** `manage_users`, `assign_privileges`, `view_all_users`
*   **Availability:** `view_all_availability`, `view_team_availability`
*   **Classes:** `manage_classes`
*   **System:** `view_audit_logs`, `manage_templates`

**Supabase Edge Functions:**

1. **`approve-event-request`**
   *   Input: `request_id`, `admin_id`
   *   Creates event, adds participants, updates request, sends notifications

2. **`decline-event-request`**
   *   Input: `request_id`, `admin_id`, `decline_reason`
   *   Updates request status, sends notification with reason

3. **`create-recurring-events`**
   *   Input: `event_data`, `recurrence_pattern`, `recurrence_end_date`
   *   Creates parent event and all child event instances based on pattern
   *   Handles exceptions (skipped dates)
   *   Returns array of created event IDs

4. **`update-recurring-series`**
   *   Input: `parent_event_id`, `update_type` ('this_only'|'this_and_future'|'all'), `event_data`
   *   Updates single event or series based on update_type
   *   Maintains parent-child relationships

5. **`send-notification`**
   *   Input: `user_ids`, `notification_type`, `message`
   *   Creates in-app notifications, sends emails via SendGrid

6. **`calculate-availability-overlap`**
   *   Input: `user_ids[]`, `start_date`, `end_date`
   *   Returns time slots with availability counts for heat map

**Realtime Subscriptions:**
*   Live updates for events, requests, notifications
*   WebSocket connections managed by Supabase
*   Automatic reconnection handling

---

## 4. Security

*   **HTTPS:** Enforced via Vercel (automatic SSL)
*   **CORS:** Configured for app domain only
*   **Rate Limiting:** 100 requests/minute per user
*   **SQL Injection:** Prevented via parameterized queries
*   **XSS:** Prevented via React's built-in escaping
*   **CSRF:** Tokens for state-changing operations
*   **Dependency Scanning:** Dependabot for vulnerabilities
*   **Secrets Management:** Environment variables only

---

## 5. Deployment & DevOps

### Repository Structure
```
/
├── apps/
│   ├── marketing/     # Marketing site
│   └── web/           # Main application
├── packages/
│   ├── ui/            # Shared UI components
│   ├── types/         # Shared TypeScript types
│   └── utils/         # Shared utilities
├── supabase/
│   ├── migrations/    # Database migrations
│   └── functions/     # Edge functions
└── package.json
```

### CI/CD Pipeline

**GitHub Actions:**
*   Lint (ESLint)
*   Type check (TypeScript)
*   Unit tests (Vitest)
*   E2E tests (Playwright)
*   Build verification

**Vercel Deployment:**
*   Production: `main` → `app.yourtutoringservice.com`
*   Staging: `develop` → `staging.yourtutoringservice.com`
*   Preview: All PRs → `pr-{number}.vercel.app`

### Monitoring

*   **Error Tracking:** Sentry
*   **Analytics:** Vercel Analytics
*   **Logging:** Vercel + Supabase logs
*   **Uptime:** Health check endpoints

### Performance

*   Code splitting via Next.js
*   Image optimization
*   React Query caching
*   ISR for semi-static pages
*   CDN caching via Vercel Edge
*   Database indexing and query optimization

---

## 6. Cost Estimation

### Initial Phase (0-100 users)
*   **Vercel:** Free (Hobby plan)
*   **Supabase:** Free (500MB database, 2GB bandwidth)
*   **SendGrid:** Free (100 emails/day)
*   **Total:** $0/month

### Growth Phase (100-1000 users)
*   **Vercel:** $20/month (Pro plan)
*   **Supabase:** $25/month (Pro plan)
*   **SendGrid:** $15/month (Essentials)
*   **Sentry:** $26/month (Team plan)
*   **Total:** ~$86/month

---

## 7. Scalability

*   PostgreSQL handles 500+ concurrent users
*   Supabase provides built-in connection pooling
*   React Query + CDN reduces database load
*   Serverless auto-scales with demand
*   Future: Read replicas, Redis caching, database partitioning

***
