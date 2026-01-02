import { getSupabaseServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Users, Clock, MapPin, Plane, AlertCircle, RefreshCw, Settings, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Suspense } from "react"

async function getCombinedSchedule() {
  const supabase = await getSupabaseServerClient()

  const today = new Date()
  const nextMonth = new Date()
  nextMonth.setMonth(nextMonth.getMonth() + 3) // Povećano na 3 meseca

  // Dohvati kombinovani raspored
  const { data: schedule } = await supabase
    .from("combined_schedule_view")
    .select("*")
    .gte("start_date", today.toISOString())
    .lte("start_date", nextMonth.toISOString())
    .in("status", ["scheduled", "in_progress"])
    .order("start_date", { ascending: true })

  return schedule || []
}

async function getExpirySummary() {
  const supabase = await getSupabaseServerClient()

  const { data: summary } = await supabase
    .rpc("get_expiry_summary", { p_days_threshold: 90 })

  return summary || []
}

async function getScheduleSettings() {
  const supabase = await getSupabaseServerClient()

  const { data: settings } = await supabase
    .from("schedule_settings")
    .select("*")
    .single()

  return settings
}

function getWeekOfMonth(date: Date): number {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1)
  const firstDayOfWeek = firstDay.getDay()
  return Math.ceil((date.getDate() + firstDayOfWeek) / 7)
}

function groupTrainingsByWeek(trainings: any[]) {
  const grouped: Record<string, any[]> = {}

  trainings.forEach((training) => {
    const date = new Date(training.start_date)
    const weekKey = `${date.getFullYear()}-W${getWeekOfMonth(date)}-${date.getMonth()}`
    const weekLabel = `Nedelja ${getWeekOfMonth(date)} - ${date.toLocaleDateString("sr-RS", { month: "long", year: "numeric" })}`

    if (!grouped[weekKey]) {
      grouped[weekKey] = []
    }

    grouped[weekKey].push({ ...training, weekLabel, date })
  })

  return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b))
}

function formatDuration(startDate: Date, endDate: Date): string {
  const diffMs = endDate.getTime() - startDate.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

  if (diffHours > 0) {
    return `${diffHours}h ${diffMinutes > 0 ? diffMinutes + 'min' : ''}`
  }
  return `${diffMinutes}min`
}

function ScheduleContent() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    }>
      <SchedulePageContent />
    </Suspense>
  )
}

