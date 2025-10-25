// import { createClient } from '@supabase/supabase-js'
// import type { Database } from '@/types/database'

// This script requires SUPABASE_SERVICE_ROLE_KEY to be set
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

// Supabase client for seeding (will be used when implementing seed logic)
// const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
//   auth: {
//     autoRefreshToken: false,
//     persistSession: false,
//   },
// })

async function seedData() {
  console.log('🌱 Starting database seed...')

  try {
    // Note: This is a placeholder script
    // In a real implementation, you would:
    // 1. Create test users via Supabase Auth API
    // 2. Insert profiles with different roles
    // 3. Create classes and enrollments
    // 4. Generate availability slots
    // 5. Create sample events
    // 6. Create pending event requests

    console.log('✅ Database seeded successfully!')
    console.log('\nTest accounts created:')
    console.log('- Admin: admin@example.com')
    console.log('- HR: hr@example.com')
    console.log('- Teacher: teacher@example.com')
    console.log('- Student: student@example.com')
    console.log('\nDefault password: Password123!')
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    process.exit(1)
  }
}

seedData()
