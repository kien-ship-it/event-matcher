# Event Matcher - Setup Guide

This guide will walk you through setting up the Event Matcher application from scratch.

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js 20+** and npm
- **Docker Desktop** (for local Supabase)
- **Git**
- A **Supabase account** (for production deployment)
- A **Vercel account** (for frontend deployment)

## Step-by-Step Setup

### 1. Install Dependencies

First, install all npm packages:

```bash
npm install
```

This will install all dependencies listed in `package.json`, including:
- Next.js 14
- TypeScript
- Tailwind CSS
- Supabase client libraries
- shadcn/ui components
- React Query
- And more...

### 2. Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

For **local development**, you'll update these after starting Supabase locally (Step 3).

For **production**, you'll need to:
1. Create a Supabase project at https://supabase.com
2. Get your project URL and anon key from Project Settings > API
3. Update `.env.local` with your production credentials

### 3. Start Local Supabase (Development)

Install Supabase CLI globally:

```bash
npm install -g supabase
```

Start local Supabase services (requires Docker):

```bash
supabase start
```

This command will:
- Start PostgreSQL database
- Start Supabase Studio (local dashboard)
- Start Auth server
- Start Realtime server
- Start Storage server
- Display connection details

**Important:** Copy the output and update your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key_from_output>
SUPABASE_SERVICE_ROLE_KEY=<service_role_key_from_output>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Apply Database Migrations

Push the database schema to your local Supabase:

```bash
supabase db push
```

This will create all tables, indexes, RLS policies, and triggers defined in:
`supabase/migrations/20250101000000_initial_schema.sql`

### 5. Generate TypeScript Types

Generate TypeScript types from your database schema:

```bash
supabase gen types typescript --local > types/database.ts
```

This ensures type safety when working with Supabase.

### 6. Start Development Server

Now you can start the Next.js development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

You should see: **"Hello Event Matcher"**

### 7. Access Supabase Studio

Open Supabase Studio to view your database:

```bash
open http://localhost:54323
```

Or visit: http://localhost:54323

Here you can:
- View and edit tables
- Test RLS policies
- View logs
- Manage authentication

### 8. Seed Database (Optional)

To populate the database with test data:

```bash
npm run seed
```

**Note:** The seed script is currently a placeholder. You'll need to implement it based on your needs.

## Production Deployment

### Supabase Production Setup

1. **Create a Supabase project:**
   - Go to https://supabase.com
   - Click "New Project"
   - Choose organization and project name: `event-matcher-prod`
   - Select a region close to your users
   - Set a strong database password

2. **Configure Authentication:**
   - Go to Authentication > Settings
   - Enable Email provider
   - Set password requirements (minimum 8 characters)
   - Add redirect URLs:
     - `http://localhost:3000/**` (for local testing)
     - `https://your-domain.com/**` (your production domain)
     - `https://your-staging.vercel.app/**` (staging)

3. **Push migrations to production:**
   ```bash
   supabase link --project-ref your_project_ref
   supabase db push
   ```

4. **Get production credentials:**
   - Go to Project Settings > API
   - Copy Project URL and anon key
   - Copy service_role key (keep this secret!)

### Vercel Deployment

1. **Push code to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Phase 0 complete"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/event-matcher.git
   git push -u origin main
   ```

2. **Create develop branch for staging:**
   ```bash
   git checkout -b develop
   git push -u origin develop
   ```

3. **Deploy to Vercel:**
   - Go to https://vercel.com
   - Click "Import Project"
   - Select your GitHub repository
   - Configure project:
     - Framework Preset: Next.js
     - Root Directory: `./`
     - Build Command: `npm run build`
     - Output Directory: `.next`

4. **Set environment variables in Vercel:**
   - Go to Project Settings > Environment Variables
   - Add for Production:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `NEXT_PUBLIC_APP_URL` (your production URL)
   - Repeat for Preview and Development environments

5. **Configure branch deployments:**
   - `main` branch → Production
   - `develop` branch → Staging
   - Pull requests → Preview deployments

## Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
npm run type-check       # TypeScript type checking
npm run format           # Format code with Prettier

# Database
supabase start           # Start local Supabase
supabase stop            # Stop local Supabase
supabase status          # Check Supabase status
supabase db reset        # Reset local database
supabase db push         # Push migrations
supabase gen types typescript --local > types/database.ts  # Generate types

# Testing
npm run test             # Run unit tests (Vitest)
npm run test:e2e         # Run E2E tests (Playwright)

# Seeding
npm run seed             # Seed database with test data
```

## Troubleshooting

### Docker Issues
If `supabase start` fails:
- Ensure Docker Desktop is running
- Check if ports 54321-54327 are available
- Try `supabase stop` then `supabase start` again

### TypeScript Errors
If you see type errors:
- Run `npm run type-check` to see all errors
- Regenerate types: `supabase gen types typescript --local > types/database.ts`
- Restart your IDE/TypeScript server

### Build Errors
If `npm run build` fails:
- Check for TypeScript errors: `npm run type-check`
- Check for ESLint errors: `npm run lint`
- Ensure all environment variables are set

### Database Connection Issues
- Verify Supabase is running: `supabase status`
- Check `.env.local` has correct credentials
- Ensure no firewall is blocking ports

## Next Steps

Phase 0 is now complete! You have:
- ✅ Next.js 14 project with TypeScript
- ✅ Tailwind CSS + shadcn/ui configured
- ✅ Supabase client setup (client-side, server-side, middleware)
- ✅ Complete database schema with RLS policies
- ✅ CI/CD pipeline with GitHub Actions
- ✅ Testing infrastructure (Vitest, Playwright)

**Ready for Phase 1:** Authentication & User Management

Refer to the Implementation Guide for the next tasks.
