import { getSupabaseServerClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit } from "lucide-react"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

async function getEmployees() {
  const supabase = await getSupabaseServerClient()

  const { data: employees } = await supabase
    .from("staff")
    .select(`
      *,
      working_positions!inner (
        title,
        code,
        department
      )
    `)
    .order("last_name", { ascending: true })

  return employees || []
}

export default async function EmployeesPage() {
  const employees = await getEmployees()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Zaposleni</h1>
          <p className="text-muted-foreground">Upravljajte bazom zaposlenih</p>
        </div>
        <Link href="/dashboard/employees/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novi Zaposleni
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Svi Zaposleni</CardTitle>
        </CardHeader>
        <CardContent>
          {employees.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">Nema zaposlenih u sistemu</p>
              <Link href="/dashboard/employees/new">
                <Button variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Dodaj Prvog Zaposlenog
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ime</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Pozicija</TableHead>
                    <TableHead>Odsek</TableHead>
                    <TableHead>Broj Zaposlenog</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Akcije</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((employee: any) => {
                    // Izvuci podatke o poziciji - koristimo working_positions kao objekt, ne niz
                    const position = employee.working_positions || {}
                    
                    return (
                      <TableRow key={employee.id}>
                        <TableCell className="font-medium">
                          {employee.first_name} {employee.last_name}
                        </TableCell>
                        <TableCell>{employee.email || "N/A"}</TableCell>
                        <TableCell>
                          {position.title || "N/A"}
                        </TableCell>
                        <TableCell>
                          {position.department || "N/A"}
                        </TableCell>
                        <TableCell>{employee.employee_number || "N/A"}</TableCell>
                        <TableCell>
                          <Badge variant={employee.status === "active" ? "default" : "secondary"}>
                            {employee.status === "active" ? "Aktivan" : "Neaktivan"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Link href={`/dashboard/employees/${employee.id}`}>
                              <Button variant="ghost" size="sm">
                                Detalji
                              </Button>
                            </Link>
                            <Link href={`/dashboard/employees/${employee.id}/edit`}>
                              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                                <Edit className="h-4 w-4" />
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
    </div>
  )
}