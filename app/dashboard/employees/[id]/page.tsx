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
  Plus,
  Trash2,
  Eye,
  Edit
} from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import DeleteTrainingButton from "@/components/DeleteTrainingButton"
import { Suspense } from "react"

// Type definitions
interface WorkingPosition {
  title: string
  code: string
  department: string
}

interface TrainingCertificateMaster {
  title: string
  code: string
  validity_months?: number
}

interface TrainingCertificateRecord {
  id: string
  staff_id: string
  training_master_id: string
  certificate_number?: string
  issue_date: string
  expiry_date?: string
  completion_date?: string
  grade?: string
  notes?: string
  training_provider?: string
  instructor_name?: string
  status: string
  training_certificates_master?: TrainingCertificateMaster
}

interface StaffMember {
  id: string
  employee_number: string
  first_name: string
  last_name: string
  email?: string
  phone?: string
  position_id?: string
  department?: string
  staff_type: string
  status: string
  hire_date?: string
  termination_date?: string
  created_at: string
  updated_at: string
  working_positions?: WorkingPosition[]
}

interface EmployeeData {
  employee: StaffMember
  certificates: TrainingCertificateRecord[]
  staffTrainings: TrainingCertificateRecord[]
}

async function getEmployeeDetails(id: string): Promise<EmployeeData | null> {
  const supabase = await getSupabaseServerClient()

  // Get employee details from STAFF table
  const { data: employee } = await supabase
    .from("staff")
    .select(`
      *,
      working_positions (
        title,
        code,
        department
      )
    `)
    .eq("id", id)
    .single()

  if (!employee) return null

  // Get employee's certificates from training_certificate_records
  const { data: certificates } = await supabase
    .from("training_certificate_records")
    .select(`
      *,
      training_certificates_master (
        title,
        code
      )
    `)
    .eq("staff_id", id)
    .order("issue_date", { ascending: false })

  // Get staff trainings (from training_certificate_records)
  const { data: staffTrainings } = await supabase
    .from("training_certificate_records")
    .select(`
      *,
      training_certificates_master (
        title,
        code,
        validity_months
      )
    `)
    .eq("staff_id", id)
    .order("expiry_date", { ascending: true })

  return {
    employee,
    certificates: certificates || [],
    staffTrainings: staffTrainings || []
  }
}

// Helper function to calculate days remaining
function getDaysRemaining(expiryDate: string): number {
  const today = new Date()
  const expiry = new Date(expiryDate)
  const diff = expiry.getTime() - today.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

// Helper function to get training status badge
function getTrainingStatusBadge(status: string, expiryDate: string) {
  const days = getDaysRemaining(expiryDate)
  
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

export default async function EmployeeDetailsPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params
  const data = await getEmployeeDetails(id)

  if (!data) {
    notFound()
  }

  const { employee, certificates, staffTrainings } = data

  // Calculate statistics
  const validTrainings = staffTrainings.filter((training) => {
    if (!training.expiry_date) return false
    const days = getDaysRemaining(training.expiry_date)
    return days > 0
  }).length

  const expiringSoonTrainings = staffTrainings.filter((training) => {
    if (!training.expiry_date) return false
    const days = getDaysRemaining(training.expiry_date)
    return days > 0 && days <= 30
  }).length

  const expiredTrainings = staffTrainings.filter((training) => {
    if (!training.expiry_date) return false
    const days = getDaysRemaining(training.expiry_date)
    return days < 0
  }).length

  // Get position info from joined table
  const positionTitle = employee.working_positions?.[0]?.title || employee.position_id || "Nije postavljena"
  const department = employee.working_positions?.[0]?.department || employee.department || "Nije postavljen"

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
            <p className="text-muted-foreground">{positionTitle}</p>
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

            <div className="flex items-center gap-3">
              <Briefcase className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Pozicija</p>
                <p className="text-sm text-muted-foreground">{positionTitle}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Odsek</p>
                <p className="text-sm text-muted-foreground">{department}</p>
              </div>
            </div>

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

      {/* Employee's Trainings */}
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
                    <TableHead>Datum Polaganja</TableHead>
                    <TableHead>Datum Isteka</TableHead>
                    <TableHead>Preostalo Dana</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Akcije</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staffTrainings.map((training) => {
                    const daysRemaining = training.expiry_date ? getDaysRemaining(training.expiry_date) : null
                    const isExpiringSoon = daysRemaining !== null && daysRemaining <= 30
                    const isExpired = daysRemaining !== null && daysRemaining < 0
                    
                    return (
                      <TableRow 
                        key={training.id}
                        className={isExpired ? "bg-red-50" : isExpiringSoon ? "bg-yellow-50" : ""}
                      >
                        <TableCell className="font-medium">
                          {training.training_certificates_master?.title || "Nepoznata obuka"}
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm">
                            {training.training_certificates_master?.code || "N/A"}
                          </span>
                        </TableCell>
                        <TableCell>
                          {training.completion_date 
                            ? new Date(training.completion_date).toLocaleDateString("sr-RS")
                            : training.issue_date
                              ? new Date(training.issue_date).toLocaleDateString("sr-RS")
                              : "N/A"}
                        </TableCell>
                        <TableCell>
                          {training.expiry_date ? (
                            <div className={`font-medium ${isExpired ? "text-red-600" : isExpiringSoon ? "text-yellow-600" : ""}`}>
                              {new Date(training.expiry_date).toLocaleDateString("sr-RS")}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Bez isteka</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {training.expiry_date ? (
                            <div className="flex items-center gap-2">
                              <Clock className={`h-4 w-4 ${isExpired ? "text-red-500" : isExpiringSoon ? "text-yellow-500" : "text-gray-500"}`} />
                              <span className={isExpired ? "font-bold text-red-600" : isExpiringSoon ? "font-semibold text-yellow-600" : ""}>
                                {daysRemaining && daysRemaining > 0 ? `${daysRemaining} dana` : "ISTEKLO"}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {training.expiry_date ? (
                            getTrainingStatusBadge(training.status, training.expiry_date)
                          ) : (
                            <Badge variant="secondary">Bez isteka</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Suspense fallback={
                              <Button size="sm" variant="outline" disabled>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            }>
                              <DeleteTrainingButton 
                                trainingId={training.id} 
                                employeeId={id}
                                trainingName={training.training_certificates_master?.title || "Nepoznata obuka"}
                              />
                            </Suspense>
                          </div>
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
                    <TableHead className="text-right">Akcije</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {certificates.map((certificate) => (
                    <TableRow key={certificate.id}>
                      <TableCell className="font-medium">{certificate.certificate_number || "N/A"}</TableCell>
                      <TableCell>{certificate.training_certificates_master?.title || "N/A"}</TableCell>
                      <TableCell>
                        {certificate.issue_date 
                          ? new Date(certificate.issue_date).toLocaleDateString("sr-RS")
                          : "N/A"}
                      </TableCell>
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
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Suspense fallback={
                            <Button size="sm" variant="outline" disabled>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          }>
                            <DeleteTrainingButton 
                              trainingId={certificate.id} 
                              employeeId={id}
                              trainingName={certificate.training_certificates_master?.title || "Nepoznati sertifikat"}
                              isCertificate={true}
                            />
                          </Suspense>
                        </div>
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