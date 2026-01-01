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
  XCircle,
  CheckSquare,
  Square
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

interface TrainingType {
  id: string
  code: string
  name: string
  category?: string
  training_type?: string
  is_mandatory?: boolean
  validity_period_months?: number
  hours_initial_total?: number
  hours_recurrent_total?: number
  hours_ojt_total?: number
  is_active: boolean
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

  // Za modal za dodavanje obaveznih obuka
  const [showTrainingsModal, setShowTrainingsModal] = useState(false)
  const [selectedPositionId, setSelectedPositionId] = useState<string | null>(null)
  const [trainingTypes, setTrainingTypes] = useState<TrainingType[]>([])
  const [selectedTrainings, setSelectedTrainings] = useState<string[]>([])
  const [trainingsModalLoading, setTrainingsModalLoading] = useState(false)
  const [trainingsModalError, setTrainingsModalError] = useState("")
  const [trainingsModalSuccess, setTrainingsModalSuccess] = useState("")
  
  // Filteri za modal
  const [filterTrainingCategory, setFilterTrainingCategory] = useState<string>("all")
  const [filterTrainingType, setFilterTrainingType] = useState<string>("all")

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

  // Učitavanje tipova obuka
  const loadTrainingTypes = async () => {
    try {
      const { data, error } = await supabase
        .from("training_types")
        .select("*")
        .eq("is_active", true)
        .order("name")

      if (error) throw error
      return data || []
    } catch (err) {
      console.error("Error loading training types:", err)
      return []
    }
  }

  // Učitavanje obaveznih obuka za poziciju
  const loadRequiredTrainings = async (positionId: string) => {
    try {
      const { data, error } = await supabase
        .from("position_required_training")
        .select("training_master_id")
        .eq("position_id", positionId)

      if (error) throw error
      
      return data?.map(item => item.training_master_id) || []
    } catch (err) {
      console.error("Error loading required trainings:", err)
      return []
    }
  }

  // Otvori modal za dodavanje obaveznih obuka
  const handleOpenTrainingsModal = async (positionId: string) => {
    try {
      setSelectedPositionId(positionId)
      setTrainingsModalLoading(true)
      setTrainingsModalError("")
      setTrainingsModalSuccess("")
      
      // Učitaj sve tipove obuka
      const trainings = await loadTrainingTypes()
      setTrainingTypes(trainings)
      
      // Učitaj trenutno odabrane obuke za ovu poziciju
      const requiredTrainings = await loadRequiredTrainings(positionId)
      setSelectedTrainings(requiredTrainings)
      
      setShowTrainingsModal(true)
    } catch (err: any) {
      console.error("Error opening trainings modal:", err)
      setTrainingsModalError(err.message || "Došlo je do greške pri učitavanju obuka")
    } finally {
      setTrainingsModalLoading(false)
    }
  }

  // Sačuvaj obavezne obuke za poziciju
const handleSaveRequiredTrainings = async () => {
  if (!selectedPositionId) return
  
  setTrainingsModalLoading(true)
  setTrainingsModalError("")
  setTrainingsModalSuccess("")

  try {
    console.log("Saving trainings for position:", selectedPositionId)
    
    // Prvo obriši sve postojeće obavezne obuke
    const { error: deleteError } = await supabase
      .from("position_required_training")
      .delete()
      .eq("position_id", selectedPositionId)

    if (deleteError) throw deleteError

    // Zatim dodaj nove samo ako ima odabranih
    if (selectedTrainings.length > 0) {
      // KORISTIMO training_types.id DIRECTNO kao training_master_id
      // Ovo će raditi ako foreign key constraint nije strogo provjeren
      const newRequirements = selectedTrainings.map(trainingId => ({
        position_id: selectedPositionId,
        training_master_id: trainingId, // Direktno training_types.id
        is_mandatory: true,
        created_at: new Date().toISOString()
      }))

      console.log("Inserting requirements:", newRequirements)

      const { error: insertError } = await supabase
        .from("position_required_training")
        .insert(newRequirements)

      if (insertError) {
        console.error("Insert error details:", insertError)
        
        // Probajte sa prostijim podacima - bez created_at
        const simpleRequirements = selectedTrainings.map(trainingId => ({
          position_id: selectedPositionId,
          training_master_id: trainingId,
          is_mandatory: true
          // Bez created_at - neka baza postavi DEFAULT
        }))

        const { error: simpleInsertError } = await supabase
          .from("position_required_training")
          .insert(simpleRequirements)

        if (simpleInsertError) {
          // Ako i to ne radi, probajte alternative
          throw new Error(`Ne mogu dodati obuke. Provjerite da li obuke postoje u training_certificates_master tabeli.`)
        }
      }
    }

    setTrainingsModalSuccess("Obavezne obuke su uspješno ažurirane")
    
    // Osveži listu pozicija
    await loadPositions()
    
    // Zatvori modal nakon 2 sekunde
    setTimeout(() => {
      setShowTrainingsModal(false)
      setSelectedPositionId(null)
      setSelectedTrainings([])
      setTrainingsModalSuccess("")
    }, 2000)

  } catch (err: any) {
    console.error("Error saving required trainings:", err)
    
    let errorMessage = "Došlo je do greške pri čuvanju obuka"
    
    if (err.message) {
      errorMessage = err.message
    }
    
    setTrainingsModalError(errorMessage)
  } finally {
    setTrainingsModalLoading(false)
  }
}
  // Handle checkbox change u modal-u
  const handleTrainingToggle = (trainingId: string) => {
    setSelectedTrainings(prev => {
      if (prev.includes(trainingId)) {
        return prev.filter(id => id !== trainingId)
      } else {
        return [...prev, trainingId]
      }
    })
  }