async function SchedulePageContent() {
  const [schedule, expirySummary, settings] = await Promise.all([
    getCombinedSchedule(),
    getExpirySummary(),
    getScheduleSettings()
  ])

  const groupedSchedule = groupTrainingsByWeek(schedule)

  return (
    <div className="space-y-6">
      {/* Header sa akcijama */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Raspored Obuka</h1>
          <p className="text-muted-foreground">
            Planirane obuke za naredna 3 mjeseca
            {settings && (
              <span className="ml-2 text-sm">
                (Kapacitet: {settings.default_capacity}, Lokacija: {settings.default_airport})
              </span>
            )}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/schedule/generate">
              <RefreshCw className="h-4 w-4 mr-2" />
              Generiši Automatski
            </Link>
          </Button>
          
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/schedule/settings">
              <Settings className="h-4 w-4 mr-2" />
              Podešavanja
            </Link>
          </Button>
          
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/schedule/expiries">
              <AlertCircle className="h-4 w-4 mr-2" />
              Pregled Isteka
            </Link>
          </Button>
        </div>
      </div>

      {/* Statistika isteka */}
      {expirySummary.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Predstojeći isteci validnosti (narednih 90 dana)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {expirySummary.slice(0, 4).map((summary: any) => (
                <div key={summary.training_type_id} className="space-y-2 p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium truncate">{summary.training_type_name}</h4>
                    <Badge variant="outline" className="ml-2">
                      {summary.category}
                    </Badge>
                  </div>
                  
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ističe:</span>
                      <span className="font-medium">{summary.expiring_count} zaposlenih</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Period:</span>
                      <span>
                        {new Date(summary.earliest_expiry).toLocaleDateString('sr-RS')} - 
                        {new Date(summary.latest_expiry).toLocaleDateString('sr-RS')}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Preporučene grupe:</span>
                      <span className="font-medium">{summary.recommended_sessions}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Trajanje:</span>
                      <span>{summary.required_hours || 0}h</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {expirySummary.length > 4 && (
              <div className="mt-4 text-center">
                <p className="text-sm text-muted-foreground">
                  + {expirySummary.length - 4} više tipova treninga sa predstojećim istekom
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Glavni raspored */}
      {groupedSchedule.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">Nema planiranih obuka u naredna 3 meseca</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild>
                <Link href="/dashboard/schedule/generate">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Generiši Automatski Raspored
                </Link>
              </Button>
              {/* <Button variant="outline" asChild>
                <Link href="/dashboard/training-records/new">
                  Dodaj Ručno Trening
                </Link>
              </Button> */}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {groupedSchedule.map(([weekKey, weekTrainings]) => (
            <Card key={weekKey}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{weekTrainings[0].weekLabel}</CardTitle>
                  <Badge variant="outline">
                    {weekTrainings.length} {weekTrainings.length === 1 ? 'trening' : 'treninga'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {weekTrainings.map((training: any) => (
                    <div
                      key={training.id}
                      className={`flex flex-col md:flex-row items-start gap-4 p-4 rounded-lg border hover:bg-accent/50 transition-colors ${
                        training.source_type === 'auto_generated' ? 'bg-blue-50/50 border-blue-200' : 'bg-card'
                      }`}
                    >
                      {/* Datum i tip */}
                      <div className={`flex flex-col items-center justify-center rounded-lg p-3 min-w-[70px] ${
                        training.source_type === 'auto_generated' ? 'bg-blue-100' : 'bg-primary/10'
                      }`}>
                        <span className="text-2xl font-bold text-primary">{training.date.getDate()}</span>
                        <span className="text-xs text-muted-foreground uppercase">
                          {training.date.toLocaleDateString("sr-RS", { weekday: "short" })}
                        </span>
                        <span className="text-xs mt-1 font-medium">
                          {training.date.toLocaleTimeString("sr-RS", {
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </span>
                      </div>

                      {/* Glavni sadržaj */}
                      <div className="flex-1 space-y-3">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{training.title}</h3>
                              {training.source_type === 'auto_generated' && (
                                <Badge variant="outline" className="text-xs bg-blue-100 border-blue-300">
                                  Auto-generisano
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-sm">
                              {training.training_type_name && (
                                <Badge variant="secondary" className="text-xs">
                                  {training.training_type_name}
                                </Badge>
                              )}
                              
                              {training.training_type_category && (
                                <Badge variant="outline" className="text-xs">
                                  {training.training_type_category}
                                </Badge>
                              )}
                              
                              {training.source_type === 'auto_generated' && training.expiry_period_start && (
                                <span className="text-xs text-muted-foreground">
                                  Istek: {new Date(training.expiry_period_start).toLocaleDateString('sr-RS')} - 
                                  {new Date(training.expiry_period_end).toLocaleDateString('sr-RS')}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Badge variant={
                              training.status === "scheduled" ? "default" :
                              training.status === "in_progress" ? "secondary" :
                              "outline"
                            }>
                              {training.status === "scheduled" ? "Zakazano" :
                               training.status === "in_progress" ? "U toku" :
                               "Otkazano"}
                            </Badge>
                          </div>
                        </div>

                        {/* Detalji */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                          {/* Lokacija */}
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                            <div>
                              <span className="font-medium">Lokacija:</span>
                              <p className="text-muted-foreground truncate">{training.location}</p>
                              {training.airport && (
                                <div className="flex items-center gap-1 mt-1">
                                  <Plane className="h-3 w-3" />
                                  <span className="text-xs">{training.airport}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Kapacitet i trajanje */}
                          <div className="flex items-start gap-2">
                            <Users className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                            <div>
                              <span className="font-medium">Kapacitet:</span>
                              <p className="text-muted-foreground">
                                {training.current_enrollment || 0} / {training.capacity}
                              </p>
                            </div>
                          </div>

                          {/* Vreme */}
                          <div className="flex items-start gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                            <div>
                              <span className="font-medium">Vreme:</span>
                              <p className="text-muted-foreground">
                                {new Date(training.start_date).toLocaleTimeString("sr-RS", {
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })} -{" "}
                                {new Date(training.end_date).toLocaleTimeString("sr-RS", {
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })}
                                <span className="ml-2 text-xs">
                                  ({formatDuration(new Date(training.start_date), new Date(training.end_date))})
                                </span>
                              </p>
                            </div>
                          </div>

                          {/* Instruktor / Dodatne informacije */}
                          <div className="flex items-start gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                            <div>
                              <span className="font-medium">
                                {training.instructor ? "Instruktor" : "Tip"}
                              </span>
                              <p className="text-muted-foreground">
                                {training.instructor || training.source_type === 'auto_generated' ? 'Automatski dodeljen' : 'Nije dodeljen'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Opis */}
                        {training.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {training.description}
                          </p>
                        )}

                        {/* Akcije */}
                        <div className="flex flex-wrap gap-2 pt-2">
                          {training.source_type === 'auto_generated' ? (
                            <>
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/dashboard/schedule/assignments/${training.id}`}>
                                  Pregled dodela
                                </Link>
                              </Button>
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/dashboard/schedule/training/${training.id}/edit`}>
                                  Uredi
                                </Link>
                              </Button>
                            </>
                          ) : (
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/dashboard/trainings/${training.id}`}>
                                Detalji
                              </Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Statističke informacije */}
      {schedule.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">
                  {schedule.length}
                </div>
                <div className="text-sm text-muted-foreground">Ukupno treninga</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {schedule.filter((t: any) => t.source_type === 'auto_generated').length}
                </div>
                <div className="text-sm text-muted-foreground">Automatski generisano</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {schedule.reduce((sum: number, t: any) => sum + (t.current_enrollment || 0), 0)}
                </div>
                <div className="text-sm text-muted-foreground">Ukupno dodeljenih polaznika</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default function SchedulePage() {
  return <ScheduleContent />
}