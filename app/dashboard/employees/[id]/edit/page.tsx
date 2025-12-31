"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Save, User, Mail, Phone, Calendar } from "lucide-react"
import Link from "next/link"

interface WorkingPosition {
  id: string
  code: string
  title: string
  department?: string
}

export default function EditEmployeePage() {
  const params = useParams()
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [workingPositions, setWorkingPositions] = useState<WorkingPosition[]>([])
  
  const [formData, setFormData] = useState({
    employee_number: "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    position_id: "",
    staff_type: "employee" as "employee" | "subcontractor" | "seasonal" | "external",
    status: "active" as "active" | "inactive" | "terminated",
    hire_date: "",
    termination_date: "",
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        
        // Učitaj zaposlenog
        const { data: employee, error: employeeError } = await supabase
          .from("staff")
          .select("*")
          .eq("id", params.id)
          .single()

        if (employeeError) throw employeeError
        
        if (employee) {
          setFormData({
            employee_number: employee.employee_number || "",
            first_name: employee.first_name || "",
            last_name: employee.last_name || "",
            email: employee.email || "",
            phone: employee.phone || "",
            position_id: employee.position_id || "",
            staff_type: employee.staff_type as any || "employee",
            status: employee.status as any || "active",
            hire_date: employee.hire_date || "",
            termination_date: employee.termination_date || "",
          })
        }

        // Učitaj radne pozicije
        const { data: positions, error: positionsError } = await supabase
          .from("working_positions")
          .select("id, code, title, department")
          .eq("is_active", true)
          .order("title")

        if (positionsError) throw positionsError
        setWorkingPositions(positions || [])

      } catch (err: any) {
        setError(err.message || "Greška pri učitavanju podataka")
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      loadData()
    }
  }, [params.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSaving(true)

    try {
      // Validacija
      if (!formData.employee_number.trim()) throw new Error("Broj zaposlenog je obavezan")
      if (!formData.first_name.trim()) throw new Error("Ime je obavezno")
      if (!formData.last_name.trim()) throw new Error("Prezime je obavezno")

      // Update zaposlenog
      const { error: updateError } = await supabase
        .from("staff")
        .update({
          employee_number: formData.employee_number,
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email || null,
          phone: formData.phone || null,
          position_id: formData.position_id || null,
          staff_type: formData.staff_type,
          status: formData.status,
          hire_date: formData.hire_date || null,
          termination_date: formData.termination_date || null,
          updated_at: new Date().toISOString()
        })
        .eq("id", params.id)

      if (updateError) throw updateError

      // Vrati se na listu zaposlenih
      router.push("/dashboard/employees")
      router.refresh()

    } catch (err: any) {
      setError(err.message || "Došlo je do greške pri čuvanju promjena")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-2 text-muted-foreground">Učitavanje...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/employees">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Uredi Zaposlenog</h1>
          <p className="text-muted-foreground">Ažurirajte podatke o zaposlenom</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Osnovni podaci
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="employee_number">
                  Broj zaposlenog <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="employee_number"
                  value={formData.employee_number}
                  onChange={(e) => setFormData({ ...formData, employee_number: e.target.value })}
                  required
                  disabled={saving}
                  className="font-mono"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="first_name">
                    Ime <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    required
                    disabled={saving}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_name">
                    Prezime <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    required
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Telefon
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={saving}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informacije o zaposlenju</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="position_id">Pozicija</Label>
     <Select
  value={formData.position_id}
  onValueChange={(value) => setFormData({ ...formData, position_id: value })}
  disabled={saving}
>
  <SelectTrigger>
    <SelectValue placeholder="Izaberite poziciju" />
  </SelectTrigger>
  <SelectContent>
    {/* Izbacite ovu liniju */}
    {/* <SelectItem value="">Nije postavljena</SelectItem> */}
    
    {workingPositions.map((position) => (
      <SelectItem key={position.id} value={position.id}>
        {position.title} ({position.code})
      </SelectItem>
    ))}
  </SelectContent>
</Select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="staff_type">Tip zaposlenog</Label>
                  <Select
                    value={formData.staff_type}
                    onValueChange={(value: any) => setFormData({ ...formData, staff_type: value })}
                    disabled={saving}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">Zaposleni</SelectItem>
                      <SelectItem value="subcontractor">Podizvođač</SelectItem>
                      <SelectItem value="seasonal">Sezonski radnik</SelectItem>
                      <SelectItem value="external">Eksterni saradnik</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                    disabled={saving}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Aktivan</SelectItem>
                      <SelectItem value="inactive">Neaktivan</SelectItem>
                      <SelectItem value="terminated">Prestao radni odnos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="hire_date" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Datum zaposlenja
                  </Label>
                  <Input
                    id="hire_date"
                    type="date"
                    value={formData.hire_date}
                    onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                    disabled={saving}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="termination_date">Datum prestanka rada</Label>
                  <Input
                    id="termination_date"
                    type="date"
                    value={formData.termination_date}
                    onChange={(e) => setFormData({ ...formData, termination_date: e.target.value })}
                    disabled={saving}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-3 pt-6">
          <Button 
            type="submit" 
            disabled={saving}
            className="min-w-[150px]"
          >
            {saving ? (
              <>
                <div className="h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                Čuvanje...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Sačuvaj promjene
              </>
            )}
          </Button>
          <Link href="/dashboard/employees">
            <Button type="button" variant="outline" disabled={saving}>
              Otkaži
            </Button>
          </Link>
        </div>
      </form>
    </div>
  )
}