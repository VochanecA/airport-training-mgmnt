import { getSupabaseServerClient } from '@/lib/supabase/server'
import type {
  DashboardStats,
  ExpiringCertificate,
  UpcomingCourse,
  RecentAlert,
  ReportPlannedCourse,
  ReportCertificateIssued
} from '@/lib/types'

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await getSupabaseServerClient()

  const [
    { count: totalStaff },
    { count: activeStaff },
    { count: upcomingCourses },
    { count: activeCertificates },
    { count: expiredCertificates },
    { count: expiringSoonCertificates },
    { count: activeAlerts },
    { count: criticalAlerts }
  ] = await Promise.all([
    supabase.from('staff').select('*', { count: 'exact', head: true }),
    supabase.from('staff').select('*', { count: 'exact', head: true }).eq('employment_status', 'active'),
    supabase.from('courses').select('*', { count: 'exact', head: true }).gte('start_date', new Date().toISOString()).eq('status', 'confirmed'),
    supabase.from('training_records').select('*', { count: 'exact', head: true }).eq('is_valid', true),
    supabase.from('training_records').select('*', { count: 'exact', head: true }).lt('expiry_date', new Date().toISOString()),
    supabase.from('training_records').select('*', { count: 'exact', head: true }).gte('expiry_date', new Date().toISOString()).lte('expiry_date', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()),
    supabase.from('training_alerts').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('training_alerts').select('*', { count: 'exact', head: true }).eq('status', 'active').eq('alert_level', 'critical')
  ])

  // Calculate compliance rate
  const { data: staffWithRequirements } = await supabase
    .from('staff_training_profile')
    .select('compliance_percentage')
    .eq('employment_status', 'active')

  const complianceRate = staffWithRequirements && staffWithRequirements.length > 0
    ? staffWithRequirements.reduce((sum, staff) => sum + (staff.compliance_percentage || 0), 0) / staffWithRequirements.length
    : 0

  return {
    totalStaff: totalStaff || 0,
    activeStaff: activeStaff || 0,
    upcomingCourses: upcomingCourses || 0,
    activeCertificates: activeCertificates || 0,
    expiredCertificates: expiredCertificates || 0,
    expiringSoonCertificates: expiringSoonCertificates || 0,
    activeAlerts: activeAlerts || 0,
    criticalAlerts: criticalAlerts || 0,
    complianceRate: Math.round(complianceRate)
  }
}

export async function getExpiringCertificates(limit: number = 5): Promise<ExpiringCertificate[]> {
  const supabase = await getSupabaseServerClient()

  const { data } = await supabase
    .from('report_renewal_due_dates')
    .select('*')
    .gte('expiry_date', new Date().toISOString())
    .lte('expiry_date', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString())
    .order('expiry_date')
    .limit(limit)

  return (data || []).map(item => ({
    id: item.id,
    certificate_number: item.certificate_number,
    expiry_date: item.expiry_date,
    staff_name: item.staff_name,
    training_name: item.training_name,
    days_until_expiry: item.days_until_expiry
  }))
}

export async function getUpcomingCourses(limit: number = 4): Promise<UpcomingCourse[]> {
  const supabase = await getSupabaseServerClient()

  const { data } = await supabase
    .from('courses')
    .select(`
      id,
      course_code,
      title,
      start_date,
      location,
      current_participants,
      max_participants,
      instructor:instructors(
        staff:staff(first_name, last_name),
        external_instructor_name
      )
    `)
    .gte('start_date', new Date().toISOString())
    .eq('status', 'confirmed')
    .order('start_date')
    .limit(limit)

  return (data || []).map(course => ({
    id: course.id,
    course_code: course.course_code,
    title: course.title,
    start_date: course.start_date,
    location: course.location,
    instructor_name: course.instructor?.staff 
      ? `${course.instructor.staff.first_name} ${course.instructor.staff.last_name}`
      : course.instructor?.external_instructor_name || 'N/A',
    current_participants: course.current_participants,
    max_participants: course.max_participants
  }))
}

export async function getRecentAlerts(limit: number = 5): Promise<RecentAlert[]> {
  const supabase = await getSupabaseServerClient()

  const { data } = await supabase
    .from('report_training_alerts')
    .select('*')
    .eq('status', 'active')
    .order('alert_level', { ascending: false })
    .order('due_date')
    .limit(limit)

  return (data || []).map(alert => ({
    id: alert.id,
    alert_type: alert.alert_type,
    alert_level: alert.alert_level,
    description: alert.description,
    staff_name: alert.staff_name,
    training_name: alert.training_name || 'N/A',
    days_until_due: alert.days_until_due
  }))
}

export async function getReportPlannedCourses(): Promise<ReportPlannedCourse[]> {
  const supabase = await getSupabaseServerClient()

  const { data } = await supabase
    .from('report_planned_courses')
    .select('*')
    .order('start_date')

  return (data || []).map(course => ({
    id: course.id,
    course_code: course.course_code,
    title: course.title,
    start_date: course.start_date,
    end_date: course.end_date,
    location: course.location,
    max_participants: course.max_participants,
    current_participants: course.current_participants,
    course_type: course.course_type,
    status: course.status,
    training_name: course.training_name,
    training_code: course.training_code,
    instructor_name: course.instructor_name,
    registered_participants: course.registered_participants
  }))
}

export async function getReportCertificatesIssued(startDate?: string, endDate?: string): Promise<ReportCertificateIssued[]> {
  const supabase = await getSupabaseServerClient()

  let query = supabase
    .from('report_certificates_issued')
    .select('*')
    .order('completion_date', { ascending: false })

  if (startDate) {
    query = query.gte('completion_date', startDate)
  }
  if (endDate) {
    query = query.lte('completion_date', endDate)
  }

  const { data } = await query

  return (data || []).map(cert => ({
    id: cert.id,
    certificate_number: cert.certificate_number,
    completion_date: cert.completion_date,
    expiry_date: cert.expiry_date,
    issuing_authority: cert.issuing_authority,
    staff_name: cert.staff_name,
    employee_number: cert.employee_number,
    training_name: cert.training_name,
    training_code: cert.training_code,
    course_title: cert.course_title,
    instructor_name: cert.instructor_name
  }))
}

export async function getStaffWithTrainingProfile() {
  const supabase = await getSupabaseServerClient()

  const { data } = await supabase
    .from('staff_training_profile')
    .select('*')
    .order('full_name')

  return data || []
}

export async function getOverdueAndMissingTrainings() {
  const supabase = await getSupabaseServerClient()

  const { data } = await supabase
    .from('report_overdue_missing')
    .select('*')
    .order('position_name, staff_name')

  return data || []
}