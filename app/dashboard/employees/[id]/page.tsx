import { getSupabaseServerClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  Briefcase, 
  Building2, 
  Calendar, 
  Hash,
  User,
  GraduationCap,
  BookOpen,
  Clock,
  AlertTriangle,
  CheckCircle,
  Plus
} from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

async function getEmployeeDetails(id: string) {
  const supabase = await getSupabaseServerClient()

  // Get employee details
  const { data: employee } = await supabase
    .from("employees")
    .select("*")
    .eq("id", id)
    .single()

  if (!employee) return null

  // Get employee's training enrollments (from old system if exists)
  const { data: enrollments } = await supabase
    .from("training_enrollments")
    .select(`
      *,
      trainings (
        title,
        start_date,
        end_date,
        status
      )
    `)
    .eq("employee_id", id)
    .order("enrollment_date", { ascending: false })

  // Get certificates
  const { data: certificates } = await supabase
    .from("certificates")
    .select(`
      *,
      training_types (name)
    `)
    .eq("employee_id", id)
    .order("issue_date", { ascending: false })

  // Get NEW staff_trainings data (from new expiry system)
  const { data: staffTrainings } = await supabase
    .from("staff_trainings")
    .select(`
      *,
      training_type:training_type_id (
        name,
        code,
        validity_months
      )
    `)
    .eq("staff_id", id)
    .order("expires_date", { ascending: true })

  return {
    employee,
    enrollments: enrollments || [],
    certificates: certificates || [],
    staffTrainings: staffTrainings || []
  }
}

