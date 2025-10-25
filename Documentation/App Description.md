# Event Matcher: Application Feature Specification

## 1. Introduction

This document outlines the features and specifications for the "Event Matcher," a web-based application designed to solve the complex and time-consuming process of scheduling for a tutoring business. The application will centralize schedule management for the administrative team while providing personalized, role-based access for employees (teachers, HR) and clients (students).

**Version:** 1.1  
**Last Updated:** October 2025

---

## 2. User Roles & Permissions

The application features a **flexible roles + privileges model** where organizational roles define identity, and specific privileges grant capabilities. "Admin" is not a role but a set of privileges that can be assigned to any user.

### 2.1. Organizational Roles

*   **Teacher** (System Role)
    *   Primary function: Instructors who teach classes
    *   Default privileges: Can view assigned students' availability
    *   Can manage own availability and view own schedule

*   **Student** (System Role)
    *   Primary function: Students enrolled in classes
    *   Default privileges: None (self-access only)
    *   Can manage own availability and view own schedule

*   **Marketing**
    *   Primary function: Marketing team members
    *   Default privileges: View all events, view all availability
    *   Can scrub timelines and view weekly calendars
    *   Can be granted `approve_events` to schedule internal meetings

*   **HR (Human Resources)**
    *   Primary function: HR team members
    *   Default privileges: View all events, view all availability, view all users, manage users, manage classes
    *   Can manage user accounts and class assignments
    *   Can be granted `approve_events` for full admin capabilities

*   **Operations**
    *   Primary function: Operations team members
    *   Default privileges: View all events, view all availability
    *   Can scrub timelines and view weekly calendars
    *   Can be granted any privilege as needed

### 2.2. Key Privileges (Admin Capabilities)

These privileges can be granted to any user, regardless of role:

**Event Management:**
*   `approve_events` - Approve and confirm event requests (primary "admin" privilege)
*   `create_events` - Create events for others
*   `manage_all_events` - Edit/delete any event
*   `view_all_events` - View all events in the system

**User Management:**
*   `manage_users` - Create, edit, and deactivate users
*   `assign_privileges` - Grant/revoke privileges to other users
*   `view_all_users` - View all user profiles

**Availability:**
*   `view_all_availability` - View everyone's availability
*   `view_team_availability` - View assigned team members' availability

**Classes:**
*   `manage_classes` - Create and manage class assignments

**System:**
*   `view_audit_logs` - View system audit logs
*   `manage_templates` - Create and edit event templates

### 2.3. Example Privilege Assignments

*   **Marketing Manager** (marketing role + `approve_events` privilege) = Can schedule internal meetings
*   **HR Manager** (hr role + `approve_events` privilege) = Full admin access
*   **Operations Lead** (operations role + `manage_templates` privilege) = Can manage event templates
*   **Teacher** (teacher role, no additional privileges) = Can only view assigned students

---

## 3. Core Features

These are fundamental functionalities accessible to various user roles.

### 3.1. User Account Management
*   **Secure Authentication:** All users will log in with email and password.
    *   Password requirements: Minimum 8 characters, at least one uppercase, one lowercase, one number.
    *   Session timeout: 24 hours of inactivity.
    *   Password reset via email verification.
*   **Role Assignment:** Roles are assigned by Admin/HR during account creation, not self-selected.
*   **User Profile:** Users can update their display name, contact information, and notification preferences.

### 3.2. Availability Management
*   **Personal Availability Page:** A dedicated, intuitive interface for every user to manage their free time.
*   **Recurring Availability:** Users can set a default weekly schedule (e.g., "available every Monday from 9 AM to 5 PM") that repeats automatically.
    *   Time slots must be in 15-minute increments.
    *   Minimum slot duration: 30 minutes.
