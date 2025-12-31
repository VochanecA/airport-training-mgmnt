"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  ArrowLeft, Plus, Briefcase, GraduationCap, User, Mail, Phone, Calendar,
  X, Save, Loader2
} from "lucide-react"
import Link from "next/link"

interface NewStaffFormData {
  employee_number: string
  first_name: string
  last_name: string
  email: string
  phone: string
  position_id: string
  staff_type: 'employee' | 'subcontractor' | 'seasonal' | 'external'
  status: 'active' | 'inactive' | 'terminated'
  hire_date: string
  termination_date: string
  department?: string
  required_trainings: string[] // IDs of required training types
}

interface WorkingPosition {
  id: string
  code: string
  title: string
  description?: string | null
  department?: string | null
}

interface TrainingType {
  id: string
  code: string
  name: string
  description?: string | null
  training_type?: string
  category?: string
  is_mandatory?: boolean
}

interface NewPositionFormData {
  code: string
  title: string
  description: string
  department: string
}

export default function NewStaffPage() {
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [workingPositions, setWorkingPositions] = useState<WorkingPosition[]>([])
  const [trainingTypes, setTrainingTypes] = useState<TrainingType[]>([])
  const [loadingData, setLoadingData] = useState(true)
  
  // Stanje za modal/dialog za novu poziciju
  const [showNewPositionModal, setShowNewPositionModal] = useState(false)
  const [creatingPosition, setCreatingPosition] = useState(false)
  const [newPositionError, setNewPositionError] = useState("")
  const [newPositionForm, setNewPositionForm] = useState<NewPositionFormData>({
    code: "",
    title: "",
    description: "",
    department: ""
  })

  const [formData, setFormData] = useState<NewStaffFormData>({
    employee_number: "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    position_id: "",
    staff_type: "employee",
    status: "active",
    hire_date: new Date().toISOString().split('T')[0],
    termination_date: "",
    department: "",
    required_trainings: [],
  })

  // Učitavanje radnih pozicija i tipova obuka
  const loadPositionsAndTrainings = async () => {
    try {
      setLoadingData(true)
      
      // Učitaj radne pozicije
      const { data: positionsData, error: positionsError } = await supabase
        .from("working_positions")
        .select("id, code, title, description, department")
        .eq("is_active", true)
        .order("title")
      
      if (positionsError) {
        console.error("Error loading working positions:", positionsError)
      } else {
        setWorkingPositions(positionsData || [])
      }
      
      // Učitaj tipove obuka
      const { data: trainingsData, error: trainingsError } = await supabase
        .from("training_types")
        .select("id, code, name, description, training_type, category, is_mandatory")
        .eq("is_active", true)
        .order("name")
      
      if (trainingsError) {
        console.error("Error loading training types:", trainingsError)
      } else {
        setTrainingTypes(trainingsData || [])
      }
    } catch (err) {
      console.error("Error loading data:", err)
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => {
    loadPositionsAndTrainings()
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      // 1. Prvo kreirajte osoblje (staff)
      const { data: staffData, error: staffError } = await supabase
        .from("staff")
        .insert([{
          employee_number: formData.employee_number,
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email || null,
          phone: formData.phone || null,
          position_id: formData.position_id || null,
          staff_type: formData.staff_type,
          status: formData.status,
          hire_date: formData.hire_date,
          termination_date: formData.termination_date || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
        .select()

      if (staffError) {
        console.error("Error creating staff:", staffError)
        throw staffError
      }

      const staffId = staffData?.[0]?.id
      if (!staffId) throw new Error("Failed to create staff member")

      // 2. Dodajte zahteve za obuke za poziciju (samo ako je pozicija izabrana)
      if (formData.position_id && formData.required_trainings.length > 0) {
        const positionRequirements = formData.required_trainings.map(trainingTypeId => ({
          position_id: formData.position_id,
          training_type_id: trainingTypeId,
          is_mandatory: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }))

        const { error: requirementsError } = await supabase
          .from("position_required_training")
          .insert(positionRequirements)

        if (requirementsError) {
          console.error("Error adding training requirements:", requirementsError)
          // Ne bacajte grešku, samo logujte
        }
      }

      // 3. Preusmerite na listu zaposlenih
      router.push("/dashboard/employees")
      router.refresh()
    } catch (err: unknown) {
      console.error("Full error:", err)
      if (err instanceof Error) {
        setError(err.message || "Došlo je do greške pri čuvanju zaposlenog")
      } else {
        setError("Došlo je do nepoznate greške pri čuvanju zaposlenog")
      }
    } finally {
      setLoading(false)
    }
  }

  // Funkcija za kreiranje nove pozicije
  const handleCreateNewPosition = async () => {
    setNewPositionError("")
    setCreatingPosition(true)
    
    try {
      // Validacija
      if (!newPositionForm.code.trim()) {
        throw new Error("Kod pozicije je obavezan")
      }
      if (!newPositionForm.title.trim()) {
        throw new Error("Naziv pozicije je obavezan")
      }

      // Kreiraj novu poziciju
      const { data, error } = await supabase
        .from("working_positions")
        .insert([{
          code: newPositionForm.code,
          title: newPositionForm.title,
          description: newPositionForm.description || null,
          department: newPositionForm.department || null,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
        .select()

      if (error) throw error
      
      if (data && data.length > 0) {
        const newPosition = data[0]
        
        // Dodaj novu poziciju u listu
        setWorkingPositions(prev => [newPosition, ...prev])
        
        // Postavi novu poziciju kao izabranu u formi
        setFormData(prev => ({
          ...prev,
          position_id: newPosition.id
        }))
        
        // Resetuj i zatvori modal
        setNewPositionForm({
          code: "",
          title: "",
          description: "",
          department: ""
        })
        setShowNewPositionModal(false)
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setNewPositionError(err.message)
      } else {
        setNewPositionError("Došlo je do greške pri kreiranju pozicije")
      }
    } finally {
      setCreatingPosition(false)
    }
  }

  const handleTrainingToggle = (trainingTypeId: string) => {
    setFormData(prev => {
      const isSelected = prev.required_trainings.includes(trainingTypeId)
      if (isSelected) {
        return {
          ...prev,
          required_trainings: prev.required_trainings.filter(id => id !== trainingTypeId)
        }
      } else {
        return {
          ...prev,
          required_trainings: [...prev.required_trainings, trainingTypeId]
        }
      }
    })
  }

  // Grupiši obuke po kategoriji za bolju organizaciju
  const trainingsByCategory = trainingTypes.reduce((acc, training) => {
    const category = training.category || 'other'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(training)
    return acc
  }, {} as Record<string, TrainingType[]>)

  // Prevedi kategorije na srpski
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

  // Generiši kod pozicije na osnovu naziva
  const generatePositionCode = (title: string) => {
    if (!title.trim()) return ""
    
    // Izdvoj prva slova svake riječi i pretvori u velika slova
    const words = title.split(' ')
    const initials = words.map(word => word.charAt(0).toUpperCase()).join('')
    
    // Dodaj broj ako već postoji pozicija sa sličnim kodom
    const existingCodes = workingPositions.map(p => p.code)
    let code = initials
    let counter = 1
    
    while (existingCodes.includes(code)) {
      code = `${initials}${counter}`
      counter++
    }
    
    return code
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
          <h1 className="text-3xl font-bold tracking-tight">Novi Zaposleni</h1>
          <p className="text-muted-foreground">Dodajte novog zaposlenog u sistem</p>
        </div>
      </div>

      {/* Modal za novu poziciju */}
      {showNewPositionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Nova Radna Pozicija</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowNewPositionModal(false)}
                  disabled={creatingPosition}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {newPositionError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{newPositionError}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="position-code">
                    Kod pozicije <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="position-code"
                      value={newPositionForm.code}
                      onChange={(e) => {
                        const value = e.target.value.toUpperCase()
                        setNewPositionForm(prev => ({ ...prev, code: value }))
                      }}
                      placeholder="Npr. PILOT, FOO, STW"
                      className="font-mono"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const generatedCode = generatePositionCode(newPositionForm.title)
                        setNewPositionForm(prev => ({ ...prev, code: generatedCode }))
                      }}
                      disabled={!newPositionForm.title.trim()}
                    >
                      Generiši
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="position-title">
                    Naziv pozicije <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="position-title"
                    value={newPositionForm.title}
                    onChange={(e) => {
                      const value = e.target.value
                      setNewPositionForm(prev => ({ ...prev, title: value }))
                    }}
                    placeholder="Npr. Pilot, Stewardesa, Serviser"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="position-department">Odjeljenje/Odsjek</Label>
                  <Input
                    id="position-department"
                    value={newPositionForm.department}
                    onChange={(e) => 
                      setNewPositionForm(prev => ({ ...prev, department: e.target.value }))
                    }
                    placeholder="Npr. Operacije, Održavanje, Služba putnika"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="position-description">Opis pozicije</Label>
                  <Textarea
                    id="position-description"
                    value={newPositionForm.description}
                    onChange={(e) => 
                      setNewPositionForm(prev => ({ ...prev, description: e.target.value }))
                    }
                    placeholder="Detaljan opis radne pozicije, odgovornosti..."
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="flex gap-3 pt-6">
                <Button
                  onClick={handleCreateNewPosition}
                  disabled={creatingPosition}
                  className="flex-1"
                >
                  {creatingPosition ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Kreiranje...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Kreiraj Poziciju
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowNewPositionModal(false)}
                  disabled={creatingPosition}
                >
                  Otkaži
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Osnovni podaci */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Osnovni podaci
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="employee_number">
                    Broj zaposlenog <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="employee_number"
                    value={formData.employee_number}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      setFormData({ ...formData, employee_number: e.target.value })
                    }
                    required
                    disabled={loading}
                    placeholder="Npr. EMP-001"
                    className="font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="first_name">
                    Ime <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      setFormData({ ...formData, first_name: e.target.value })
                    }
                    required
                    disabled={loading}
                    placeholder="Ime"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_name">
                    Prezime <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      setFormData({ ...formData, last_name: e.target.value })
                    }
                    required
                    disabled={loading}
                    placeholder="Prezime"
                  />
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
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      setFormData({ ...formData, email: e.target.value })
                    }
                    disabled={loading}
                    placeholder="ime.prezime@aerodrom.me"
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
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    disabled={loading}
                    placeholder="+382 67 XXX XXX"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hire_date" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Datum zaposlenja
                  </Label>
                  <Input
                    id="hire_date"
                    type="date"
                    value={formData.hire_date}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      setFormData({ ...formData, hire_date: e.target.value })
                    }
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="termination_date">Datum prestanka rada</Label>
                  <Input
                    id="termination_date"
                    type="date"
                    value={formData.termination_date}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      setFormData({ ...formData, termination_date: e.target.value })
                    }
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="staff_type">Tip zaposlenog</Label>
                  <Select
                    value={formData.staff_type}
                    onValueChange={(value: NewStaffFormData['staff_type']) => 
                      setFormData({ ...formData, staff_type: value })
                    }
                    disabled={loading}
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
                    onValueChange={(value: NewStaffFormData['status']) => 
                      setFormData({ ...formData, status: value })
                    }
                    disabled={loading}
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
            </CardContent>
          </Card>

          {/* Informacije o poziciji i obukama */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Radna Pozicija
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="position_id">Pozicija</Label>
                  <div className="flex gap-2">
                    {loadingData ? (
                      <div className="text-sm text-muted-foreground flex-1">Učitavanje pozicija...</div>
                    ) : (
                      <Select
                        value={formData.position_id}
                        onValueChange={(value: string) => 
                          setFormData({ ...formData, position_id: value, required_trainings: [] })
                        }
                        disabled={loading}
                        // className="flex-1"
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Izaberite poziciju" />
                        </SelectTrigger>
                        <SelectContent>
                          {workingPositions.map((position) => (
                            <SelectItem key={position.id} value={position.id}>
                              <div className="flex flex-col">
                                <span className="font-medium">{position.title}</span>
                                <span className="text-xs text-muted-foreground">
                                  {position.code} • {position.department || 'N/A'}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setShowNewPositionModal(true)}
                      disabled={loading}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    Izaberite postojeću poziciju ili kliknite "+" da kreirate novu
                  </div>
                </div>

                {formData.position_id && (
                  <div className="text-sm text-muted-foreground pt-2 border-t">
                    <div className="font-medium">Opis pozicije:</div>
                    {workingPositions.find(p => p.id === formData.position_id)?.description || 
                     "Nema opisa za ovu poziciju."}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Obavezne Obuke za Poziciju
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingData ? (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    Učitavanje tipova obuka...
                  </div>
                ) : !formData.position_id ? (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    Izaberite poziciju da biste videli obavezne obuke
                  </div>
                ) : trainingTypes.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    Nema dostupnih tipova obuka
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                    {Object.entries(trainingsByCategory).map(([category, trainings]) => (
                      <div key={category} className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-700">
                          {getCategoryLabel(category)}
                        </h4>
                        <div className="space-y-2">
                          {trainings.map((training) => (
                            <div key={training.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`training-${training.id}`}
                                checked={formData.required_trainings.includes(training.id)}
                                onCheckedChange={() => handleTrainingToggle(training.id)}
                                disabled={loading}
                              />
                              <Label
                                htmlFor={`training-${training.id}`}
                                className="text-sm font-normal cursor-pointer flex-1"
                              >
                                <div className="flex flex-col">
                                  <span className="font-medium">{training.name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {training.code} • {training.is_mandatory ? 'Obavezna' : 'Preporučena'}
                                  </span>
                                </div>
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {formData.required_trainings.length > 0 && (
                  <div className="pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Izabrano: {formData.required_trainings.length} obuka
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex gap-3 pt-6 border-t">
          <Button 
            type="submit" 
            disabled={loading}
            className="min-w-[150px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                Čuvanje...
              </span>
            ) : "Sačuvaj Zaposlenog"}
          </Button>
          <Link href="/dashboard/employees">
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
    </div>
  )
}