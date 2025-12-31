// // Common types
// export interface TrainingType {
//   id: string
//   name: string
//   description?: string | null
//   created_at?: string
// }

// export interface Employee {
//   id: string
//   first_name: string
//   last_name: string
//   email?: string | null
//   phone?: string | null
//   position?: string | null
//   department?: string | null
//   employee_number?: string | null
//   hire_date?: string | null
//   status: 'active' | 'inactive'
//   created_at?: string
//   updated_at?: string
// }

// export interface Training {
//   id: string
//   training_type_id: string
//   title: string
//   description?: string | null
//   instructor?: string | null
//   location?: string | null
//   start_date: string
//   end_date: string
//   capacity?: number | null
//   status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
//   created_at?: string
//   updated_at?: string
//   training_type?: TrainingType
// }

// export interface Certificate {
//   id: string
//   employee_id: string
//   training_id: string
//   certificate_number: string
//   issue_date: string
//   expiry_date: string
//   status: 'valid' | 'expired' | 'revoked'
//   file_url?: string | null
//   created_at?: string
//   updated_at?: string
//   employees?: Employee
//   trainings?: Training
// }

// export interface TrainingProgram {
//   id: string
//   title: string
//   code: string
//   description?: string | null
//   theoretical_hours?: number | null
//   practical_hours?: number | null
//   is_active: boolean
//   created_at?: string
//   updated_at?: string
// }

// export interface Profile {
//   id: string
//   full_name?: string | null
//   email?: string | null
//   avatar_url?: string | null
//   role: string
//   created_at?: string
//   updated_at?: string
// }

// // Dashboard specific types
// export interface DashboardStats {
//   employeesCount: number
//   upcomingTrainings: number
//   activeCertificates: number
//   completedThisMonth: number
//   expiringCertificates: Certificate[]
//   recentTrainings: Training[]
//   upcomingItems: Training[]
// }

// // Form data types
// export interface NewTrainingFormData {
//   training_type_id: string
//   title: string
//   description: string
//   instructor: string
//   location: string
//   start_date: string
//   end_date: string
//   capacity: string
//   status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
// }

// export interface NewEmployeeFormData {
//   first_name: string
//   last_name: string
//   email: string
//   phone: string
//   position: string
//   department: string
//   employee_number: string
//   hire_date: string
//   status: 'active' | 'inactive'
// }

// GalioT CLS/TR Training Management System Types

