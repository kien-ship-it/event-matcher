import { createClient } from '@/lib/supabase/client'

export interface Class {
  id: string
  name: string
  subject: string
  teacher_id: string | null
  created_at: string
}

export interface ClassWithDetails extends Class {
  teacher: {
    id: string
    full_name: string
    email: string
    avatar_url: string | null
  } | null
  class_enrollments: Array<{
    student_id: string
    enrolled_at: string
    student: {
      id: string
      full_name: string
      email: string
      avatar_url: string | null
    }
  }>
}

export interface StudentWithAvailability {
  id: string
  full_name: string
  email: string
  avatar_url: string | null
  availability: Array<{
    id: string
    start_time: string
    end_time: string
    is_recurring: boolean | null
    day_of_week: number | null
    recurrence_end_date: string | null
    exception_dates: any
  }>
}

/**
 * Get all classes assigned to a teacher
 */
export async function getTeacherClasses(teacherId: string): Promise<ClassWithDetails[]> {
  const supabase = createClient()

  const { data, error} = await supabase
    .from('classes')
    .select(`
      id,
      name,
      subject,
      teacher_id,
      created_at,
      teacher:profiles!classes_teacher_id_fkey (
        id,
        full_name,
        email,
        avatar_url
      ),
      class_enrollments (
        student_id,
        enrolled_at,
        student:profiles!class_enrollments_student_id_fkey (
          id,
          full_name,
          email,
          avatar_url
        )
      )
    `)
    .eq('teacher_id', teacherId)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching teacher classes:', error)
    throw new Error('Failed to fetch classes')
  }

  return (data || []) as ClassWithDetails[]
}

/**
 * Get a single class with all details
 */
export async function getClassDetails(classId: string): Promise<ClassWithDetails | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('classes')
    .select(`
      id,
      name,
      subject,
      teacher_id,
      created_at,
      teacher:profiles!classes_teacher_id_fkey (
        id,
        full_name,
        email,
        avatar_url
      ),
      class_enrollments (
        student_id,
        enrolled_at,
        student:profiles!class_enrollments_student_id_fkey (
          id,
          full_name,
          email,
          avatar_url
        )
      )
    `)
    .eq('id', classId)
    .single()

  if (error) {
    console.error('Error fetching class details:', error)
    return null
  }

  return data as ClassWithDetails
}

/**
 * Get students in a class with their availability
 */
export async function getClassStudentsWithAvailability(
  classId: string
): Promise<StudentWithAvailability[]> {
  const supabase = createClient()

  // First get the students enrolled in the class
  const { data: enrollments, error: enrollmentError } = await supabase
    .from('class_enrollments')
    .select(`
      student_id,
      student:profiles!class_enrollments_student_id_fkey (
        id,
        full_name,
        email,
        avatar_url
      )
    `)
    .eq('class_id', classId)

  if (enrollmentError) {
    console.error('Error fetching class students:', enrollmentError)
    throw new Error('Failed to fetch students')
  }

  if (!enrollments || enrollments.length === 0) {
    return []
  }

  // Get availability for all students
  const studentIds = enrollments.map((e: any) => e.student_id)
  
  const { data: availability, error: availabilityError } = await supabase
    .from('availability')
    .select('*')
    .in('user_id', studentIds)
    .order('start_time', { ascending: true })

  if (availabilityError) {
    console.error('Error fetching student availability:', availabilityError)
    throw new Error('Failed to fetch availability')
  }

  // Combine student data with their availability
  const studentsWithAvailability: StudentWithAvailability[] = enrollments.map((enrollment: any) => {
    const student = enrollment.student
    const studentAvailability = (availability || []).filter(
      (slot: any) => slot.user_id === enrollment.student_id
    )

    return {
      id: student.id,
      full_name: student.full_name,
      email: student.email,
      avatar_url: student.avatar_url,
      availability: studentAvailability,
    }
  })

  return studentsWithAvailability
}

/**
 * Check if a user is a teacher for a specific class
 */
export async function isTeacherForClass(userId: string, classId: string): Promise<boolean> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('classes')
    .select('teacher_id')
    .eq('id', classId)
    .eq('teacher_id', userId)
    .single()

  if (error) {
    return false
  }

  return !!data
}

/**
 * Get all classes (admin/HR only)
 */
export async function getAllClasses(): Promise<ClassWithDetails[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('classes')
    .select(`
      id,
      name,
      subject,
      teacher_id,
      created_at,
      teacher:profiles!classes_teacher_id_fkey (
        id,
        full_name,
        email,
        avatar_url
      ),
      class_enrollments (
        student_id,
        enrolled_at,
        student:profiles!class_enrollments_student_id_fkey (
          id,
          full_name,
          email,
          avatar_url
        )
      )
    `)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching all classes:', error)
    throw new Error('Failed to fetch classes')
  }

  return (data || []) as ClassWithDetails[]
}

/**
 * Subscribe to class changes
 */
export function subscribeToClasses(callback: (payload: any) => void) {
  const supabase = createClient()

  const subscription = supabase
    .channel('classes_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'classes',
      },
      callback
    )
    .subscribe()

  return () => {
    subscription.unsubscribe()
  }
}

/**
 * Subscribe to enrollment changes
 */
export function subscribeToEnrollments(callback: (payload: any) => void) {
  const supabase = createClient()

  const subscription = supabase
    .channel('enrollments_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'class_enrollments',
      },
      callback
    )
    .subscribe()

  return () => {
    subscription.unsubscribe()
  }
}
