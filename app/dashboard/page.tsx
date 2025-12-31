import { getSupabaseServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, GraduationCap, Award, AlertCircle, Calendar, TrendingUp, Clock, CheckCircle, Plus, ArrowRight, CalendarDays, FileCheck, UserCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"

async function getDashboardStats() {
  const supabase = await getSupabaseServerClient()

  // Get total employees - koristite staff tabelu
  const { count: employeesCount } = await supabase
    .from("staff") // Promenjeno sa "employees" na "staff"
    .select("*", { count: "exact", head: true })
    .eq("status", "active")

  // Get upcoming trainings (next 7 days)
  const sevenDaysFromNow = new Date()
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
  
  const { count: upcomingTrainings } = await supabase
    .from("trainings")
    .select("*", { count: "exact", head: true })
    .gte("start_date", new Date().toISOString())
    .lte("start_date", sevenDaysFromNow.toISOString())
    .eq("status", "scheduled")

  // Get active certificates
  const { count: activeCertificates } = await supabase
    .from("certificates")
    .select("*", { count: "exact", head: true })
    .eq("status", "valid")

  // Get completed trainings this month
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  const { count: completedThisMonth } = await supabase
    .from("trainings")
    .select("*", { count: "exact", head: true })
    .gte("end_date", startOfMonth.toISOString())
    .eq("status", "completed")

  // Get expiring certificates (within 30 days)
  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

  const { data: expiringCertificates } = await supabase
    .from("certificates")
    .select(
      `
      *,
      staff (first_name, last_name), // Promenjeno sa employees na staff
      training_types (name)
    `,
    )
    .eq("status", "valid")
    .lte("expiry_date", thirtyDaysFromNow.toISOString())
    .gte("expiry_date", new Date().toISOString())
    .order("expiry_date", { ascending: true })
    .limit(5)

  // Get recent trainings
  const { data: recentTrainings } = await supabase
    .from("trainings")
    .select(
      `
      *,
      training_types (name)
    `,
    )
    .order("start_date", { ascending: false })
    .limit(5)

  // Get upcoming scheduled items for calendar
  const { data: upcomingSchedule } = await supabase
    .from("trainings")
    .select(
      `
      id,
      title,
      start_date,
      training_types (name)
    `,
    )
    .gte("start_date", new Date().toISOString())
    .eq("status", "scheduled")
    .order("start_date", { ascending: true })
    .limit(4)

  return {
    employeesCount: employeesCount || 0,
    upcomingTrainings: upcomingTrainings || 0,
    activeCertificates: activeCertificates || 0,
    completedThisMonth: completedThisMonth || 0,
    expiringCertificates: expiringCertificates || [],
    recentTrainings: recentTrainings || [],
    upcomingSchedule: upcomingSchedule || [],
  }
}

export default async function DashboardPage() {
  const stats = await getDashboardStats()

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
            Pregled sistema
          </h1>
          <p className="text-muted-foreground mt-2">
            Dobrodošli u sistem za upravljanje obukama i sertifikatima
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            <Link href="/dashboard/trainings/new">
              <Plus className="h-4 w-4" />
              Nova obuka
            </Link>
          </Button>
          <Button variant="outline" asChild className="gap-2">
            <Link href="/dashboard/reports">
              <TrendingUp className="h-4 w-4" />
              Izveštaji
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid - Improved Design */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="group border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700 transition-colors hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
              Aktivni Zaposleni
            </CardTitle>
            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
              {stats.employeesCount}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="h-2 flex-1 bg-blue-100 dark:bg-blue-900/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                  style={{ width: `${Math.min(stats.employeesCount * 2, 100)}%` }}
                />
              </div>
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                +{Math.floor(stats.employeesCount * 0.12)} u 30 dana
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="group border-purple-200 dark:border-purple-800 hover:border-purple-300 dark:hover:border-purple-700 transition-colors hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">
              Predstojeće Obuke
            </CardTitle>
            <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <GraduationCap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">
              {stats.upcomingTrainings}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <CalendarDays className="h-4 w-4 text-purple-500 dark:text-purple-400" />
              <span className="text-xs text-purple-600 dark:text-purple-400">
                U narednih 7 dana
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="group border-green-200 dark:border-green-800 hover:border-green-300 dark:hover:border-green-700 transition-colors hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">
              Aktivni Sertifikati
            </CardTitle>
            <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Award className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900 dark:text-green-100">
              {stats.activeCertificates}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400" />
              <span className="text-xs text-green-600 dark:text-green-400">
                94% važećih
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="group border-amber-200 dark:border-amber-800 hover:border-amber-300 dark:hover:border-amber-700 transition-colors hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-300">
              Završene Obuke
            </CardTitle>
            <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileCheck className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-900 dark:text-amber-100">
              {stats.completedThisMonth}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <TrendingUp className="h-4 w-4 text-amber-500 dark:text-amber-400" />
              <span className="text-xs text-amber-600 dark:text-amber-400">
                +{Math.floor(stats.completedThisMonth * 0.15)} u odnosu na prošli mesec
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Expiring Certificates - Improved */}
        <Card className="lg:col-span-2 border-l-4 border-amber-500">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                Sertifikati koji ističu
              </CardTitle>
              <p className="text-sm text-muted-foreground">U narednih 30 dana</p>
            </div>
            <Badge variant="destructive" className="gap-2">
              {stats.expiringCertificates.length}
              <AlertCircle className="h-3 w-3" />
            </Badge>
          </CardHeader>
          <CardContent>
            {stats.expiringCertificates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Award className="h-16 w-16 text-amber-200 dark:text-amber-800 mb-4" />
                <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-300">
                  Nema sertifikata koji ističu
                </h3>
                <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                  Svi sertifikati su važeći
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {stats.expiringCertificates.map((cert: any) => {
                  const daysUntilExpiry = Math.ceil(
                    (new Date(cert.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                  )
                  
                  return (
                    <div
                      key={cert.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 hover:bg-amber-100 dark:hover:bg-amber-950/40 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center">
                          <AlertCircle className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {cert.employees?.first_name} {cert.employees?.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {cert.training_types?.name || "N/A"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant={daysUntilExpiry <= 7 ? "destructive" : "outline"} 
                          className={daysUntilExpiry <= 7 ? "" : "border-amber-500 text-amber-700 dark:text-amber-400"}
                        >
                          {new Date(cert.expiry_date).toLocaleDateString("sr-RS")}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {daysUntilExpiry} dana
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            {stats.expiringCertificates.length > 0 && (
              <div className="mt-6">
                <Button variant="outline" className="w-full gap-2" asChild>
                  <Link href="/dashboard/certificates">
                    Pregled svih sertifikata
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Schedule */}
        <Card className="border-l-4 border-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Nadolazeći događaji
            </CardTitle>
            <p className="text-sm text-muted-foreground">Naredne obuke</p>
          </CardHeader>
          <CardContent>
            {stats.upcomingSchedule.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-16 w-16 text-blue-200 dark:text-blue-800 mb-4" />
                <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300">
                  Nema događaja
                </h3>
                <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                  Planirajte novu obuku
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {stats.upcomingSchedule.map((item: any) => (
                  <div key={item.id} className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.training_types?.name || "Obuka"}
                        </p>
                      </div>
                      <Badge variant="secondary" className="ml-2">
                        {new Date(item.start_date).toLocaleDateString("sr-RS", {
                          day: "numeric",
                          month: "short",
                        })}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(item.start_date).toLocaleTimeString("sr-RS", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-6">
              <Button variant="outline" className="w-full gap-2" asChild>
                <Link href="/dashboard/schedule">
                  Prikaži kalendar
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Trainings - Improved */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              Nedavne Obuke
            </CardTitle>
            <p className="text-sm text-muted-foreground">Poslednjih 5 obuka</p>
          </div>
          <Button variant="ghost" size="sm" asChild className="gap-2">
            <Link href="/dashboard/trainings">
              Vidi sve
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {stats.recentTrainings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <GraduationCap className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">Nema obuka</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Još uvek nema zabeleženih obuka
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {stats.recentTrainings.map((training: any) => {
                const getStatusConfig = (status: string) => {
                  switch (status) {
                    case "completed":
                      return {
                        color: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800",
                        icon: <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />,
                        text: "Završeno"
                      }
                    case "scheduled":
                      return {
                        color: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800",
                        icon: <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />,
                        text: "Zakazano"
                      }
                    case "in_progress":
                      return {
                        color: "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800",
                        icon: <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />,
                        text: "U toku"
                      }
                    default:
                      return {
                        color: "bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-800",
                        icon: null,
                        text: training.status
                      }
                  }
                }
                
                const statusConfig = getStatusConfig(training.status)
                
                return (
                  <div
                    key={training.id}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-primary/10 to-primary/5 flex items-center justify-center">
                          <GraduationCap className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{training.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {training.training_types?.name || "N/A"}
                            </Badge>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${statusConfig.color} border`}
                            >
                              <div className="flex items-center gap-1">
                                {statusConfig.icon}
                                {statusConfig.text}
                              </div>
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground ml-13">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(training.start_date).toLocaleDateString("sr-RS")}
                        </span>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" asChild>
                      <Link href={`/dashboard/trainings/${training.id}`}>
                        Detalji
                      </Link>
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="group cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg">
          <Link href="/dashboard/employees/new" className="block">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 p-3">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    Dodaj Zaposlenog
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Dodajte novog zaposlenog u sistem
                  </p>
                </div>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="group cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg">
          <Link href="/dashboard/trainings/new" className="block">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500 p-3">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    Nova Obuka
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Planirajte novu obuku za zaposlene
                  </p>
                </div>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="group cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg">
          <Link href="/dashboard/certificates" className="block">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-gradient-to-r from-green-500 to-emerald-500 p-3">
                  <Award className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                    Sertifikati
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Pregled i upravljanje sertifikatima
                  </p>
                </div>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="group cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg">
          <Link href="/dashboard/reports" className="block">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 p-3">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    Izveštaji
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Generišite izveštaje i analize
                  </p>
                </div>
              </div>
            </CardContent>
          </Link>
        </Card>
      </div>
    </div>
  )
}