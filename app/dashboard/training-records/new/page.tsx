// app/dashboard/training-records/new/page.tsx
"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User, GraduationCap, Target, Award, Search, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

// Define interface for validation errors
interface ValidationErrors {
  staff_id?: string
  training_title?: string
  training_date?: string
  passing_score?: string
  actual_score?: string
  trainer_name?: string
  location?: string
  training_provider?: string
  training_hours_total?: string
  [key: string]: string | undefined
}

// Kreirajte zasebnu komponentu koja koristi useSearchParams
function NewTrainingRecordContent() {
  const router = useRouter()
  const searchParams = useSearchParams() // Sada je ovo unutar Suspense boundary
  const supabase = getSupabaseBrowserClient()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})
  
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

  // Postavi staff_id iz URL parametra kada se komponenta učita
  useEffect(() => {
    const staffIdFromParams = searchParams.get("staff_id")
    if (staffIdFromParams) {
      setFormData(prev => ({ ...prev, staff_id: staffIdFromParams }))
    }
  }, [searchParams])

  // Automatski izračunaj ukupne sate
  useEffect(() => {
    const totalHours = (formData.training_hours_theory || 0) + 
                      (formData.training_hours_practical || 0) + 
                      (formData.training_hours_ojt || 0)
    
    // Ako treba, možete ažurirati formData sa ukupnim satima
  }, [formData.training_hours_theory, formData.training_hours_practical, formData.training_hours_ojt])

  // Učitaj podatke
  useEffect(() => {
    loadData()
  }, [])

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
      // Učitaj zaposlene
      const { data: staffData } = await supabase
        .from("staff")
        .select("id, first_name, last_name, employee_number")
        .eq("status", "active")
        .order("last_name")
      
      // Učitaj tipove treninga iz training_types tabele
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
      setFilteredTrainingTypes(typesData || []) // Postavi inicijalno filtrirane tipove
      setInstructors(instructorsData || [])
    } catch (err) {
      console.error("Error loading data:", err)
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
        // Automatski postavi satnice ako postoje
        training_hours_theory: selectedType.hours_initial_total || 0,
        training_hours_ojt: selectedType.hours_ojt_total || 0,
        // Možete dodati i druge automatske postavke ovdje
      }))
      
      // Očisti grešku za training_title ako postoji
      if (validationErrors.training_title) {
        setValidationErrors(prev => ({ ...prev, training_title: undefined }))
      }
    }
  }

  // Validacija forme
  const validateForm = (): boolean => {
    const errors: ValidationErrors = {}
    
    // 8.2.a - Zaposleni (REQUIRED)
    if (!formData.staff_id.trim()) {
      errors.staff_id = "Morate odabrati zaposlenog"
    }
    
    // 8.2.b - Naziv treninga (REQUIRED)
    if (!formData.training_title.trim()) {
      errors.training_title = "Naziv treninga je obavezan"
    }
    
    // 8.2.c - Datum treninga (REQUIRED)
    if (!formData.training_date) {
      errors.training_date = "Datum treninga je obavezan"
    } else {
      const selectedDate = new Date(formData.training_date)
      const today = new Date()
      if (selectedDate > today) {
        errors.training_date = "Datum treninga ne može biti u budućnosti"
      }
    }
    
    // 8.2.d - Kompetencije (opciono, ali ako je competency_achieved true, onda je level REQUIRED)
    if (formData.competency_achieved && !formData.competency_level.trim()) {
      errors.competency_level = "Nivo kompetencije je obavezan kada su kompetencije dokazane"
    }
    
    // 8.2.e - Passing score i actual score (REQUIRED kada je status 'completed')
    if (formData.status === 'completed') {
      if (formData.passing_score === null || formData.passing_score === undefined) {
        errors.passing_score = "Minimalni prolazni rezultat je obavezan za završeni trening"
      } else if (formData.passing_score < 0 || formData.passing_score > 100) {
        errors.passing_score = "Minimalni prolazni rezultat mora biti između 0 i 100"
      }
      
      if (formData.actual_score === null || formData.actual_score === undefined) {
        errors.actual_score = "Postignuti rezultat je obavezan za završeni trening"
      } else if (formData.score_type === 'percentage' && (formData.actual_score < 0 || formData.actual_score > 100)) {
        errors.actual_score = "Postignuti rezultat mora biti između 0 i 100"
      }
    }
    
    // 8.2.f - Instruktor (REQUIRED - bar jedan od dva)
    if (!formData.trainer_id && !formData.trainer_name.trim()) {
      errors.trainer_name = "Morate unijeti ili odabrati instruktora"
    }
    
    // Dodatna validacija za satnice
    const totalHours = (formData.training_hours_theory || 0) + 
                      (formData.training_hours_practical || 0) + 
                      (formData.training_hours_ojt || 0)
    
    if (totalHours <= 0) {
      errors.training_hours_total = "Ukupno trajanje treninga mora biti veće od 0"
    }
    
    // Validacija za location (REQUIRED)
    if (!formData.location.trim()) {
      errors.location = "Lokacija treninga je obavezna"
    }
    
    // Validacija za training_provider (REQUIRED)
    if (!formData.training_provider.trim()) {
      errors.training_provider = "Organizator treninga je obavezan"
    }
    
    // Validacija za training_end_date (ako je unesen, mora biti poslije training_date)
    if (formData.training_end_date && formData.training_date) {
      const startDate = new Date(formData.training_date)
      const endDate = new Date(formData.training_end_date)
      if (endDate < startDate) {
        errors.training_end_date = "Završni datum ne može biti prije početnog datuma"
      }
    }
    
    // Validacija za validity_months (ako je unesen, mora biti pozitivan broj)
    if (formData.validity_months !== null && formData.validity_months <= 0) {
      errors.validity_months = "Validnost mora biti pozitivan broj mjeseci"
    }
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Clear validation error when field changes
  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      // Validacija forme
      if (!validateForm()) {
        setError("Popravite greške u formi prije čuvanja")
        setLoading(false)
        return
      }

      // Konvertuj string datume u Date objekte
      const trainingDate = formData.training_date ? new Date(formData.training_date) : null
      const trainingEndDate = formData.training_end_date ? new Date(formData.training_end_date) : null
      const trainerSignatureDate = formData.trainer_signature_date ? new Date(formData.trainer_signature_date) : null
      const traineeSignatureDate = formData.trainee_signature_date ? new Date(formData.trainee_signature_date) : null

      if (!trainingDate) throw new Error("Datum treninga nije validan")

      // Pripremi podatke za slanje
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
        competency_level: formData.competency_level.trim() || null,
        competency_notes: formData.competency_notes.trim() || null,
        
        trainer_id: formData.trainer_id || null,
        trainer_name: formData.trainer_name.trim() || null,
        
        trainer_signature_date: trainerSignatureDate,
        trainee_signature_date: traineeSignatureDate,
        signature_notes: formData.signature_notes.trim() || null,
        
        training_hours_theory: formData.training_hours_theory || 0,
        training_hours_practical: formData.training_hours_practical || 0,
        training_hours_ojt: formData.training_hours_ojt || 0,
        training_hours_total: (formData.training_hours_theory || 0) + 
                            (formData.training_hours_practical || 0) + 
                            (formData.training_hours_ojt || 0),
        
        training_method: formData.training_method,
        location: formData.location.trim(),
        training_provider: formData.training_provider.trim(),
        
        status: formData.status,
        notes: formData.notes.trim() || null,
        
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: (await supabase.auth.getUser()).data.user?.id || null,
      }

      // Pošalji podatke
      const { data, error } = await supabase
        .from("training_records")
        .insert([trainingData])
        .select()

      if (error) throw error

      setSuccess("Trening uspješno zabilježen!")
      
      // Preusmjeri na listu treninga nakon 2 sekunde
      setTimeout(() => {
        router.push("/dashboard/training-records")
      }, 2000)

    } catch (err: any) {
      console.error("Error saving training:", err)
      setError(err.message || "Došlo je do greške pri čuvanju treninga")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Novi Zapisnik o obuci - Evidencija</h1>
          <p className="text-muted-foreground">
            Evidencija treninga prema zahtjevima 8.2 Records Identification
            <span className="text-red-500 ml-2">* Obavezna polja</span>
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          Nazad
        </Button>
      </div>

      {/* Poruke */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
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
                    onValueChange={(value) => handleFieldChange("staff_id", value)}
                  >
                    <SelectTrigger className={validationErrors.staff_id ? "border-red-500" : ""}>
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
                  {validationErrors.staff_id && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {validationErrors.staff_id}
                    </p>
                  )}
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
                    
                    {/* Polje za unos ako želite ručno unijeti */}
                    <div className="mt-2">
                      <Label htmlFor="training_title_input">
                        Ili unesite ručno naziv treninga: <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="training_title_input"
                        value={formData.training_title}
                        onChange={(e) => handleFieldChange("training_title", e.target.value)}
                        placeholder="Unesite naziv treninga..."
                        className={cn("mt-1", validationErrors.training_title && "border-red-500")}
                      />
                      {validationErrors.training_title && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {validationErrors.training_title}
                        </p>
                      )}
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
                    onChange={(e) => handleFieldChange("training_date", e.target.value)}
                    className={validationErrors.training_date ? "border-red-500" : ""}
                    required
                  />
                  {validationErrors.training_date && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {validationErrors.training_date}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="training_end_date">
                    Završni datum
                  </Label>
                  <Input
                    id="training_end_date"
                    type="date"
                    value={formData.training_end_date}
                    onChange={(e) => handleFieldChange("training_end_date", e.target.value)}
                    className={validationErrors.training_end_date ? "border-red-500" : ""}
                  />
                  {validationErrors.training_end_date && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {validationErrors.training_end_date}
                    </p>
                  )}
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
                    onChange={(e) => handleFieldChange("validity_months", e.target.value ? parseInt(e.target.value) : null)}
                    className={validationErrors.validity_months ? "border-red-500" : ""}
                    placeholder="Npr. 12, 24..."
                  />
                  {validationErrors.validity_months && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {validationErrors.validity_months}
                    </p>
                  )}
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
                    onValueChange={(value) => handleFieldChange("score_type", value)}
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
                  <Label>
                    Minimalni prolazni rezultat 
                    {formData.status === 'completed' && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    max={formData.score_type === "percentage" ? "100" : undefined}
                    value={formData.passing_score || ""}
                    onChange={(e) => handleFieldChange("passing_score", e.target.value ? parseInt(e.target.value) : null)}
                    className={validationErrors.passing_score ? "border-red-500" : ""}
                    placeholder={formData.score_type === "percentage" ? "70" : "Minimalni broj bodova"}
                  />
                  {validationErrors.passing_score && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {validationErrors.passing_score}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>
                    Postignuti rezultat 
                    {formData.status === 'completed' && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    max={formData.score_type === "percentage" ? "100" : undefined}
                    value={formData.actual_score || ""}
                    onChange={(e) => handleFieldChange("actual_score", e.target.value ? parseFloat(e.target.value) : null)}
                    className={validationErrors.actual_score ? "border-red-500" : ""}
                    placeholder="Unesite rezultat"
                  />
                  {validationErrors.actual_score && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {validationErrors.actual_score}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label>
                    Nivo kompetencije
                    {formData.competency_achieved && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  <Select
                    value={formData.competency_level}
                    onValueChange={(value) => handleFieldChange("competency_level", value)}
                  >
                    <SelectTrigger className={validationErrors.competency_level ? "border-red-500" : ""}>
                      <SelectValue placeholder="Odaberite nivo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Osnovni</SelectItem>
                      <SelectItem value="intermediate">Srednji</SelectItem>
                      <SelectItem value="advanced">Napredni</SelectItem>
                      <SelectItem value="expert">Ekspert</SelectItem>
                    </SelectContent>
                  </Select>
                  {validationErrors.competency_level && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {validationErrors.competency_level}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="competency_achieved"
                    checked={formData.competency_achieved}
                    onChange={(e) => handleFieldChange("competency_achieved", e.target.checked)}
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
                  onChange={(e) => handleFieldChange("competency_notes", e.target.value)}
                  placeholder="Detaljni opis postignutih kompetencija..."
                  rows={3}
                />
              </div>
            </div>

            {/* Sekcija 4: Instruktor */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                8.2.f - Instruktor/trening lider <span className="text-red-500">*</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Interni instruktor</Label>
                  <Select
                    value={formData.trainer_id}
                    onValueChange={(value) => handleFieldChange("trainer_id", value)}
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
                  <Label>Ime eksternog instruktora <span className="text-red-500">*</span></Label>
                  <Input
                    value={formData.trainer_name}
                    onChange={(e) => handleFieldChange("trainer_name", e.target.value)}
                    placeholder="Ime i prezime eksternog instruktora"
                    className={validationErrors.trainer_name ? "border-red-500" : ""}
                  />
                  {validationErrors.trainer_name && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {validationErrors.trainer_name}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Morate unijeti bar jednog instruktora (internog ili eksternog)
                  </p>
                </div>
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
                    onValueChange={(value) => handleFieldChange("training_method", value)}
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
                  <Label>Status <span className="text-red-500">*</span></Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleFieldChange("status", value)}
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
                  <Label htmlFor="location">
                    Lokacija <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleFieldChange("location", e.target.value)}
                    placeholder="Gdje je trening održan"
                    className={validationErrors.location ? "border-red-500" : ""}
                  />
                  {validationErrors.location && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {validationErrors.location}
                    </p>
                  )}
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
                    onChange={(e) => handleFieldChange("training_hours_theory", parseFloat(e.target.value) || 0)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Praksa (sati)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    value={formData.training_hours_practical}
                    onChange={(e) => handleFieldChange("training_hours_practical", parseFloat(e.target.value) || 0)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>OJT (sati)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    value={formData.training_hours_ojt}
                    onChange={(e) => handleFieldChange("training_hours_ojt", parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label className="font-medium">Ukupno sati: </Label>
                  <span className="text-lg font-bold">
                    {(formData.training_hours_theory || 0) + 
                     (formData.training_hours_practical || 0) + 
                     (formData.training_hours_ojt || 0)}
                  </span>
                  {validationErrors.training_hours_total && (
                    <span className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {validationErrors.training_hours_total}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="training_provider">
                    Organizator treninga <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="training_provider"
                    value={formData.training_provider}
                    onChange={(e) => handleFieldChange("training_provider", e.target.value)}
                    placeholder="Organizacija koja je sprovela trening"
                    className={validationErrors.training_provider ? "border-red-500" : ""}
                  />
                  {validationErrors.training_provider && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {validationErrors.training_provider}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label>Bilješke</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => handleFieldChange("notes", e.target.value)}
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
                    Čuvanje...
                  </>
                ) : (
                  "Sačuvaj Trening Zapisnik"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Otkaži
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

// Glavna komponenta koja wrapuje u Suspense
export default function NewTrainingRecordPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Učitavanje forme za novi trening...</p>
        </div>
      </div>
    }>
      <NewTrainingRecordContent />
    </Suspense>
  )
}