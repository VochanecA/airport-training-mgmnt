import { getSupabaseServerClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus } from "lucide-react"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

async function getTrainings() {
  const supabase = await getSupabaseServerClient()

  const { data: trainings } = await supabase
    .from("trainings")
    .select(
      `
      *,
      training_types (name, category)
    `,
    )
    .order("start_date", { ascending: false })

  return trainings || []
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

export default async function TrainingsPage() {
  const trainings = await getTrainings()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Predavanja i Obuke</h1>
          <p className="text-muted-foreground">Upravljajte obukama i njihovim rasporedom rasporedom</p>
        </div>
        <Link href="/dashboard/trainings/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Predavanje/Obuka
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sve Obuke</CardTitle>
        </CardHeader>
        <CardContent>
          {trainings.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">Nema kreiranih obuka</p>
              <Link href="/dashboard/trainings/new">
                <Button variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Kreiraj Prvu Obuku
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Naziv</TableHead>
                    <TableHead>Tip</TableHead>
                    <TableHead>Kategorija</TableHead>
                    <TableHead>Datum Početka</TableHead>
                    <TableHead>Datum Kraja</TableHead>
                    <TableHead>Kapacitet</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Akcije</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trainings.map((training: any) => (
                    <TableRow key={training.id}>
                      <TableCell className="font-medium">{training.title}</TableCell>
                      <TableCell>{training.training_types?.name || "N/A"}</TableCell>
                      <TableCell>{training.training_types?.category || "N/A"}</TableCell>
                      <TableCell>{new Date(training.start_date).toLocaleDateString("sr-RS")}</TableCell>
                      <TableCell>{new Date(training.end_date).toLocaleDateString("sr-RS")}</TableCell>
                      <TableCell>{training.capacity || "N/A"}</TableCell>
                      <TableCell>{getStatusBadge(training.status)}</TableCell>
                      <TableCell className="text-right">
                        <Link href={`/dashboard/trainings/${training.id}`}>
                          <Button variant="ghost" size="sm">
                            Detalji
                          </Button>
                        </Link>
                      </TableCell>
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
