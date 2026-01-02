import { getSupabaseServerClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, User, GraduationCap } from "lucide-react"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

async function getEmployeeTrainingRecords(employeeId: string) {
  const supabase = await getSupabaseServerClient()

  const { data: trainingRecords } = await supabase
    .from("v_training_records_summary")
    .select("*")
    .eq("staff_id", employeeId)
    .order("training_date", { ascending: false })

  return trainingRecords || []
}

async function getEmployeeDetails(employeeId: string) {
  const supabase = await getSupabaseServerClient()

  const { data: employee } = await supabase
    .from("staff")
    .select("first_name, last_name, employee_number")
    .eq("id", employeeId)
    .single()

  return employee
}

export default async function EmployeeTrainingPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  // Dodajte await za params
  const { id } = await params
  
  const trainingRecords = await getEmployeeTrainingRecords(id)
  const employee = await getEmployeeDetails(id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trening Evidencija</h1>
          <p className="text-muted-foreground">
            Za zaposlenog: {employee?.first_name} {employee?.last_name} ({employee?.employee_number})
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/dashboard/training-records/new?staff_id=${id}`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novi Trening
            </Button>
          </Link>
          <Link href={`/dashboard/employees/${id}`}>
            <Button variant="outline">
              Nazad na profil
            </Button>
          </Link>
        </div>
      </div>

      {/* Statistike */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ukupno treninga</p>
                <p className="text-2xl font-bold">{trainingRecords.length}</p>
              </div>
              <GraduationCap className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Dokazane kompetencije</p>
                <p className="text-2xl font-bold">
                  {trainingRecords.filter(t => t.competency_achieved).length}
                </p>
              </div>
              <User className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ukupno sati</p>
                <p className="text-2xl font-bold">
                  {trainingRecords.reduce((sum, t) => sum + (t.training_hours_total || 0), 0).toFixed(1)}
                </p>
              </div>
              <GraduationCap className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle>Historija Treninga</CardTitle>
        </CardHeader>
        <CardContent>
          {trainingRecords.length === 0 ? (
            <div className="text-center py-12">
              <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">Zaposleni nema zabilježenih treninga</p>
              <Link href={`/dashboard/training-records/new?staff_id=${id}`}>
                <Button variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Dodaj Prvi Trening
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Trening</TableHead>
                    <TableHead>Datum</TableHead>
                    <TableHead>Tip</TableHead>
                    <TableHead>Rezultat</TableHead>
                    <TableHead>Kompetencije</TableHead>
                    <TableHead>Sati</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Akcije</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trainingRecords.map((record: any) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {record.training_title}
                      </TableCell>
                      <TableCell>
                        <div>{new Date(record.training_date).toLocaleDateString()}</div>
                        {record.expiry_date && (
                          <div className="text-xs text-muted-foreground">
                            Važi do: {new Date(record.expiry_date).toLocaleDateString()}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {record.training_method || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {record.actual_score && record.passing_score ? (
                          <div>
                            <div className="font-medium">
                              {record.actual_score} / {record.passing_score}
                            </div>
                            <div className={`text-xs ${record.actual_score >= record.passing_score ? 'text-green-600' : 'text-red-600'}`}>
                              {record.actual_score >= record.passing_score ? 'Položeno' : 'Palo'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {record.competency_achieved ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                            {record.competency_level || 'Dokazano'}
                          </Badge>
                        ) : (
                          <Badge variant="outline">U toku</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {record.training_hours_total || 0}h
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          record.status === 'completed' ? 'default' :
                          record.status === 'in_progress' ? 'secondary' :
                          'outline'
                        }>
                          {record.status === 'completed' ? 'Završeno' :
                           record.status === 'in_progress' ? 'U toku' :
                           record.status === 'planned' ? 'Planirano' :
                           'Otkazano'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/dashboard/training-records/${record.id}`}>
                            <Button variant="ghost" size="sm">
                              Detalji
                            </Button>
                          </Link>
                        </div>
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