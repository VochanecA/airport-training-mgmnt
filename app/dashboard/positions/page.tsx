"use client"

import { useState, useEffect } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Plus,
  Edit,
  Trash2,
  Briefcase,
  GraduationCap,
  Eye,
  Search,
  Filter,
  ArrowUpDown,
  CheckCircle,
  XCircle
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface WorkingPosition {
  id: string
  code: string
  title: string
  description?: string | null
  department?: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  required_trainings_count?: number
  staff_count?: number
}

export default function PositionsPage() {
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()
  const [positions, setPositions] = useState<WorkingPosition[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterDepartment, setFilterDepartment] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")

  // Za modal/dialog
  const [showModal, setShowModal] = useState(false)
  const [editingPosition, setEditingPosition] = useState<WorkingPosition | null>(null)
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState("")

  const [formData, setFormData] = useState({
    code: "",
    title: "",
    description: "",
    department: "",
    is_active: true
  })

  // Učitavanje pozicija sa brojem obuka i zaposlenih
  const loadPositions = async () => {
    try {
      setLoading(true)
      
      // Prvo učitaj osnovne podatke o pozicijama
      const { data: positionsData, error: positionsError } = await supabase
        .from("working_positions")
        .select("*")
        .order("title")

      if (positionsError) throw positionsError

      if (positionsData) {
        // Za svaku poziciju, dohvati broj obaveznih obuka
        const positionsWithCounts = await Promise.all(
          positionsData.map(async (position) => {
            // Broj obaveznih obuka za poziciju
            const { count: trainingsCount } = await supabase
              .from("position_required_training")
              .select("*", { count: 'exact', head: true })
              .eq("position_id", position.id)

            // Broj zaposlenih na ovoj poziciji
            const { count: staffCount } = await supabase
              .from("staff")
              .select("*", { count: 'exact', head: true })
              .eq("position_id", position.id)
              .eq("status", "active")

            return {
              ...position,
              required_trainings_count: trainingsCount || 0,
              staff_count: staffCount || 0
            }
          })
        )

        setPositions(positionsWithCounts)
      }
    } catch (err) {
      console.error("Error loading positions:", err)
      setError("Došlo je do greške pri učitavanju pozicija")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPositions()
  }, [])

  // Resetuj formu
  const resetForm = () => {
    setFormData({
      code: "",
      title: "",
      description: "",
      department: "",
      is_active: true
    })
    setEditingPosition(null)
    setModalError("")
  }

  // Otvori modal za kreiranje
  const handleOpenCreateModal = () => {
    resetForm()
    setShowModal(true)
  }

  // Otvori modal za edit
  const handleOpenEditModal = (position: WorkingPosition) => {
    setFormData({
      code: position.code,
      title: position.title,
      description: position.description || "",
      department: position.department || "",
      is_active: position.is_active
    })
    setEditingPosition(position)
    setShowModal(true)
  }

// Sačuvaj/update poziciju - ISPRAVLJENO
const handleSavePosition = async () => {
  setModalError("")
  setModalLoading(true)

  try {
    // Validacija
    if (!formData.code.trim()) throw new Error("Kod pozicije je obavezan")
    if (!formData.title.trim()) throw new Error("Naziv pozicije je obavezan")

    if (editingPosition) {
      // Update postojeće pozicije
      const { error } = await supabase
        .from("working_positions")
        .update({
          code: formData.code,
          title: formData.title,
          description: formData.description || null,
          department: formData.department || null,
          is_active: formData.is_active,
          updated_at: new Date().toISOString()
        })
        .eq("id", editingPosition.id)

      if (error) throw error
    } else {
      // Kreiraj novu poziciju - DODAJTE .select() !!!
      const { data, error } = await supabase
        .from("working_positions")
        .insert([{
          code: formData.code,
          title: formData.title,
          description: formData.description || null,
          department: formData.department || null,
          is_active: formData.is_active,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select() // ← OVO JE KLJUČNO!

      if (error) {
        console.error("Full error:", error)
        if (error.message.includes("row-level security")) {
          throw new Error(`RLS greška: ${error.message}. Idite u Supabase Dashboard → Table Editor → working_positions → Policies → "Disable RLS"`)
        }
        throw error
      }
    }

    // Osveži listu i zatvori modal
    await loadPositions()
    setShowModal(false)
    resetForm()
    
  } catch (err: any) {
    console.error("Save position error:", err)
    setModalError(err.message || "Došlo je do greške pri čuvanju pozicije")
  } finally {
    setModalLoading(false)
  }
}

  // Obriši poziciju
  const handleDeletePosition = async (id: string) => {
    if (!confirm("Da li ste sigurni da želite obrisati ovu poziciju?")) return

    try {
      // Prvo proveri da li postoje zaposleni na ovoj poziciji
      const { count } = await supabase
        .from("staff")
        .select("*", { count: 'exact', head: true })
        .eq("position_id", id)

      if (count && count > 0) {
        alert("Ne možete obrisati poziciju dok postoje zaposleni na njoj.")
        return
      }

      // Obriši sve povezane obavezne obuke prvo
      await supabase
        .from("position_required_training")
        .delete()
        .eq("position_id", id)

      // Zatim obriši poziciju
      const { error } = await supabase
        .from("working_positions")
        .delete()
        .eq("id", id)

      if (error) throw error

      // Osveži listu
      await loadPositions()
    } catch (err) {
      console.error("Error deleting position:", err)
      alert("Došlo je do greške pri brisanju pozicije")
    }
  }

  // Filtriranje pozicija
  const filteredPositions = positions.filter(position => {
    // Pretraga po kodu, nazivu i odjeljenju
    const matchesSearch = searchTerm === "" || 
      position.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      position.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (position.department && position.department.toLowerCase().includes(searchTerm.toLowerCase()))

    // Filter po odjeljenju
    const matchesDepartment = filterDepartment === "all" || 
      (filterDepartment === "no_department" && !position.department) ||
      position.department === filterDepartment

    // Filter po statusu
    const matchesStatus = filterStatus === "all" ||
      (filterStatus === "active" && position.is_active) ||
      (filterStatus === "inactive" && !position.is_active)

    return matchesSearch && matchesDepartment && matchesStatus
  })

  // Dobij listu jedinstvenih odjeljenja za filter
  const departments = Array.from(
    new Set(positions.map(p => p.department).filter(Boolean) as string[])
  )

  // Generiši kod automatski
  const generateCode = () => {
    if (!formData.title.trim()) return
    
    const words = formData.title.split(' ')
    const initials = words.map(word => word.charAt(0).toUpperCase()).join('')
    
    const existingCodes = positions.map(p => p.code)
    let code = initials
    let counter = 1
    
    while (existingCodes.includes(code)) {
      code = `${initials}${counter}`
      counter++
    }
    
    setFormData(prev => ({ ...prev, code }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Radne Pozicije</h1>
          <p className="text-muted-foreground">Upravljajte radnim pozicijama i obaveznim obukama</p>
        </div>
        <Button onClick={handleOpenCreateModal} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Pozicija
        </Button>
      </div>

      {/* Statistike */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ukupno pozicija</p>
                <p className="text-2xl font-bold">{positions.length}</p>
              </div>
              <Briefcase className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Aktivne pozicije</p>
                <p className="text-2xl font-bold">
                  {positions.filter(p => p.is_active).length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Prosjek obuka po poziciji</p>
                <p className="text-2xl font-bold">
                  {positions.length > 0 
                    ? (positions.reduce((sum, p) => sum + (p.required_trainings_count || 0), 0) / positions.length).toFixed(1)
                    : "0"
                  }
                </p>
              </div>
              <GraduationCap className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filteri i pretraga */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Pretraga
              </Label>
              <Input
                id="search"
                placeholder="Pretraži po kodu, nazivu ili odjeljenju..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="department-filter" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Odjeljenje
              </Label>
              <select
                id="department-filter"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
              >
                <option value="all">Sva odjeljenja</option>
                <option value="no_department">Bez odjeljenja</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status-filter" className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4" />
                Status
              </Label>
              <select
                id="status-filter"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">Svi statusi</option>
                <option value="active">Aktivne</option>
                <option value="inactive">Neaktivne</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela pozicija */}
      <Card>
        <CardHeader>
          <CardTitle>Lista Radnih Pozicija</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
              <p className="mt-2 text-muted-foreground">Učitavanje pozicija...</p>
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : filteredPositions.length === 0 ? (
            <div className="text-center py-8">
              <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">Nema pronađenih pozicija</h3>
              <p className="text-muted-foreground">
                {searchTerm || filterDepartment !== "all" || filterStatus !== "all" 
                  ? "Pokušajte promijeniti filtere ili pretragu"
                  : "Dodajte svoju prvu radnu poziciju"}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kod</TableHead>
                    <TableHead>Naziv</TableHead>
                    <TableHead>Odjeljenje</TableHead>
                    <TableHead className="text-center">Obuke</TableHead>
                    <TableHead className="text-center">Zaposleni</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Akcije</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPositions.map((position) => (
                    <TableRow key={position.id}>
                      <TableCell className="font-mono font-medium">
                        {position.code}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{position.title}</div>
                        {position.description && (
                          <div className="text-sm text-muted-foreground truncate max-w-xs">
                            {position.description}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {position.department || (
                          <span className="text-muted-foreground">Nije navedeno</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Link href={`/dashboard/positions/${position.id}`}>
                          <Badge variant={position.required_trainings_count ? "default" : "outline"}>
                            {position.required_trainings_count || 0}
                          </Badge>
                        </Link>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">
                          {position.staff_count || 0}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {position.is_active ? (
                          <Badge variant="default" className="gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Aktivan
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="gap-1">
                            <XCircle className="h-3 w-3" />
                            Neaktivan
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/dashboard/positions/${position.id}`}>
                            <Button variant="ghost" size="icon" title="Upravljaj obukama">
                              <GraduationCap className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEditModal(position)}
                            title="Uredi poziciju"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeletePosition(position.id)}
                            title="Obriši poziciju"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            // disabled={position.staff_count && position.staff_count > 0}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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

      {/* Modal za kreiranje/uređivanje pozicije */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  {editingPosition ? "Uredi Poziciju" : "Nova Radna Pozicija"}
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowModal(false)
                    resetForm()
                  }}
                  disabled={modalLoading}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
              
              {modalError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{modalError}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">
                    Kod pozicije <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => {
                        const value = e.target.value.toUpperCase()
                        setFormData(prev => ({ ...prev, code: value }))
                      }}
                      placeholder="Npr. PILOT, FOO, STW"
                      className="font-mono"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generateCode}
                      disabled={!formData.title.trim()}
                    >
                      Generiši
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="title">
                    Naziv pozicije <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => 
                      setFormData(prev => ({ ...prev, title: e.target.value }))
                    }
                    placeholder="Npr. Pilot, Stewardesa, Serviser"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="department">Odjeljenje/Odsjek</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => 
                      setFormData(prev => ({ ...prev, department: e.target.value }))
                    }
                    placeholder="Npr. Operacije, Održavanje, Služba putnika"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Opis pozicije</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => 
                      setFormData(prev => ({ ...prev, description: e.target.value }))
                    }
                    placeholder="Detaljan opis radne pozicije, odgovornosti..."
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => 
                      setFormData(prev => ({ ...prev, is_active: e.target.checked }))
                    }
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Label htmlFor="is_active" className="text-sm font-medium">
                    Aktivna pozicija
                  </Label>
                </div>
              </div>
              
              <div className="flex gap-3 pt-6">
                <Button
                  onClick={handleSavePosition}
                  disabled={modalLoading}
                  className="flex-1"
                >
                  {modalLoading ? (
                    <>
                      <div className="h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                      Čuvanje...
                    </>
                  ) : editingPosition ? (
                    "Sačuvaj promjene"
                  ) : (
                    "Kreiraj Poziciju"
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowModal(false)
                    resetForm()
                  }}
                  disabled={modalLoading}
                >
                  Otkaži
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}