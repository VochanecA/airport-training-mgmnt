// app/dashboard/instructors/[id]/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Edit, Mail, Phone, Calendar, Award, User, Briefcase, Trash2 } from "lucide-react"
import Link from "next/link"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
import { AlertCircle } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface InstructorDetails {
  id: string
  staff_id: string
  instructor_code: string | null
  specializations: string[] | null
  certification_number: string | null
  certification_expiry: string | null
  status: string
  created_at: string
  updated_at: string
  staff: {
    employee_number: string
    first_name: string
    last_name: string
    email: string | null
    phone: string | null
    hire_date: string | null
    position_id: string | null
  } | null
  position: {
    title: string | null
    department: string | null
  } | null
  assigned_courses?: Array<{
    id: string
    course_code: string
    title: string
    start_date: string
    end_date: string
    status: string
  }>
}

export default function InstructorDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()
  
  const [instructor, setInstructor] = useState<InstructorDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const instructorId = params.id as string

  useEffect(() => {
    if (instructorId) {
      fetchInstructorDetails()
    }
  }, [instructorId])

  const fetchInstructorDetails = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch instructor with staff details
      const { data: instructorData, error: instructorError } = await supabase
        .from("instructors")
        .select(`
          *,
          staff:staff_id (
            employee_number,
            first_name,
            last_name,
            email,
            phone,
            hire_date,
            position_id
          )
        `)
        .eq("id", instructorId)
        .single()

      if (instructorError) throw instructorError
      if (!instructorData) throw new Error("Instruktor nije pronađen")

      // Fetch position details if available
      let position = null
      if (instructorData.staff?.position_id) {
        const { data: positionData } = await supabase
          .from("working_positions")
          .select("title, department")
          .eq("id", instructorData.staff.position_id)
          .single()
        position = positionData
      }

      // Fetch assigned courses
      const { data: coursesData } = await supabase
        .from("course_instructors")
        .select(`
          courses (
            id,
            course_code,
            title,
            start_date,
            end_date,
            status
          )
        `)
        .eq("instructor_id", instructorId)

      const assignedCourses = coursesData?.map(ci => ci.courses).filter(Boolean) || []

      setInstructor({
        ...instructorData,
        position,
        assigned_courses: assignedCourses
      })

    } catch (err) {
      console.error("Error fetching instructor details:", err)
      setError(err instanceof Error ? err.message : "Došlo je do greške")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      setDeleting(true)
      
      const { error } = await supabase
        .from("instructors")
        .delete()
        .eq("id", instructorId)

      if (error) throw error

      router.push("/dashboard/instructors")
      router.refresh()
      
    } catch (err) {
      console.error("Error deleting instructor:", err)
      setError("Došlo je do greške prilikom brisanja instruktora")
    } finally {
      setDeleting(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Nije postavljeno"
    return new Date(dateString).toLocaleDateString('sr-RS', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getCertificationStatus = (expiryDate: string | null) => {
    if (!expiryDate) {
      return {
        label: "Bez isteka",
        color: "bg-gray-100 text-gray-800 border-gray-200",
        badgeVariant: "outline" as const
      }
    }

    const today = new Date()
    const expiry = new Date(expiryDate)
    const daysUntilExpiry = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (expiry < today) {
      return {
        label: "Istekla",
        color: "bg-red-100 text-red-800 border-red-200",
        badgeVariant: "destructive" as const
      }
    } else if (daysUntilExpiry <= 30) {
      return {
        label: "Ističe uskoro",
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        badgeVariant: "secondary" as const
      }
    } else {
      return {
        label: "Važeća",
        color: "bg-green-100 text-green-800 border-green-200",
        badgeVariant: "default" as const
      }
    }
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded" />
          <Skeleton className="h-10 w-64" />
        </div>
        
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ))}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error || !instructor) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/instructors">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Detalji Instruktora</h1>
          </div>
        </div>
        
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || "Instruktor nije pronađen"}
          </AlertDescription>
        </Alert>
        
        <Link href="/dashboard/instructors">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Nazad na listu instruktora
          </Button>
        </Link>
      </div>
    )
  }

  const staff = instructor.staff
  const certStatus = getCertificationStatus(instructor.certification_expiry)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/instructors">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {staff ? `${staff.first_name} ${staff.last_name}` : "Instruktor"}
            </h1>
            <p className="text-muted-foreground">
              {instructor.instructor_code || "Instruktor detalji"}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/instructors/${instructorId}/edit`}>
            <Button variant="outline" className="gap-2">
              <Edit className="h-4 w-4" />
              Uredi
            </Button>
          </Link>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="gap-2">
                <Trash2 className="h-4 w-4" />
                Obriši
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Da li ste sigurni?</AlertDialogTitle>
                <AlertDialogDescription>
                  Ova akcija je trajna i ne može se poništiti. Brisanjem instruktora, biće uklonjen iz svih dodeljenih kurseva.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Otkaži</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDelete}
                  disabled={deleting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {deleting ? (
                    <>
                      <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2"></span>
                      Brisanje...
                    </>
                  ) : "Obriši"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column - Personal Info */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Osnovne Informacije</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="text-lg">
                  {staff ? getInitials(staff.first_name, staff.last_name) : "I"}
                </AvatarFallback>
              </Avatar>
              
              <div className="space-y-1">
                <h2 className="text-2xl font-bold">
                  {staff ? `${staff.first_name} ${staff.last_name}` : "Nepoznato"}
                </h2>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>Broj zaposlenog: {staff?.employee_number || "N/A"}</span>
                  </div>
                  <Badge variant={instructor.status === 'active' ? 'default' : 'destructive'}>
                    {instructor.status === 'active' ? 'Aktivan' : 'Neaktivan'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <LabelWithIcon icon={Mail} label="Email" />
                <p className="text-sm">{staff?.email || "Nije dostupno"}</p>
              </div>
              
              <div className="space-y-2">
                <LabelWithIcon icon={Phone} label="Telefon" />
                <p className="text-sm">{staff?.phone || "Nije dostupno"}</p>
              </div>
              
              <div className="space-y-2">
                <LabelWithIcon icon={Calendar} label="Datum zaposlenja" />
                <p className="text-sm">{formatDate(staff?.hire_date || null)}</p>
              </div>
              
              <div className="space-y-2">
                <LabelWithIcon icon={Briefcase} label="Pozicija" />
                <p className="text-sm">{instructor.position?.title || "Nije postavljeno"}</p>
                {instructor.position?.department && (
                  <p className="text-xs text-muted-foreground">{instructor.position.department}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <LabelWithIcon icon={Award} label="Kod instruktora" />
                <p className="text-sm font-medium">{instructor.instructor_code || "Nije postavljen"}</p>
              </div>
              
              <div className="space-y-2">
                <LabelWithIcon icon={Calendar} label="Registrovan" />
                <p className="text-sm">{formatDate(instructor.created_at)}</p>
              </div>
            </div>

            {/* Certification */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold text-lg">Sertifikacija</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="certification_number">Broj sertifikata</Label>
                  <div className="text-sm">
                    {instructor.certification_number || "Nije postavljen"}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="certification_expiry">Datum isteka</Label>
                  <div className="flex items-center gap-2">
                    <div className="text-sm">
                      {formatDate(instructor.certification_expiry)}
                    </div>
                    {instructor.certification_expiry && (
                      <Badge variant={certStatus.badgeVariant} className={certStatus.color}>
                        {certStatus.label}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Specializations */}
            {instructor.specializations && instructor.specializations.length > 0 && (
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold text-lg">Specijalizacije</h3>
                <div className="flex flex-wrap gap-2">
                  {instructor.specializations.map((spec, index) => (
                    <Badge key={index} variant="secondary">
                      {spec}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column - Stats and Courses */}
        <div className="space-y-6">
          {/* Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle>Statistika</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Ukupno kurseva</span>
                  <span className="font-bold">{instructor.assigned_courses?.length || 0}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Aktivni kursevi</span>
                  <span className="font-bold">
                    {instructor.assigned_courses?.filter(c => 
                      c.status === 'planned' || c.status === 'in_progress'
                    ).length || 0}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Završeni kursevi</span>
                  <span className="font-bold">
                    {instructor.assigned_courses?.filter(c => c.status === 'completed').length || 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assigned Courses */}
          <Card>
            <CardHeader>
              <CardTitle>Dodeljeni Kursevi</CardTitle>
            </CardHeader>
            <CardContent>
              {instructor.assigned_courses && instructor.assigned_courses.length > 0 ? (
                <div className="space-y-3">
                  {instructor.assigned_courses.slice(0, 5).map(course => (
                    <div key={course.id} className="p-3 border rounded-lg">
                      <div className="font-medium text-sm">{course.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {course.course_code} • {formatDate(course.start_date)}
                      </div>
                      <div className="mt-2">
                        <Badge variant={
                          course.status === 'completed' ? 'default' :
                          course.status === 'in_progress' ? 'secondary' :
                          'outline'
                        } className="text-xs">
                          {course.status === 'completed' ? 'Završen' :
                           course.status === 'in_progress' ? 'U toku' :
                           'Planiran'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  
                  {instructor.assigned_courses.length > 5 && (
                    <div className="text-center text-sm text-muted-foreground">
                      + {instructor.assigned_courses.length - 5} više kurseva
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Award className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Nema dodeljenih kurseva</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Helper component for labels with icons
function LabelWithIcon({ icon: Icon, label }: { icon: any, label: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  )
}