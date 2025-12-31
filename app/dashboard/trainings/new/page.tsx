"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Plus, AlertCircle, Info } from "lucide-react"
import Link from "next/link"
import { AddTrainingTypeDialog } from "@/components/add-training-type-dialog"

interface NewTrainingFormData {
  training_type_id: string
  title: string
  description: string
  instructor: string
  location: string
  start_date: string
  end_date: string
  capacity: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
}

interface TrainingType {
  id: string
  code: string
  name: string
  description?: string | null
  training_type?: string
  validity_period_months?: number
  is_mandatory?: boolean
}

export default function NewTrainingPage() {
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [trainingTypes, setTrainingTypes] = useState<TrainingType[]>([])
  const [loadingTypes, setLoadingTypes] = useState(true)
  const [tableError, setTableError] = useState("")

  // Funkcija za učitavanje tipova obuka
  const loadTrainingTypes = useCallback(async () => {
    try {
      setLoadingTypes(true)
      setTableError("")
      
      const { data, error } = await supabase
        .from("training_types")
        .select("id, code, name, description, training_type, validity_period_months, is_mandatory")
        .eq("is_active", true)
        .order("name")
      
      if (error) {
        console.error("Error loading training types:", error)
        // Proverite da li tabela postoji
        if (error.code === '42P01') { // relation does not exist
          setTableError("Tabela 'training_types' ne postoji. Koristite SQL skriptu da je kreirate.")
        } else {
          setTableError(`Greška: ${error.message}`)
        }
        return
      }
      
      setTrainingTypes(data || [])
    } catch (err: unknown) {
      console.error("Exception loading training types:", err)
      setTableError("Došlo je do greške pri povezivanju sa bazom")
    } finally {
      setLoadingTypes(false)
    }
  }, [supabase])

  // Učitaj tipove prilikom montiranja komponente
  useEffect(() => {
    loadTrainingTypes()
  }, [loadTrainingTypes])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      // Prvo proverite da li postoji tabela trainings
      const { error: tableCheckError } = await supabase
        .from("trainings")
        .select("id")
        .limit(1)

      if (tableCheckError && tableCheckError.code === '42P01') {
        throw new Error("Tabela 'trainings' ne postoji. Kreirajte je u Supabase.")
      }

      const { error: insertError } = await supabase.from("trainings").insert([
        {
          training_type_id: formData.training_type_id,
          title: formData.title,
          description: formData.description,
          instructor: formData.instructor,
          location: formData.location,
          start_date: formData.start_date,
          end_date: formData.end_date,
          capacity: formData.capacity ? Number.parseInt(formData.capacity) : null,
          status: formData.status,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])

      if (insertError) {
        throw new Error(`Greška pri čuvanju: ${insertError.message}`)
      }

      router.push("/dashboard/trainings")
      router.refresh()
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Došlo je do nepoznate greške")
      }
    } finally {
      setLoading(false)
    }
  }

  const [formData, setFormData] = useState<NewTrainingFormData>({
    training_type_id: "",
    title: "",
    description: "",
    instructor: "",
    location: "",
    start_date: "",
    end_date: "",
    capacity: "",
    status: "scheduled",
  })

  const getTrainingTypeLabel = (type?: string) => {
    const labels: Record<string, string> = {
      'initial': 'Initial Training',
      'recurrent': 'Recurrent Training',
      're_qualification': 'Re-qualification Training',
      'update': 'Update Training',
      'ojt': 'OJT (On-the-Job)',
      'refresher': 'Refresher Training',
      'conversion': 'Conversion Training',
    }
    return type ? labels[type] || type : 'N/A'
  }

  const getValidityText = (months?: number) => {
    if (!months) return 'Nema isteka'
    
    const years = Math.floor(months / 12)
    const remainingMonths = months % 12
    
    if (years > 0 && remainingMonths > 0) {
      return `${years} god. ${remainingMonths} mes.`
    } else if (years > 0) {
      return `${years} godina`
    } else {
      return `${months} meseci`
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/trainings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nova Obuka</h1>
          <p className="text-muted-foreground">Kreirajte novu obuku prema IATA AHM 1110 standardu</p>
        </div>
      </div>

      {tableError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium mb-1">Problem sa bazom podataka</div>
            <div className="text-sm mb-2">{tableError}</div>
            <div className="text-xs space-y-1">
              <p>Da biste kreirali potrebne tabele, koristite SQL Editor u Supabase:</p>
              <ol className="list-decimal list-inside ml-2 space-y-1">
                <li>Idite u SQL Editor u Supabase Dashboard</li>
                <li>Kopirajte SQL skriptu za kreiranje tabela</li>
                <li>Izvršite skriptu</li>
              </ol>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Detalji Obuke</span>
            <AddTrainingTypeDialog onTrainingTypeAdded={loadTrainingTypes} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>
                  <div className="font-medium">Greška pri čuvanju</div>
                  <div className="text-sm mt-1">{error}</div>
                </AlertDescription>
              </Alert>
            )}

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="training_type_id">
                    Tip Obuke (prema IATA AHM 1110) <span className="text-red-500">*</span>
                  </Label>
                  {trainingTypes.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {trainingTypes.length} tipova dostupno
                    </span>
                  )}
                </div>
                
                {loadingTypes ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent"></div>
                    Učitavanje tipova obuka...
                  </div>
                ) : trainingTypes.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-4 text-center">
                    <Info className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="font-medium">Nema tipova obuka</p>
                    <p className="text-sm text-muted-foreground mt-1 mb-3">
                      Da biste kreirali obuku, prvo morate dodati tip obuke.
                    </p>
                    <AddTrainingTypeDialog onTrainingTypeAdded={loadTrainingTypes} />
                  </div>
                ) : (
                  <Select
                    value={formData.training_type_id}
                    onValueChange={(value: string) => setFormData({ ...formData, training_type_id: value })}
                    required
                    disabled={loading}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Izaberite tip obuke" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {trainingTypes.map((type: TrainingType) => (
                        <SelectItem key={type.id} value={type.id} className="py-3">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium truncate">{type.name}</span>
                              {type.is_mandatory && (
                                <span className="text-xs bg-red-100 text-red-800 px-1.5 py-0.5 rounded">
                                  Obavezna
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                                {type.code}
                              </span>
                              <span>•</span>
                              <span>{getTrainingTypeLabel(type.training_type)}</span>
                              <span>•</span>
                              <span>Važi: {getValidityText(type.validity_period_months)}</span>
                            </div>
                            {type.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {type.description}
                              </p>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                
                {!loadingTypes && trainingTypes.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Info className="h-3 w-3" />
                    <span>Tip obuke određuje validnost sertifikata i zahteve za obnovu</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">
                  Naziv obuke <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, title: e.target.value })}
                  required
                  disabled={loading}
                  placeholder="Npr. Ramp Safety Awareness Training"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instructor">Instruktor / Trainer</Label>
                <Input
                  id="instructor"
                  value={formData.instructor}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, instructor: e.target.value })}
                  disabled={loading}
                  placeholder="Ime i prezime instruktora"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Opis obuke (syllabus)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  disabled={loading}
                  placeholder="Detaljan opis obuke, ciljevi, sadržaj, materijali..."
                  className="resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Lokacija (venue)</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, location: e.target.value })}
                  disabled={loading}
                  placeholder="Npr. Training Room A, Main Terminal"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacity">Kapacitet (max participants)</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.capacity}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, capacity: e.target.value })}
                  disabled={loading}
                  placeholder="Npr. 20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="start_date">
                  Datum i vreme početka <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="start_date"
                  type="datetime-local"
                  value={formData.start_date}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, start_date: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_date">
                  Datum i vreme kraja <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="end_date"
                  type="datetime-local"
                  value={formData.end_date}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, end_date: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status (phase)</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value: NewTrainingFormData['status']) => setFormData({ ...formData, status: value })}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled (Planirano)</SelectItem>
                    <SelectItem value="in_progress">In Progress (U toku)</SelectItem>
                    <SelectItem value="completed">Completed (Završeno)</SelectItem>
                    <SelectItem value="cancelled">Cancelled (Otkazano)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3 pt-6 border-t">
              <Button 
                type="submit" 
                disabled={loading || trainingTypes.length === 0}
                className="min-w-[150px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                    Čuvanje...
                  </span>
                ) : "Sačuvaj Obuku"}
              </Button>
              <Link href="/dashboard/trainings">
                <Button 
                  type="button" 
                  variant="outline" 
                  disabled={loading}
                >
                  Otkaži
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}