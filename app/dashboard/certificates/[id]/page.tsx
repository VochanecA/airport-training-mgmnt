import { getSupabaseServerClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, User, Award, Calendar, FileText, AlertCircle } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"

async function getCertificateDetails(id: string) {
  const supabase = await getSupabaseServerClient()

  const { data: certificate } = await supabase
    .from("certificates")
    .select(
      `
      *,
      employees (
        first_name,
        last_name,
        email,
        position,
        department,
        employee_number
      ),
      trainings (
        title,
        start_date,
        end_date,
        instructor
      ),
      training_types (
        name,
        category,
        validity_months
      )
    `,
    )
    .eq("id", id)
    .single()

  if (!certificate) return null

  return certificate
}

function getStatusBadge(status: string) {
  const statusMap: Record<string, { label: string; variant: any }> = {
    valid: { label: "Važeći", variant: "default" },
    expired: { label: "Istekao", variant: "secondary" },
    revoked: { label: "Opozvan", variant: "destructive" },
  }

  const config = statusMap[status] || { label: status, variant: "outline" }
  return <Badge variant={config.variant}>{config.label}</Badge>
}

function isExpiringSoon(expiryDate: string | null): boolean {
  if (!expiryDate) return false

  const expiry = new Date(expiryDate)
  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

  return expiry <= thirtyDaysFromNow && expiry > new Date()
}

export default async function CertificateDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const certificate = await getCertificateDetails(id)

  if (!certificate) {
    notFound()
  }

  const showExpiryWarning = certificate.status === "valid" && isExpiringSoon(certificate.expiry_date)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/certificates">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{certificate.certificate_number}</h1>
          <p className="text-muted-foreground">Detalji sertifikata</p>
        </div>
        {getStatusBadge(certificate.status)}
      </div>

      {showExpiryWarning && (
        <Alert variant="default" className="border-amber-500 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-900">
            Ovaj sertifikat ističe{" "}
            {certificate.expiry_date ? new Date(certificate.expiry_date).toLocaleDateString("sr-RS") : ""}. Potrebno je
            obnoviti ga.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informacije o Zaposlenom</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Ime i Prezime</p>
                <p className="text-sm text-muted-foreground">
                  {certificate.employees?.first_name} {certificate.employees?.last_name}
                </p>
              </div>
            </div>

            {certificate.employees?.email && (
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{certificate.employees.email}</p>
                </div>
              </div>
            )}

            {certificate.employees?.position && (
              <div className="flex items-start gap-3">
                <Award className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Pozicija</p>
                  <p className="text-sm text-muted-foreground">{certificate.employees.position}</p>
                </div>
              </div>
            )}

            {certificate.employees?.department && (
              <div className="pt-2 border-t">
                <p className="text-sm font-medium mb-1">Odsek</p>
                <p className="text-sm text-muted-foreground">{certificate.employees.department}</p>
              </div>
            )}

            {certificate.employees?.employee_number && (
              <div className="pt-2 border-t">
                <p className="text-sm font-medium mb-1">Broj Zaposlenog</p>
                <p className="text-sm text-muted-foreground">{certificate.employees.employee_number}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informacije o Sertifikatu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Datum Izdavanja</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(certificate.issue_date).toLocaleDateString("sr-RS", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>

            {certificate.expiry_date && (
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Datum Isteka</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(certificate.expiry_date).toLocaleDateString("sr-RS", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            )}

            {certificate.issued_by && (
              <div className="pt-2 border-t">
                <p className="text-sm font-medium mb-1">Izdao</p>
                <p className="text-sm text-muted-foreground">{certificate.issued_by}</p>
              </div>
            )}

            {certificate.training_types && (
              <div className="pt-2 border-t">
                <p className="text-sm font-medium mb-1">Tip Obuke</p>
                <p className="text-sm text-muted-foreground">{certificate.training_types.name}</p>
                {certificate.training_types.category && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Kategorija: {certificate.training_types.category}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {certificate.trainings && (
        <Card>
          <CardHeader>
            <CardTitle>Povezana Obuka</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium">Naziv Obuke</p>
              <p className="text-sm text-muted-foreground">{certificate.trainings.title}</p>
            </div>

            {certificate.trainings.start_date && (
              <div>
                <p className="text-sm font-medium">Period Obuke</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(certificate.trainings.start_date).toLocaleDateString("sr-RS")} -{" "}
                  {certificate.trainings.end_date
                    ? new Date(certificate.trainings.end_date).toLocaleDateString("sr-RS")
                    : "N/A"}
                </p>
              </div>
            )}

            {certificate.trainings.instructor && (
              <div>
                <p className="text-sm font-medium">Instruktor</p>
                <p className="text-sm text-muted-foreground">{certificate.trainings.instructor}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {certificate.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Napomene</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{certificate.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
