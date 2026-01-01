"use client"

import { useState, useEffect } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Users, 
  FileText, 
  GraduationCap, 
  Calendar, 
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle,
  UserCheck,
  Briefcase,
  BarChart3,
  RefreshCw
} from "lucide-react"
import Link from "next/link"
import { formatDate } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface DashboardStats {
  totalEmployees: number
  activeEmployees: number
  totalCertificates: number
  expiringCertificates: number
  expiredCertificates: number
  totalPositions: number
  totalTrainingTypes: number
  upcomingExpirations: {
    today: number
    week: number
    month: number
  }
  recentCertificates: Array<{
    id: string
    certificate_number: string
    issue_date: string
    expiry_date: string | null
    staff_name: string
    training_title: string
  }>
  departmentStats: Array<{
    department: string | null
    employee_count: number
    certificate_count: number
  }>
  monthlyTrend: Array<{
    month: string
    certificates: number
    employees: number
  }>
}

export default function DashboardPage() {
  const { toast } = useToast()
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    activeEmployees: 0,
    totalCertificates: 0,
    expiringCertificates: 0,
    expiredCertificates: 0,
    totalPositions: 0,
    totalTrainingTypes: 0,
    upcomingExpirations: {
      today: 0,
      week: 0,
      month: 0
    },
    recentCertificates: [],
    departmentStats: [],
    monthlyTrend: []
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const supabase = getSupabaseBrowserClient()

  const loadDashboardData = async () => {
    try {
      setRefreshing(true)
      
      // Učitaj podatke paralelno za bolju performance
      const [
        employeesData,
        certificatesData,
        positionsData,
        trainingTypesData,
        recentCertificatesData,
        departmentStatsData
      ] = await Promise.all([
        // 1. Podaci o zaposlenima
        supabase
          .from("staff")
          .select("id, status, position_id")
          .then(({ data, error }) => {
            if (error) throw error
            return data || []
          }),

        // 2. Podaci o sertifikatima
        supabase
          .from("training_certificate_records")
          .select("id, issue_date, expiry_date, certificate_number, staff_id, training_master_id")
          .then(({ data, error }) => {
            if (error) throw error
            return data || []
          }),

        // 3. Podaci o pozicijama
        supabase
          .from("working_positions")
          .select("id, is_active")
          .then(({ data, error }) => {
            if (error) throw error
            return data || []
          }),

        // 4. Podaci o tipovima obuka
        supabase
          .from("training_certificates_master")
          .select("id, is_active")
          .then(({ data, error }) => {
            if (error) throw error
            return data || []
          }),

        // 5. Poslednjih 5 sertifikata sa detaljima
        supabase
          .from("training_certificate_records")
          .select(`
            id,
            certificate_number,
            issue_date,
            expiry_date,
            staff:staff_id (first_name, last_name),
            training_certificates_master:training_master_id (title)
          `)
          .order("issue_date", { ascending: false })
          .limit(5)
          .then(({ data, error }) => {
            if (error) throw error
            return data || []
          }),

        // 6. Statistika po odjeljenjima
        supabase
          .from("staff")
          .select(`
            id,
            working_positions:position_id (department),
            training_certificate_records!inner (id)
          `)
          .eq("status", "active")
          .then(({ data, error }) => {
            if (error) throw error
            return data || []
          })
      ])

      // Izračunaj statistikе
      const today = new Date()
      const weekFromNow = new Date()
      weekFromNow.setDate(today.getDate() + 7)
      const monthFromNow = new Date()
      monthFromNow.setDate(today.getDate() + 30)

      // Broj zaposlenih
      const totalEmployees = employeesData.length
      const activeEmployees = employeesData.filter(e => e.status === "active").length

      // Broj sertifikata
      const totalCertificates = certificatesData.length

      // Istekli sertifikati
      const expiredCertificates = certificatesData.filter(cert => {
        if (!cert.expiry_date) return false
        return new Date(cert.expiry_date) < today
      }).length

      // Sertifikati koji ističu u narednih 30 dana
      const expiringCertificates = certificatesData.filter(cert => {
        if (!cert.expiry_date) return false
        const expiryDate = new Date(cert.expiry_date)
        return expiryDate >= today && expiryDate <= monthFromNow
      }).length

      // Broj pozicija i tipova obuka
      const totalPositions = positionsData.length
      const totalTrainingTypes = trainingTypesData.length

      // Nadolazeći isteci
      const upcomingExpirations = {
        today: certificatesData.filter(cert => {
          if (!cert.expiry_date) return false
          const expiryDate = new Date(cert.expiry_date)
          return expiryDate.toDateString() === today.toDateString()
        }).length,
        week: certificatesData.filter(cert => {
          if (!cert.expiry_date) return false
          const expiryDate = new Date(cert.expiry_date)
          return expiryDate > today && expiryDate <= weekFromNow
        }).length,
        month: certificatesData.filter(cert => {
          if (!cert.expiry_date) return false
          const expiryDate = new Date(cert.expiry_date)
          return expiryDate > weekFromNow && expiryDate <= monthFromNow
        }).length
      }

      // Oбради poslednje sertifikate
      const recentCertificates = recentCertificatesData.map(cert => ({
        id: cert.id,
        certificate_number: cert.certificate_number || "N/A",
        issue_date: cert.issue_date,
        expiry_date: cert.expiry_date,
        staff_name: cert.staff 
          ? `${cert.staff.first_name} ${cert.staff.last_name}`
          : "Nepoznato",
        training_title: cert.training_certificates_master?.title || "Opšti sertifikat"
      }))

      // Oбради statistiku po odjeljenjima
      const departmentMap = new Map<string, { employees: number; certificates: number }>()
      
      departmentStatsData.forEach(employee => {
        const department = employee.working_positions?.department || "Bez odjeljenja"
        const current = departmentMap.get(department) || { employees: 0, certificates: 0 }
        
        current.employees++
        current.certificates += employee.training_certificate_records?.length || 0
        
        departmentMap.set(department, current)
      })

      const departmentStats = Array.from(departmentMap.entries()).map(([department, counts]) => ({
        department: department === "Bez odjeljenja" ? null : department,
        employee_count: counts.employees,
        certificate_count: counts.certificates
      })).sort((a, b) => b.employee_count - a.employee_count).slice(0, 5)

      // Izračunaj mesečni trend (poslednjih 6 meseci)
      const monthlyTrend = []
      const currentMonth = today.getMonth()
      const currentYear = today.getFullYear()
      
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(currentYear, currentMonth - i, 1)
        const monthStr = monthDate.toLocaleDateString('sr-RS', { month: 'short' })
        
        // Broj sertifikata izdatih u ovom mesecu
        const monthCertificates = certificatesData.filter(cert => {
          const certDate = new Date(cert.issue_date)
          return certDate.getMonth() === monthDate.getMonth() && 
                 certDate.getFullYear() === monthDate.getFullYear()
        }).length

        // Broj zaposlenih dodatiх u ovom mesecu (simulacija - treba da dodate hire_date polje)
        const monthEmployees = 0 // Ovo treba da se implementira ako imate hire_date

        monthlyTrend.push({
          month: monthStr,
          certificates: monthCertificates,
          employees: monthEmployees
        })
      }

      setStats({
        totalEmployees,
        activeEmployees,
        totalCertificates,
        expiringCertificates,
        expiredCertificates,
        totalPositions,
        totalTrainingTypes,
        upcomingExpirations,
        recentCertificates,
        departmentStats,
        monthlyTrend
      })

    } catch (error) {
      console.error("Greška pri učitavanju dashboard podataka:", error)
      toast({
        title: "Greška",
        description: "Došlo je do greške pri učitavanju podataka",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  const handleRefresh = () => {
    loadDashboardData()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-lg text-muted-foreground">Učitavanje dashboard podataka...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Pregled sistema za upravljanje obukama
          </p>
        </div>
        <Button 
          onClick={handleRefresh} 
          variant="outline" 
          size="sm"
          className="gap-2"
          disabled={refreshing}
        >
          {refreshing ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Osvježi
        </Button>
      </div>

      {/* Glavne statistike */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ukupno zaposlenih</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">
              <Badge variant="secondary" className="mr-2">
                {stats.activeEmployees} aktivnih
              </Badge>
              {stats.totalEmployees - stats.activeEmployees} neaktivnih
            </p>
            <div className="mt-2">
              <Link href="/dashboard/employees">
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                  Pregledaj sve
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Izdati sertifikati</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCertificates}</div>
            <div className="flex flex-wrap gap-1 mt-2">
              {stats.expiringCertificates > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {stats.expiringCertificates} ističe
                </Badge>
              )}
              {stats.expiredCertificates > 0 && (
                <Badge variant="outline" className="text-xs">
                  {stats.expiredCertificates} isteklo
                </Badge>
              )}
            </div>
            <div className="mt-2">
              <Link href="/dashboard/certificates">
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                  Upravljaj sertifikatima
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Radne pozicije</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPositions}</div>
            <p className="text-xs text-muted-foreground">
              Definisane radne pozicije u sistemu
            </p>
            <div className="mt-2">
              <Link href="/dashboard/positions">
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                  Pregledaj pozicije
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tipovi obuka</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTrainingTypes}</div>
            <p className="text-xs text-muted-foreground">
              Dostupni tipovi obuka i sertifikata
            </p>
            <div className="mt-2">
              <Link href="/dashboard/training-types">
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                  Upravljaj obukama
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Nadolazeći isteci i poslednje aktivnosti */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Nadolazeći isteci */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Nadolazeći isteci
            </CardTitle>
            <CardDescription>
              Pregled sertifikata koji ističu u bliskoj budućnosti
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-amber-600" />
                  <div>
                    <p className="font-medium">Ističe danas</p>
                    <p className="text-sm text-muted-foreground">Sertifikati koji ističu danas</p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-amber-700">
                  {stats.upcomingExpirations.today}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="font-medium">Ističe u narednih 7 dana</p>
                    <p className="text-sm text-muted-foreground">Hitne obaveze</p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-red-700">
                  {stats.upcomingExpirations.week}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Ističe u narednih 30 dana</p>
                    <p className="text-sm text-muted-foreground">Planirane obnove</p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-blue-700">
                  {stats.upcomingExpirations.month}
                </div>
              </div>

              <div className="pt-2">
                <Link href="/dashboard/training-expiry">
                  <Button variant="outline" className="w-full">
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Detaljan pregled isteka
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Poslednje izdati sertifikati */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              Zadnje izdati sertifikati
            </CardTitle>
            <CardDescription>
              Najnovije aktivnosti u sistemu
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentCertificates.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nema novih sertifikata</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recentCertificates.map((cert) => (
                  <div
                    key={cert.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <UserCheck className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {cert.staff_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {cert.training_title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {cert.certificate_number}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(cert.issue_date)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Link href={`/dashboard/certificates/${cert.id}`}>
                      <Button variant="ghost" size="sm">
                        Pregled
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
            <div className="pt-4">
              <Link href="/dashboard/certificates">
                <Button variant="outline" className="w-full">
                  Pregledaj sve sertifikate
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistika po odjeljenjima */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-purple-500" />
            Statistika po odjeljenjima ili sluzbama
          </CardTitle>
          <CardDescription>
            Distribucija zaposlenih i sertifikata po organizacionim jedinicama
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.departmentStats.length === 0 ? (
            <div className="text-center py-8">
              <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nema podataka o odjeljenjima</p>
              <p className="text-sm text-muted-foreground">
                Dodajte odjeljenja u radne pozicije
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              {stats.departmentStats.map((dept, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">
                      {dept.department || "Bez odjeljenja"}
                    </h4>
                    <Badge variant="secondary">
                      {dept.employee_count} zap.
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Zaposleni:</span>
                      <span className="font-medium">{dept.employee_count}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Sertifikati:</span>
                      <span className="font-medium">{dept.certificate_count}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Prosek:</span>
                      <span className="font-medium">
                        {dept.employee_count > 0 
                          ? (dept.certificate_count / dept.employee_count).toFixed(1)
                          : "0"
                        }
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Brzi linkovi za akcije */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/dashboard/employees/new">
          <Card className="hover:bg-blue-50 cursor-pointer transition-colors">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-full">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">Dodaj zaposlenog</p>
                  <p className="text-sm text-muted-foreground">Novi zaposleni u sistem</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/certificates/new">
          <Card className="hover:bg-green-50 cursor-pointer transition-colors">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-full">
                  <FileText className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Izdaj sertifikat</p>
                  <p className="text-sm text-muted-foreground">Nova obuka završena</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/positions/new">
          <Card className="hover:bg-purple-50 cursor-pointer transition-colors">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-2 rounded-full">
                  <Briefcase className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium">Dodaj poziciju</p>
                  <p className="text-sm text-muted-foreground">Nova radna pozicija</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/training-types/new">
          <Card className="hover:bg-orange-50 cursor-pointer transition-colors">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 p-2 rounded-full">
                  <GraduationCap className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium">Dodaj obuku</p>
                  <p className="text-sm text-muted-foreground">Novi tip obuke</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Footer info */}
      <div className="text-center text-sm text-muted-foreground pt-4 border-t">
        <p>
          Sistem za upravljanje obukama • Poslednje ažuriranje: {new Date().toLocaleDateString('sr-RS')}
        </p>
        <p className="mt-1">
          Ukupno podataka: {stats.totalEmployees} zaposlenih • {stats.totalCertificates} sertifikata • {stats.totalPositions} pozicija
        </p>
      </div>
    </div>
  )
}