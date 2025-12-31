"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  GraduationCap,
  CheckCircle,
  Clock,
  AlertTriangle,
  BookOpen,
  Filter,
  Save,
  Plus,
  Briefcase,
  X
} from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Position {
  id: string
  code: string
  title: string
  description?: string
  department?: string
}

interface TrainingType {
  id: string
  code: string
  name: string
  description?: string
  category?: string
  training_type?: string
  is_mandatory?: boolean
  validity_period_months?: number
  hours_initial_total?: number
  hours_recurrent_total?: number
  hours_re_qualification_total?: number
  hours_update_total?: number
  hours_ojt_total?: number
}

interface RequiredTraining {
  id: string
  training_type_id: string
  is_mandatory: boolean
  created_at: string
  training_type: TrainingType
}

export default function PositionTrainingsPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  
  const [position, setPosition] = useState<Position | null>(null)
  const [trainingTypes, setTrainingTypes] = useState<TrainingType[]>([])
  const [requiredTrainings, setRequiredTrainings] = useState<RequiredTraining[]>([])
  
  // Selektovane obuke u formi
  const [selectedTrainings, setSelectedTrainings] = useState<string[]>([])
  
  // Filteri
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [filterType, setFilterType] = useState<string>("all")

  // Dodavanje nove obuke
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [addingTraining, setAddingTraining] = useState(false)
  const [newTraining, setNewTraining] = useState({
    code: "",
    name: "",
    description: "",
    category: "",
    training_type: "",
    validity_period_months: "",
    is_mandatory: "true",
  })

  const positionId = params.id as string

  // Učitaj podatke
  useEffect(() => {
    loadData()
  }, [positionId])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Učitaj poziciju
      const { data: positionData, error: positionError } = await supabase
        .from("working_positions")
        .select("*")
        .eq("id", positionId)
        .single()

      if (positionError) throw positionError
      setPosition(positionData)

      // Učitaj sve tipove obuka iz training_types
      const { data: trainingsData, error: trainingsError } = await supabase
        .from("training_types")
        .select("*")
        .eq("is_active", true)
        .order("name")

      if (trainingsError) throw trainingsError
      setTrainingTypes(trainingsData || [])

      // Učitaj obavezne obuke za ovu poziciju iz position_required_training
      // Moramo prilagoditi da koristi training_master_id za training_type_id
      const { data: requiredData, error: requiredError } = await supabase
        .from("position_required_training")
        .select(`
          id,
          training_master_id,
          is_mandatory,
          created_at
        `)
        .eq("position_id", positionId)

      if (requiredError) throw requiredError
      
      // Mapiraj podatke i poveži sa training_types
      const mappedRequiredData = (requiredData || []).map(item => {
        const training = trainingsData?.find(t => t.id === item.training_master_id)
        return {
          id: item.id,
          training_type_id: item.training_master_id,
          is_mandatory: item.is_mandatory,
          created_at: item.created_at,
          training_type: training || null
        }
      }).filter(item => item.training_type !== null) as RequiredTraining[]
      
      setRequiredTrainings(mappedRequiredData)
      
      // Postavi selektovane obuke
      const selectedIds = mappedRequiredData.map(rt => rt.training_type_id)
      setSelectedTrainings(selectedIds)

    } catch (err: any) {
      console.error("Error loading data:", err)
      setError(err.message || "Došlo je do greške pri učitavanju podataka")
    } finally {
      setLoading(false)
    }
  }

  // Sačuvaj promjene
  const handleSave = async () => {
    setSaving(true)
    setError("")
    setSuccess("")

    try {
      // Prvo obriši sve postojeće obavezne obuke
      const { error: deleteError } = await supabase
        .from("position_required_training")
        .delete()
        .eq("position_id", positionId)

      if (deleteError) throw deleteError

      // Zatim dodaj nove
      if (selectedTrainings.length > 0) {
        const newRequirements = selectedTrainings.map(trainingId => ({
          position_id: positionId,
          training_master_id: trainingId, // Koristimo training_master_id field
          is_mandatory: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }))

        const { error: insertError } = await supabase
          .from("position_required_training")
          .insert(newRequirements)

        if (insertError) throw insertError
      }

      setSuccess("Obavezne obuke su uspješno ažurirane")
      
      // Osveži podatke
      setTimeout(() => {
        router.refresh()
        loadData()
      }, 1000)

    } catch (err: any) {
      console.error("Error saving trainings:", err)
      setError(err.message || "Došlo je do greške pri čuvanju obuka")
    } finally {
      setSaving(false)
    }
  }

  // Handle checkbox change
  const handleTrainingToggle = (trainingId: string) => {
    setSelectedTrainings(prev => {
      if (prev.includes(trainingId)) {
        return prev.filter(id => id !== trainingId)
      } else {
        return [...prev, trainingId]
      }
    })
  }

  // Dodaj novi tip obuke
  const handleAddTraining = async () => {
    setAddingTraining(true)
    setError("")

    try {
      // Kreiraj novi tip obuke u training_types tabeli
      const { data: newTrainingType, error: trainingError } = await supabase
        .from("training_types")
        .insert([
          {
            code: newTraining.code,
            name: newTraining.name,
            description: newTraining.description || null,
            category: newTraining.category || null,
            training_type: newTraining.training_type || null,
            validity_period_months: newTraining.validity_period_months ? parseFloat(newTraining.validity_period_months) : null,
            is_mandatory: newTraining.is_mandatory === "true",
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single()

      if (trainingError) throw trainingError

      // Automatski dodaj u selektovane obuke za ovu poziciju
      const updatedSelectedTrainings = [...selectedTrainings, newTrainingType.id]
      setSelectedTrainings(updatedSelectedTrainings)

      // Reset form
      setNewTraining({
        code: "",
        name: "",
        description: "",
        category: "",
        training_type: "",
        validity_period_months: "",
        is_mandatory: "true",
      })

      setShowAddDialog(false)
      setSuccess("Novi tip obuke je uspješno dodat i automatski dodan ovoj poziciji")

      // Osveži listu obuka
      await loadData()

    } catch (err: any) {
      console.error("Error adding training:", err)
      setError(err.message || "Došlo je do greške pri dodavanju tipa obuke")
    } finally {
      setAddingTraining(false)
    }
  }

  // Filtriraj obuke
  const filteredTrainings = trainingTypes.filter(training => {
    const matchesCategory = filterCategory === "all" || training.category === filterCategory
    const matchesType = filterType === "all" || training.training_type === filterType
    return matchesCategory && matchesType
  })

  // Grupiši obuke po kategoriji
  const trainingsByCategory = filteredTrainings.reduce((acc, training) => {
    const category = training.category || 'other'
    if (!acc[category]) acc[category] = []
    acc[category].push(training)
    return acc
  }, {} as Record<string, TrainingType[]>)

  // Dobij labelu za kategoriju
  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'safety': 'Bezbednost',
      'technical': 'Tehnička',
      'operational': 'Operativna',
      'administrative': 'Administrativna',
      'customer_service': 'Usluga putnicima',
      'management': 'Menadžment',
      'other': 'Ostalo'
    }
    return labels[category] || category
  }

  // Dobij labelu za tip obuke
  const getTrainingTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'initial': 'Initial Training',
      'recurrent': 'Recurrent Training',
      're_qualification': 'Re-qualification',
      'update': 'Update Training',
      'ojt': 'OJT Training',
      'refresher': 'Refresher Training',
      'conversion': 'Conversion Training'
    }
    return labels[type] || type
  }

  // Dobij jedinstvene kategorije i tipove za filtere
  const categories = Array.from(new Set(trainingTypes.map(t => t.category).filter(Boolean) as string[]))
  const types = Array.from(new Set(trainingTypes.map(t => t.training_type).filter(Boolean) as string[]))

  // Funkcija za formatiranje sati
  const formatHours = (hours?: number) => {
    if (!hours) return null
    return `${hours} sati`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-2 text-muted-foreground">Učitavanje podataka...</p>
        </div>
      </div>
    )
  }

  if (!position) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 mx-auto text-red-500 mb-4" />
        <h3 className="text-lg font-semibold">Pozicija nije pronađena</h3>
        <p className="text-muted-foreground mb-4">Radna pozicija sa ovim ID-om ne postoji.</p>
        <Link href="/dashboard/positions">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Nazad na listu pozicija
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/positions">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Obavezne Obuke</h1>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Briefcase className="h-4 w-4" />
            <span className="font-medium">{position.title}</span>
            <span className="font-mono">({position.code})</span>
            {position.department && (
              <>
                <Separator orientation="vertical" className="h-4" />
                <span>{position.department}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Informacije o poziciji */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Kod pozicije</p>
              <p className="text-lg font-mono font-semibold">{position.code}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Naziv</p>
              <p className="text-lg font-semibold">{position.title}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Trenutno obaveznih obuka</p>
              <p className="text-lg font-semibold">{selectedTrainings.length}</p>
            </div>
          </div>
          {position.description && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">{position.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Poruke */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista obuka */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Dostupne Obuke
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-1">
                  <GraduationCap className="h-3 w-3" />
                  {selectedTrainings.length} odabrano
                </Badge>
              </div>
            </CardTitle>
            <CardDescription>
              Odaberite obuke koje su obavezne za ovu radnu poziciju
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Filteri */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="category-filter" className="flex items-center gap-2 text-sm font-medium">
                  <Filter className="h-4 w-4" />
                  Kategorija
                </label>
                <select
                  id="category-filter"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <option value="all">Sve kategorije</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {getCategoryLabel(category)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="type-filter" className="flex items-center gap-2 text-sm font-medium">
                  <Filter className="h-4 w-4" />
                  Tip obuke
                </label>
                <select
                  id="type-filter"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="all">Svi tipovi</option>
                  {types.map(type => (
                    <option key={type} value={type}>
                      {getTrainingTypeLabel(type)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Lista obuka */}
            <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2">
              {Object.entries(trainingsByCategory).length === 0 ? (
                <div className="text-center py-8">
                  <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">Nema pronađenih obuka</h3>
                  <p className="text-muted-foreground">Pokušajte promijeniti filtere</p>
                </div>
              ) : (
                Object.entries(trainingsByCategory).map(([category, trainings]) => (
                  <div key={category} className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-700 border-b pb-2">
                      {getCategoryLabel(category)}
                    </h4>
                    <div className="space-y-2">
                      {trainings.map((training) => (
                        <div
                          key={training.id}
                          className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50"
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox
                              id={`training-${training.id}`}
                              checked={selectedTrainings.includes(training.id)}
                              onCheckedChange={() => handleTrainingToggle(training.id)}
                              disabled={saving}
                            />
                            <div>
                              <label
                                htmlFor={`training-${training.id}`}
                                className="font-medium cursor-pointer"
                              >
                                {training.name}
                              </label>
                              <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-2 mt-1">
                                <span className="font-mono">{training.code}</span>
                                
                                {training.training_type && (
                                  <>
                                    <Separator orientation="vertical" className="h-3" />
                                    <span>{getTrainingTypeLabel(training.training_type)}</span>
                                  </>
                                )}
                                
                                {training.hours_initial_total && (
                                  <>
                                    <Separator orientation="vertical" className="h-3" />
                                    <Clock className="h-3 w-3" />
                                    <span>Initial: {formatHours(training.hours_initial_total)}</span>
                                  </>
                                )}
                                
                                {training.validity_period_months && (
                                  <>
                                    <Separator orientation="vertical" className="h-3" />
                                    <CheckCircle className="h-3 w-3" />
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
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sidebar - Trenutne obavezne obuke */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Obavezne Obuke za Poziciju
              </CardTitle>
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="h-8 gap-1">
                    <Plus className="h-3 w-3" />
                    Dodaj Novu
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Dodaj Novi Tip Obuke</DialogTitle>
                    <DialogDescription>
                      Kreirajte novi tip obuke i automatski ga dodajte ovoj poziciji
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label htmlFor="code" className="text-sm font-medium">
                        Kod obuke <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="code"
                        value={newTraining.code}
                        onChange={(e) => setNewTraining({ ...newTraining, code: e.target.value })}
                        placeholder="Npr. RAMP-SAF-001"
                        className="font-mono"
                        disabled={addingTraining}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-medium">
                        Naziv obuke <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="name"
                        value={newTraining.name}
                        onChange={(e) => setNewTraining({ ...newTraining, name: e.target.value })}
                        placeholder="Npr. Ramp Safety Awareness"
                        disabled={addingTraining}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="description" className="text-sm font-medium">
                        Opis obuke
                      </label>
                      <Textarea
                        id="description"
                        value={newTraining.description}
                        onChange={(e) => setNewTraining({ ...newTraining, description: e.target.value })}
                        placeholder="Detaljan opis obuke, ciljevi, teme..."
                        rows={3}
                        disabled={addingTraining}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="category" className="text-sm font-medium">
                          Kategorija
                        </label>
                        <Select
                          value={newTraining.category}
                          onValueChange={(value) => setNewTraining({ ...newTraining, category: value })}
                          disabled={addingTraining}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Izaberite kategoriju" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="safety">Bezbednost</SelectItem>
                            <SelectItem value="technical">Tehnička</SelectItem>
                            <SelectItem value="operational">Operativna</SelectItem>
                            <SelectItem value="administrative">Administrativna</SelectItem>
                            <SelectItem value="customer_service">Usluga putnicima</SelectItem>
                            <SelectItem value="management">Menadžment</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <label htmlFor="training_type" className="text-sm font-medium">
                          Tip obuke
                        </label>
                        <Select
                          value={newTraining.training_type}
                          onValueChange={(value) => setNewTraining({ ...newTraining, training_type: value })}
                          disabled={addingTraining}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Izaberite tip" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="initial">Initial Training</SelectItem>
                            <SelectItem value="recurrent">Recurrent Training</SelectItem>
                            <SelectItem value="re_qualification">Re-qualification</SelectItem>
                            <SelectItem value="update">Update Training</SelectItem>
                            <SelectItem value="ojt">OJT Training</SelectItem>
                            <SelectItem value="refresher">Refresher Training</SelectItem>
                            <SelectItem value="conversion">Conversion Training</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="validity_months" className="text-sm font-medium">
                          Period važenja (mjeseci)
                        </label>
                        <Input
                          id="validity_months"
                          type="number"
                          min="0"
                          max="120"
                          value={newTraining.validity_period_months}
                          onChange={(e) => setNewTraining({ ...newTraining, validity_period_months: e.target.value })}
                          placeholder="Npr. 24"
                          disabled={addingTraining}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label htmlFor="is_mandatory" className="text-sm font-medium">
                          Obaveznost
                        </label>
                        <Select
                          value={newTraining.is_mandatory}
                          onValueChange={(value) => setNewTraining({ ...newTraining, is_mandatory: value })}
                          disabled={addingTraining}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Izaberite" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">Obavezna</SelectItem>
                            <SelectItem value="false">Preporučena</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setShowAddDialog(false)}
                      disabled={addingTraining}
                    >
                      Otkaži
                    </Button>
                    <Button
                      onClick={handleAddTraining}
                      disabled={addingTraining || !newTraining.code || !newTraining.name}
                      className="gap-2"
                    >
                      {addingTraining ? (
                        <>
                          <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                          Dodavanje...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          Dodaj Obuku
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <CardDescription>
              Lista obuka koje su trenutno obavezne za ovu poziciju
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedTrainings.length === 0 ? (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
                <p className="text-muted-foreground">Nema odabranih obaveznih obuka</p>
                <Button
                  onClick={() => setShowAddDialog(true)}
                  variant="outline"
                  className="mt-4 gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Dodaj prvu obuku
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedTrainings.map(trainingId => {
                  const training = trainingTypes.find(t => t.id === trainingId)
                  if (!training) return null
                  
                  return (
                    <div
                      key={trainingId}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{training.name}</p>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <span className="font-mono">{training.code}</span>
                          {training.category && (
                            <Badge variant="outline" className="text-xs">
                              {getCategoryLabel(training.category)}
                            </Badge>
                          )}
                          {training.training_type && (
                            <Badge variant="secondary" className="text-xs">
                              {getTrainingTypeLabel(training.training_type)}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleTrainingToggle(trainingId)}
                        disabled={saving}
                        className="h-8 w-8 ml-2 flex-shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}

            <Separator className="my-6" />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Ukupno obuka:</span>
                <span className="font-semibold">{selectedTrainings.length}</span>
              </div>
              
              <Button
                onClick={handleSave}
                disabled={saving || loading}
                className="w-full gap-2"
              >
                {saving ? (
                  <>
                    <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    Čuvanje...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Sačuvaj promjene
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                className="w-full gap-2"
                asChild
              >
                <Link href="/dashboard/training-types">
                  <Plus className="h-4 w-4" />
                  Upravljaj tipovima obuka
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}