# Event Matcher: AI-Assisted Implementation Guide

**Version:** 1.0  
**Last Updated:** October 2025  
**Purpose:** Synthesized implementation guide with human setup tasks and AI coding prompts

---

## Quick Reference

### Tech Stack
- **Frontend:** Next.js 14+ (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Supabase (PostgreSQL 15+, Auth, Realtime, Edge Functions)
- **Hosting:** Vercel (frontend), Supabase (backend)
- **Key Libraries:** @fullcalendar/react v6+, @tanstack/react-query v5, react-hook-form, zod

### Timeline
- **Total Duration:** 20-22 weeks (10 sprints)
- **Phase 0:** 1 week - Foundation & Setup
- **Phase 1:** 6 weeks - Core MVP (Auth, Availability, Schedule)
- **Phase 2:** 9 weeks - Feature Expansion (RBAC, Events, Templates)
- **Phase 3:** 4 weeks - Polish & Testing
- **Phase 4:** Launch

---
AI collaboratiion guide: Ensure proper file organization and scalability, tick boxes directly in the document to mark tasks as completed.

## Phase 0: Foundation & Setup (Sprint 0 - 1 Week)

### ☐ Human Setup Tasks

#### 1. Service Accounts Setup
```
□ Create GitHub account and repository "event-matcher"
□ Sign up for Vercel (use GitHub OAuth)
□ Create Supabase account and projects (prod + staging)
□ Save all credentials securely (use password manager)
```

#### 2. GitHub Repository Configuration
```bash
# Repository settings:
□ Enable branch protection on main
□ Require PR reviews (1 reviewer minimum)
□ Require status checks to pass
□ Create develop branch for staging
```

#### 3. Vercel Project Setup
```
□ Import GitHub repository to Vercel
□ Configure environments:
  - Production → main branch
  - Staging → develop branch
□ Note deployment URLs
```

#### 4. Supabase Configuration
```
□ Create production project: event-matcher-prod
  - Note down:
    - Project URL
    - Anon key
    - Service role key (keep secret!)
  - Configure Auth settings:
    - Enable email provider
    - Set password requirements (8+ chars, uppercase, lowercase, number)
    - Add redirect URLs:
      - http://localhost:3000/**
      - https://your-production-domain.com/**
      - https://your-staging-domain.vercel.app/**

□ For staging/development:
    #### 5. Setup Local Development Environment
```bash
# Install Supabase CLI
npm install -g supabase

# Initialize Supabase in project
cd event-matcher
supabase init

# Start local Supabase (Docker required)
supabase start

# This will start:
# - PostgreSQL database
# - Supabase Studio (local dashboard)
# - Auth server
# - Realtime server
# - Storage server

# Link to production project (for migrations)
supabase login
supabase link --project-ref your_production_project_ref

# Note: Use local Supabase for development
# Local API URL: http://localhost:54321
# Local Studio: http://localhost:54323
```
    - Use local Supabase URL for development
  
```

---

### 🤖 AI Coding Tasks

#### Task 0.1: Initialize Next.js Project
**Prompt:**
```
Initialize Next.js 14+ project with TypeScript, Tailwind CSS, and this folder structure:
/app, /components, /lib, /types, /hooks, /supabase
Configure tsconfig.json with strict mode and path aliases (@/*)
Add ESLint and Prettier configs
Create basic layout.tsx and page.tsx with "Hello Event Matcher"
```
**Context:** Technical Specification.md lines 85-131  
**Files:** package.json, tsconfig.json, tailwind.config.ts, app/layout.tsx, app/page.tsx

---

#### Task 0.2: Install shadcn/ui
**Prompt:**
```
Install shadcn/ui with default style and slate color scheme.
Install components: button, card, input, label, form, select, dialog, dropdown-menu, toast
Configure theme provider in app/layout.tsx
```
**Context:** Technical Specification.md lines 103-107  
**Files:** components.json, components/ui/*, app/layout.tsx

---

#### Task 0.3: Configure Supabase Client
**Prompt:**
```
Install @supabase/ssr and @supabase/supabase-js
Create lib/supabase/client.ts (client-side)
Create lib/supabase/server.ts (server-side with cookies)
Create lib/supabase/middleware.ts (auth middleware)
Add TypeScript types for Supabase
```
**Context:** Technical Specification.md lines 116, 258-265  
**Files:** lib/supabase/client.ts, lib/supabase/server.ts, lib/supabase/middleware.ts

---

#### Task 0.4: Create Database Schema
**Prompt:**
```
Create Supabase migration file with complete schema:
Tables: profiles, classes, class_enrollments, availability, events (with recurring fields), 
event_participants, event_requests, event_templates, filter_presets, notifications, audit_logs

For each table: columns, constraints, indexes, RLS policies
Reference: Technical Specification.md lines 138-317

File: supabase/migrations/001_initial_schema.sql
```
**Context:** Technical Specification.md lines 138-317  
**Files:** supabase/migrations/001_initial_schema.sql

---

#### Task 0.5: Setup CI/CD Pipeline
**Prompt:**
```
Create .github/workflows/ci.yml with:
- Trigger on push/PR
- Steps: checkout, install, type-check, lint, build
- Add status badge to README.md
Configure Vercel auto-deploy for main and develop branches
```
**Context:** Development Plan.md line 36, Technical Specification.md lines 332-342  
**Files:** .github/workflows/ci.yml, README.md

---

## Phase 1: Core MVP (Sprints 1-3 - 6 Weeks)

### Sprint 1: Authentication (2 weeks)

#### 🤖 AI Coding Tasks

**Task 1.1: Auth Pages**
```
Create app/(auth)/login, signup, reset-password, update-password pages
Use react-hook-form + zod for validation
Password requirements: 8+ chars, uppercase, lowercase, number
Add error handling with toast notifications
```
**Context:** App Description.md lines 47-52  
**Files:** app/(auth)/*/page.tsx

**Task 1.2: Auth Middleware**
```
Create middleware.ts to protect routes: /dashboard/*, /availability/*, /schedule/*, /admin/*
Redirect unauthenticated users to /login
Refresh Supabase session if needed
```
**Context:** Development Plan.md line 55  
**Files:** middleware.ts

**Task 1.3: User Profiles**
```
Create types/database.ts with all table types
Create app/profile/page.tsx with edit form
Create lib/api/profiles.ts with getProfile, updateProfile
Use TanStack Query v5 for data fetching
```
**Context:** Technical Specification.md lines 138-149  
**Files:** types/database.ts, app/profile/page.tsx, lib/api/profiles.ts

**Task 1.4: RBAC System**
```
Create lib/auth/rbac.ts with hasRole, canAccessRoute functions
Create hooks/useAuth.ts with useUser, useRole, useHasRole hooks
Create components/auth/ProtectedRoute.tsx wrapper
Create app/unauthorized/page.tsx
```
**Context:** App Description.md lines 12-39  
**Files:** lib/auth/rbac.ts, hooks/useAuth.ts

**Task 1.5: Role Dashboards**
```
Create app/dashboard/page.tsx (redirects by role)
Create app/dashboard/admin/page.tsx (stats, quick actions)
Create app/dashboard/hr/page.tsx (similar to admin)
Create app/dashboard/teacher/page.tsx (my classes, schedule)
Create app/dashboard/student/page.tsx (my schedule, request meeting)
```
**Context:** App Description.md lines 80-101  
**Files:** app/dashboard/*/page.tsx

---

### Sprint 2: Availability Management (2 weeks)

#### 🤖 AI Coding Tasks

**Task 2.1: Availability Calendar**
```
Install @fullcalendar/react v6+ with plugins
Create components/availability/AvailabilityCalendar.tsx:
- Week view, 15-min increments
- Click/drag to add slots
- Validation: 30-min minimum, no overlaps
- Color coding: available (green), recurring (blue)
Create app/availability/page.tsx
```
**Context:** App Description.md lines 54-67  
**Files:** components/availability/AvailabilityCalendar.tsx, app/availability/page.tsx

**Task 2.2: Recurring Availability**
```
Create components/availability/RecurringAvailabilityDialog.tsx:
- Set weekly schedule (Mon-Sun)
- Multiple slots per day
- Preview next 4 weeks
Create lib/api/availability.ts with CRUD functions
```
**Context:** App Description.md lines 56-59  
**Files:** components/availability/RecurringAvailabilityDialog.tsx, lib/api/availability.ts

**Task 2.3: Bulk Operations**
```
Create components/availability/BulkOperationsToolbar.tsx:
- Quick clear buttons (today, week, month)
- Date range selector
- Scrub mode (click/drag to select dates)
- Copy week functionality
- Undo capability (10-second window)
```
**Context:** App Description.md lines 60-66, Development Plan.md line 56  
**Files:** components/availability/BulkOperationsToolbar.tsx

**Task 2.4: Validation**
```
Create lib/validation/availability.ts:
- validateTimeSlot (30-min min, 15-min increments)
- validateNoOverlap
- validateRecurringPattern
Use zod schemas
```
**Context:** App Description.md line 67  
**Files:** lib/validation/availability.ts

**Task 2.5: Supabase Integration**
```
Update lib/api/availability.ts with:
- getAvailability, createAvailability, updateAvailability, deleteAvailability
- Setup Supabase Realtime subscription
- Implement optimistic updates with TanStack Query
- Error handling and toast notifications
```
**Context:** Technical Specification.md lines 364-367  
**Files:** lib/api/availability.ts

---

### Sprint 3: Schedule Viewing (2 weeks)

#### 🤖 AI Coding Tasks

**Task 3.1: Schedule Calendar**
```
Create components/schedule/ScheduleCalendar.tsx:
- Day/week/month views
- Color-coded events (class: blue, meeting: green, training: purple)
- Hover tooltips
- Click to open details modal
Create app/schedule/page.tsx
```
**Context:** App Description.md lines 69-76  
**Files:** components/schedule/ScheduleCalendar.tsx, app/schedule/page.tsx

**Task 3.2: Event Fetching**
```
Create lib/api/events.ts:
- getMyEvents(userId, startDate, endDate)
- getEventDetails(eventId)
Create lib/filters/events.ts with filtering functions
Use TanStack Query with caching
```
**Context:** Technical Specification.md lines 183-221  
**Files:** lib/api/events.ts, lib/filters/events.ts

**Task 3.3: Real-time Updates**
```
Setup Supabase Realtime subscriptions for events and event_participants
Update React Query cache on changes
Show toast notifications for new/updated/deleted events
```
**Context:** Technical Specification.md lines 364-367  
**Files:** app/schedule/page.tsx

**Task 3.4: Seed Data Script**
```
Create scripts/seed-data.ts:
- Generate 5 admins, 5 HR, 10 teachers, 20 students
- Create 10 classes with enrollments
- Generate availability slots
- Create 20 events
- Create 5 pending requests
Use Supabase service role key
```
**Context:** Development Plan.md line 57  
**Files:** scripts/seed-data.ts

**Task 3.5: Loading & Error States**
```
Create components/ui/LoadingSpinner.tsx
Create components/ui/ErrorMessage.tsx
Create components/ui/EmptyState.tsx
Create components/ui/SkeletonLoader.tsx
Update all pages with Suspense and Error Boundaries
```
**Context:** Development Plan.md line 57  
**Files:** components/ui/*

---

## Phase 2: Feature Expansion (Sprints 4-7.5 - 9 Weeks)

### Sprint 4: RBAC & Teacher Features (2 weeks)

**Task 4.1: Advanced RBAC**
```
Create lib/auth/permissions.ts with permission constants
Create hooks/usePermissions.ts
Update middleware with permission checks
Add Server Action permission verification
```
**Context:** Development Plan.md line 76  
**Files:** lib/auth/permissions.ts

**Task 4.2: Teacher Class View**
```
Create app/dashboard/teacher/classes/page.tsx (list assigned classes)
Create app/dashboard/teacher/classes/[classId]/page.tsx (class details, students)
Create components/teacher/StudentAvailabilityViewer.tsx (read-only)
```
**Context:** App Description.md lines 82-90  
**Files:** app/dashboard/teacher/classes/*

---

### Sprint 5: Admin Master Schedule & Filtering (2 weeks)

**Task 5.1: Master Schedule**
```
Create app/admin/schedule/page.tsx with multi-user calendar
Show all events across organization
Color-code by user/type
```
**Context:** App Description.md lines 104-140  
**Files:** app/admin/schedule/page.tsx

**Task 5.2: Advanced Filtering**
```
Create components/admin/FilterPanel.tsx:
- Filters: user (search), role (checkboxes), event type, date range, subject, class
- Filter logic: OR within category, AND across categories
- Save/load filter presets
- Active filter chips with quick remove
- Real-time filtering with URL state
```
**Context:** App Description.md lines 106-140, Development Plan.md line 77  
**Files:** components/admin/FilterPanel.tsx

**Task 5.3: User Management**
```
Create app/admin/users/page.tsx (list all users)
Create app/admin/users/new/page.tsx (create user)
Create app/admin/users/[id]/page.tsx (edit user, change role, deactivate)
Add audit logging for admin actions
```
**Context:** Development Plan.md line 77  
**Files:** app/admin/users/*

---

### Sprint 6: Event Request System (2 weeks)

**Task 6.1: Meeting Request Form**
```
Create app/request-meeting/page.tsx:
- Participant selection
- Proposed date/time
- Duration, event type, description
- Validation
Submit to event_requests table
```
**Context:** Development Plan.md line 78  
**Files:** app/request-meeting/page.tsx

**Task 6.2: Request Management Dashboard**
```
Create app/admin/requests/page.tsx:
- Tabs: Pending, Approved, Declined
- Request queue with details
- Approve/Decline buttons
- Bulk actions
- Mini availability heat map
```
**Context:** App Description.md lines 217-239  
**Files:** app/admin/requests/page.tsx

---

### Sprint 7: Event Creation & Recurring Events (2 weeks)

**Task 7.1: Event Creation Page**
```
Create app/admin/events/new/page.tsx:
- All event fields (title, type, subject, start, duration)
- Advanced participant selection (search, role, class, quick add)
- Recurring events UI (daily, weekly, monthly, custom patterns)
- Recurrence range (never, after X, by date)
- Exception dates selector
- Preview next 5 occurrences
- Availability heat map
- Conflict detection
- Save as template checkbox
- File attachments (max 10MB)
```
**Context:** App Description.md lines 142-215, Development Plan.md line 79  
**Files:** app/admin/events/new/page.tsx

**Task 7.2: Recurring Events Edge Function**
```
Create supabase/functions/create-recurring-events/index.ts:
- Input: event_data, recurrence_pattern, recurrence_end_date
- Create parent event
- Generate all child event instances
- Handle exception dates
- Return array of created event IDs
```
**Context:** Technical Specification.md lines 345-354  
**Files:** supabase/functions/create-recurring-events/index.ts

---

### Sprint 7.5: Event Templates (1 week)

**Task 7.5.1: Template Library**
```
Create app/admin/templates/page.tsx:
- Grid/list view of templates
- Search and filter by type, subject, name
- Template cards (name, icon, duration, usage count)
- Create/Edit/Duplicate/Delete actions
```
**Context:** App Description.md lines 241-272, Development Plan.md line 81  
**Files:** app/admin/templates/page.tsx

**Task 7.5.2: Template CRUD**
```
Create lib/api/templates.ts:
- getTemplates, createTemplate, updateTemplate, deleteTemplate
- useTemplate (pre-fill event form)
- Update usage_count and last_used_at
Create components/admin/TemplateForm.tsx
```
**Context:** App Description.md lines 247-272  
**Files:** lib/api/templates.ts, components/admin/TemplateForm.tsx

---

## Phase 3: Polish & Pre-Launch (Sprints 8-9 - 4 Weeks)

### Sprint 8: UI/UX Polish & Accessibility (2 weeks)

**Task 8.1: UI Consistency Review**
```
- Audit all pages for consistent spacing, colors, typography
- Implement loading skeletons everywhere
- Add toast notifications for all user actions
- Create empty states for all lists/calendars
- Ensure mobile responsiveness (320px+)
```
**Context:** Development Plan.md line 100  

**Task 8.2: Accessibility**
```
- Implement WCAG 2.1 Level AA compliance
- Add keyboard navigation support
- Test with screen readers (NVDA, JAWS)
- Add aria-labels and roles
- Implement high contrast mode
- Add focus indicators
```
**Context:** App Description.md lines 289-293, Development Plan.md line 100  

---

### Sprint 9: Testing & Performance (2 weeks)

**Task 9.1: E2E Testing**
```
Install Playwright
Create tests/e2e/ directory
Write E2E tests for:
- Auth flows (login, signup, password reset)
- Availability management (create, edit, delete, recurring, bulk ops)
- Schedule viewing
- Event creation (including recurring)
- Template management
- Request approval workflow
```
**Context:** Development Plan.md line 101  
**Files:** tests/e2e/*

**Task 9.2: Performance Optimization**
```
- Implement code splitting and lazy loading
- Optimize database queries
- Add database indexes (already in schema)
- Optimize images with Next.js Image
- Run Lighthouse audits (target: >90 score)
- Load testing with 500+ concurrent users
```
**Context:** Development Plan.md line 101, Technical Specification.md lines 352-358  

**Task 9.3: Monitoring Setup**
```
- Setup Sentry for error tracking
- Configure Vercel Analytics
- Setup UptimeRobot for uptime monitoring
- Create monitoring dashboard
```
**Context:** Technical Specification.md lines 344-349  

---

## Phase 4: Launch

### ☐ Human Pre-Launch Tasks

```
□ Configure custom domain in Vercel
□ Setup SSL certificates (auto via Vercel)
□ Verify all environment variables in production
□ Run security audit (OWASP checks, dependency scan)
□ Setup database backups (Supabase auto-backup)
□ Configure rate limiting
□ Prepare rollback plan
□ Create incident response runbook
□ Smoke test all critical paths in production
```

### Launch Day

```
□ Deploy to production during low-traffic window
□ Monitor error rates (Sentry)
□ Monitor performance (Vercel Analytics)
□ Soft launch to initial user group
□ Collect feedback
□ Full public announcement after 48-hour stability period
```

---

## Quick Command Reference

```bash
# Development
npm run dev                    # Start dev server
npm run build                  # Build for production
npm run lint                   # Run ESLint
npm run type-check             # TypeScript check

# Database
supabase db reset              # Reset local database
supabase db push               # Push migrations
supabase gen types typescript  # Generate TypeScript types

# Testing
npm run test                   # Run unit tests
npm run test:e2e               # Run E2E tests
npm run seed                   # Seed database

# Deployment
git push origin main           # Deploy to production (auto)
git push origin develop        # Deploy to staging (auto)
```

---

## AI Prompt Template

When requesting AI assistance, use this template:

```
Context: [Feature name from this guide]
Reference: [Documentation file and line numbers]
Task: [Specific task description]

Requirements:
- [Requirement 1]
- [Requirement 2]
- [Requirement 3]

Files to create/modify: [List files]
Dependencies: [List any new packages needed]

Please implement with:
- TypeScript strict mode
- Proper error handling
- Loading states
- Responsive design
- Accessibility (WCAG 2.1 AA)
```

---

## Success Criteria Checklist

### Phase 0
- [ ] All services configured and accessible
- [ ] Database schema deployed
- [ ] CI/CD pipeline working
- [ ] "Hello World" deployed

### Phase 1 (MVP)
- [ ] Users can sign up, login, reset password
- [ ] Users can manage availability (recurring + one-time)
- [ ] Users can view their schedule
- [ ] Real-time updates working
- [ ] All CRUD operations functional

### Phase 2 (Feature Complete)
- [ ] RBAC system working for all roles
- [ ] Teachers can view assigned students
- [ ] Admin can filter master schedule
- [ ] Users can request meetings
- [ ] Admin can create events (including recurring)
- [ ] Event templates working
- [ ] Notifications operational

### Phase 3 (Production Ready)
- [ ] WCAG 2.1 AA compliant
- [ ] >80% test coverage
- [ ] <2s page load time
- [ ] Mobile responsive
- [ ] Error tracking configured
- [ ] UAT sign-off received

### Launch
- [ ] Production deployment successful
- [ ] No critical bugs in first 48 hours
- [ ] Monitoring dashboards active
- [ ] User feedback collected

---

**End of Implementation Guide**
