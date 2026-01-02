// app/dashboard/instructors/[id]/edit/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Save, AlertCircle } from "lucide-react"
import Link from "next/link"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Skeleton } from "@/components/ui/skeleton"
import { MultiSelect } from "@/components/ui/multi-select"

interface InstructorFormData {
  staff_id: string
  instructor_code: string
  specializations: string[]
  certification_number: string
  certification_expiry: string
  status: string
}

export default function EditInstructorPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [instructor, setInstructor] = useState<any>(null)
  
  const [formData, setFormData] = useState<InstructorFormData>({
    staff_id: "",
    instructor_code: "",
    specializations: [],
    certification_number: "",
    certification_expiry: "",
    status: "active"
  })

  const [customSpecialization, setCustomSpecialization] = useState("")
  const instructorId = params.id as string

  useEffect(() => {
    if (instructorId) {
      fetchInstructor()
    }
  }, [instructorId])

  const fetchInstructor = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from("instructors")
        .select(`
          *,
          staff:staff_id (
            employee_number,
            first_name,
            last_name,
            email
          )
        `)
        .eq("id", instructorId)
        .single()

      if (error) throw error
      if (!data) throw new Error("Instruktor nije pronađen")

      setInstructor(data)
      setFormData({
        staff_id: data.staff_id,
        instructor_code: data.instructor_code || "",
        specializations: data.specializations || [],
        certification_number: data.certification_number || "",
        certification_expiry: data.certification_expiry ? 
          new Date(data.certification_expiry).toISOString().split('T')[0] : "",
        status: data.status
      })

    } catch (err) {
      console.error("Error fetching instructor:", err)
      setError(err instanceof Error ? err.message : "Došlo je do greške")
    } finally {
      setLoading(false)
    }
  }

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const instructorData = {
        ...formData,
        certification_expiry: formData.certification_expiry || null,
        specializations: formData.specializations.length > 0 ? formData.specializations : null
      }

      const { error } = await supabase
        .from("instructors")
        .update(instructorData)
        .eq("id", instructorId)

      if (error) throw error

      router.push(`/dashboard/instructors/${instructorId}`)
      router.refresh()
      
    } catch (err) {
      console.error("Error updating instructor:", err)
      setError(err instanceof Error ? err.message : "Došlo je do greške prilikom ažuriranja")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded" />
          <Skeleton className="h-10 w-64" />
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !instructor) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/instructors">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Uredi Instruktora</h1>
          </div>
        </div>
        
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || "Instruktor nije pronađen"}
          </AlertDescription>
        </Alert>
        
        <Link href="/dashboard/instructors">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Nazad na listu instruktora
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/instructors/${instructorId}`}>
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Uredi Instruktora</h1>
          <p className="text-muted-foreground">
            {instructor.staff ? 
              `${instructor.staff.first_name} ${instructor.staff.last_name}` : 
              "Uređivanje podataka o instruktoru"}
          </p>
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
                <Label>Zaposleni</Label>
                <div className="p-3 bg-gray-50 rounded border">
                  <div className="font-medium">
                    {instructor.staff?.first_name} {instructor.staff?.last_name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {instructor.staff?.employee_number} • {instructor.staff?.email}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Zaposleni se ne može promeniti nakon kreiranja instruktora
                </p>
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
                    { value: "safety", label: "Bezbednost" },
                    { value: "technical", label: "Tehnički trening" },
                    { value: "operations", label: "Operacije" },
                    { value: "customer_service", label: "Korisnički servis" },
                    { value: "management", label: "Menadžment" },
                    { value: "emergency", label: "Hitne situacije" },
                    { value: "security", label: "Sigurnost" },
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

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Link href={`/dashboard/instructors/${instructorId}`}>
              <Button type="button" variant="outline">
                Otkaži
              </Button>
            </Link>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2"></span>
                  Čuvanje...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Sačuvaj Promene
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}