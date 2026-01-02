// app/dashboard/instructors/new/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Save, AlertCircle } from "lucide-react"
import Link from "next/link"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { MultiSelect } from "@/components/ui/multi-select"

interface StaffMember {
  id: string
  employee_number: string
  first_name: string
  last_name: string
  email: string | null
  is_instructor?: boolean
  position_id: string | null
  status: string
}

export default function NewInstructorPage() {
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([])
  const [staffLoading, setStaffLoading] = useState(true)
  
  // Form state
  const [formData, setFormData] = useState({
    staff_id: "",
    instructor_code: "",
    specializations: [] as string[],
    certification_number: "",
    certification_expiry: "",
    status: "active"
  })

  const [customSpecialization, setCustomSpecialization] = useState("")

  // Fetch staff members for selection
  useEffect(() => {
    fetchStaffMembers()
  }, [])

// Izmenite fetchStaffMembers funkciju da uključi informaciju o tome ko je već instruktor
const fetchStaffMembers = async () => {
  try {
    // Prvo dohvatite sve zaposlene
    const { data: staffData, error: staffError } = await supabase
      .from("staff")
      .select("id, employee_number, first_name, last_name, email, position_id, status")
      .order("last_name")

    if (staffError) throw staffError

    // Zatim dohvatite sve instruktore da biste znali koji zaposleni već jesu instruktori
    const { data: instructorsData } = await supabase
      .from("instructors")
      .select("staff_id")

    const instructorIds = instructorsData?.map(i => i.staff_id) || []

    // Dodajte polje is_instructor svakom zaposlenom
    const enrichedStaff = (staffData || []).map(staff => ({
      ...staff,
      is_instructor: instructorIds.includes(staff.id)
    }))

    setStaffMembers(enrichedStaff)
  } catch (err) {
    console.error("Error fetching staff:", err)
    setError("Greška pri učitavanju zaposlenih")
  } finally {
    setStaffLoading(false)
  }
}
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSpecializationsChange = (values: string[]) => {
    setFormData(prev => ({
      ...prev,
      specializations: values
    }))
  }

  const addCustomSpecialization = () => {
    if (customSpecialization.trim() && !formData.specializations.includes(customSpecialization.trim())) {
      setFormData(prev => ({
        ...prev,
        specializations: [...prev.specializations, customSpecialization.trim()]
      }))
      setCustomSpecialization("")
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validate required fields
      if (!formData.staff_id) {
        throw new Error("Izaberite zaposlenog")
      }

      // Prepare instructor data
      const instructorData = {
        ...formData,
        certification_expiry: formData.certification_expiry || null,
        specializations: formData.specializations.length > 0 ? formData.specializations : null
      }

      // Insert into database
      const { data, error } = await supabase
        .from("instructors")
        .insert([instructorData])
        .select()

      if (error) throw error

      // Redirect to instructor details or list
      router.push(`/dashboard/instructors/${data[0].id}`)
      router.refresh()
      
    } catch (err) {
      console.error("Error creating instructor:", err)
      setError(err instanceof Error ? err.message : "Došlo je do greške prilikom kreiranja instruktora")
    } finally {
      setLoading(false)
    }
  }

  // Get selected staff member details
  const selectedStaff = staffMembers.find(s => s.id === formData.staff_id)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/instructors">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dodaj Novog Instruktora</h1>
          <p className="text-muted-foreground">Unesite podatke o novom instruktoru</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Osnovne Informacije</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="staff_id">Zaposleni *</Label>
      <Select 
  value={formData.staff_id} 
  onValueChange={(value) => handleSelectChange("staff_id", value)}
  disabled={staffLoading}
>
  <SelectTrigger>
    <SelectValue placeholder="Izaberite zaposlenog" />
  </SelectTrigger>
  <SelectContent>
    {staffMembers
      .filter(staff => staff.status === 'active')
      .map(staff => (
        <SelectItem key={staff.id} value={staff.id}>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span>{staff.first_name} {staff.last_name} ({staff.employee_number})</span>
              {staff.is_instructor && (
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                  Već instruktor
                </span>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {staff.email || "Nema email"}
            </span>
          </div>
        </SelectItem>
      ))}
  </SelectContent>
</Select>
                {selectedStaff && (
                  <div className="text-sm text-muted-foreground mt-2 p-2 bg-gray-50 rounded">
                    <p>Email: {selectedStaff.email || "Nije dostupno"}</p>
                    <p>Status: {selectedStaff.status}</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="instructor_code">Kod Instruktora</Label>
                  <Input
                    id="instructor_code"
                    name="instructor_code"
                    value={formData.instructor_code}
                    onChange={handleInputChange}
                    placeholder="INST-001"
                  />
                  <p className="text-xs text-muted-foreground">
                    Jedinstveni identifikacioni kod instruktora
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="certification_number">Broj Sertifikata</Label>
                  <Input
                    id="certification_number"
                    name="certification_number"
                    value={formData.certification_number}
                    onChange={handleInputChange}
                    placeholder="CERT-2024-001"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="certification_expiry">Datum Isteka Sertifikata</Label>
                  <Input
                    id="certification_expiry"
                    name="certification_expiry"
                    type="date"
                    value={formData.certification_expiry}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value) => handleSelectChange("status", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Aktivan</SelectItem>
                      <SelectItem value="inactive">Neaktivan</SelectItem>
                      <SelectItem value="pending">Na čekanju</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Specializations */}
          <Card>
            <CardHeader>
              <CardTitle>Specijalizacije i Oblast Instruiranja</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Specijalizacije</Label>
                <MultiSelect
                  options={[
                    { value: "safety", label: "Sigurnost" },
                    { value: "dgr", label: "DGR trening" },
                    { value: "medical", label: "Prva pomoc" },
                    { value: "technical", label: "Tehnički trening" },
                    { value: "operations", label: "Operacije" },
                    { value: "prm_service", label: "PRM servis" },
                    { value: "management", label: "Menadžment" },
                    { value: "emergency", label: "Emergencz Response" },
                    { value: "security", label: "Bezbjednost" },
                    { value: "sms", label: "SMS trening" },
                    { value: "cyber", label: "Cyber sigurnost" },
                    { value: "wildlife", label: "Wildlife trening" },
                    { value: "winter", label: "Winter operations trening" },
                    { value: "aviation", label: "Avijacija" },
                  ]}
                  selected={formData.specializations}
                  onChange={handleSpecializationsChange}
                  placeholder="Izaberite specijalizacije..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customSpecialization">Dodaj Novu Specijalizaciju</Label>
                <div className="flex gap-2">
                  <Input
                    id="customSpecialization"
                    value={customSpecialization}
                    onChange={(e) => setCustomSpecialization(e.target.value)}
                    placeholder="Unesite novu specijalizaciju"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addCustomSpecialization()
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addCustomSpecialization}
                    disabled={!customSpecialization.trim()}
                  >
                    Dodaj
                  </Button>
                </div>
              </div>

              {formData.specializations.length > 0 && (
                <div>
                  <Label>Odabrane specijalizacije:</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.specializations.map((spec, index) => (
                      <div
                        key={index}
                        className="px-3 py-1 bg-primary text-primary-foreground text-sm rounded-full flex items-center gap-1"
                      >
                        {spec}
                        <button
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              specializations: prev.specializations.filter((_, i) => i !== index)
                            }))
                          }}
                          className="ml-1 hover:text-red-200"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle>Dodatne Informacije</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notes">Napomene</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="Dodatne napomene o instruktoru..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Link href="/dashboard/instructors">
              <Button type="button" variant="outline">
                Otkaži
              </Button>
            </Link>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2"></span>
                  Čuvanje...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Sačuvaj Instruktora
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}