"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Calendar, Save, User, BookOpen } from "lucide-react"
import Link from "next/link"

interface StaffMember {
  id: string
  first_name: string
  last_name: string
  employee_number: string
}

interface TrainingType {
  id: string
  code: string
  name: string
  validity_months?: number
}

export default function AddTrainingPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [staff, setStaff] = useState<StaffMember | null>(null)
  const [trainingTypes, setTrainingTypes] = useState<TrainingType[]>([])
  
  const [formData, setFormData] = useState({
    training_type_id: "",
    completed_date: new Date().toISOString().split('T')[0],
    notes: ""
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        
        // Učitaj zaposlenog
        const { data: staffData, error: staffError } = await supabase
          .from("staff")
          .select("id, first_name, last_name, employee_number")
          .eq("id", params.id)
          .single()

        if (staffError) throw staffError
        setStaff(staffData)

        // Učitaj tipove obuka
        const { data: trainingsData, error: trainingsError } = await supabase
          .from("training_types")
          .select("id, code, name, validity_months")
          .eq("is_active", true)
          .order("name")

        if (trainingsError) throw trainingsError
        setTrainingTypes(trainingsData || [])

      } catch (err: any) {
        setError(err.message || "Greška pri učitavanju podataka")
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      loadData()
    }
  }, [params.id])

  const calculateExpiryDate = (completedDate: string, validityMonths: number = 12) => {
    const date = new Date(completedDate)
    date.setMonth(date.getMonth() + validityMonths)
    return date.toISOString().split('T')[0]
  }

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setError("")
  setSaving(true)

  try {
    if (!formData.training_type_id) {
      throw new Error("Odaberite tip obuke")
    }

    const selectedTraining = trainingTypes.find(t => t.id === formData.training_type_id)
    if (!selectedTraining) {
      throw new Error("Odabrana obuka ne postoji")
    }

    const expiresDate = calculateExpiryDate(
      formData.completed_date,
      selectedTraining.validity_months || 12
    )

    // Dodaj obuku zaposlenom
    const { error: insertError } = await supabase
      .from("training_certificate_records")
      .insert({
        staff_id: params.id,
        training_master_id: formData.training_type_id, // Ovo može biti training_type_id
        completion_date: formData.completed_date, // Promenjeno sa completed_date na completion_date
        expiry_date: expiresDate,
        issue_date: formData.completed_date, // Dodato: datum izdavanja je isti kao datum završetka
        notes: formData.notes || null,
        status: 'valid'
      })

    if (insertError) {
      if (insertError.code === '23505') {
        throw new Error("Ovaj zaposleni već ima ovu obuku")
      }
      throw insertError
    }

    // Vrati se na profil zaposlenog
    router.push(`/dashboard/employees/${params.id}`)
    router.refresh()

  } catch (err: any) {
    setError(err.message || "Došlo je do greške pri čuvanju obuke")
  } finally {
    setSaving(false)
  }
}

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-2 text-muted-foreground">Učitavanje...</p>
        </div>
      </div>
    )
  }

  if (!staff) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold">Zaposleni nije pronađen</h3>
        <Link href="/dashboard/employees">
          <Button variant="outline" className="mt-4">
            Nazad na listu
          </Button>
        </Link>
      </div>
    )
  }

  const selectedTraining = trainingTypes.find(t => t.id === formData.training_type_id)

  return (
    <div className="container mx-auto py-6 max-w-3xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/dashboard/employees/${params.id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dodaj Obuku</h1>
          <p className="text-muted-foreground">
            Za: {staff.first_name} {staff.last_name} ({staff.employee_number})
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Nova Obuka
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="training_type">Tip Obuke *</Label>
                <Select
                  value={formData.training_type_id}
                  onValueChange={(value) => setFormData({ ...formData, training_type_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Odaberite tip obuke" />
                  </SelectTrigger>
                  <SelectContent>
                    {trainingTypes.map((training) => (
                      <SelectItem key={training.id} value={training.id}>
                        <div className="flex flex-col">
                          <span>{training.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {training.code} • {training.validity_months || 12} mjeseci
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="completed_date" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Datum Završetka *
                </Label>
                <Input
                  id="completed_date"
                  type="date"
                  value={formData.completed_date}
                  onChange={(e) => setFormData({ ...formData, completed_date: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Napomene</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Dodatne informacije o obuci..."
                  rows={3}
                />
              </div>

              {/* Preview sekcija */}
              {formData.training_type_id && formData.completed_date && selectedTraining && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-800 mb-2">Pregled obuke:</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Obuka:</span>
                      <p className="font-medium">{selectedTraining.name}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Šifra:</span>
                      <p className="font-mono">{selectedTraining.code}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Datum završetka:</span>
                      <p>{new Date(formData.completed_date).toLocaleDateString('sr-RS')}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Važi do:</span>
                      <p className="font-semibold">
                        {calculateExpiryDate(formData.completed_date, selectedTraining.validity_months || 12)
                          .split('-')
                          .reverse()
                          .join('.')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={saving} className="gap-2">
                {saving ? (
                  <>
                    <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    Čuvanje...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Sačuvaj Obuku
                  </>
                )}
              </Button>
              <Link href={`/dashboard/employees/${params.id}`}>
                <Button type="button" variant="outline">
                  Otkaži
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}