"use client"

import { useState, useEffect } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, 
  AlertTriangle, 
  Search, 
  Filter, 
  Download,
  Edit,
  Trash2,
  User,
  FileText,
  Calendar
} from "lucide-react"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

// Type definitions
interface Certificate {
  id: string
  certificate_number: string
  issue_date: string
  expiry_date: string | null
  status: string
  grade: string | null
  notes: string | null
  instructor_name: string | null
  training_provider: string | null
  issued_by: string | null
  staff: {
    id: string
    first_name: string
    last_name: string
    employee_number: string
    email: string | null
    working_positions?: {
      department: string | null
    } | null
  }
  training_certificates_master: {
    id: string
    title: string
    code: string
    validity_months: number | null
  } | null
}

export default function CertificatesPage() {
  const { toast } = useToast()
  const supabase = getSupabaseBrowserClient()
  
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [filteredCertificates, setFilteredCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [certificateToDelete, setCertificateToDelete] = useState<string | null>(null)

  // Učitaj sertifikate
  useEffect(() => {
    async function loadCertificates() {
      try {
        setLoading(true)
        
        const { data, error } = await supabase
          .from("training_certificate_records")
          .select(`
            *,
            staff:staff_id (
              id,
              first_name,
              last_name,
              employee_number,
              email,
              working_positions:position_id (
                department
              )
            ),
            training_certificates_master:training_master_id (
              id,
              title,
              code,
              validity_months
            )
          `)
          .order("issue_date", { ascending: false })

        if (error) throw error

        console.log("Učitano sertifikata:", data?.length || 0)
        setCertificates(data || [])
        setFilteredCertificates(data || [])
      } catch (error: any) {
        console.error("Greška pri učitavanju sertifikata:", error)
        toast({
          title: "Greška",
          description: "Došlo je do greške pri učitavanju sertifikata",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadCertificates()
  }, [supabase, toast])

  // Filtriraj sertifikate
  useEffect(() => {
    let filtered = [...certificates]

    // Pretraga
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(cert => 
        cert.certificate_number.toLowerCase().includes(term) ||
        cert.staff.first_name.toLowerCase().includes(term) ||
        cert.staff.last_name.toLowerCase().includes(term) ||
        cert.staff.employee_number.toLowerCase().includes(term) ||
        cert.training_certificates_master?.title.toLowerCase().includes(term) ||
        cert.training_certificates_master?.code.toLowerCase().includes(term)
      )
    }

    // Filter po statusu
    if (statusFilter !== "all") {
      filtered = filtered.filter(cert => cert.status === statusFilter)
    }

    // Filter po odseku
    if (departmentFilter !== "all") {
      filtered = filtered.filter(cert => 
        cert.staff.working_positions?.department === departmentFilter
      )
    }

    setFilteredCertificates(filtered)
  }, [certificates, searchTerm, statusFilter, departmentFilter])

  // Funkcija za brisanje sertifikata
  const handleDeleteCertificate = async (id: string) => {
    try {
      const { error } = await supabase
        .from("training_certificate_records")
        .delete()
        .eq("id", id)

      if (error) throw error

      // Ukloni iz state-a
      setCertificates(prev => prev.filter(cert => cert.id !== id))
      
      toast({
        title: "Uspešno",
        description: "Sertifikat je uspešno obrisan",
      })
    } catch (error: any) {
      console.error("Greška pri brisanju sertifikata:", error)
      toast({
        title: "Greška",
        description: "Došlo je do greške pri brisanju sertifikata",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setCertificateToDelete(null)
    }
  }

  // Funkcija za preuzimanje sertifikata kao CSV
  const handleExportCSV = () => {
    const headers = [
      "Broj sertifikata",
      "Zaposleni",
      "Broj zaposlenog",
      "Email",
      "Obuka",
      "Šifra obuke",
      "Datum izdavanja",
      "Datum isteka",
      "Status",
      "Ocena",
      "Instruktor",
      "Izdato od",
      "Odsek"
    ]

    const csvData = filteredCertificates.map(cert => [
      cert.certificate_number,
      `${cert.staff.first_name} ${cert.staff.last_name}`,
      cert.staff.employee_number,
      cert.staff.email || "",
      cert.training_certificates_master?.title || "Opšti sertifikat",
      cert.training_certificates_master?.code || "GENERAL-CERT",
      new Date(cert.issue_date).toLocaleDateString('sr-RS'),
      cert.expiry_date ? new Date(cert.expiry_date).toLocaleDateString('sr-RS') : "Bez isteka",
      cert.status === "valid" ? "Važeći" : cert.status === "expired" ? "Istekao" : "Opozvan",
      cert.grade || "",
      cert.instructor_name || "",
      cert.issued_by || "",
      cert.staff.working_positions?.department || ""
    ])

    const csvContent = [
      headers.join(","),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `sertifikati_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Helper funkcije
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      valid: { label: "Važeći", variant: "default" },
      expired: { label: "Istekao", variant: "secondary" },
      revoked: { label: "Opozvan", variant: "destructive" },
    }

    const config = statusMap[status] || { label: status, variant: "outline" }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const isExpiringSoon = (expiryDate: string | null): boolean => {
    if (!expiryDate) return false
    const expiry = new Date(expiryDate)
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    return expiry <= thirtyDaysFromNow && expiry > new Date()
  }

  const isExpired = (expiryDate: string | null): boolean => {
    if (!expiryDate) return false
    return new Date(expiryDate) < new Date()
  }

  // Grupiši sertifikate za tabove
  const validCertificates = certificates.filter(c => c.status === "valid")
  const expiringCertificates = validCertificates.filter(c => isExpiringSoon(c.expiry_date))
  const expiredCertificates = certificates.filter(c => c.status === "expired" || (c.status === "valid" && isExpired(c.expiry_date)))
  const allCertificates = certificates

  // Get unique departments for filter
  const departments = Array.from(
    new Set(
      certificates
        .map(cert => cert.staff.working_positions?.department)
        .filter(Boolean) as string[]
    )
  ).sort()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-2 text-muted-foreground">Učitavanje sertifikata...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sertifikati</h1>
          <p className="text-muted-foreground">Upravljajte sertifikatima zaposlenih</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Izvezi CSV
          </Button>
          <Link href="/dashboard/certificates/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novi Sertifikat
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter sekcija */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pretraži sertifikate..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter po statusu" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Svi statusi</SelectItem>
                <SelectItem value="valid">Važeći</SelectItem>
                <SelectItem value="expired">Istekli</SelectItem>
                <SelectItem value="revoked">Opozvani</SelectItem>
              </SelectContent>
            </Select>

            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter po odseku" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Svi odseci</SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm("")
                setStatusFilter("all")
                setDepartmentFilter("all")
              }}
            >
              <Filter className="mr-2 h-4 w-4" />
              Resetuj filtere
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">
            Svi ({allCertificates.length})
          </TabsTrigger>
          <TabsTrigger value="valid">
            Važeći ({validCertificates.length})
          </TabsTrigger>
          <TabsTrigger value="expiring" className="gap-2">
            {expiringCertificates.length > 0 && (
              <AlertTriangle className="h-3 w-3 text-amber-500" />
            )}
            Ističu ({expiringCertificates.length})
          </TabsTrigger>
          <TabsTrigger value="expired">
            Istekli ({expiredCertificates.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <CertificatesTable 
            certificates={filteredCertificates}
            onDeleteClick={(id) => {
              setCertificateToDelete(id)
              setDeleteDialogOpen(true)
            }}
          />
        </TabsContent>

        <TabsContent value="valid">
          <CertificatesTable 
            certificates={filteredCertificates.filter(c => c.status === "valid")}
            onDeleteClick={(id) => {
              setCertificateToDelete(id)
              setDeleteDialogOpen(true)
            }}
          />
        </TabsContent>

        <TabsContent value="expiring">
          <CertificatesTable 
            certificates={filteredCertificates.filter(c => 
              c.status === "valid" && isExpiringSoon(c.expiry_date)
            )}
            onDeleteClick={(id) => {
              setCertificateToDelete(id)
              setDeleteDialogOpen(true)
            }}
          />
        </TabsContent>

        <TabsContent value="expired">
          <CertificatesTable 
            certificates={filteredCertificates.filter(c => 
              c.status === "expired" || (c.status === "valid" && isExpired(c.expiry_date))
            )}
            onDeleteClick={(id) => {
              setCertificateToDelete(id)
              setDeleteDialogOpen(true)
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Statistika */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ukupno sertifikata</p>
                <p className="text-2xl font-bold">{allCertificates.length}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Važeći sertifikati</p>
                <p className="text-2xl font-bold text-green-600">{validCertificates.length}</p>
              </div>
              <User className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sertifikata ističe</p>
                <p className="text-2xl font-bold text-amber-600">{expiringCertificates.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Brisanje sertifikata</DialogTitle>
            <DialogDescription>
              Da li ste sigurni da želite da obrišete ovaj sertifikat? Ova akcija se ne može poništiti.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setDeleteDialogOpen(false)
                setCertificateToDelete(null)
              }}
            >
              Otkaži
            </Button>
            <Button 
              variant="destructive"
              onClick={() => {
                if (certificateToDelete) {
                  handleDeleteCertificate(certificateToDelete)
                }
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Obriši
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function CertificatesTable({ 
  certificates, 
  onDeleteClick 
}: { 
  certificates: Certificate[]
  onDeleteClick: (id: string) => void
}) {
  const isExpiringSoon = (expiryDate: string | null): boolean => {
    if (!expiryDate) return false
    const expiry = new Date(expiryDate)
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    return expiry <= thirtyDaysFromNow && expiry > new Date()
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      valid: { label: "Važeći", variant: "default" },
      expired: { label: "Istekao", variant: "secondary" },
      revoked: { label: "Opozvan", variant: "destructive" },
    }

    const config = statusMap[status] || { label: status, variant: "outline" }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

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
                <TableHead>Obuka</TableHead>
                <TableHead>Odsek</TableHead>
                <TableHead>Datum izdavanja</TableHead>
                <TableHead>Datum isteka</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Akcije</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {certificates.map((certificate) => (
                <TableRow key={certificate.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      {certificate.certificate_number}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {certificate.staff.first_name} {certificate.staff.last_name}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {certificate.staff.employee_number}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {certificate.training_certificates_master?.title || "Opšti sertifikat"}
                    <span className="block text-xs text-muted-foreground">
                      {certificate.training_certificates_master?.code || "GENERAL-CERT"}
                    </span>
                  </TableCell>
                  <TableCell>
                    {certificate.staff.working_positions?.department || "N/A"}
                  </TableCell>
                  <TableCell>
                    {new Date(certificate.issue_date).toLocaleDateString("sr-RS")}
                  </TableCell>
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
                        <span className="text-muted-foreground">Bez isteka</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(certificate.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/dashboard/certificates/${certificate.id}`}>
                        <Button variant="ghost" size="sm">
                          Detalji
                        </Button>
                      </Link>
                      <Link href={`/dashboard/certificates/${certificate.id}/edit`}>
                        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700"
                        onClick={() => onDeleteClick(certificate.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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