*   **Specific Edits:** Users can override their recurring schedule for specific dates to add or remove availability for one-time events.
*   **Bulk Operations (Availability Scrub):** 
    *   **Quick Clear Buttons:** One-click options for "Clear Today," "Clear This Week," "Clear This Month"
    *   **Date Range Selector:** Choose start and end dates to clear all availability in that range
    *   **Calendar Scrub Mode:** Toggle scrub mode to click/drag on calendar days for visual selection, then clear selected dates
    *   **Copy Week:** Duplicate availability pattern from one week to another
    *   **Visual Preview:** Shows which slots will be affected before confirmation
    *   **Undo Capability:** 10-second undo window after bulk deletion
*   **Validation:** System prevents overlapping availability slots and ensures logical time ranges.

### 3.3. Schedule Viewing
*   **Individualized Calendar:** Every user has a personal calendar view showing only the events, classes, and meetings they are a part of.
    *   Multiple view options: Day, Week, Month.
    *   Color-coded event types (classes, meetings, training).
    *   Event details on hover/click.
*   **Centralized Calendar:** A master calendar, visible only to Admin and HR, that displays all events and user schedules across the entire organization.
    *   Advanced filtering by user, role, event type, date range.
    *   Export functionality (CSV, iCal format).

---

## 4. Feature Specification by User View

### 4.1. Employee View (Teacher, HR)

*   **Page 1: My Availability**
    *   An interactive weekly calendar to set, update, and manage personal free time.
    *   Teachers can access a view displaying the availability of students enrolled in their classes to find common free times.

*   **Page 2: My Schedule**
    *   A personal calendar displaying all confirmed events (classes, meetings, training).
    *   A feature to initiate a meeting request with another teacher or a student. This request is sent to an Admin/HR for approval.

### 4.2. Client View (Student)

*   **Page 1: My Availability**
    *   A simple, user-friendly weekly calendar to input and update their free time.
    *   A feature to view the availability of teachers for the subjects they are interested in.

*   **Page 2: My Schedule**
    *   A clear calendar view of all their upcoming classes and confirmed meetings.
    *   A button to request a meeting with a teacher, which is sent to the Admin/HR team for review and scheduling.

### 4.3. Admin & HR View

*   **Page 1: Master Schedule**
    *   A comprehensive, organization-wide calendar displaying all events across the organization.
    *   **Advanced Filtering System:**
        *   **Filter Panel:** Collapsible sidebar with multiple filter categories
        *   **Filter Types:**
            *   **By User:** 
                *   Search bar with type-ahead to find specific users
                *   Multi-select to view multiple users simultaneously
            *   **By Role:** 
                *   Checkboxes for Admin, HR, Teacher, Student
                *   Select all/none toggle
            *   **By Event Type:** 
                *   Checkboxes for Class, Meeting, Training
                *   Color-coded to match calendar event colors
            *   **By Date Range:** 
                *   Custom date picker (start and end date)
                *   Quick presets: "Today," "This Week," "This Month," "Next 7 Days," "Next 30 Days"
            *   **By Subject/Department:** 
                *   Dropdown list of all subjects (Math, Science, English, etc.)
                *   Multi-select support
            *   **By Class:** 
                *   Dropdown list of all classes
                *   Shows class name and teacher
        *   **Filter Logic:** 
            *   Filters within same category use OR logic (e.g., Teacher A OR Teacher B)
            *   Filters across categories use AND logic (e.g., Teachers AND Classes)
        *   **Filter Presets:** 
            *   Save custom filter combinations with names (e.g., "My Teachers," "All Math Classes")
            *   Quick access dropdown to load saved presets
            *   Edit/delete saved presets
        *   **Active Filters Display:** 
            *   Visual chips showing currently active filters
            *   X button on each chip to quickly remove individual filters
            *   "Clear All Filters" button
            *   Filter count indicator (e.g., "3 filters active")
        *   **Real-time Filtering:** Calendar updates immediately as filters are applied
        *   **URL State:** Filter selections persist in URL for sharing and bookmarking

