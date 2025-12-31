"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
  Trash2
} from "lucide-react"
import Link from "next/link"

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
  duration_days?: number
  validity_months?: number
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

  const positionId = params.id as string

  // Učitaj podatke
  useEffect(() => {
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

        // Učitaj sve tipove obuka
        const { data: trainingsData, error: trainingsError } = await supabase
          .from("training_types")
          .select("*")
          .eq("is_active", true)
          .order("name")

        if (trainingsError) throw trainingsError
        setTrainingTypes(trainingsData || [])

        // Učitaj obavezne obuke za ovu poziciju
        const { data: requiredData, error: requiredError } = await supabase
          .from("position_required_training")
          .select(`
            id,
            training_type_id,
            is_mandatory,
            created_at,
            training_type:training_type_id (*)
          `)
          .eq("position_id", positionId)

        if (requiredError) throw requiredError
        
        setRequiredTrainings(requiredData || [])
        
        // Postavi selektovane obuke
        const selectedIds = (requiredData || []).map(rt => rt.training_type_id)
        setSelectedTrainings(selectedIds)

      } catch (err: any) {
        console.error("Error loading data:", err)
        setError(err.message || "Došlo je do greške pri učitavanju podataka")
      } finally {
        setLoading(false)
      }
    }

    if (positionId) {
      loadData()
    }
  }, [positionId])

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
          training_type_id: trainingId,
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

  // Dobij jedinstvene kategorije i tipove za filtere
  const categories = Array.from(new Set(trainingTypes.map(t => t.category).filter(Boolean) as string[]))
  const types = Array.from(new Set(trainingTypes.map(t => t.training_type).filter(Boolean) as string[]))

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
              <p className="text-lg font-semibold">{requiredTrainings.length}</p>
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
                <Label htmlFor="category-filter" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Kategorija
                </Label>
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
                <Label htmlFor="type-filter" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Tip obuke
                </Label>
                <select
                  id="type-filter"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="all">Svi tipovi</option>
                  {types.map(type => (
                    <option key={type} value={type}>{type}</option>
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
                              <Label
                                htmlFor={`training-${training.id}`}
                                className="font-medium cursor-pointer"
                              >
                                {training.name}
                              </Label>
                              <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                                <span className="font-mono">{training.code}</span>
                                {training.duration_days && (
                                  <>
                                    <Separator orientation="vertical" className="h-3" />
                                    <Clock className="h-3 w-3" />
                                    <span>{training.duration_days} dana</span>
                                  </>
                                )}
                                {training.validity_months && (
                                  <>
                                    <Separator orientation="vertical" className="h-3" />
                                    <CheckCircle className="h-3 w-3" />
                                    <span>Važi {training.validity_months} mjeseci</span>
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
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Obavezne Obuke za Poziciju
            </CardTitle>
            <CardDescription>
              Lista obuka koje su trenutno obavezne za ovu poziciju
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedTrainings.length === 0 ? (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
                <p className="text-muted-foreground">Nema odabranih obaveznih obuka</p>
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
                      <div>
                        <p className="font-medium">{training.name}</p>
                        <div className="text-sm text-muted-foreground">
                          <span className="font-mono">{training.code}</span>
                          {training.category && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              {getCategoryLabel(training.category)}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleTrainingToggle(trainingId)}
                        disabled={saving}
                        className="h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4" />
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

// Dodajte Label komponentu ako već nije importovana
import { Label } from "@/components/ui/label"