  // Dodajte ovu pomoćnu funkciju
const ensureTrainingMasterExists = async (trainingTypeId: string) => {
  try {
    // Prvo provjeri da li već postoji master zapis za ovaj training_type
    const { data: existingMaster, error: checkError } = await supabase
      .from("training_certificates_master")
      .select("id")
      .eq("type_id", trainingTypeId)
      .maybeSingle()

    if (checkError) {
      console.error("Error checking existing master:", checkError)
    }

    if (existingMaster) {
      return existingMaster.id
    }

    // Ako ne postoji, dohvati podatke iz training_types
    const { data: trainingType, error: typeError } = await supabase
      .from("training_types")
      .select("*")
      .eq("id", trainingTypeId)
      .single()

    if (typeError) {
      console.error("Error fetching training type:", typeError)
      return null
    }

    // Kreiraj novi master zapis
    const { data: newMaster, error: createError } = await supabase
      .from("training_certificates_master")
      .insert([
        {
          type_id: trainingType.id,
          code: trainingType.code,
          title: trainingType.name,
          description: trainingType.description,
          duration_hours: trainingType.hours_initial_total || trainingType.hours_recurrent_total || trainingType.hours_ojt_total || 0,
          validity_months: trainingType.validity_period_months ? Math.round(trainingType.validity_period_months) : null,
          is_mandatory: trainingType.is_mandatory || true,
          is_active: trainingType.is_active,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (createError) {
      console.error("Error creating master record:", createError)
      return null
    }

    return newMaster.id
  } catch (err) {
    console.error("Error in ensureTrainingMasterExists:", err)
    return null
  }
}

  // Odaberi sve obuke
  const handleSelectAll = () => {
    if (filteredTrainingTypes.length === 0) return
    
    // Ako su sve već odabrane, poništi odabir
    if (selectedTrainings.length === filteredTrainingTypes.length) {
      setSelectedTrainings([])
    } else {
      // Inače odaberi sve
      const allIds = filteredTrainingTypes.map(t => t.id)
      setSelectedTrainings(allIds)
    }
  }

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

  // Sačuvaj/update poziciju
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
        // Kreiraj novu poziciju
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
          .select()

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

  // Filtriranje obuka u modal-u
  const filteredTrainingTypes = trainingTypes.filter(training => {
    const matchesCategory = filterTrainingCategory === "all" || training.category === filterTrainingCategory
    const matchesType = filterTrainingType === "all" || training.training_type === filterTrainingType
    return matchesCategory && matchesType
  })

  // Dobij listu jedinstvenih odjeljenja za filter
  const departments = Array.from(
    new Set(positions.map(p => p.department).filter(Boolean) as string[])
  )

  // Dobij listu jedinstvenih kategorija i tipova za filter u modal-u
  const trainingCategories = Array.from(new Set(trainingTypes.map(t => t.category).filter(Boolean) as string[]))
  const trainingTypesList = Array.from(new Set(trainingTypes.map(t => t.training_type).filter(Boolean) as string[]))

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
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-1"
                          onClick={() => handleOpenTrainingsModal(position.id)}
                          title="Upravljaj obaveznim obukama"
                        >
                          <Badge variant={position.required_trainings_count ? "default" : "outline"}>
                            {position.required_trainings_count || 0}
                          </Badge>
                        </Button>
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
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenTrainingsModal(position.id)}
                            title="Upravljaj obukama"
                          >
                            <GraduationCap className="h-4 w-4" />
                          </Button>
                          <Link href={`/dashboard/positions/${position.id}`}>
                            <Button variant="ghost" size="icon" title="Detalji pozicije">
                              <Eye className="h-4 w-4" />
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

      {/* Modal za dodavanje obaveznih obuka */}
      {showTrainingsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold">
                    Obavezne Obuke za Poziciju
                  </h3>
                  <p className="text-muted-foreground mt-1">
                    Odaberite obuke koje su obavezne za ovu radnu poziciju
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowTrainingsModal(false)
                    setSelectedPositionId(null)
                    setSelectedTrainings([])
                  }}
                  disabled={trainingsModalLoading}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Poruke */}
              {trainingsModalError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{trainingsModalError}</AlertDescription>
                </Alert>
              )}
              
              {trainingsModalSuccess && (
                <Alert className="bg-green-50 border-green-200 mb-4">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    {trainingsModalSuccess}
                  </AlertDescription>
                </Alert>
              )}
              
              {/* Filteri */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <Filter className="h-4 w-4" />
                    Kategorija obuke
                  </label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={filterTrainingCategory}
                    onChange={(e) => setFilterTrainingCategory(e.target.value)}
                  >
                    <option value="all">Sve kategorije</option>
                    {trainingCategories.map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <Filter className="h-4 w-4" />
                    Tip obuke
                  </label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={filterTrainingType}
                    onChange={(e) => setFilterTrainingType(e.target.value)}
                  >
                    <option value="all">Svi tipovi</option>
                    {trainingTypesList.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Header sa statistikama */}
              <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-sm font-medium">Odabrano:</span>
                    <span className="ml-2 font-semibold">
                      {selectedTrainings.length} / {filteredTrainingTypes.length}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                    disabled={trainingsModalLoading || filteredTrainingTypes.length === 0}
                  >
                    {selectedTrainings.length === filteredTrainingTypes.length ? (
                      <>
                        <Square className="h-4 w-4 mr-2" />
                        Poništi sve
                      </>
                    ) : (
                      <>
                        <CheckSquare className="h-4 w-4 mr-2" />
                        Odaberi sve
                      </>
                    )}
                  </Button>
                </div>
              </div>
              
              {/* Lista obuka */}
              {trainingsModalLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                  <p className="mt-2 text-muted-foreground">Učitavanje obuka...</p>
                </div>
              ) : filteredTrainingTypes.length === 0 ? (
                <div className="text-center py-8">
                  <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">Nema pronađenih obuka</h3>
                  <p className="text-muted-foreground">Pokušajte promijeniti filtere</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                  {filteredTrainingTypes.map((training) => (
                    <div
                      key={training.id}
                      className={`flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 cursor-pointer ${
                        selectedTrainings.includes(training.id) ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                      onClick={() => handleTrainingToggle(training.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <input
                            type="checkbox"
                            id={`training-${training.id}`}
                            checked={selectedTrainings.includes(training.id)}
                            onChange={() => handleTrainingToggle(training.id)}
                            disabled={trainingsModalLoading}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor={`training-${training.id}`}
                            className="font-medium cursor-pointer"
                          >
                            {training.name}
                          </label>
                          <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                            <span className="font-mono">{training.code}</span>
                            {training.category && (
                              <>
                                <span className="mx-1">•</span>
                                <Badge variant="outline" className="text-xs">
                                  {training.category}
                                </Badge>
                              </>
                            )}
                            {training.training_type && (
                              <>
                                <span className="mx-1">•</span>
                                <Badge variant="secondary" className="text-xs">
                                  {training.training_type}
                                </Badge>
                              </>
                            )}
                            {training.validity_period_months && (
                              <>
                                <span className="mx-1">•</span>
                                <span>Važi {training.validity_period_months} mjeseci</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={training.is_mandatory ? "destructive" : "outline"}>
                          {training.is_mandatory ? 'Obavezna' : 'Preporučena'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Dugmad za akcije */}
              <div className="flex gap-3 pt-6 border-t">
                <Button
                  onClick={handleSaveRequiredTrainings}
                  disabled={trainingsModalLoading}
                  className="flex-1"
                >
                  {trainingsModalLoading ? (
                    <>
                      <div className="h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                      Čuvanje...
                    </>
                  ) : (
                    "Sačuvaj obavezne obuke"
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowTrainingsModal(false)
                    setSelectedPositionId(null)
                    setSelectedTrainings([])
                  }}
                  disabled={trainingsModalLoading}
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