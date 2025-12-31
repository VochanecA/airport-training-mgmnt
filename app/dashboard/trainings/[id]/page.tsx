import { getSupabaseServerClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Users, Calendar, MapPin, User } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

async function getTrainingDetails(id: string) {
  const supabase = await getSupabaseServerClient()

  const { data: training } = await supabase
    .from("trainings")
    .select(
      `
      *,
      training_types (name, category, duration_hours)
    `,
    )
    .eq("id", id)
    .single()

  if (!training) return null

  const { data: enrollments } = await supabase
    .from("training_enrollments")
    .select(
      `
      *,
      employees (first_name, last_name, position, department)
    `,
    )
    .eq("training_id", id)
    .order("enrollment_date", { ascending: false })

  return { training, enrollments: enrollments || [] }
}

function getStatusBadge(status: string) {
  const statusMap: Record<string, { label: string; variant: any }> = {
    scheduled: { label: "Zakazano", variant: "default" },
    in_progress: { label: "U toku", variant: "secondary" },
    completed: { label: "Završeno", variant: "outline" },
    cancelled: { label: "Otkazano", variant: "destructive" },
  }

  const config = statusMap[status] || { label: status, variant: "outline" }
  return <Badge variant={config.variant}>{config.label}</Badge>
}

export default async function TrainingDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await getTrainingDetails(id)

  if (!data) {
    notFound()
  }

  const { training, enrollments } = data

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/trainings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{training.title}</h1>
          <p className="text-muted-foreground">{training.training_types?.name}</p>
        </div>
        {getStatusBadge(training.status)}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informacije o Obuci</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Period</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(training.start_date).toLocaleDateString("sr-RS", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}{" "}
                  -{" "}
                  {new Date(training.end_date).toLocaleDateString("sr-RS", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>

            {training.instructor && (
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Instruktor</p>
                  <p className="text-sm text-muted-foreground">{training.instructor}</p>
                </div>
              </div>
            )}

            {training.location && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Lokacija</p>
                  <p className="text-sm text-muted-foreground">{training.location}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Kapacitet</p>
                <p className="text-sm text-muted-foreground">
                  {enrollments.length} / {training.capacity || "∞"} učesnika
                </p>
              </div>
            </div>

            {training.description && (
              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-2">Opis</p>
                <p className="text-sm text-muted-foreground">{training.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statistika</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Ukupno prijavljenih</p>
                <p className="text-2xl font-bold">{enrollments.length}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Završilo</p>
                <p className="text-2xl font-bold">
                  {enrollments.filter((e: any) => e.completion_status === "completed").length}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Prisustvovalo</p>
                <p className="text-2xl font-bold">
                  {enrollments.filter((e: any) => e.attendance_status === "attended").length}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Izostalo</p>
                <p className="text-2xl font-bold">
                  {enrollments.filter((e: any) => e.attendance_status === "missed").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Učesnici</CardTitle>
        </CardHeader>
        <CardContent>
          {enrollments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nema prijavljenih učesnika</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ime i Prezime</TableHead>
                    <TableHead>Pozicija</TableHead>
                    <TableHead>Odsek</TableHead>
                    <TableHead>Status Prisustva</TableHead>
                    <TableHead>Status Završetka</TableHead>
                    <TableHead>Ocena</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollments.map((enrollment: any) => (
                    <TableRow key={enrollment.id}>
                      <TableCell className="font-medium">
                        {enrollment.employees?.first_name} {enrollment.employees?.last_name}
                      </TableCell>
                      <TableCell>{enrollment.employees?.position || "N/A"}</TableCell>
                      <TableCell>{enrollment.employees?.department || "N/A"}</TableCell>
                      <TableCell>
                        {enrollment.attendance_status === "attended"
                          ? "Prisustvovao"
                          : enrollment.attendance_status === "missed"
                            ? "Izostao"
                            : enrollment.attendance_status === "enrolled"
                              ? "Prijavljen"
                              : enrollment.attendance_status || "N/A"}
                      </TableCell>
                      <TableCell>
                        {enrollment.completion_status === "completed"
                          ? "Završio"
                          : enrollment.completion_status === "in_progress"
                            ? "U toku"
                            : enrollment.completion_status === "failed"
                              ? "Nije položio"
                              : enrollment.completion_status || "N/A"}
                      </TableCell>
                      <TableCell>{enrollment.score || "N/A"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