// Helper function to calculate days remaining
function getDaysRemaining(expiresDate: string) {
  const today = new Date()
  const expiry = new Date(expiresDate)
  const diff = expiry.getTime() - today.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

// Helper function to get training status badge
function getTrainingStatusBadge(status: string, expiresDate: string) {
  const days = getDaysRemaining(expiresDate)
  
  if (status === 'expired' || days < 0) {
    return (
      <Badge variant="destructive" className="gap-1">
        <AlertTriangle className="h-3 w-3" />
        Isteklo
      </Badge>
    )
  } else if (days <= 7) {
    return (
      <Badge variant="destructive" className="gap-1">
        <AlertTriangle className="h-3 w-3" />
        Ističe za {days}d
      </Badge>
    )
  } else if (days <= 30) {
    return (
      <Badge variant="outline" className="border-yellow-500 text-yellow-700 gap-1">
        <AlertTriangle className="h-3 w-3" />
        Ističe za {days}d
      </Badge>
    )
  } else {
    return (
      <Badge variant="secondary" className="gap-1">
        <CheckCircle className="h-3 w-3" />
        Važeće ({days}d)
      </Badge>
    )
  }
}

export default async function EmployeeDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await getEmployeeDetails(id)

  if (!data) {
    notFound()
  }

  const { employee, enrollments, certificates, staffTrainings } = data

  // Calculate statistics
  const validTrainings = staffTrainings.filter(t => {
    const days = getDaysRemaining(t.expires_date)
    return days > 0
  }).length

  const expiringSoonTrainings = staffTrainings.filter(t => {
    const days = getDaysRemaining(t.expires_date)
    return days > 0 && days <= 30
  }).length

  const expiredTrainings = staffTrainings.filter(t => {
    const days = getDaysRemaining(t.expires_date)
    return days < 0
  }).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/employees">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">
              {employee.first_name} {employee.last_name}
            </h1>
            <p className="text-muted-foreground">{employee.position || "Zaposleni"}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={employee.status === "active" ? "default" : "secondary"}>
            {employee.status === "active" ? "Aktivan" : "Neaktivan"}
          </Badge>
          <Link href={`/dashboard/employees/${id}/add-training`}>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Dodaj Obuku
            </Button>
          </Link>
        </div>
      </div>

      {/* Main content - 2 columns */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Personal Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Lični Podaci
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {employee.employee_number && (
              <div className="flex items-center gap-3">
                <Hash className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Broj Zaposlenog</p>
                  <p className="text-sm text-muted-foreground font-mono">{employee.employee_number}</p>
                </div>
              </div>
            )}

            {employee.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{employee.email}</p>
                </div>
              </div>
            )}

            {employee.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Telefon</p>
                  <p className="text-sm text-muted-foreground">{employee.phone}</p>
                </div>
              </div>
            )}

            {employee.position && (
              <div className="flex items-center gap-3">
                <Briefcase className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Pozicija</p>
                  <p className="text-sm text-muted-foreground">{employee.position}</p>
                </div>
              </div>
            )}

            {employee.department && (
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Odsek</p>
                  <p className="text-sm text-muted-foreground">{employee.department}</p>
                </div>
              </div>
            )}

            {employee.hire_date && (
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Datum Zaposlenja</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(employee.hire_date).toLocaleDateString("sr-RS")}
                  </p>
                </div>
              </div>
            )}

            {employee.termination_date && (
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Datum Prestanka Rada</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(employee.termination_date).toLocaleDateString("sr-RS")}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Training Statistics Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Statistika Obuka
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Ukupno Obuka</p>
                <p className="text-2xl font-bold">{staffTrainings.length}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Važeće</p>
                <p className="text-2xl font-bold text-green-600">{validTrainings}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Ističe uskoro</p>
                <p className="text-2xl font-bold text-yellow-600">{expiringSoonTrainings}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Istekle</p>
                <p className="text-2xl font-bold text-red-600">{expiredTrainings}</p>
              </div>
            </div>

            {/* Quick links */}
            <div className="mt-6 pt-6 border-t">
              <Link href={`/dashboard/training-expiry?search=${employee.employee_number}`}>
                <Button variant="outline" className="w-full gap-2">
                  <Clock className="h-4 w-4" />
                  Pregled isteka obuka
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employee's Trainings (NEW SYSTEM) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Obuke Zaposlenog
          </CardTitle>
        </CardHeader>
        <CardContent>
          {staffTrainings.length === 0 ? (
            <div className="text-center py-8">
              <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">Nema evidentiranih obuka</h3>
              <p className="text-muted-foreground mb-4">
                Ovaj zaposleni nema evidentiranih obuka u sistemu
              </p>
              <Link href={`/dashboard/employees/${id}/add-training`}>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Dodaj Prvu Obuku
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Obuka</TableHead>
                    <TableHead>Šifra</TableHead>
                    <TableHead>Datum Završetka</TableHead>
                    <TableHead>Datum Isteka</TableHead>
                    <TableHead>Preostalo Dana</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Napomene</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staffTrainings.map((training: any) => {
                    const daysRemaining = getDaysRemaining(training.expires_date)
                    const isExpiringSoon = daysRemaining <= 30
                    const isExpired = daysRemaining < 0
                    
                    return (
                      <TableRow 
                        key={training.id}
                        className={isExpired ? "bg-red-50" : isExpiringSoon ? "bg-yellow-50" : ""}
                      >
                        <TableCell className="font-medium">
                          {training.training_type?.name || "Nepoznata obuka"}
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm">
                            {training.training_type?.code || "N/A"}
                          </span>
                        </TableCell>
                        <TableCell>
                          {new Date(training.completed_date).toLocaleDateString("sr-RS")}
                        </TableCell>
                        <TableCell>
                          <div className={`font-medium ${isExpired ? "text-red-600" : isExpiringSoon ? "text-yellow-600" : ""}`}>
                            {new Date(training.expires_date).toLocaleDateString("sr-RS")}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock className={`h-4 w-4 ${isExpired ? "text-red-500" : isExpiringSoon ? "text-yellow-500" : "text-gray-500"}`} />
                            <span className={isExpired ? "font-bold text-red-600" : isExpiringSoon ? "font-semibold text-yellow-600" : ""}>
                              {daysRemaining > 0 ? `${daysRemaining} dana` : "ISTEKLO"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getTrainingStatusBadge(training.status, training.expires_date)}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {training.notes || "Nema napomena"}
                          </span>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Old Training History (if exists) */}
      {enrollments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Stara Istorija Obuka</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Obuka</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Status Prisustva</TableHead>
                    <TableHead>Status Završetka</TableHead>
                    <TableHead>Ocena</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollments.map((enrollment: any) => (
                    <TableRow key={enrollment.id}>
                      <TableCell className="font-medium">{enrollment.trainings?.title || "N/A"}</TableCell>
                      <TableCell>
                        {enrollment.trainings?.start_date
                          ? new Date(enrollment.trainings.start_date).toLocaleDateString("sr-RS")
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        {enrollment.attendance_status === "attended"
                          ? "Prisustvovao"
                          : enrollment.attendance_status === "missed"
                            ? "Izostao"
                            : enrollment.attendance_status || "N/A"}
                      </TableCell>
                      <TableCell>
                        {enrollment.completion_status === "completed"
                          ? "Završio"
                          : enrollment.completion_status === "in_progress"
                            ? "U toku"
                            : enrollment.completion_status || "N/A"}
                      </TableCell>
                      <TableCell>{enrollment.score || "N/A"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Certificates (if exists) */}
      {certificates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sertifikati</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Broj Sertifikata</TableHead>
                    <TableHead>Tip</TableHead>
                    <TableHead>Datum Izdavanja</TableHead>
                    <TableHead>Datum Isteka</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {certificates.map((certificate: any) => (
                    <TableRow key={certificate.id}>
                      <TableCell className="font-medium">{certificate.certificate_number}</TableCell>
                      <TableCell>{certificate.training_types?.name || "N/A"}</TableCell>
                      <TableCell>{new Date(certificate.issue_date).toLocaleDateString("sr-RS")}</TableCell>
                      <TableCell>
                        {certificate.expiry_date
                          ? new Date(certificate.expiry_date).toLocaleDateString("sr-RS")
                          : "Bez isteka"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            certificate.status === "valid"
                              ? "default"
                              : certificate.status === "expired"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {certificate.status === "valid"
                            ? "Važeći"
                            : certificate.status === "expired"
                              ? "Istekao"
                              : "Opozvan"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}