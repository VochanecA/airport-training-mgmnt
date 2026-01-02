"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User, GraduationCap, Target, Award, Search, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

export default function EditTrainingRecordPage() {
  const router = useRouter()
  const params = useParams()
  const trainingId = params.id as string
  const supabase = getSupabaseBrowserClient()
  
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  
  const [staffList, setStaffList] = useState<any[]>([])
  const [trainingTypes, setTrainingTypes] = useState<any[]>([])
  const [instructors, setInstructors] = useState<any[]>([])
  
  // State za pretragu tipova treninga
  const [trainingTypeSearch, setTrainingTypeSearch] = useState("")
  const [filteredTrainingTypes, setFilteredTrainingTypes] = useState<any[]>([])
  
  const [formData, setFormData] = useState({
    staff_id: "",
    training_title: "",
    training_type_id: "",
    training_date: "",
    training_end_date: "",
    validity_months: null as number | null,
    
    passing_score: null as number | null,
    actual_score: null as number | null,
    score_type: "percentage",
    
    competency_achieved: false,
    competency_level: "",
    competency_notes: "",
    
    trainer_id: "",
    trainer_name: "",
    
    trainer_signature_date: "",
    trainee_signature_date: "",
    signature_notes: "",
    
    training_hours_theory: 0,
    training_hours_practical: 0,
    training_hours_ojt: 0,
    
    training_method: "classroom",
    location: "",
    training_provider: "",
    
    status: "completed",
    notes: "",
  })

  // Učitaj podatke i postojeći trening
  useEffect(() => {
    loadData()
  }, [trainingId])

  // Filtriraj tipove treninga na osnovu pretrage
  useEffect(() => {
    if (trainingTypeSearch.trim() === "") {
      setFilteredTrainingTypes(trainingTypes)
    } else {
      const filtered = trainingTypes.filter(type => 
        type.name.toLowerCase().includes(trainingTypeSearch.toLowerCase()) ||
        type.code.toLowerCase().includes(trainingTypeSearch.toLowerCase()) ||
        (type.description && type.description.toLowerCase().includes(trainingTypeSearch.toLowerCase()))
      )
      setFilteredTrainingTypes(filtered)
    }
  }, [trainingTypeSearch, trainingTypes])

  const loadData = async () => {
    try {
      setLoadingData(true)
      
      // Učitaj postojeći trening
      const { data: trainingData, error: trainingError } = await supabase
        .from("training_records")
        .select("*")
        .eq("id", trainingId)
        .single()

      if (trainingError) throw trainingError

      if (trainingData) {
        // Format date to YYYY-MM-DD for input type="date"
        const formatDateForInput = (date: string | null) => {
          if (!date) return ""
          return new Date(date).toISOString().split('T')[0]
        }

        setFormData({
          staff_id: trainingData.staff_id || "",
          training_title: trainingData.training_title || "",
          training_type_id: trainingData.training_type_id || "",
          training_date: formatDateForInput(trainingData.training_date),
          training_end_date: formatDateForInput(trainingData.training_end_date),
          validity_months: trainingData.validity_months,
          
          passing_score: trainingData.passing_score,
          actual_score: trainingData.actual_score,
          score_type: trainingData.score_type || "percentage",
          
          competency_achieved: trainingData.competency_achieved || false,
          competency_level: trainingData.competency_level || "",
          competency_notes: trainingData.competency_notes || "",
          
          trainer_id: trainingData.trainer_id || "",
          trainer_name: trainingData.trainer_name || "",
          
          trainer_signature_date: formatDateForInput(trainingData.trainer_signature_date),
          trainee_signature_date: formatDateForInput(trainingData.trainee_signature_date),
          signature_notes: trainingData.signature_notes || "",
          
          training_hours_theory: trainingData.training_hours_theory || 0,
          training_hours_practical: trainingData.training_hours_practical || 0,
          training_hours_ojt: trainingData.training_hours_ojt || 0,
          
          training_method: trainingData.training_method || "classroom",
          location: trainingData.location || "",
          training_provider: trainingData.training_provider || "",
          
          status: trainingData.status || "completed",
          notes: trainingData.notes || "",
        })
      }

      // Učitaj zaposlene
      const { data: staffData } = await supabase
        .from("staff")
        .select("id, first_name, last_name, employee_number")
        .eq("status", "active")
        .order("last_name")
      
      // Učitaj tipove treninga
      const { data: typesData } = await supabase
        .from("training_types")
        .select("id, name, code, description, training_type, category, validity_period_months, hours_initial_total, hours_recurrent_total, hours_ojt_total")
        .eq("is_active", true)
        .order("name")
      
      // Učitaj instruktore
      const { data: instructorsData } = await supabase
        .from("instructors")
        .select(`
          id,
          staff:staff_id (id, first_name, last_name)
        `)
        .eq("status", "active")
      
      setStaffList(staffData || [])
      setTrainingTypes(typesData || [])
      setFilteredTrainingTypes(typesData || [])
      setInstructors(instructorsData || [])
      
    } catch (err: any) {
      console.error("Error loading data:", err)
      setError("Došlo je do greške pri učitavanju podataka: " + err.message)
    } finally {
      setLoadingData(false)
    }
  }

  // Funkcija za automatsko popunjavanje podataka kada se odabere tip treninga
  const handleTrainingTypeSelect = (trainingTypeId: string) => {
    const selectedType = trainingTypes.find(type => type.id === trainingTypeId)
    if (selectedType) {
      setFormData(prev => ({
        ...prev,
        training_type_id: trainingTypeId,
        training_title: selectedType.name,
        validity_months: selectedType.validity_period_months || null,
        training_hours_theory: selectedType.hours_initial_total || 0,
        training_hours_ojt: selectedType.hours_ojt_total || 0,
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      // Validacija
      if (!formData.staff_id) throw new Error("Zaposleni je obavezan")
      if (!formData.training_title.trim()) throw new Error("Naziv treninga je obavezan")
      if (!formData.training_date) throw new Error("Datum treninga je obavezan")

      // Konvertuj string datume u Date objekte
      const trainingDate = formData.training_date ? new Date(formData.training_date) : null
      const trainingEndDate = formData.training_end_date ? new Date(formData.training_end_date) : null
      const trainerSignatureDate = formData.trainer_signature_date ? new Date(formData.trainer_signature_date) : null
      const traineeSignatureDate = formData.trainee_signature_date ? new Date(formData.trainee_signature_date) : null

      if (!trainingDate) throw new Error("Datum treninga nije validan")

      // Pripremi podatke za update
      const trainingData = {
        staff_id: formData.staff_id,
        training_title: formData.training_title.trim(),
        training_type_id: formData.training_type_id || null,
        training_date: trainingDate,
        training_end_date: trainingEndDate,
        validity_months: formData.validity_months,
        
        passing_score: formData.passing_score,
        actual_score: formData.actual_score,
        score_type: formData.score_type,
        
        competency_achieved: formData.competency_achieved,
        competency_level: formData.competency_level || null,
        competency_notes: formData.competency_notes || null,
        
        trainer_id: formData.trainer_id || null,
        trainer_name: formData.trainer_name.trim() || null,
        
        trainer_signature_date: trainerSignatureDate,
        trainee_signature_date: traineeSignatureDate,
        signature_notes: formData.signature_notes || null,
        
        training_hours_theory: formData.training_hours_theory || 0,
        training_hours_practical: formData.training_hours_practical || 0,
        training_hours_ojt: formData.training_hours_ojt || 0,
        
        training_method: formData.training_method,
        location: formData.location.trim() || null,
        training_provider: formData.training_provider.trim() || null,
        
        status: formData.status,
        notes: formData.notes.trim() || null,
        
        updated_at: new Date().toISOString(),
        updated_by: (await supabase.auth.getUser()).data.user?.id || null,
      }

      // Update podataka
      const { data, error } = await supabase
        .from("training_records")
        .update(trainingData)
        .eq("id", trainingId)
        .select()

      if (error) throw error

      setSuccess("Trening uspješno ažuriran!")
      
      // Preusmjeri na detalje nakon 2 sekunde
      setTimeout(() => {
        router.push(`/dashboard/training-records/${trainingId}`)
      }, 2000)

    } catch (err: any) {
      console.error("Error updating training:", err)
      setError(err.message || "Došlo je do greške pri čuvanju izmjena")
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Nazad
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Učitavanje...</h1>
            </div>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
              <p className="mt-2 text-muted-foreground">Učitavanje podataka...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Nazad
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Uredi Trening Zapisnik</h1>
            <p className="text-muted-foreground">Ažuriranje evidencije treninga prema zahtjevima 8.2 Records Identification</p>
          </div>
        </div>
      </div>

      {/* Poruke */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Forma */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Sekcija 1: Osnovne informacije */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <User className="h-5 w-5" />
                8.2.a - Informacije o polazniku obuke
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="staff_id">
                    Zaposleni <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.staff_id}
                    onValueChange={(value) => setFormData({...formData, staff_id: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Odaberite zaposlenog" />
                    </SelectTrigger>
                    <SelectContent>
                      {staffList.map(staff => (
                        <SelectItem key={staff.id} value={staff.id}>
                          {staff.first_name} {staff.last_name} ({staff.employee_number})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="training_title">
                    8.2.b - Naziv treninga <span className="text-red-500">*</span>
                  </Label>
                  
                  {/* Dropdown sa pretragom za tipove treninga */}
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Pretraži postojeće tipove treninga..."
                        value={trainingTypeSearch}
                        onChange={(e) => setTrainingTypeSearch(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    
                    {filteredTrainingTypes.length > 0 ? (
                      <div className="max-h-60 overflow-y-auto rounded-md border">
                        {filteredTrainingTypes.map((trainingType) => (
                          <div
                            key={trainingType.id}
                            className={`flex flex-col p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 ${
                              formData.training_type_id === trainingType.id ? 'bg-blue-50 border-blue-200' : ''
                            }`}
                            onClick={() => handleTrainingTypeSelect(trainingType.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="font-medium">{trainingType.name}</div>
                              <div className="text-xs font-mono text-muted-foreground">
                                {trainingType.code}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              {trainingType.category && (
                                <Badge variant="outline" className="text-xs">
                                  {trainingType.category}
                                </Badge>
                              )}
                              {trainingType.training_type && (
                                <Badge variant="secondary" className="text-xs">
                                  {trainingType.training_type}
                                </Badge>
                              )}
                              {trainingType.validity_period_months && (
                                <span className="text-xs text-muted-foreground">
                                  Važi {trainingType.validity_period_months} mj.
                                </span>
                              )}
                            </div>
                            {trainingType.description && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {trainingType.description.substring(0, 100)}...
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center p-4 border rounded-md">
                        <p className="text-sm text-muted-foreground mb-2">
                          Nema pronađenih tipova treninga koji odgovaraju pretrazi
                        </p>
                      </div>
                    )}
                    
                    {/* Polje za unos */}
                    <div className="mt-2">
                      <Label htmlFor="training_title_input">
                        Ili unesite ručno naziv treninga:
                      </Label>
                      <Input
                        id="training_title_input"
                        value={formData.training_title}
                        onChange={(e) => setFormData({...formData, training_title: e.target.value})}
                        placeholder="Unesite naziv treninga..."
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sekcija 2: Datum i validnost */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                8.2.c - Datum i validnost treninga
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="training_date">
                    Datum treninga <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="training_date"
                    type="date"
                    value={formData.training_date}
                    onChange={(e) => setFormData({...formData, training_date: e.target.value})}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="training_end_date">
                    Završni datum
                  </Label>
                  <Input
                    id="training_end_date"
                    type="date"
                    value={formData.training_end_date}
                    onChange={(e) => setFormData({...formData, training_end_date: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="validity_months">
                    Validnost (mjeseci)
                  </Label>
                  <Input
                    id="validity_months"
                    type="number"
                    min="0"
                    value={formData.validity_months || ""}
                    onChange={(e) => setFormData({
                      ...formData, 
                      validity_months: e.target.value ? parseInt(e.target.value) : null
                    })}
                    placeholder="Npr. 12, 24..."
                  />
                </div>
              </div>
            </div>

            {/* Sekcija 3: Rezultati i kompetencije */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Target className="h-5 w-5" />
                8.2.d & 8.2.e - Rezultati i kompetencije
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tip ocjenjivanja</Label>
                  <Select
                    value={formData.score_type}
                    onValueChange={(value: any) => setFormData({...formData, score_type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Odaberite tip" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Procenat (0-100%)</SelectItem>
                      <SelectItem value="points">Bodovi</SelectItem>
                      <SelectItem value="pass/fail">Položio/Pao</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Minimalni prolazni rezultat</Label>
                  <Input
                    type="number"
                    min="0"
                    max={formData.score_type === "percentage" ? "100" : undefined}
                    value={formData.passing_score || ""}
                    onChange={(e) => setFormData({
                      ...formData, 
                      passing_score: e.target.value ? parseInt(e.target.value) : null
                    })}
                    placeholder={formData.score_type === "percentage" ? "70" : "Minimalni broj bodova"}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Postignuti rezultat</Label>
                  <Input
                    type="number"
                    min="0"
                    max={formData.score_type === "percentage" ? "100" : undefined}
                    value={formData.actual_score || ""}
                    onChange={(e) => setFormData({
                      ...formData, 
                      actual_score: e.target.value ? parseFloat(e.target.value) : null
                    })}
                    placeholder="Unesite rezultat"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Nivo kompetencije</Label>
                  <Select
                    value={formData.competency_level}
                    onValueChange={(value) => setFormData({...formData, competency_level: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Odaberite nivo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Osnovni</SelectItem>
                      <SelectItem value="intermediate">Srednji</SelectItem>
                      <SelectItem value="advanced">Napredni</SelectItem>
                      <SelectItem value="expert">Ekspert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="competency_achieved"
                    checked={formData.competency_achieved}
                    onChange={(e) => setFormData({...formData, competency_achieved: e.target.checked})}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Label htmlFor="competency_achieved" className="text-sm font-medium">
                    8.2.d - Kompetencije dokazane
                  </Label>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Bilješke o kompetencijama</Label>
                <Textarea
                  value={formData.competency_notes}
                  onChange={(e) => setFormData({...formData, competency_notes: e.target.value})}
                  placeholder="Detaljni opis postignutih kompetencija..."
                  rows={3}
                />
              </div>
            </div>

            {/* Sekcija 4: Instruktor */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                8.2.f - Instruktor/trening lider
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Interni instruktor</Label>
                  <Select
                    value={formData.trainer_id}
                    onValueChange={(value) => setFormData({...formData, trainer_id: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Odaberite instruktora" />
                    </SelectTrigger>
                    <SelectContent>
                      {instructors.map(instructor => (
                        <SelectItem key={instructor.id} value={instructor.id}>
                          {instructor.staff.first_name} {instructor.staff.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Ime eksternog instruktora</Label>
                  <Input
                    value={formData.trainer_name}
                    onChange={(e) => setFormData({...formData, trainer_name: e.target.value})}
                    placeholder="Ime i prezime eksternog instruktora"
                  />
                </div>
              </div>
              
              {/* Potpisi */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="trainer_signature_date">
                    Datum potpisa instruktora
                  </Label>
                  <Input
                    id="trainer_signature_date"
                    type="date"
                    value={formData.trainer_signature_date}
                    onChange={(e) => setFormData({...formData, trainer_signature_date: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="trainee_signature_date">
                    Datum potpisa polaznika
                  </Label>
                  <Input
                    id="trainee_signature_date"
                    type="date"
                    value={formData.trainee_signature_date}
                    onChange={(e) => setFormData({...formData, trainee_signature_date: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Bilješke o potpisima</Label>
                <Textarea
                  value={formData.signature_notes}
                  onChange={(e) => setFormData({...formData, signature_notes: e.target.value})}
                  placeholder="Dodatne bilješke o potpisima..."
                  rows={2}
                />
              </div>
            </div>

            {/* Sekcija 5: Ostalo */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Ostale informacije</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Metoda treninga</Label>
                  <Select
                    value={formData.training_method}
                    onValueChange={(value) => setFormData({...formData, training_method: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="classroom">Predavanje</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="ojt">OJT (na radnom mjestu)</SelectItem>
                      <SelectItem value="practical">Praktični rad</SelectItem>
                      <SelectItem value="simulation">Simulacija</SelectItem>
                      <SelectItem value="workshop">Radionica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({...formData, status: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planned">Planirano</SelectItem>
                      <SelectItem value="in_progress">U toku</SelectItem>
                      <SelectItem value="completed">Završeno</SelectItem>
                      <SelectItem value="cancelled">Otkazano</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Lokacija</Label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    placeholder="Gdje je trening održan"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Teorija (sati)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    value={formData.training_hours_theory}
                    onChange={(e) => setFormData({
                      ...formData, 
                      training_hours_theory: parseFloat(e.target.value) || 0
                    })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Praksa (sati)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    value={formData.training_hours_practical}
                    onChange={(e) => setFormData({
                      ...formData, 
                      training_hours_practical: parseFloat(e.target.value) || 0
                    })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>OJT (sati)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    value={formData.training_hours_ojt}
                    onChange={(e) => setFormData({
                      ...formData, 
                      training_hours_ojt: parseFloat(e.target.value) || 0
                    })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Organizator treninga</Label>
                  <Input
                    value={formData.training_provider}
                    onChange={(e) => setFormData({...formData, training_provider: e.target.value})}
                    placeholder="Organizacija koja je sprovela trening"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Bilješke</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Dodatne bilješke o treningu..."
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Dugmad */}
            <div className="flex gap-3 pt-6 border-t">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    Ažuriranje...
                  </>
                ) : (
                  "Sačuvaj izmjene"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/dashboard/training-records/${trainingId}`)}
                disabled={loading}
              >
                Otkaži
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => router.back()}
                disabled={loading}
              >
                Obriši zapisnik
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}