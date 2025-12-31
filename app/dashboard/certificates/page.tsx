import { getSupabaseServerClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

async function getCertificates() {
  const supabase = await getSupabaseServerClient()

  const { data: certificates } = await supabase
    .from("certificates")
    .select(
      `
      *,
      employees (first_name, last_name, department),
      training_types (name, category)
    `,
    )
    .order("issue_date", { ascending: false })

  return certificates || []
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

export default async function CertificatesPage() {
  const allCertificates = await getCertificates()

  const validCertificates = allCertificates.filter((c: any) => c.status === "valid")
  const expiringCertificates = validCertificates.filter((c: any) => isExpiringSoon(c.expiry_date))
  const expiredCertificates = allCertificates.filter((c: any) => c.status === "expired")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sertifikati</h1>
          <p className="text-muted-foreground">Upravljajte sertifikatima zaposlenih</p>
        </div>
        <Link href="/dashboard/certificates/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novi Sertifikat
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">Svi ({allCertificates.length})</TabsTrigger>
          <TabsTrigger value="valid">Važeći ({validCertificates.length})</TabsTrigger>
          <TabsTrigger value="expiring" className="gap-2">
            {expiringCertificates.length > 0 && <AlertTriangle className="h-3 w-3" />}
            Ističu ({expiringCertificates.length})
          </TabsTrigger>
          <TabsTrigger value="expired">Istekli ({expiredCertificates.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <CertificatesTable certificates={allCertificates} />
        </TabsContent>

        <TabsContent value="valid">
          <CertificatesTable certificates={validCertificates} />
        </TabsContent>

        <TabsContent value="expiring">
          <CertificatesTable certificates={expiringCertificates} />
        </TabsContent>

        <TabsContent value="expired">
          <CertificatesTable certificates={expiredCertificates} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function CertificatesTable({ certificates }: { certificates: any[] }) {
  if (certificates.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="text-muted-foreground">Nema sertifikata</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pregled Sertifikata</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Broj Sertifikata</TableHead>
                <TableHead>Zaposleni</TableHead>
                <TableHead>Tip</TableHead>
                <TableHead>Odsek</TableHead>
                <TableHead>Datum Izdavanja</TableHead>
                <TableHead>Datum Isteka</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Akcije</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {certificates.map((certificate: any) => (
                <TableRow key={certificate.id}>
                  <TableCell className="font-medium">{certificate.certificate_number}</TableCell>
                  <TableCell>
                    {certificate.employees?.first_name} {certificate.employees?.last_name}
                  </TableCell>
                  <TableCell>{certificate.training_types?.name || "N/A"}</TableCell>
                  <TableCell>{certificate.employees?.department || "N/A"}</TableCell>
                  <TableCell>{new Date(certificate.issue_date).toLocaleDateString("sr-RS")}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {certificate.expiry_date ? (
                        <>
                          {isExpiringSoon(certificate.expiry_date) && (
                            <AlertTriangle className="h-3 w-3 text-amber-500" />
                          )}
                          {new Date(certificate.expiry_date).toLocaleDateString("sr-RS")}
                        </>
                      ) : (
                        "Bez isteka"
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(certificate.status)}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/dashboard/certificates/${certificate.id}`}>
                      <Button variant="ghost" size="sm">
                        Detalji
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
