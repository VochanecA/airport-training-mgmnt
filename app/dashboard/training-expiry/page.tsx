"use client"

import { useState, useEffect } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Calendar,
  Mail,
  User,
  Clock,
  AlertTriangle,
  CheckCircle,
  Send,
  RefreshCw,
  Download,
  ExternalLink,
  Filter,
  Search,
  FileText
} from "lucide-react"
import Link from "next/link"
import { formatDate } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

// Definišite tipove
interface CertificateRecord {
  id: string
  certificate_number: string
  issue_date: string
  expiry_date: string
  completion_date: string | null
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
    email: string | null
    employee_number: string
    phone: string | null
    status: string
    working_positions?: {
      title: string | null
      department: string | null
    } | null
  }
  training_certificates_master: {
    id: string
    title: string
    code: string
    validity_months: number | null
    description: string | null
    training_provider: string | null
  } | null
}

interface ExpiryStats {
  total: number
  expired: number
  warning30: number
  warning7: number
  valid: number
  today: number
  thisWeek: number
  thisMonth: number
}

export default function TrainingExpiryPage() {
  const { toast } = useToast()
  const [certificates, setCertificates] = useState<CertificateRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [search, setSearch] = useState("")
  const [filterDays, setFilterDays] = useState<"7" | "30" | "90" | "all">("30")
  const [filterStatus, setFilterStatus] = useState<"all" | "expired" | "warning" | "valid">("all")
  const [stats, setStats] = useState<ExpiryStats>({
    total: 0,
    expired: 0,
    warning30: 0,
    warning7: 0,
    valid: 0,
    today: 0,
    thisWeek: 0,
    thisMonth: 0
  })

  const supabase = getSupabaseBrowserClient()

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Učitaj sve sertifikate koji imaju datum isteka
      const { data, error } = await supabase
        .from('training_certificate_records')
        .select(`
          *,
          staff:staff_id (
            id,
            first_name,
            last_name,
            email,
            employee_number,
            phone,
            status,
            working_positions:position_id (
              title,
              department
            )
          ),
          training_certificates_master:training_master_id (
            id,
            title,
            code,
            validity_months,
            description,
            training_provider
          )
        `)
        .not('expiry_date', 'is', null) // Samo oni koji imaju datum isteka
        .order('expiry_date', { ascending: true })

      if (error) throw error

      if (data) {
        // Obrađujemo podatke i dodajemo status
        const today = new Date()
        const processedCertificates = data.map(cert => {
          if (!cert.expiry_date) return { ...cert, status: 'unknown' }
          
          const expiresDate = new Date(cert.expiry_date)
          const daysDiff = Math.ceil((expiresDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          
          let status = 'valid'
          if (daysDiff < 0) {
            status = 'expired'
          } else if (daysDiff <= 7) {
            status = 'warning7'
          } else if (daysDiff <= 30) {
            status = 'warning30'
          }
          
          return { ...cert, status }
        })

        setCertificates(processedCertificates)

        // Izračunaj statistike
        const todayDate = today.toISOString().split('T')[0]
        const sevenDaysFromNow = new Date()
        sevenDaysFromNow.setDate(today.getDate() + 7)
        const sevenDaysStr = sevenDaysFromNow.toISOString().split('T')[0]
        const thirtyDaysFromNow = new Date()
        thirtyDaysFromNow.setDate(today.getDate() + 30)
        const thirtyDaysStr = thirtyDaysFromNow.toISOString().split('T')[0]

        const statsData: ExpiryStats = {
          total: data.length,
          expired: processedCertificates.filter(t => t.status === 'expired').length,
          warning30: processedCertificates.filter(t => t.status === 'warning30').length,
          warning7: processedCertificates.filter(t => t.status === 'warning7').length,
          valid: processedCertificates.filter(t => t.status === 'valid').length,
          today: data.filter(t => t.expiry_date === todayDate).length,
          thisWeek: data.filter(t => 
            t.expiry_date && t.expiry_date >= todayDate && t.expiry_date <= sevenDaysStr
          ).length,
          thisMonth: data.filter(t => 
            t.expiry_date && t.expiry_date >= todayDate && t.expiry_date <= thirtyDaysStr
          ).length
        }

        setStats(statsData)
      }

    } catch (error) {
      console.error('Error loading data:', error)
      toast({
        title: "Greška",
        description: "Došlo je do greške pri učitavanju podataka",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSendReminders = async () => {
    setSending(true)
    try {
      // Pronađi sertifikate koji ističu u narednih 30 dana
      const certificatesToNotify = certificates.filter(cert => {
        if (!cert.expiry_date || !cert.staff.email) return false
        
        const days = getDaysRemaining(cert.expiry_date)
        return days >= 0 && days <= 30
      })

      let sentCount = 0
      const failedEmails: string[] = []

      // Simulacija slanja email-a
      for (const cert of certificatesToNotify) {
        try {
          const daysRemaining = getDaysRemaining(cert.expiry_date)
          const trainingName = cert.training_certificates_master?.title || 'Sertifikat'
          const expiryDateFormatted = formatDate(cert.expiry_date)
          
          console.log(`Sending email to ${cert.staff.email}:`)
          console.log(`- Subject: Podsetnik: ${trainingName} ističe za ${daysRemaining} dana`)
          console.log(`- Expires: ${expiryDateFormatted}`)
          
          // Ovde bi bio pravi Resend API poziv
          sentCount++
          
          await new Promise(resolve => setTimeout(resolve, 50))
          
        } catch (err) {
          console.error(`Failed to send email to ${cert.staff.email}:`, err)
          failedEmails.push(cert.staff.email || 'Unknown email')
        }
      }

      toast({
        title: "Podsetnici poslati",
        description: `Simulacija: Poslano bi ${sentCount} email podsetnika. Neuspeli: ${failedEmails.length}`,
      })
      
      await loadData()
      
    } catch (error) {
      console.error('Error sending reminders:', error)
      toast({
        title: "Greška",
        description: "Došlo je do greške pri slanju podsetnika",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  const handleExportToExcel = () => {
    try {
      // Kreiraj CSV podatke
      const headers = [
        'Ime',
        'Prezime',
        'Broj zaposlenog',
        'Email',
        'Obuka',
        'Šifra obuke',
        'Broj sertifikata',
        'Datum izdavanja',
        'Datum isteka',
        'Dana preostalo',
        'Status',
        'Instruktor',
        'Izdato od'
      ]

      const csvData = certificates.map(cert => {
        const daysRemaining = getDaysRemaining(cert.expiry_date)
        const statusText = getStatusText(cert.status, cert.expiry_date)
        
        return [
          cert.staff.first_name,
          cert.staff.last_name,
          cert.staff.employee_number,
          cert.staff.email || '',
          cert.training_certificates_master?.title || 'Opšti sertifikat',
          cert.training_certificates_master?.code || 'GENERAL-CERT',
          cert.certificate_number,
          formatDate(cert.issue_date),
          formatDate(cert.expiry_date),
          daysRemaining.toString(),
          statusText,
          cert.instructor_name || '',
          cert.issued_by || ''
        ]
      })

      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `obuke_istek_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Uspešno",
        description: "Podaci su izvezeni u CSV format",
      })
      
    } catch (error) {
      console.error('Error exporting to CSV:', error)
      toast({
        title: "Greška",
        description: "Došlo je do greške pri izvozu podataka",
        variant: "destructive",
      })
    }
  }

  const getDaysRemaining = (expiryDate: string | null) => {
    if (!expiryDate) return 999
    
    const today = new Date()
    const expiry = new Date(expiryDate)
    const diff = expiry.getTime() - today.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  const getStatusText = (status: string, expiryDate: string | null) => {
    const days = getDaysRemaining(expiryDate)
    
    if (status === 'expired' || days < 0) {
      return 'ISTEKLO'
    } else if (days <= 7) {
      return `ISTIČE ZA ${days} DANA`
    } else if (days <= 30) {
      return `UPOZORENJE (${days}d)`
    } else {
      return `VAŽEĆE (${days}d)`
    }
  }

  const getStatusBadge = (status: string, expiryDate: string | null) => {
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
        <Badge variant="outline" className="border-yellow-500 text-yellow-700 gap-1 bg-yellow-50">
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

  // Filtriranje podataka
  const filteredCertificates = certificates.filter(cert => {
    // Pretraga
    const searchLower = search.toLowerCase()
    const matchesSearch = search === "" ||
      cert.staff.first_name.toLowerCase().includes(searchLower) ||
      cert.staff.last_name.toLowerCase().includes(searchLower) ||
      cert.staff.employee_number.toLowerCase().includes(searchLower) ||
      cert.training_certificates_master?.title?.toLowerCase().includes(searchLower) ||
      cert.training_certificates_master?.code?.toLowerCase().includes(searchLower) ||
      cert.certificate_number.toLowerCase().includes(searchLower)

    // Filter po statusu
    const matchesStatus = filterStatus === "all" || 
      (filterStatus === "expired" && cert.status === "expired") ||
      (filterStatus === "warning" && (cert.status === "warning7" || cert.status === "warning30")) ||
      (filterStatus === "valid" && cert.status === "valid")

    // Filter po danima
    const daysRemaining = getDaysRemaining(cert.expiry_date)
    const matchesDays = filterDays === "all" ? true :
      filterDays === "7" ? (daysRemaining >= 0 && daysRemaining <= 7) :
      filterDays === "30" ? (daysRemaining >= 0 && daysRemaining <= 30) :
      filterDays === "90" ? (daysRemaining >= 0 && daysRemaining <= 90) : true

    return matchesSearch && matchesStatus && matchesDays
  })

  // Funkcija za određivanje CSS klase za red
  const getRowClass = (status: string, daysRemaining: number) => {
    if (status === 'expired' || daysRemaining < 0) {
      return "bg-red-50 hover:bg-red-100"
    } else if (daysRemaining <= 7) {
      return "bg-red-100 hover:bg-red-200"
    } else if (daysRemaining <= 30) {
      // LIGHT RED background za obuke koje ističu za 30 dana
      return "bg-red-50 hover:bg-red-100 text-gray-900 font-semibold"
    }
    return ""
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Istek Obuka</h1>
          <p className="text-muted-foreground">Praćenje isteka sertifikata zaposlenih</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleSendReminders}
            disabled={sending || filteredCertificates.length === 0}
            className="gap-2"
          >
            {sending ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Pošalji Podsetnike
          </Button>
          <Button
            onClick={handleExportToExcel}
            variant="outline"
            className="gap-2"
            disabled={filteredCertificates.length === 0}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button
            onClick={loadData}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Osveži
          </Button>
        </div>
      </div>

      {/* Statistike */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ukupno sertifikata</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ističe danas</p>
                <p className="text-2xl font-bold">{stats.today}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ističe za 7 dana</p>
                <p className="text-2xl font-bold">{stats.thisWeek}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ističe za 30 dana</p>
                <p className="text-2xl font-bold">{stats.thisMonth}</p>
              </div>
              <Calendar className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dodatne statistike */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Istekli</p>
                <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ističe za 30 dana</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.warning30}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Važeći</p>
                <p className="text-2xl font-bold text-green-600">{stats.valid}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filteri i pretraga */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Pretraga
              </Label>
              <Input
                id="search"
                placeholder="Ime, prezime, broj zaposlenog, obuka, broj sertifikata..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="days-filter" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Vremenski period
              </Label>
              <select
                id="days-filter"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={filterDays}
                onChange={(e) => setFilterDays(e.target.value as any)}
              >
                <option value="7">Ističe za 7 dana</option>
                <option value="30">Ističe za 30 dana</option>
                <option value="90">Ističe za 90 dana</option>
                <option value="all">Svi rokovi</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status-filter" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Status
              </Label>
              <select
                id="status-filter"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
              >
                <option value="all">Svi statusi</option>
                <option value="valid">Važeći</option>
                <option value="warning">Upozorenje (7-30 dana)</option>
                <option value="expired">Istekli</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista Sertifikata</CardTitle>
              <CardDescription>
                {filteredCertificates.length} sertifikata pronađeno
                {filterDays !== "all" && ` (koje ističu za ${filterDays} dana)`}
              </CardDescription>
            </div>
            {filteredCertificates.length > 0 && (
              <div className="text-sm text-muted-foreground">
                Poslednje ažuriranje: {new Date().toLocaleTimeString('sr-RS')}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
              <p className="mt-2 text-muted-foreground">Učitavanje podataka...</p>
            </div>
          ) : filteredCertificates.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <h3 className="text-lg font-semibold">
                {search || filterStatus !== "all" || filterDays !== "all" 
                  ? "Nema pronađenih sertifikata" 
                  : "Nema evidentiranih sertifikata"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {search || filterStatus !== "all" || filterDays !== "all"
                  ? "Pokušajte promijeniti filtere ili pretragu"
                  : "Dodajte prvi sertifikat zaposlenom"}
              </p>
              <Link href="/dashboard/certificates/new">
                <Button variant="outline" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Dodaj sertifikat
                </Button>
              </Link>
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">Zaposleni</TableHead>
                      <TableHead className="whitespace-nowrap">Obuka</TableHead>
                      <TableHead className="whitespace-nowrap text-center">Broj sertifikata</TableHead>
                      <TableHead className="whitespace-nowrap text-center">Datum izdavanja</TableHead>
                      <TableHead className="whitespace-nowrap text-center">Datum isteka</TableHead>
                      <TableHead className="whitespace-nowrap text-center">Dana preostalo</TableHead>
                      <TableHead className="whitespace-nowrap text-center">Status</TableHead>
                      <TableHead className="whitespace-nowrap text-center">Akcije</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCertificates.map((cert) => {
                      const daysRemaining = getDaysRemaining(cert.expiry_date)
                      const rowClass = getRowClass(cert.status, daysRemaining)
                      
                      return (
                        <TableRow 
                          key={cert.id}
                          className={rowClass}
                        >
                          <TableCell>
                            <div className="font-medium">
                              {cert.staff.first_name} {cert.staff.last_name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {cert.staff.employee_number}
                            </div>
                            {cert.staff.email && (
                              <div className="text-xs text-blue-600">
                                {cert.staff.email}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              {cert.training_certificates_master?.title || 'Opšti sertifikat'}
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                              <span className="font-mono">{cert.training_certificates_master?.code || 'GENERAL-CERT'}</span>
                              {cert.training_certificates_master?.validity_months && (
                                <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                                  {cert.training_certificates_master.validity_months} mj.
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center font-mono">
                            {cert.certificate_number}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-col items-center">
                              <Calendar className="h-4 w-4 text-gray-500 mb-1" />
                              <span>{formatDate(cert.issue_date)}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className={`flex flex-col items-center ${daysRemaining <= 30 ? "font-bold" : ""}`}>
                              <Clock className={`h-4 w-4 mb-1 ${daysRemaining <= 7 ? "text-red-500" : daysRemaining <= 30 ? "text-yellow-600" : "text-gray-500"}`} />
                              <span className={daysRemaining <= 30 ? "font-bold" : ""}>
                                {formatDate(cert.expiry_date)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className={`font-semibold ${daysRemaining <= 7 ? "text-red-600" : daysRemaining <= 30 ? "text-yellow-700 font-bold" : ""}`}>
                              {daysRemaining > 0 ? `${daysRemaining} dana` : "ISTEKLO"}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {getStatusBadge(cert.status, cert.expiry_date)}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              {cert.staff.email && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => window.location.href = `mailto:${cert.staff.email}?subject=Podsetnik: ${cert.training_certificates_master?.title || 'Sertifikat'} ističe za ${daysRemaining} dana&body=Poštovani ${cert.staff.first_name},%0D%0A%0D%0ASertifikat "${cert.training_certificates_master?.title || ''}" ističe ${formatDate(cert.expiry_date)}.%0D%0APreostalo dana: ${daysRemaining}%0D%0ABroj sertifikata: ${cert.certificate_number}%0D%0A%0D%0AMolimo obnovite sertifikat prije isteka roka.%0D%0A%0D%0APoštovanje,%0D%0ATim za obuke`}
                                  title="Pošalji email"
                                >
                                  <Mail className="h-4 w-4" />
                                </Button>
                              )}
                              <Link href={`/dashboard/certificates/${cert.id}`}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  title="Pogledaj detalje"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Link href={`/dashboard/employees/${cert.staff.id}`}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  title="Pogledaj profil zaposlenog"
                                >
                                  <User className="h-4 w-4" />
                                </Button>
                              </Link>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legenda */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Legenda statusa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-100 border border-red-300"></div>
              <span className="text-sm">Ističe za 30 dana (light red)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-200 border border-red-400"></div>
              <span className="text-sm">Ističe za 7 dana (red)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-300 border border-red-500"></div>
              <span className="text-sm">Isteklo (dark red)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-white border border-gray-300"></div>
              <span className="text-sm">Važeći (normal)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info box za email notifikacije */}
      <Alert>
        <Send className="h-4 w-4" />
        <AlertDescription>
          <strong>Email podsetnici:</strong> Kliknite na email ikonu pored zaposlenog za brzo slanje podsetnika.
          Sistem šalje automatske podsjetnike za sertifikate koji ističu za 30 dana.
        </AlertDescription>
      </Alert>
    </div>
  )
}