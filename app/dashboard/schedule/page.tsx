import { getSupabaseServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "lucide-react"

async function getScheduledTrainings() {
  const supabase = await getSupabaseServerClient()

  const today = new Date()
  const nextMonth = new Date()
  nextMonth.setMonth(nextMonth.getMonth() + 1)

  const { data: trainings } = await supabase
    .from("trainings")
    .select(
      `
      *,
      training_types (name, category)
    `,
    )
    .gte("start_date", today.toISOString())
    .lte("start_date", nextMonth.toISOString())
    .in("status", ["scheduled", "in_progress"])
    .order("start_date", { ascending: true })

  return trainings || []
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

export default async function SchedulePage() {
  const trainings = await getScheduledTrainings()
  const groupedTrainings = groupTrainingsByWeek(trainings)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Raspored Obuka</h1>
        <p className="text-muted-foreground">Planirane obuke za naredni mesec</p>
      </div>

      {groupedTrainings.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nema planiranih obuka u narednom mesecu</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {groupedTrainings.map(([weekKey, weekTrainings]) => (
            <Card key={weekKey}>
              <CardHeader>
                <CardTitle className="text-lg">{weekTrainings[0].weekLabel}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {weekTrainings.map((training: any) => (
                    <div
                      key={training.id}
                      className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex flex-col items-center justify-center bg-primary/10 rounded-lg p-3 min-w-[60px]">
                        <span className="text-2xl font-bold text-primary">{training.date.getDate()}</span>
                        <span className="text-xs text-muted-foreground uppercase">
                          {training.date.toLocaleDateString("sr-RS", { weekday: "short" })}
                        </span>
                      </div>

                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold">{training.title}</h3>
                            <p className="text-sm text-muted-foreground">{training.training_types?.name}</p>
                          </div>
                          <Badge variant={training.status === "scheduled" ? "default" : "secondary"}>
                            {training.status === "scheduled" ? "Zakazano" : "U toku"}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <div>
                            <span className="font-medium">Vreme:</span>{" "}
                            {new Date(training.start_date).toLocaleTimeString("sr-RS", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            -{" "}
                            {new Date(training.end_date).toLocaleTimeString("sr-RS", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>

                          {training.location && (
                            <div>
                              <span className="font-medium">Lokacija:</span> {training.location}
                            </div>
                          )}

                          {training.instructor && (
                            <div>
                              <span className="font-medium">Instruktor:</span> {training.instructor}
                            </div>
                          )}

                          {training.capacity && (
                            <div>
                              <span className="font-medium">Kapacitet:</span> {training.capacity}
                            </div>
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
    </div>
  )
}