*   **Page 2: Event Creation**
    *   An administrative tool to schedule new events (classes, training sessions).
    *   **Quick Start Options:**
        *   **Create from Scratch:** Standard form with all fields
        *   **Create from Template:** Select from saved event templates (see Event Templates section below)
        *   **Duplicate Existing Event:** Copy settings from a previous event
    *   **Event Details:** Required fields include:
        *   **Event Title:** Text input (max 100 characters)
        *   **Event Type:** Dropdown (Class, Training, Meeting)
        *   **Subject/Department:** Dropdown or text input
        *   **Start Date & Time:** 
            *   Date picker with calendar view
            *   Time picker with 15-minute increments
            *   Timezone display (based on user's location)
        *   **Duration:** 
            *   Dropdown (30 min, 1 hour, 1.5 hours, 2 hours, etc. up to 4 hours)
            *   Or custom duration input (15-min increments)
            *   Shows calculated end time
        *   **Participants (Advanced Multi-Select):**
            *   **Search by Name:** Type-ahead search to find specific users
            *   **Filter by Role:** Dropdown to filter users by role (Admin, HR, Teacher, Student)
            *   **Select by Class:** Choose entire class (e.g., "Math 101" adds all enrolled students + teacher)
            *   **Quick Add Options:**
                *   "Add All Teachers"
                *   "Add All HR Staff"
                *   "Add All Students in [Class]"
            *   **Selected Participants Display:** Visual chips/tags showing selected users with role badges
            *   **Quick Remove:** X button on each chip to remove individual participants
            *   **Participant Count:** Shows total selected (e.g., "12 participants selected")
            *   **Mixed Selection:** Can combine individual users, roles, and classes
        *   **Optional Fields:**
            *   Description (rich text editor, max 500 characters)
            *   Location (text input or dropdown of common locations)
            *   Meeting Link (URL input with validation)
            *   Attachments (file upload, max 10MB)
    *   **Recurring Events:**
        *   **Enable Recurrence:** Toggle switch
        *   **Recurrence Pattern:**
            *   **Daily:** Every X days (1-30)
            *   **Weekly:** Select days of week (Mon, Tue, Wed, etc.)
            *   **Monthly:** 
                *   By day of month (e.g., "15th of every month")
                *   By day of week (e.g., "2nd Tuesday of every month")
            *   **Custom:** Advanced pattern builder
        *   **Recurrence Range:**
            *   **Start Date:** Auto-filled with event start date
            *   **End Options:**
                *   Never (continues indefinitely)
                *   After X occurrences (1-100)
                *   By specific end date (date picker)
        *   **Exceptions:** 
            *   Add specific dates to skip (e.g., holidays)
            *   Calendar view to select exception dates
            *   List of exceptions with remove option
        *   **Preview:** Shows next 5 occurrences with dates
    *   **Availability Heat Map:** Visual representation showing overlapping free times for selected participants.
        *   Color intensity indicates number of available participants.
        *   Displays in 15-minute time blocks.
        *   Shows participant names on hover.
        *   Updates dynamically as participants are added/removed.
        *   For recurring events, shows heat map for first occurrence
    *   **Conflict Detection:** 
        *   System warns if scheduling over existing events for any participant
        *   For recurring events, shows total conflicts across all occurrences
        *   Option to view detailed conflict list
    *   **Save as Template:**
        *   Checkbox: "Save this configuration as a template"
        *   Template name input (if checked)
        *   Saves all settings except date/time and participants
    *   **Action Buttons:**
        *   **Create Event:** Creates single or recurring event series
        *   **Save as Draft:** Saves for later completion
        *   **Cancel:** Discards changes with confirmation
    *   **Auto-Population:** Once confirmed, event(s) automatically added to all participants' calendars with email notifications.

*   **Page 3: Event Request Management**
    *   **Purpose:** A centralized dashboard for Admins and HR to manage all meeting requests submitted by teachers and students.
    *   **Request Queue:** An organized list showing:
        *   Requestor name and role
        *   Requested participants
        *   Proposed date/time and duration
        *   Request submission timestamp
        *   Priority indicator (if applicable)
    *   **Status Tabs:** Organized into "Pending," "Approved," and "Declined" tabs with request counts.
    *   **Actions:** Each pending request has clear "Approve" and "Decline" buttons.
        *   **On Approve:** 
            *   Event is automatically created and added to all participants' calendars.
            *   All participants receive email and in-app notifications.
            *   Request moves to "Approved" tab with timestamp.
        *   **On Decline:** 
            *   Admin must provide a decline reason (required field, min 10 characters).
            *   Requestor receives email and in-app notification with the reason.
            *   Request moves to "Declined" tab with reason logged.
    *   **Detailed View:** Click any request to see:
        *   Full request details and any notes from requestor.
        *   Mini availability heat map for proposed time window.
        *   Conflict warnings if participants have overlapping events.
    *   **Bulk Actions:** Approve/decline multiple requests at once (with shared decline reason option).

*   **Page 4: Event Templates**
    *   **Purpose:** Manage reusable event configurations for quick event creation.
    *   **Template Library:**
        *   Grid or list view of all saved templates
        *   Each template card shows: name, event type icon, duration, typical participant count
        *   Search and filter templates by type, subject, or name
    *   **Template Details:**
        *   **Saved Information:**
            *   Template name
            *   Event type (class, training, meeting)
            *   Default duration
            *   Subject/Department
            *   Description template
            *   Default location
            *   Recurring pattern (if applicable)
        *   **Not Saved:** Specific date/time, specific participants (only participant selection method)
    *   **Template Actions:**
        *   **Use Template:** Opens event creation form pre-filled with template settings
        *   **Edit Template:** Modify template settings
        *   **Duplicate Template:** Create a copy with modifications
        *   **Delete Template:** Remove template (with confirmation)
    *   **Create New Template:**
        *   Can be created from Event Creation page (via "Save as Template")
        *   Or created directly from Template Library
        *   Form includes all template fields
    *   **Template Categories:**
        *   Option to organize templates into categories (e.g., "Weekly Classes," "Training Sessions," "One-on-One Meetings")
        *   Filter by category
    *   **Usage Analytics:**
        *   Shows how many times each template has been used
        *   Last used date
        *   Helps identify popular templates

---

## 5. Non-Functional Requirements

### 5.1. Performance
*   Page load time: < 2 seconds on standard broadband connection.
*   Calendar interactions: < 500ms response time.
*   Support for 500+ concurrent users.

### 5.2. Security
*   All data transmission encrypted via HTTPS.
*   Role-based access control (RBAC) enforced at database level.
*   Audit logging for all administrative actions.
*   Compliance with data protection regulations (GDPR considerations).

### 5.3. Accessibility
*   WCAG 2.1 Level AA compliance.
*   Keyboard navigation support.
*   Screen reader compatible.
*   High contrast mode available.

### 5.4. Browser Support
*   Chrome (last 2 versions)
*   Firefox (last 2 versions)
*   Safari (last 2 versions)
*   Edge (last 2 versions)
*   Mobile browsers: iOS Safari, Chrome Mobile

### 5.5. Notifications
*   **In-App Notifications:** Real-time updates for event changes, approvals, declines.
*   **Email Notifications:** Configurable per user for:
    *   Event creation/modification/cancellation
    *   Meeting request status changes
    *   Daily/weekly schedule summaries

---

## 6. Future Enhancements (Post-MVP)

*   **Calendar Integration:** Sync with Google Calendar, Outlook.
*   **Mobile Apps:** Native iOS and Android applications.
*   **Analytics Dashboard:** Usage statistics, popular time slots, scheduling efficiency metrics.
*   **Automated Scheduling:** AI-powered suggestions for optimal meeting times.
*   **Video Conferencing Integration:** Direct Zoom/Teams links in events.
*   **Payment Integration:** For paid tutoring sessions.
*   **Student Progress Tracking:** Link events to learning outcomes.

***