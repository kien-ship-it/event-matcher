# Event Matcher - Schedule Management System

![CI Status](https://github.com/YOUR_USERNAME/event-matcher/workflows/CI/badge.svg)

An intelligent scheduling and availability management system for educational institutions, built with Next.js 14, TypeScript, Supabase, and Tailwind CSS.

## Features

- **Role-Based Access Control**: Admin, HR, Teacher, and Student roles with specific permissions
- **Availability Management**: Recurring and one-time availability slots with bulk operations
- **Event Scheduling**: Create, manage, and track events with recurring patterns
- **Real-time Updates**: Live synchronization using Supabase Realtime
- **Event Templates**: Reusable templates for common event types
- **Advanced Filtering**: Multi-criteria filtering for master schedule view
- **Notifications**: In-app and email notifications for event changes

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Edge Functions)
- **Hosting**: Vercel (frontend), Supabase (backend)
- **Key Libraries**: 
  - `@fullcalendar/react` - Calendar component
  - `@tanstack/react-query` - Data fetching and caching
  - `react-hook-form` + `zod` - Form validation
  - `date-fns` - Date manipulation

## Getting Started

### Prerequisites

- Node.js 20+ and npm
- Supabase account
- Vercel account (for deployment)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/event-matcher.git
cd event-matcher
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. Set up Supabase:
```bash
# Install Supabase CLI
npm install -g supabase

# Initialize Supabase (if not already done)
supabase init

# Start local Supabase (requires Docker)
supabase start

# Push migrations to local database
supabase db push

# Generate TypeScript types
supabase gen types typescript --local > types/database.ts
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking
- `npm run format` - Format code with Prettier
- `npm run seed` - Seed database with test data

## Project Structure

```
event-matcher/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication pages
│   ├── dashboard/         # Role-specific dashboards
│   ├── availability/      # Availability management
│   ├── schedule/          # Schedule viewing
│   └── admin/             # Admin features
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── availability/     # Availability components
│   ├── schedule/         # Schedule components
│   └── admin/            # Admin components
├── lib/                   # Utility functions
│   ├── supabase/         # Supabase clients
│   ├── api/              # API functions
│   ├── auth/             # Auth utilities
│   └── validation/       # Validation schemas
├── types/                 # TypeScript types
├── hooks/                 # Custom React hooks
├── supabase/             # Supabase configuration
│   ├── migrations/       # Database migrations
│   └── functions/        # Edge functions
└── scripts/              # Utility scripts
```

## Database Schema

The application uses PostgreSQL with the following main tables:
- `profiles` - User profiles with role information
- `classes` - Class definitions
- `class_enrollments` - Student-class relationships
- `availability` - User availability slots
- `events` - Scheduled events
- `event_participants` - Event-user relationships
- `event_requests` - Meeting requests
- `event_templates` - Reusable event templates
- `notifications` - User notifications
- `filter_presets` - Saved filter configurations
- `audit_logs` - Admin action logs

## Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Import the repository in Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy!

Vercel will automatically deploy:
- `main` branch → Production
- `develop` branch → Staging
- Pull requests → Preview deployments

### Supabase Setup

1. Create a Supabase project
2. Run migrations: `supabase db push`
3. Configure Auth settings (email provider, redirect URLs)
4. Set up Edge Functions (if needed)

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For questions or issues, please open an issue on GitHub or contact the development team.

---

**Phase 0 Foundation Complete** ✅
- Next.js 14 with TypeScript
- Tailwind CSS + shadcn/ui
- Supabase configuration
- Database schema with RLS
- CI/CD pipeline
