"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Users, 
  BookOpen, 
  Award, 
  AlertTriangle, 
  TrendingUp,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  UserCheck,
  BarChart3,
  RefreshCw
} from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  PieLabelRenderProps
} from "recharts"

// ============================================================================
// DEFINISANJE TIPOVA PODATAKA (Type Safety)
// ============================================================================

interface StatCard {
  title: string
  value: string | number
  icon: React.ReactNode
  color: string
}

interface DepartmentData {
  department: string
  employees: number
  activeEmployees: number
}

interface TrainingTypeData {
  name: string
  count: number
  hours: number
  [key: string]: string | number
}

interface MonthlyTrendData {
  month: string
  completed: number
  scheduled: number
}

interface ExpiryData {
  name: string
  expired: number
  expiringSoon: number
  valid: number
}

// Tipovi za podatke dobijene iz Supabase-a
interface StaffWithDepartment {
  status: string
  working_positions: { department: string | null } | null
}

interface TrainingRecordWithType {
  status: string
  training_hours_total: number | null
  training_types: { name: string | null } | null
}

interface CertificateWithMaster {
  expiry_date: string | null
  status: string
  training_certificates_master: { title: string | null } | null
}

// Tip za stanje statistike
interface StatisticsState {
  totalEmployees: number
  activeEmployees: number
  totalTrainings: number
  completedTrainings: number
  validCertificates: number
  expiringCertificates: number
  expiredCertificates: number
  totalInstructors: number
  totalHours: number
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

export default function StatisticsPage() {
  const [loading, setLoading] = useState<boolean>(true)
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [stats, setStats] = useState<StatisticsState>({
    totalEmployees: 0,
    activeEmployees: 0,
    totalTrainings: 0,
    completedTrainings: 0,
    validCertificates: 0,
    expiringCertificates: 0,
    expiredCertificates: 0,
    totalInstructors: 0,
    totalHours: 0
  })
  const [departmentData, setDepartmentData] = useState<DepartmentData[]>([])
  const [trainingTypeData, setTrainingTypeData] = useState<TrainingTypeData[]>([])
  const [monthlyTrend, setMonthlyTrend] = useState<MonthlyTrendData[]>([])
  const [expiryData, setExpiryData] = useState<ExpiryData[]>([])

  const supabase = getSupabaseBrowserClient()

  const fetchStatistics = async (): Promise<void> => {
    try {
      // 1. Zaposleni
      const { data: employeesData } = await supabase
        .from('staff')
        .select('status, working_positions(department)') as { data: StaffWithDepartment[] | null }
      
      const totalEmployees = employeesData?.length || 0
      const activeEmployees = employeesData?.filter(e => e.status === 'active').length || 0
      
      // 2. Gruisanje zaposlenih po odeljenjima
      const departmentMap: Record<string, { total: number; active: number }> = {}
      employeesData?.forEach(emp => {
        const dept = emp.working_positions?.department || 'Nedefinisano'
        if (!departmentMap[dept]) {
          departmentMap[dept] = { total: 0, active: 0 }
        }
        departmentMap[dept].total++
        if (emp.status === 'active') departmentMap[dept].active++
      })
      
      const departments: DepartmentData[] = Object.entries(departmentMap).map(([dept, data]) => ({
        department: dept,
        employees: data.total,
        activeEmployees: data.active
      }))
      
      // 3. Obuke
      const { data: trainingData } = await supabase
        .from('training_records')
        .select('status, training_hours_total, training_types(name)') as { data: TrainingRecordWithType[] | null }
      
      const totalTrainings = trainingData?.length || 0
      const completedTrainings = trainingData?.filter(t => t.status === 'completed').length || 0
      const totalHours = trainingData?.reduce((sum, t) => sum + (t.training_hours_total || 0), 0) || 0
      
      // 4. Gruisanje po tipovima obuka
      const trainingTypeMap: Record<string, { count: number; hours: number }> = {}
      trainingData?.forEach(training => {
        const typeName = training.training_types?.name || 'Nedefinisano'
        if (!trainingTypeMap[typeName]) {
          trainingTypeMap[typeName] = { count: 0, hours: 0 }
        }
        trainingTypeMap[typeName].count++
        trainingTypeMap[typeName].hours += training.training_hours_total || 0
      })
      
      const trainingTypes: TrainingTypeData[] = Object.entries(trainingTypeMap)
        .map(([name, data]) => ({ name, count: data.count, hours: data.hours }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10) // Top 10
      
      // 5. Mesečni trend (poslednjih 6 meseci)
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
      
      const { data: monthlyData } = await supabase
        .from('training_records')
        .select('training_date, status')
        .gte('training_date', sixMonthsAgo.toISOString())
      
      const monthMap: Record<string, { completed: number; scheduled: number }> = {}
      monthlyData?.forEach(record => {
        const date = new Date(record.training_date)
        const monthKey = date.toLocaleDateString('sr-RS', { year: 'numeric', month: 'short' })
        
        if (!monthMap[monthKey]) {
          monthMap[monthKey] = { completed: 0, scheduled: 0 }
        }
        
        if (record.status === 'completed') {
          monthMap[monthKey].completed++
        } else {
          monthMap[monthKey].scheduled++
        }
      })
      
      const monthlyTrendData: MonthlyTrendData[] = Object.entries(monthMap)
        .map(([month, data]) => ({ month, ...data }))
        .sort((a, b) => {
          const dateA = new Date(a.month)
          const dateB = new Date(b.month)
          return dateA.getTime() - dateB.getTime()
        })
      
      // 6. Sertifikati
      const today = new Date()
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(today.getDate() + 30)
      
      const { data: certificateData } = await supabase
        .from('training_certificate_records')
        .select('expiry_date, status, training_certificates_master(title)') as { data: CertificateWithMaster[] | null }
      
      const validCertificates = certificateData?.filter(c => 
        c.status === 'valid' && (!c.expiry_date || new Date(c.expiry_date) > today)
      ).length || 0
      
      const expiringCertificates = certificateData?.filter(c => 
        c.status === 'valid' && 
        c.expiry_date && 
        new Date(c.expiry_date) > today && 
        new Date(c.expiry_date) <= thirtyDaysFromNow
      ).length || 0
      
      const expiredCertificates = certificateData?.filter(c => 
        c.status === 'valid' && 
        c.expiry_date && 
        new Date(c.expiry_date) <= today
      ).length || 0
      
      // 7. Gruisanje sertifikata po tipovima
      const certificateTypeMap: Record<string, { expired: number; expiringSoon: number; valid: number }> = {}
      certificateData?.forEach(cert => {
        const certName = cert.training_certificates_master?.title || 'Nedefinisano'
        
        if (!certificateTypeMap[certName]) {
          certificateTypeMap[certName] = { expired: 0, expiringSoon: 0, valid: 0 }
        }
        
        if (cert.expiry_date && new Date(cert.expiry_date) <= today) {
          certificateTypeMap[certName].expired++
        } else if (cert.expiry_date && new Date(cert.expiry_date) <= thirtyDaysFromNow) {
          certificateTypeMap[certName].expiringSoon++
        } else {
          certificateTypeMap[certName].valid++
        }
      })
      
      const expiryDataResult: ExpiryData[] = Object.entries(certificateTypeMap)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => (b.expired + b.expiringSoon) - (a.expired + a.expiringSoon))
        .slice(0, 10) // Top 10
      
      // 8. Instruktori
      const { data: instructorsData } = await supabase
        .from('instructors')
        .select('id', { count: 'exact' })
      
      const totalInstructors = instructorsData?.length || 0
      
      // Postavljanje svih statistika
      setStats({
        totalEmployees,
        activeEmployees,
        totalTrainings,
        completedTrainings,
        validCertificates,
        expiringCertificates,
        expiredCertificates,
        totalInstructors,
        totalHours
      })
      
      setDepartmentData(departments)
      setTrainingTypeData(trainingTypes)
      setMonthlyTrend(monthlyTrendData)
      setExpiryData(expiryDataResult)
      
    } catch (error) {
      console.error('Greška pri učitavanju statistike:', error)
    }
  }

  const loadData = async (): Promise<void> => {
    setLoading(true)
    await fetchStatistics()
    setLoading(false)
  }

  const refreshData = async (): Promise<void> => {
    setRefreshing(true)
    await fetchStatistics()
    setRefreshing(false)
  }

  useEffect(() => {
    void loadData()
  }, [])

  const statCards: StatCard[] = [
    {
      title: "Ukupno zaposlenih",
      value: stats.totalEmployees,
      icon: <Users className="h-5 w-5" />,
      color: "text-blue-600"
    },
    {
      title: "Aktivni zaposleni",
      value: stats.activeEmployees,
      icon: <UserCheck className="h-5 w-5" />,
      color: "text-green-600"
    },
    {
      title: "Ukupno obuka",
      value: stats.totalTrainings,
      icon: <BookOpen className="h-5 w-5" />,
      color: "text-purple-600"
    },
    {
      title: "Završene obuke",
      value: stats.completedTrainings,
      icon: <CheckCircle className="h-5 w-5" />,
      color: "text-emerald-600"
    },
    {
      title: "Važeći sertifikati",
      value: stats.validCertificates,
      icon: <Award className="h-5 w-5" />,
      color: "text-indigo-600"
    },
    {
      title: "Sertifikati koji ističu",
      value: stats.expiringCertificates,
      icon: <AlertTriangle className="h-5 w-5" />,
      color: "text-amber-600"
    },
    {
      title: "Istekli sertifikati",
      value: stats.expiredCertificates,
      icon: <XCircle className="h-5 w-5" />,
      color: "text-red-600"
    },
    {
      title: "Instruktori",
      value: stats.totalInstructors,
      icon: <UserCheck className="h-5 w-5" />,
      color: "text-cyan-600"
    }
  ]

  // Custom label funkcija za PieChart sa eksplicitnim tipovima
  const renderCustomizedLabel = (props: PieLabelRenderProps): string => {
    const { name, percent } = props
    if (typeof name === 'string' && typeof percent === 'number') {
      return `${name}: ${(percent * 100).toFixed(0)}%`
    }
    return ''
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>
        
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Statistika</h1>
          <p className="text-muted-foreground">Pregled ključnih metrika sistema za upravljanje obukama</p>
        </div>
        <Button 
          variant="outline" 
          className="gap-2"
          onClick={refreshData}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Osviježavanje...' : 'Osviježi'}
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {statCards.map((card, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <div className={card.color}>{card.icon}</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Pregled</TabsTrigger>
          <TabsTrigger value="trainings">Obuke</TabsTrigger>
          <TabsTrigger value="certificates">Sertifikati</TabsTrigger>
          <TabsTrigger value="departments">Odjeljenja/Sluzbe</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Mjesečni trend obuka
                </CardTitle>
              </CardHeader>
              <CardContent>
                {monthlyTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="completed" 
                        stroke="#8884d8" 
                        name="Završene" 
                        strokeWidth={2}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="scheduled" 
                        stroke="#82ca9d" 
                        name="Zakazane" 
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    Nema podataka za prikaz
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Status zaposlenih po odeljenjima
                </CardTitle>
              </CardHeader>
              <CardContent>
                {departmentData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={departmentData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="department" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="activeEmployees" fill="#8884d8" name="Aktivni" />
                      <Bar dataKey="employees" fill="#82ca9d" name="Ukupno" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    Nema podataka za prikaz
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="trainings" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Najčešći tipovi obuka
                </CardTitle>
              </CardHeader>
              <CardContent>
                {trainingTypeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={trainingTypeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {trainingTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    Nema podataka za prikaz
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Ukupno sati po tipovima obuka
                </CardTitle>
              </CardHeader>
              <CardContent>
                {trainingTypeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={trainingTypeData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="hours" fill="#8884d8" name="Sati" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    Nema podataka za prikaz
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="certificates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Status sertifikata po tipovima
              </CardTitle>
            </CardHeader>
            <CardContent>
              {expiryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={expiryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="valid" fill="#8884d8" name="Važeći" />
                    <Bar dataKey="expiringSoon" fill="#FFBB28" name="Istiće uskoro" />
                    <Bar dataKey="expired" fill="#FF8042" name="Istekli" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  Nema podataka za prikaz
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="departments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Detalji po odeljenjima
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Odeljenje</th>
                      <th className="text-center p-2">Ukupno zaposlenih</th>
                      <th className="text-center p-2">Aktivni zaposleni</th>
                      <th className="text-center p-2">Procenat aktivnih</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departmentData.map((dept, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2 font-medium">{dept.department}</td>
                        <td className="text-center p-2">{dept.employees}</td>
                        <td className="text-center p-2">{dept.activeEmployees}</td>
                        <td className="text-center p-2">
                          <Badge 
                            variant={dept.activeEmployees / dept.employees > 0.8 ? "default" : "secondary"}
                          >
                            {Math.round((dept.activeEmployees / dept.employees) * 100)}%
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}


// ili:
// "use client"

// import { useState, useEffect } from "react"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Badge } from "@/components/ui/badge"
// import { Button } from "@/components/ui/button"
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// import { 
//   Users, 
//   Award, 
//   Calendar, 
//   TrendingUp, 
//   AlertTriangle,
//   UserCheck,
//   Clock,
//   FileText,
//   Building,
//   RefreshCw,
//   BarChart3,
//   Target,
//   ShieldCheck
// } from "lucide-react"
// import { getSupabaseBrowserClient } from "@/lib/supabase/client"
// import { Skeleton } from "@/components/ui/skeleton"
// import Link from "next/link"

// // Tipovi za statistiku
// type DashboardStats = {
//   totalEmployees: number
//   activeEmployees: number
//   totalTrainings: number
//   expiringTrainings: number
//   expiredTrainings: number
//   completedTrainings: number
//   totalInstructors: number
//   departments: Record<string, number>
//   trainingCompliance: number
//   recentActivities: Array<{
//     employeeName: ReactNode
//     id: string
//     type: string
//     title: string
//     date: string
//     status: string
//   }>
// }

// export default function StatisticsPage() {
//   const [stats, setStats] = useState<DashboardStats | null>(null)
//   const [loading, setLoading] = useState(true)
//   const [activeTab, setActiveTab] = useState("overview")
//   const [timeRange, setTimeRange] = useState<"week" | "month" | "quarter">("month")

//   const fetchDashboardStats = async () => {
//     try {
//       const supabase = getSupabaseBrowserClient()
      
//       // 1. Ukupan broj zaposlenih
//       const { count: totalEmployees, error: employeesError } = await supabase
//         .from("staff")
//         .select("*", { count: "exact", head: true })

//       // 2. Aktivni zaposleni
//       const { count: activeEmployees, error: activeError } = await supabase
//         .from("staff")
//         .select("*", { count: "exact", head: true })
//         .eq("status", "active")

//       // 3. Ukupan broj treninga
//       const { count: totalTrainings, error: trainingsError } = await supabase
//         .from("training_records")
//         .select("*", { count: "exact", head: true })

//       // 4. Treningi koji ističu uskoro (narednih 30 dana)
//       const { count: expiringTrainings, error: expiringError } = await supabase
//         .from("training_records")
//         .select("*", { count: "exact", head: true })
//         .lt("expiry_date", new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString())
//         .gt("expiry_date", new Date().toISOString())

//       // 5. Istekli treningi
//       const { count: expiredTrainings, error: expiredError } = await supabase
//         .from("training_records")
//         .select("*", { count: "exact", head: true })
//         .lt("expiry_date", new Date().toISOString())

//       // 6. Završeni treningi
//       const { count: completedTrainings, error: completedError } = await supabase
//         .from("training_records")
//         .select("*", { count: "exact", head: true })
//         .eq("status", "completed")

//       // 7. Ukupan broj instruktora
//       const { count: totalInstructors, error: instructorsError } = await supabase
//         .from("instructors")
//         .select("*", { count: "exact", head: true })

//       // 8. Statistika po odjeljenjima
//       const { data: departmentsData } = await supabase
//         .from("staff")
//         .select("working_positions!inner (department)")
//         .eq("status", "active")

//       const departments: Record<string, number> = {}
//       departmentsData?.forEach(item => {
//         const dept = (item as any).working_positions?.department || "N/A"
//         departments[dept] = (departments[dept] || 0) + 1
//       })

//       // 9. Stopa compliance (procenat zaposlenih sa svim obaveznim obukama)
//       // Ovo je pojednostavljena verzija - u praksi bi koristili kompleksniji upit
//       const trainingCompliance = totalEmployees ? 
//         Math.round((completedTrainings || 0) / (totalEmployees * 3) * 100) : 0

//       // 10. Nedavne aktivnosti
//       const { data: recentActivitiesData } = await supabase
//         .from("training_records")
//         .select(`
//           id,
//           training_title,
//           training_date,
//           status,
//           staff:staff_id (first_name, last_name)
//         `)
//         .order("training_date", { ascending: false })
//         .limit(5)

//       const recentActivities = recentActivitiesData?.map(activity => ({
//         id: activity.id,
//         type: "trening",
//         title: activity.training_title,
//         date: activity.training_date,
//         status: activity.status,
//         employeeName: `${(activity as any).staff?.first_name || ""} ${(activity as any).staff?.last_name || ""}`
//       })) || []

//       setStats({
//         totalEmployees: totalEmployees || 0,
//         activeEmployees: activeEmployees || 0,
//         totalTrainings: totalTrainings || 0,
//         expiringTrainings: expiringTrainings || 0,
//         expiredTrainings: expiredTrainings || 0,
//         completedTrainings: completedTrainings || 0,
//         totalInstructors: totalInstructors || 0,
//         departments,
//         trainingCompliance: Math.min(trainingCompliance, 100),
//         recentActivities
//       })
//     } catch (error) {
//       console.error("Greška pri učitavanju statistike:", error)
//     } finally {
//       setLoading(false)
//     }
//   }

//   useEffect(() => {
//     fetchDashboardStats()
//   }, [])

//   const refreshStats = async () => {
//     setLoading(true)
//     await fetchDashboardStats()
//   }

//   if (loading) {
//     return (
//       <div className="space-y-6">
//         {/* Header */}
//         <div className="flex items-center justify-between">
//           <div>
//             <Skeleton className="h-8 w-48 mb-2" />
//             <Skeleton className="h-4 w-64" />
//           </div>
//           <Skeleton className="h-10 w-32" />
//         </div>

//         {/* Glavni KPIs */}
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//           {[1, 2, 3, 4].map(i => (
//             <Card key={i}>
//               <CardHeader className="pb-2">
//                 <Skeleton className="h-4 w-24" />
//               </CardHeader>
//               <CardContent>
//                 <Skeleton className="h-8 w-16" />
//               </CardContent>
//             </Card>
//           ))}
//         </div>

//         {/* Sekundarni KPIs */}
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//           {[1, 2, 3].map(i => (
//             <Card key={i}>
//               <CardHeader className="pb-2">
//                 <Skeleton className="h-4 w-32" />
//               </CardHeader>
//               <CardContent>
//                 <Skeleton className="h-12 w-full" />
//               </CardContent>
//             </Card>
//           ))}
//         </div>
//       </div>
//     )
//   }

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
//         <div>
//           <h1 className="text-3xl font-bold tracking-tight">Statistika</h1>
//           <p className="text-muted-foreground mt-2">
//             Pregled ključnih pokazatelja performansi sistema za upravljanje obukama
//           </p>
//         </div>
//         <div className="flex gap-2">
//           <Button
//             variant="outline"
//             size="sm"
//             onClick={refreshStats}
//             className="gap-2"
//           >
//             <RefreshCw className="h-4 w-4" />
//             Osveži
//           </Button>
//         </div>
//       </div>

//       {/* Glavni KPIs - najvažnije metrike */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//         {/* Ukupno zaposlenih */}
//         <Card className="border-blue-200 dark:border-blue-800">
//           <CardContent className="p-6">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
//                   Ukupno zaposlenih
//                 </p>
//                 <p className="text-3xl font-bold text-blue-900 dark:text-blue-100 mt-2">
//                   {stats?.totalEmployees}
//                 </p>
//                 <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
//                   {stats?.activeEmployees} aktivnih
//                 </p>
//               </div>
//               <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-3">
//                 <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
//               </div>
//             </div>
//           </CardContent>
//         </Card>

//         {/* Treningi ovog meseca */}
//         <Card className="border-green-200 dark:border-green-800">
//           <CardContent className="p-6">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm font-medium text-green-700 dark:text-green-300">
//                   Završeni treningi
//                 </p>
//                 <p className="text-3xl font-bold text-green-900 dark:text-green-100 mt-2">
//                   {stats?.completedTrainings}
//                 </p>
//                 <p className="text-xs text-green-600 dark:text-green-400 mt-1">
//                   od {stats?.totalTrainings} ukupno
//                 </p>
//               </div>
//               <div className="rounded-full bg-green-100 dark:bg-green-900 p-3">
//                 <Award className="h-6 w-6 text-green-600 dark:text-green-400" />
//               </div>
//             </div>
//           </CardContent>
//         </Card>

//         {/* Ističu uskoro */}
//         <Card className="border-amber-200 dark:border-amber-800">
//           <CardContent className="p-6">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
//                   Ističe uskoro
//                 </p>
//                 <p className="text-3xl font-bold text-amber-900 dark:text-amber-100 mt-2">
//                   {stats?.expiringTrainings}
//                 </p>
//                 <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
//                   {stats?.expiredTrainings} isteklo
//                 </p>
//               </div>
//               <div className="rounded-full bg-amber-100 dark:bg-amber-900 p-3">
//                 <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
//               </div>
//             </div>
//           </CardContent>
//         </Card>

//         {/* Training Compliance */}
//         <Card className="border-purple-200 dark:border-purple-800">
//           <CardContent className="p-6">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
//                   Training Compliance
//                 </p>
//                 <p className="text-3xl font-bold text-purple-900 dark:text-purple-100 mt-2">
//                   {stats?.trainingCompliance}%
//                 </p>
//                 <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
//                   zaposlenih u skladu
//                 </p>
//               </div>
//               <div className="rounded-full bg-purple-100 dark:bg-purple-900 p-3">
//                 <ShieldCheck className="h-6 w-6 text-purple-600 dark:text-purple-400" />
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Sekundarni KPIs i detaljniji pregled */}
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//         {/* Aktivni instruktori */}
//         <Card>
//           <CardHeader className="pb-2">
//             <CardTitle className="text-sm font-medium flex items-center gap-2">
//               <UserCheck className="h-4 w-4" />
//               Instruktori
//             </CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-2xl font-bold">{stats?.totalInstructors}</p>
//                 <p className="text-sm text-muted-foreground">ukupno instruktora</p>
//               </div>
//               <Link href="/dashboard/instructors">
//                 <Button variant="ghost" size="sm">
//                   Pregledaj
//                 </Button>
//               </Link>
//             </div>
//           </CardContent>
//         </Card>

//         {/* Distribucija po odjeljenjima */}
//         <Card>
//           <CardHeader className="pb-2">
//             <CardTitle className="text-sm font-medium flex items-center gap-2">
//               <Building className="h-4 w-4" />
//               Po odjeljenjima
//             </CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="space-y-2">
//               {Object.entries(stats?.departments || {}).slice(0, 3).map(([dept, count]) => (
//                 <div key={dept} className="flex items-center justify-between">
//                   <span className="text-sm">{dept}</span>
//                   <Badge variant="outline">{count}</Badge>
//                 </div>
//               ))}
//               {Object.keys(stats?.departments || {}).length > 3 && (
//                 <p className="text-xs text-muted-foreground text-center">
//                   +{Object.keys(stats?.departments || {}).length - 3} više
//                 </p>
//               )}
//             </div>
//           </CardContent>
//         </Card>

//         {/* Trenutni statusi */}
//         <Card>
//           <CardHeader className="pb-2">
//             <CardTitle className="text-sm font-medium flex items-center gap-2">
//               <Target className="h-4 w-4" />
//               Status treninga
//             </CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="space-y-2">
//               <div className="flex items-center justify-between">
//                 <span className="text-sm">Završeni</span>
//                 <Badge variant="default">{stats?.completedTrainings}</Badge>
//               </div>
//               <div className="flex items-center justify-between">
//                 <span className="text-sm">U toku</span>
//                 <Badge variant="outline">
//                   {Math.max(0, (stats?.totalTrainings || 0) - (stats?.completedTrainings || 0))}
//                 </Badge>
//               </div>
//               <div className="flex items-center justify-between">
//                 <span className="text-sm">Ističe uskoro</span>
//                 <Badge variant="secondary">{stats?.expiringTrainings}</Badge>
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Nedavne aktivnosti */}
//       <Card>
//         <CardHeader>
//           <CardTitle className="flex items-center gap-2">
//             <Clock className="h-5 w-5" />
//             Nedavne aktivnosti
//           </CardTitle>
//         </CardHeader>
//         <CardContent>
//           {stats?.recentActivities && stats.recentActivities.length > 0 ? (
//             <div className="space-y-3">
//               {stats.recentActivities.map(activity => (
//                 <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
//                   <div>
//                     <div className="font-medium">{activity.title}</div>
//                     <div className="text-sm text-muted-foreground">
//                       {activity.employeeName} • {new Date(activity.date).toLocaleDateString("sr-RS")}
//                     </div>
//                   </div>
//                   <Badge variant={
//                     activity.status === "completed" ? "default" :
//                     activity.status === "in_progress" ? "secondary" :
//                     "outline"
//                   }>
//                     {activity.status === "completed" ? "Završeno" :
//                      activity.status === "in_progress" ? "U toku" :
//                      activity.status}
//                   </Badge>
//                 </div>
//               ))}
//             </div>
//           ) : (
//             <div className="text-center py-8">
//               <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
//               <p className="text-muted-foreground">Nema nedavnih aktivnosti</p>
//             </div>
//           )}
//           <div className="mt-4 text-center">
//             <Link href="/dashboard/training-records">
//               <Button variant="outline" size="sm">
//                 Pregledaj sve aktivnosti
//               </Button>
//             </Link>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Brzi linkovi za akcije */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//         <Link href="/dashboard/training-records/new">
//           <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
//             <CardContent className="p-6 flex items-center justify-center gap-3">
//               <FileText className="h-5 w-5" />
//               <span className="font-medium">Novi trening</span>
//             </CardContent>
//           </Card>
//         </Link>

//         <Link href="/dashboard/employees">
//           <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
//             <CardContent className="p-6 flex items-center justify-center gap-3">
//               <Users className="h-5 w-5" />
//               <span className="font-medium">Zaposleni</span>
//             </CardContent>
//           </Card>
//         </Link>

//         <Link href="/dashboard/training-types">
//           <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
//             <CardContent className="p-6 flex items-center justify-center gap-3">
//               <Award className="h-5 w-5" />
//               <span className="font-medium">Tipovi obuka</span>
//             </CardContent>
//           </Card>
//         </Link>

//         <Link href="/dashboard/alerts">
//           <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
//             <CardContent className="p-6 flex items-center justify-center gap-3">
//               <AlertTriangle className="h-5 w-5" />
//               <span className="font-medium">Uzbune</span>
//             </CardContent>
//           </Card>
//         </Link>
//       </div>
//     </div>
//   )
// }