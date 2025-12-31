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
  Search
} from "lucide-react"
import Link from "next/link"

// Definišite tipove iznad komponente
interface StaffTraining {
  id: string
  completed_date: string
  expires_date: string
  status: string
  notes?: string
  staff: {
    id: string
    first_name: string
    last_name: string
    email: string
    employee_number: string
  }
  training_type: {
    id: string
    name: string
    code: string
    validity_months: number
  }
}

interface ExpiryStats {
  total: number
  expired: number
  warning: number
  valid: number
  today: number
  thisWeek: number
  thisMonth: number
}

export default function TrainingExpiryPage() {
  const [trainings, setTrainings] = useState<StaffTraining[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [search, setSearch] = useState("")
  const [filterDays, setFilterDays] = useState<"7" | "30" | "90" | "all">("30")
  const [filterStatus, setFilterStatus] = useState<"all" | "expired" | "warning" | "valid">("all")
  const [stats, setStats] = useState<ExpiryStats>({
    total: 0,
    expired: 0,
    warning: 0,
    valid: 0,
    today: 0,
    thisWeek: 0,
    thisMonth: 0
  })

  const supabase = getSupabaseBrowserClient()

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Učitaj sve obuke
      const { data: allData, error } = await supabase
        .from('staff_trainings')
        .select(`
          *,
          staff:staff_id (first_name, last_name, email, employee_number),
          training_type:training_type_id (name, code, validity_months)
        `)
        .order('expires_date', { ascending: true })

      if (error) throw error

      if (allData) {
        // Ažuriraj statuse u aplikaciji
        const today = new Date()
        const updatedTrainings = allData.map(training => {
          const expiresDate = new Date(training.expires_date)
          const daysDiff = Math.ceil((expiresDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          
          let status = 'valid'
          if (daysDiff < 0) status = 'expired'
          else if (daysDiff <= 30) status = 'warning'
          
          return { ...training, status }
        })

        setTrainings(updatedTrainings)

        // Izračunaj statistike
        const todayDate = today.toISOString().split('T')[0]
        const sevenDaysFromNow = new Date()
        sevenDaysFromNow.setDate(today.getDate() + 7)
        const sevenDaysStr = sevenDaysFromNow.toISOString().split('T')[0]
        const thirtyDaysFromNow = new Date()
        thirtyDaysFromNow.setDate(today.getDate() + 30)
        const thirtyDaysStr = thirtyDaysFromNow.toISOString().split('T')[0]

        const stats: ExpiryStats = {
          total: allData.length,
          expired: updatedTrainings.filter(t => t.status === 'expired').length,
          warning: updatedTrainings.filter(t => t.status === 'warning').length,
          valid: updatedTrainings.filter(t => t.status === 'valid').length,
          today: allData.filter(t => t.expires_date === todayDate).length,
          thisWeek: allData.filter(t => 
            t.expires_date >= todayDate && t.expires_date <= sevenDaysStr
          ).length,
          thisMonth: allData.filter(t => 
            t.expires_date >= todayDate && t.expires_date <= thirtyDaysStr
          ).length
        }

        setStats(stats)
      }

    } catch (error) {
      console.error('Error loading data:', error)
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
      // Pronađi obuke koje ističu u narednih 7 dana
      const today = new Date().toISOString().split('T')[0]
      const sevenDaysFromNow = new Date()
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
      const futureDate = sevenDaysFromNow.toISOString().split('T')[0]

      const trainingsToNotify = trainings.filter(t => {
        const days = getDaysRemaining(t.expires_date)
        return days >= 0 && days <= 7 && t.staff.email
      })

      let sentCount = 0
      const failedEmails: string[] = []

      // Simulacija slanja email-a (zamenite sa pravim Resend API pozivom)
      for (const training of trainingsToNotify) {
        try {
          const daysRemaining = getDaysRemaining(training.expires_date)
          
          // OVO JE SIMULACIJA - zamenite sa pravim API pozivom
          console.log(`Sending email to ${training.staff.email}:`)
          console.log(`- Subject: Podsetnik: ${training.training_type.name} ističe za ${daysRemaining} dana`)
          console.log(`- Expires: ${new Date(training.expires_date).toLocaleDateString('sr-RS')}`)
          
          // Ovde bi bio pravi Resend API poziv:
          // await resend.emails.send({...})
          
          sentCount++
          
          // Sačekaj malo da ne flood-ujemo konzolu
          await new Promise(resolve => setTimeout(resolve, 100))
          
        } catch (err) {
          console.error(`Failed to send email to ${training.staff.email}:`, err)
          failedEmails.push(training.staff.email)
        }
      }

      alert(`Simulacija: Poslano bi ${sentCount} email podsetnika\nNeuspeli: ${failedEmails.length > 0 ? failedEmails.join(', ') : 'nema'}`)
      
      // OSNEŽI podatke nakon slanja
      await loadData()
      
    } catch (error) {
      console.error('Error sending reminders:', error)
      alert('Došlo je do greške pri slanju podsetnika')
    } finally {
      setSending(false)
    }
  }

  const handleExportToExcel = () => {
    // Ovde bi bio export u Excel
    alert("Export u Excel funkcionalnost bi bila ovde implementirana")
    
    // Za pravu implementaciju:
    // 1. Instalirajte: npm install xlsx
    // 2. Importujte: import * as XLSX from 'xlsx'
    // 3. Implementirajte export logiku
  }

  const getDaysRemaining = (expiresDate: string) => {
    const today = new Date()
    const expiry = new Date(expiresDate)
    const diff = expiry.getTime() - today.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  const getStatusText = (status: string, expiresDate: string) => {
    const days = getDaysRemaining(expiresDate)
    
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

  const getStatusBadge = (status: string, expiresDate: string) => {
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

  // Filtriranje podataka
  const filteredTrainings = trainings.filter(training => {
    // Pretraga
    const searchLower = search.toLowerCase()
    const matchesSearch = search === "" ||
      training.staff.first_name.toLowerCase().includes(searchLower) ||
      training.staff.last_name.toLowerCase().includes(searchLower) ||
      training.staff.employee_number.toLowerCase().includes(searchLower) ||
      training.training_type.name.toLowerCase().includes(searchLower) ||
      training.training_type.code.toLowerCase().includes(searchLower)

    // Filter po statusu
    const matchesStatus = filterStatus === "all" || training.status === filterStatus

    // Filter po danima
    const daysRemaining = getDaysRemaining(training.expires_date)
    const matchesDays = filterDays === "all" ? true :
      filterDays === "7" ? (daysRemaining >= 0 && daysRemaining <= 7) :
      filterDays === "30" ? (daysRemaining >= 0 && daysRemaining <= 30) :
      filterDays === "90" ? (daysRemaining >= 0 && daysRemaining <= 90) : true

    return matchesSearch && matchesStatus && matchesDays
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Istek Obuka</h1>
          <p className="text-muted-foreground">Praćenje isteka obuka zaposlenih</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleSendReminders}
            disabled={sending || filteredTrainings.length === 0}
            className="gap-2"
          >
            {sending ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Pošalji Podsjetnike
          </Button>
          <Button
            onClick={handleExportToExcel}
            variant="outline"
            className="gap-2"
            disabled={filteredTrainings.length === 0}
          >
            <Download className="h-4 w-4" />
            Export Excel
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
                <p className="text-sm font-medium text-muted-foreground">Ukupno obuka</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-500" />
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
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
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
              <Calendar className="h-8 w-8 text-purple-500" />
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
                placeholder="Ime, prezime, broj zaposlenog, obuka..."
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
                <option value="valid">Važeće</option>
                <option value="warning">Upozorenje</option>
                <option value="expired">Istekle</option>
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
              <CardTitle>Lista Obuka</CardTitle>
              <CardDescription>
                {filteredTrainings.length} obuka pronađeno
                {filterDays !== "all" && ` (koje ističu za ${filterDays} dana)`}
              </CardDescription>
            </div>
            {filteredTrainings.length > 0 && (
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
          ) : filteredTrainings.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <h3 className="text-lg font-semibold">
                {search || filterStatus !== "all" || filterDays !== "all" 
                  ? "Nema pronađenih obuka" 
                  : "Nema evidentiranih obuka"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {search || filterStatus !== "all" || filterDays !== "all"
                  ? "Pokušajte promijeniti filtere ili pretragu"
                  : "Dodajte prvu obuku zaposlenom"}
              </p>
              <Link href="/dashboard/employees">
                <Button variant="outline" className="gap-2">
                  <User className="h-4 w-4" />
                  Dodaj obuku zaposlenom
                </Button>
              </Link>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Zaposleni</TableHead>
                    <TableHead>Obuka</TableHead>
                    <TableHead className="text-center">Završeno</TableHead>
                    <TableHead className="text-center">Ističe</TableHead>
                    <TableHead className="text-center">Dana preostalo</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Akcije</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTrainings.map((training) => {
                    const daysRemaining = getDaysRemaining(training.expires_date)
                    
                    return (
                      <TableRow 
                        key={training.id}
                        className={daysRemaining <= 7 ? "bg-red-50 hover:bg-red-100" : ""}
                      >
                        <TableCell>
                          <div className="font-medium">
                            {training.staff.first_name} {training.staff.last_name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {training.staff.employee_number}
                          </div>
                          <div className="text-xs text-blue-600">
                            {training.staff.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{training.training_type.name}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <span className="font-mono">{training.training_type.code}</span>
                            <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                              {training.training_type.validity_months} mj.
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center">
                            <Calendar className="h-4 w-4 text-gray-500 mb-1" />
                            <span>{new Date(training.completed_date).toLocaleDateString('sr-RS')}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className={`flex flex-col items-center ${daysRemaining <= 7 ? "font-bold" : ""}`}>
                            <Clock className={`h-4 w-4 mb-1 ${daysRemaining <= 7 ? "text-red-500" : "text-gray-500"}`} />
                            <span>{new Date(training.expires_date).toLocaleDateString('sr-RS')}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className={`font-semibold ${daysRemaining <= 7 ? "text-red-600" : ""}`}>
                            {daysRemaining > 0 ? `${daysRemaining} dana` : "ISTEKLO"}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {getStatusBadge(training.status, training.expires_date)}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => window.location.href = `mailto:${training.staff.email}?subject=Podsetnik: ${training.training_type.name} ističe za ${daysRemaining} dana&body=Poštovani ${training.staff.first_name},%0D%0A%0D%0AObuka "${training.training_type.name}" ističe ${new Date(training.expires_date).toLocaleDateString('sr-RS')}.%0D%0APreostalo dana: ${daysRemaining}%0D%0A%0D%0AMolimo obnovite obuku prije isteka roka.%0D%0A%0D%0APoštovanje,%0D%0ATim za obuke`}
                              title="Pošalji email"
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                            <Link href={`/dashboard/employees/${training.staff.id}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                title="Pogledaj profil"
                              >
                                <ExternalLink className="h-4 w-4" />
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
          )}
        </CardContent>
      </Card>

      {/* Info box za email notifikacije */}
      <Alert>
        <Send className="h-4 w-4" />
        <AlertDescription>
          <strong>Email podsetnici:</strong> Sistem će automatski slati podsjetnike za obuke koje ističu za 7 dana.
          Kliknite na "Pošalji Podsjetnike" za ručno slanje ili podesite cron job na serveru.
        </AlertDescription>
      </Alert>
    </div>
  )
}