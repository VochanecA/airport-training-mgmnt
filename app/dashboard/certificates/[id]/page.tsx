"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  FileText, 
  User, 
  Calendar, 
  BookOpen, 
  Award, 
  AlertTriangle,
  Download,
  Edit
} from "lucide-react"
import Link from "next/link"
import { formatDate } from "@/lib/utils"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { useToast } from "@/hooks/use-toast"

interface CertificateDetail {
  id: string
  certificate_number: string
  issue_date: string
  expiry_date: string | null
  completion_date: string | null
  status: string
  grade: string | null
  notes: string | null
  instructor_name: string | null
  training_provider: string | null
  issued_by: string | null
  created_at: string
  updated_at: string
  staff: {
    id: string
    first_name: string
    last_name: string
    employee_number: string
    email: string | null
    phone: string | null
    hire_date: string | null
    status: string
    working_positions: {
      title: string | null
      code: string | null
      department: string | null
    } | null
  }
  training_certificates_master: {
    id: string
    title: string
    code: string
    description: string | null
    validity_months: number | null
    training_provider: string | null
    is_mandatory: boolean
    is_active: boolean
  } | null
}

interface ResolvedParams {
  id: string
}

export default function CertificateDetailPage({ 
  params 
}: { 
  params: Promise<ResolvedParams>
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [certificate, setCertificate] = useState<CertificateDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [resolvedParams, setResolvedParams] = useState<ResolvedParams | null>(null)

  // Unwrap params promise
  useEffect(() => {
    params.then((resolved: ResolvedParams) => {
      setResolvedParams(resolved)
    }).catch((error: Error) => {
      console.error("Error resolving params:", error)
      toast({
        title: "Greška",
        description: "Došlo je do greške pri učitavanju stranice",
        variant: "destructive",
      })
    })
  }, [params, toast])

  useEffect(() => {
    async function loadCertificate() {
      if (!resolvedParams?.id) return

      try {
        setLoading(true)
        const supabase = getSupabaseBrowserClient()

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
              phone,
              hire_date,
              status,
              working_positions:position_id (
                title,
                code,
                department
              )
            ),
            training_certificates_master:training_master_id (
              id,
              title,
              code,
              description,
              validity_months,
              training_provider,
              is_mandatory,
              is_active
            )
          `)
          .eq("id", resolvedParams.id)
          .single()

        if (error) throw error
        setCertificate(data)
      } catch (error) {
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

    loadCertificate()
  }, [resolvedParams?.id, toast])

const generatePDF = () => {
  if (!certificate) return
  
  setPdfLoading(true)
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })
    
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    
    // Logo sekcija - tekstualni logo (bez slike zbog browser ograničenja)
    const logoY = margin
    doc.setFontSize(16)
    doc.setTextColor(41, 128, 185)
    doc.text("APM TRAINING CENTER :: CENTAR ZA OBUKU ACG", pageWidth / 2, logoY + 10, { align: 'center' })
    doc.setFontSize(12)
    doc.setTextColor(100, 100, 100)
    doc.text("Centar za obuku", pageWidth / 2, logoY + 17, { align: 'center' })
    
    // Naslov ispod logoa
    const titleY = logoY + 30
    doc.setFontSize(18)
    doc.setTextColor(40, 40, 40)
    doc.text("POTVRDA O POLOŽENOJ OBUCI", pageWidth / 2, titleY, { align: 'center' })
    
    // Linija ispod naslova
    doc.setDrawColor(200, 200, 200)
    doc.line(margin, titleY + 5, pageWidth - margin, titleY + 5)
    
    // Podaci - selektovano samo najvažnije
    const employeeName = `${certificate.staff.first_name} ${certificate.staff.last_name}`
    const employeeNumber = certificate.staff.employee_number
    const employeeDepartment = certificate.staff.working_positions?.department || 'N/A'
     const employeePosition = certificate.staff.working_positions?.title || 'N/A' // OVO JE POZICIJA
    
    const trainingName = certificate.training_certificates_master?.title || 'Opšti sertifikat'
    const trainingCode = certificate.training_certificates_master?.code || 'GENERAL-CERT'
    
    // Tabela sa esencijalnim podacima
    const tableData = [
      ['Broj potvrde:', certificate.certificate_number || 'N/A'],
      ['Ime i prezime:', employeeName],
      ['Broj zaposlenog:', employeeNumber],
['Pozicija:', employeePosition],
      ['Naziv obuke:', trainingName],
      ['Šifra obuke:', trainingCode],
      ['Datum izdavanja:', formatDate(certificate.issue_date) || 'N/A'],
      ['Datum isteka:', certificate.expiry_date ? formatDate(certificate.expiry_date) : 'Bez isteka'],
      ['Ocjena:', certificate.grade || 'N/A'],
    ]
    
    // Dodaj dodatne podatke samo ako su popunjeni
    if (certificate.instructor_name) {
      tableData.push(['Instruktor:', certificate.instructor_name])
    }
    
    if (certificate.issued_by) {
      tableData.push(['Izdato od:', certificate.issued_by])
    }
    
    if (certificate.training_provider) {
      tableData.push(['Organizator:', certificate.training_provider])
    }
    
    // Kreiraj kompaktnu tabelu
    autoTable(doc, {
      startY: titleY + 15,
      head: [['Podatak', 'Vrijednost']],
      body: tableData,
      theme: 'grid',
      headStyles: { 
        fillColor: [41, 128, 185], 
        textColor: 255,
        fontSize: 8,
        cellPadding: 2,
        lineWidth: 0.1
      },
      bodyStyles: { 
        fontSize: 8,
        cellPadding: 2,
        lineWidth: 0.1
      },
      columnStyles: {
        0: { cellWidth: 40, fontStyle: 'bold' as const },
        1: { cellWidth: 'auto' as const }
      },
      margin: { left: margin, right: margin },
      tableWidth: pageWidth - (2 * margin),
      styles: { overflow: 'linebreak' as const }
    })
    
    // Dobij finalY iz autoTable rezultata
    const tableResult = (doc as any).lastAutoTable
    const finalY = tableResult?.finalY || titleY + 15 + (tableData.length * 8)
    
    // Napomene - samo ako ima i ako ima mesta
    if (certificate.notes && finalY < pageHeight - 50) {
      doc.setFontSize(9)
      doc.setTextColor(60, 60, 60)
      doc.text('Napomene:', margin, finalY + 8)
      doc.setFontSize(8)
      const splitNotes = doc.splitTextToSize(certificate.notes, pageWidth - (2 * margin))
      
      // Ograniči napomene da stanu
      const maxLines = Math.floor((pageHeight - finalY - 30) / 5)
      const limitedNotes = splitNotes.slice(0, maxLines)
      
      doc.text(limitedNotes, margin, finalY + 14)
      
      if (splitNotes.length > maxLines) {
        doc.text('...', margin, finalY + 14 + (maxLines * 5))
      }
    }
    
    // Potpis sekcija na dnu
    const signatureY = pageHeight - 40
    
    // Levi potpis (instruktor/potpisnik)
    doc.setFontSize(9)
    doc.setTextColor(100, 100, 100)
    
    if (certificate.instructor_name) {
      doc.text("Instruktor:", margin, signatureY)
      doc.line(margin + 20, signatureY, margin + 80, signatureY)
      doc.setFontSize(8)
      doc.text(certificate.instructor_name, margin, signatureY + 6)
    }
    
    // Desni potpis (izdavač)
    const issuedBy = certificate.issued_by || "Training Center"
    doc.setFontSize(9)
    doc.text("Potpis i pecat:", pageWidth - margin - 60, signatureY)
    doc.line(pageWidth - margin - 40, signatureY, pageWidth - margin, signatureY)
    doc.setFontSize(8)
    doc.text(issuedBy, pageWidth - margin - 60, signatureY + 6)
    
    // Footer
    doc.setFontSize(7)
    doc.setTextColor(150, 150, 150)
    doc.text(`Dokument generisan: ${new Date().toLocaleDateString('sr-RS')}`, 
            pageWidth / 2, pageHeight - 15, { align: 'center' })
    
    // Sačuvaj PDF sa imenom zaposlenog i datumom izdavanja
    const formattedDate = formatDate(certificate.issue_date).replace(/\//g, '-')
    const safeFileName = `Potvrda_${employeeName.replace(/\s+/g, '_')}_${formattedDate}.pdf`
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
    
    doc.save(safeFileName)
    
  } catch (error) {
    console.error("Greška pri generisanju PDF-a:", error)
    toast({
      title: "Greška",
      description: "Došlo je do greške pri generisanju PDF-a",
      variant: "destructive",
    })
  } finally {
    setPdfLoading(false)
  }
}

  const handleEdit = () => {
    if (resolvedParams?.id) {
      router.push(`/dashboard/certificates/${resolvedParams.id}/edit`)
    }
  }

  const isExpiringSoon = (): boolean => {
    if (!certificate?.expiry_date) return false
    const expiry = new Date(certificate.expiry_date)
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    return expiry <= thirtyDaysFromNow && expiry > new Date()
  }

  const isExpired = (): boolean => {
    if (!certificate?.expiry_date) return false
    return new Date(certificate.expiry_date) < new Date()
  }

  const getStatusBadge = () => {
    if (!certificate) return null
    
    let status = certificate.status
    let variant: "default" | "secondary" | "destructive" | "outline" = "default"

    // Ako je valid ali je istekao, promeni status
    if (status === "valid" && isExpired()) {
      status = "expired"
    }

    switch (status) {
      case "valid":
        variant = "default"
        break
      case "expired":
        variant = "secondary"
        break
      case "revoked":
        variant = "destructive"
        break
      default:
        variant = "outline"
    }

    const labels: Record<string, string> = {
      "valid": "Važeći",
      "expired": "Istekao",
      "revoked": "Opozvan"
    }

    return (
      <Badge variant={variant} className="text-sm px-3 py-1">
        {labels[status] || status}
      </Badge>
    )
  }

  if (loading || !resolvedParams) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
          <p className="mt-2 text-muted-foreground">Učitavanje sertifikata...</p>
        </div>
      </div>
    )
  }

  if (!certificate) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/certificates">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sertifikat nije pronađen</h1>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center py-12 text-muted-foreground">
              Sertifikat koji tražite ne postoji ili je obrisan.
            </p>
            <div className="flex justify-center">
              <Link href="/dashboard/certificates">
                <Button>Nazad na listu sertifikata</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const expiringSoon = isExpiringSoon()
  const expired = isExpired()

  return (
    <div className="space-y-6">
      {/* Header sa navigacijom */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/certificates">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sertifikat #{certificate.certificate_number}</h1>
            <p className="text-muted-foreground">Detaljni pregled sertifikata</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={generatePDF} 
            disabled={pdfLoading}
            className="gap-2"
          >
            {pdfLoading ? (
              <>
                <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Generisanje...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Preuzmi PDF
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={handleEdit}
          >
            <Edit className="h-4 w-4" />
            Izmeni
          </Button>
        </div>
      </div>

      {/* Alert za ističući sertifikat */}
      {certificate.status === "valid" && expiringSoon && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <div>
              <h3 className="font-medium text-amber-800">Sertifikat ističe uskoro!</h3>
              <p className="text-sm text-amber-700">
                Ovaj sertifikat ističe {formatDate(certificate.expiry_date)}. 
                Preporučuje se obnova sertifikata.
              </p>
            </div>
          </div>
        </div>
      )}

      {certificate.status === "valid" && expired && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <div>
              <h3 className="font-medium text-red-800">Sertifikat je istekao!</h3>
              <p className="text-sm text-red-700">
                Ovaj sertifikat je istekao {formatDate(certificate.expiry_date)}. 
                Potrebna je hitna obnova.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Glavne informacije u kartama */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Karta 1: Osnovni podaci o sertifikatu */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Podaci o sertifikatu
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Broj sertifikata</p>
                <p className="text-lg font-semibold">{certificate.certificate_number}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <div className="mt-1">{getStatusBadge()}</div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Naziv obuke</p>
              <p className="text-lg">
                {certificate.training_certificates_master?.title || "Opšti sertifikat"}
              </p>
              {certificate.training_certificates_master?.code && (
                <p className="text-sm text-muted-foreground">
                  Šifra: {certificate.training_certificates_master.code}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Datum izdavanja</p>
                <p className="text-lg">
                  <span className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDate(certificate.issue_date)}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Datum isteka</p>
                <p className="text-lg">
                  <span className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {certificate.expiry_date ? formatDate(certificate.expiry_date) : "Bez isteka"}
                  </span>
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Ocena</p>
              <p className="text-lg">{certificate.grade || "Nije unesena"}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Važenje (meseci)</p>
              <p className="text-lg">
                {certificate.training_certificates_master?.validity_months || "Nije definisano"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Karta 2: Podaci o zaposlenom */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Podaci o zaposlenom
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Ime i prezime</p>
              <p className="text-xl font-semibold">
                {certificate.staff.first_name} {certificate.staff.last_name}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Broj zaposlenog</p>
                <p className="text-lg font-mono">{certificate.staff.employee_number}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="text-lg">{certificate.staff.email || "Nije unet"}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pozicija</p>
                <p className="text-lg">{certificate.staff.working_positions?.title || "Nije definisana"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Odsek</p>
                <p className="text-lg">{certificate.staff.working_positions?.department || "Nije definisan"}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status zaposlenog</p>
                <Badge variant={certificate.staff.status === "active" ? "default" : "secondary"}>
                  {certificate.staff.status === "active" ? "Aktivan" : "Neaktivan"}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Datum zaposlenja</p>
                <p className="text-lg">
                  {certificate.staff.hire_date ? formatDate(certificate.staff.hire_date) : "Nije unet"}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Telefon</p>
              <p className="text-lg">{certificate.staff.phone || "Nije unet"}</p>
            </div>
          </CardContent>
        </Card>

        {/* Karta 3: Dodatne informacije */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Dodatne informacije
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Instruktor</p>
                <p className="text-lg">{certificate.instructor_name || "Nije unet"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Izdato od strane</p>
                <p className="text-lg">{certificate.issued_by || "Nije uneto"}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Organizator / Provajder</p>
              <p className="text-lg">
                {certificate.training_provider || 
                 certificate.training_certificates_master?.training_provider || 
                 "Nije uneto"}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Datum završetka obuke</p>
              <p className="text-lg">
                {certificate.completion_date ? formatDate(certificate.completion_date) : "Nije unet"}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Opis obuke</p>
              <p className="text-sm">
                {certificate.training_certificates_master?.description || "Nema opisa"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Karta 4: Napomene */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Napomene
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Dodatne napomene</p>
                {certificate.notes ? (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="whitespace-pre-wrap">{certificate.notes}</p>
                  </div>
                ) : (
                  <p className="text-gray-500">Nema dodatnih napomena</p>
                )}
              </div>

              <div className="pt-4 border-t">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Kreiran</p>
                    <p>{formatDate(certificate.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Ažuriran</p>
                    <p>{formatDate(certificate.updated_at)}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Link ka zaposlenom */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Povezani zaposleni</h3>
              <p className="text-sm text-muted-foreground">
                Pregledajte kompletnu istoriju sertifikata za ovog zaposlenog
              </p>
            </div>
            <div className="flex gap-2">
              <Link href={`/dashboard/employees/${certificate.staff.id}`}>
                <Button variant="outline">
                  Profil zaposlenog
                </Button>
              </Link>
              <Link href={`/dashboard/certificates?employee=${certificate.staff.employee_number}`}>
                <Button>
                  Svi sertifikati zaposlenog
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}