// 1.1 Working Positions
export interface WorkingPosition {
  id: string
  code: string
  name: string
  description?: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

// 1.2 Staff (Osoblje)
export interface Staff {
  id: string
  employee_number?: string | null
  first_name: string
  last_name: string
  email?: string | null
  phone?: string | null
  working_position_id?: string | null
  person_type: 'employee' | 'subcontractor' | 'seasonal' | 'external'
  employment_status: 'active' | 'inactive' | 'terminated'
  hired_date?: string | null
  contract_end_date?: string | null
  department?: string | null
  notes?: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  working_position?: WorkingPosition
}

// 1.3 Training Types
export interface TrainingType {
  id: string
  code: string
  name: string
  category?: 'safety' | 'technical' | 'operational' | 'administrative' | null
  description?: string | null
  validity_period_months?: number | null
  renewal_notice_days?: number | null
  is_mandatory: boolean
  difficulty_level?: 'basic' | 'intermediate' | 'advanced' | null
  created_at: string
  updated_at: string
}

// 1.4 Training Master Data
export interface TrainingMasterData {
  id: string
  training_type_id: string
  code: string
  name: string
  issuing_authority?: string | null
  standard_reference?: string | null
  duration_hours?: number | null
  cost?: number | null
  training_provider?: string | null
  location?: string | null
  notes?: string | null
  is_active: boolean
  requires_practical: boolean
  requires_exam: boolean
  created_at: string
  updated_at: string
  training_type?: TrainingType
}

// 1.5 Instructors
export interface Instructor {
  id: string
  staff_id?: string | null
  external_instructor_name?: string | null
  external_instructor_company?: string | null
  qualification?: string | null
  specialization?: string | null
  contact_email?: string | null
  contact_phone?: string | null
  instructor_type: 'internal' | 'external'
  is_active: boolean
  created_at: string
  updated_at: string
  staff?: Staff
}

// 1.6 Courses
export interface Course {
  id: string
  training_master_data_id: string
  instructor_id?: string | null
  course_code?: string | null
  title: string
  description?: string | null
  start_date: string
  end_date: string
  location?: string | null
  max_participants?: number | null
  min_participants?: number | null
  current_participants: number
  course_type: 'internal' | 'external'
  status: 'planned' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  cost_per_participant?: number | null
  notes?: string | null
  created_at: string
  updated_at: string
  training_master_data?: TrainingMasterData
  instructor?: Instructor
}

// 1.7 Training Records
export interface TrainingRecord {
  id: string
  staff_id: string
  training_master_data_id: string
  course_id?: string | null
  completed_date: string
  expiry_date?: string | null
  certificate_number?: string | null
  issuing_authority?: string | null
  grade?: string | null
  result: 'passed' | 'failed' | 'exempt'
  file_url?: string | null
  notes?: string | null
  is_valid: boolean
  created_at: string
  updated_at: string
  staff?: Staff
  training_master_data?: TrainingMasterData
  course?: Course
}

// 1.8 Position Requirements
export interface PositionRequirement {
  id: string
  working_position_id: string
  training_master_data_id: string
  priority_level: 'mandatory' | 'recommended' | 'optional'
  required_frequency_months?: number | null
  notes?: string | null
  created_at: string
  updated_at: string
  working_position?: WorkingPosition
  training_master_data?: TrainingMasterData
}

// 1.9 Course Enrollments
export interface CourseEnrollment {
  id: string
  course_id: string
  staff_id: string
  enrollment_date: string
  enrollment_status: 'registered' | 'confirmed' | 'attended' | 'no_show' | 'cancelled'
  attendance_status?: 'present' | 'absent' | 'partial' | null
  completion_status?: 'completed' | 'failed' | 'incomplete' | null
  certificate_issued: boolean
  certificate_id?: string | null
  grade?: string | null
  feedback?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
  course?: Course
  staff?: Staff
  certificate?: TrainingRecord
}

// 1.10 Training Alerts
export interface TrainingAlert {
  id: string
  staff_id: string
  training_master_data_id: string
  training_record_id?: string | null
  alert_type: 'expiration' | 'missing' | 'renewal_due' | 'course_reminder'
  alert_level: 'info' | 'warning' | 'critical'
  alert_date: string
  due_date?: string | null
  description?: string | null
  status: 'active' | 'resolved' | 'dismissed'
  resolved_date?: string | null
  resolved_by?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
  staff?: Staff
  training_master_data?: TrainingMasterData
  training_record?: TrainingRecord
  resolved_by_staff?: Staff
}

// Dashboard Types
export interface DashboardStats {
  totalStaff: number
  activeStaff: number
  upcomingCourses: number
  activeCertificates: number
  expiredCertificates: number
  expiringSoonCertificates: number
  activeAlerts: number
  criticalAlerts: number
  complianceRate: number
}

export interface ExpiringCertificate {
  id: string
  certificate_number?: string | null
  expiry_date: string
  staff_name: string
  training_name: string
  days_until_expiry: number
}

export interface UpcomingCourse {
  id: string
  course_code?: string | null
  title: string
  start_date: string
  location?: string | null
  instructor_name: string
  current_participants: number
  max_participants?: number | null
}

export interface RecentAlert {
  id: string
  alert_type: string
  alert_level: string
  description: string
  staff_name: string
  training_name: string
  days_until_due: number
}

// Report Types
export interface ReportPlannedCourse {
  id: string
  course_code?: string | null
  title: string
  start_date: string
  end_date: string
  location?: string | null
  max_participants?: number | null
  current_participants: number
  course_type: string
  status: string
  training_name: string
  training_code: string
  instructor_name?: string | null
  registered_participants: number
}

export interface ReportCertificateIssued {
  id: string
  certificate_number?: string | null
  completion_date: string
  expiry_date?: string | null
  issuing_authority?: string | null
  staff_name: string
  employee_number?: string | null
  training_name: string
  training_code: string
  course_title?: string | null
  instructor_name?: string | null
}

// Staff Form Types
export interface NewStaffFormData {
  employee_number: string
  first_name: string
  last_name: string
  email: string
  phone: string
  position_id: string
  staff_type: 'employee' | 'subcontractor' | 'seasonal' | 'external'
  status: 'active' | 'inactive' | 'terminated'
  hire_date: string
  termination_date: string
  department?: string
  required_trainings: string[]
}

// Za tabelu position_required_training
export interface PositionTrainingRequirement {
  id: string
  position_id: string
  training_master_id: string
  is_mandatory: boolean
  created_at: string
}

export interface NewCourseFormData {
  training_master_data_id: string
  instructor_id: string
  course_code: string
  title: string
  description: string
  start_date: string
  end_date: string
  location: string
  max_participants: string
  min_participants: string
  course_type: 'internal' | 'external'
  status: 'planned' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  cost_per_participant: string
  notes: string
}

// Form Types za obuke (Training)
export interface NewTrainingFormData {
  training_master_data_id: string
  instructor_id: string
  course_code: string
  title: string
  description: string
  start_date: string
  end_date: string
  location: string
  max_participants: string
  min_participants: string
  course_type: 'internal' | 'external'
  status: 'planned' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  cost_per_participant: string
  notes: string
}

// Ili jednostavnija verzija ako koristite drugačiju tabelu
export interface SimpleTrainingFormData {
  training_type_id: string
  title: string
  description: string
  instructor: string
  location: string
  start_date: string
  end_date: string
  capacity: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
}

// Employee Form Types
export interface NewEmployeeFormData {
  employee_number: string
  first_name: string
  last_name: string
  email: string
  phone: string
  working_position_id: string
  person_type: 'employee' | 'subcontractor' | 'seasonal' | 'external'
  employment_status: 'active' | 'inactive' | 'terminated'
  hired_date: string
  contract_end_date: string
  department: string
  notes: string
  required_trainings: string[] // IDs of required training types
}