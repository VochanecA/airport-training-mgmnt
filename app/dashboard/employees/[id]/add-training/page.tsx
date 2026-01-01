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
import { Badge } from "@/components/ui/badge" // DODAJ OVAJ IMPORT
import { ArrowLeft, Calendar, Save, BookOpen, Plus, GraduationCap, AlertTriangle } from "lucide-react"
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
  validity_period_months?: number
  description?: string
  training_type?: string
  category?: string
}

export default function AddTrainingPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>("")
  const [staff, setStaff] = useState<StaffMember | null>(null)
  const [trainingTypes, setTrainingTypes] = useState<TrainingType[]>([])
  
  const [formData, setFormData] = useState({
    training_type_id: "", // Ovo je id iz training_types
    completion_date: new Date().toISOString().split('T')[0],
    notes: "",
    certificate_number: "",
    grade: "",
    training_provider: "",
    instructor_name: ""
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

        if (staffError) {
          console.error("Greška pri učitavanju zaposlenog:", staffError)
          throw new Error(`Greška pri učitavanju zaposlenog: ${staffError.message}`)
        }
        
        if (!staffData) {
          throw new Error("Zaposleni nije pronađen")
        }
        
        setStaff(staffData)

        // Učitaj dostupne tipove obuka iz training_types
        const { data: trainingTypesData, error: trainingTypesError } = await supabase
          .from("training_types")
          .select("id, code, name, validity_period_months, description, training_type, category")
          .eq("is_active", true)
          .order("name")

        if (trainingTypesError) {
          console.error("Greška pri učitavanju tipova obuka:", trainingTypesError)
          throw new Error(`Greška pri učitavanju dostupnih obuka: ${trainingTypesError.message}`)
        }
        
        setTrainingTypes(trainingTypesData || [])

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Došlo je do nepoznate greške"
        setError(errorMessage)
        console.error("Greška pri učitavanju podataka:", err)
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      loadData()
    }
  }, [params.id, supabase])

  const calculateExpiryDate = (completionDate: string, validityMonths: number = 12): string => {
    const date = new Date(completionDate)
    date.setMonth(date.getMonth() + (validityMonths || 12))
    return date.toISOString().split('T')[0]
  }

  const formatDateForDisplay = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('sr-RS', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSaving(true)

    try {
      // Validacija
      if (!formData.training_type_id) {
        throw new Error("Odaberite tip obuke")
      }

      if (!formData.completion_date) {
        throw new Error("Datum završetka je obavezan")
      }

      // Pronađi odabrani tip obuke
      const selectedTrainingType = trainingTypes.find(t => t.id === formData.training_type_id)
      if (!selectedTrainingType) {
        throw new Error("Odabrani tip obuke ne postoji")
      }

      // Izračunaj datum isteka
      const expiresDate = calculateExpiryDate(
        formData.completion_date,
        selectedTrainingType.validity_period_months || 12
      )

      // PRVO: Proveri da li postoji odgovarajući trening u training_certificates_master
      const { data: existingCertificateMaster, error: checkError } = await supabase
        .from("training_certificates_master")
        .select("id")
        .eq("code", selectedTrainingType.code)
        .single()

      let training_master_id: string

      if (checkError || !existingCertificateMaster) {
        // Ako ne postoji, kreiraj novi trening u training_certificates_master
        const { data: newCertificateMaster, error: createError } = await supabase
          .from("training_certificates_master")
          .insert({
            code: selectedTrainingType.code,
            title: selectedTrainingType.name,
            description: selectedTrainingType.description || null,
            validity_months: selectedTrainingType.validity_period_months || 12,
            is_active: true,
            is_mandatory: true
          })
          .select()
          .single()

        if (createError) {
          throw new Error(`Greška pri kreiranju treninga: ${createError.message}`)
        }

        training_master_id = newCertificateMaster.id
      } else {
        training_master_id = existingCertificateMaster.id
      }

      // Kreiraj trening record za zaposlenog
      const recordData = {
        staff_id: params.id,
        training_master_id: training_master_id,
        completion_date: formData.completion_date,
        expiry_date: expiresDate,
        issue_date: formData.completion_date,
        notes: formData.notes.trim() || null,
        grade: formData.grade.trim() || null,
        training_provider: formData.training_provider.trim() || null,
        instructor_name: formData.instructor_name.trim() || null,
        status: 'valid',
        ...(formData.certificate_number.trim() && { 
          certificate_number: formData.certificate_number.trim()
        })
      }

      console.log("Podaci za unos u training_certificate_records:", recordData)

      const { error: insertError } = await supabase
        .from("training_certificate_records")
        .insert(recordData)

      if (insertError) {
        console.error("Detalji greške pri unosu:", insertError)
        
        if (insertError.code === '23505') {
          throw new Error("Već postoji zapis sa istim sertifikatom za ovog zaposlenog")
        } else if (insertError.code === '23503') {
          throw new Error("Greška u referenci. Proverite da li trening postoji u tabeli training_certificates_master.")
        }
        
        throw new Error(`Greška pri čuvanju: ${insertError.message}`)
      }

      // Vrati se na profil zaposlenog
      router.push(`/dashboard/employees/${params.id}`)
      router.refresh()

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Došlo je do greške pri čuvanju obuke"
      setError(errorMessage)
      console.error("Greška pri čuvanju obuke:", err)
    } finally {
      setSaving(false)
    }
  }

  const selectedTrainingType = trainingTypes.find(t => t.id === formData.training_type_id)
  const expiryDate = selectedTrainingType && formData.completion_date 
    ? calculateExpiryDate(formData.completion_date, selectedTrainingType.validity_period_months || 12)
    : null

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-2 text-muted-foreground">Učitavanje podataka...</p>
        </div>
      </div>
    )
  }

  if (!staff) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold">Zaposleni nije pronađen</h3>
        <p className="text-muted-foreground mb-4">ID: {params.id}</p>
        <Link href="/dashboard/employees">
          <Button variant="outline" className="mt-4">
            Nazad na listu zaposlenih
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/dashboard/employees/${params.id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dodaj Obuku / Sertifikat</h1>
          <p className="text-muted-foreground">
            Za zaposlenog: <span className="font-semibold">{staff.first_name} {staff.last_name}</span> ({staff.employee_number})
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Dodaj Novu Obuku
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Informativna poruka o sistemu */}
            <Alert className="bg-blue-50 border-blue-200">
              <AlertTriangle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                Obuka će biti automatski sinhronizovana sa master listom treninga.
              </AlertDescription>
            </Alert>

            {/* Poruka ako nema tipova obuka */}
            {trainingTypes.length === 0 && (
              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertDescription className="text-yellow-800">
                  <div className="flex flex-col gap-3">
                    <p className="font-medium">Nema definisanih tipova obuka!</p>
                    <p>Morate prvo da dodate tipove obuka kroz stranicu "Tipovi Obuka".</p>
                    <div className="flex gap-3 mt-2">
                      <Link href="/dashboard/training-types">
                        <Button size="sm" className="gap-1 bg-yellow-600 hover:bg-yellow-700">
                          <BookOpen className="h-3 w-3" />
                          Dodaj Tipove Obuka
                        </Button>
                      </Link>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Leva kolona - Forma */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-medium text-lg">Podaci o obuci</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="training_type_id">
                      Izaberite tip obuke <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.training_type_id}
                      onValueChange={(value) => setFormData({ 
                        ...formData, 
                        training_type_id: value 
                      })}
                      required
                      disabled={trainingTypes.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={trainingTypes.length === 0 ? "Nema dostupnih tipova obuka" : "Odaberite tip obuke"} />
                      </SelectTrigger>
                      <SelectContent>
                        {trainingTypes.map((trainingType) => (
                          <SelectItem key={trainingType.id} value={trainingType.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{trainingType.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {trainingType.code} • {trainingType.training_type} • {trainingType.validity_period_months || 12} meseci
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {trainingTypes.length === 0 && (
                      <p className="text-sm text-red-500">
                        Prvo dodajte tipove obuka kroz stranicu "Tipovi Obuka".
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="completion_date" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Datum završetka / polaganja <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="completion_date"
                      type="date"
                      value={formData.completion_date}
                      onChange={(e) => setFormData({ ...formData, completion_date: e.target.value })}
                      required
                      max={new Date().toISOString().split('T')[0]}
                    />
                    <p className="text-xs text-muted-foreground">
                      Datum kada je zaposleni završio obuku ili položio ispit
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="certificate_number">
                        Broj sertifikata
                      </Label>
                      <Input
                        id="certificate_number"
                        type="text"
                        value={formData.certificate_number}
                        onChange={(e) => setFormData({ ...formData, certificate_number: e.target.value })}
                        placeholder="Broj sertifikata ako postoji"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="grade">
                        Ocena
                      </Label>
                      <Input
                        id="grade"
                        type="text"
                        value={formData.grade}
                        onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                        placeholder="npr: Odličan, A, 95%"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="training_provider">
                        Organizator treninga
                      </Label>
                      <Input
                        id="training_provider"
                        type="text"
                        value={formData.training_provider}
                        onChange={(e) => setFormData({ ...formData, training_provider: e.target.value })}
                        placeholder="npr: Interni trening ili Eksterni provajder"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="instructor_name">
                        Ime instruktora
                      </Label>
                      <Input
                        id="instructor_name"
                        type="text"
                        value={formData.instructor_name}
                        onChange={(e) => setFormData({ ...formData, instructor_name: e.target.value })}
                        placeholder="Ime i prezime instruktora"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Napomene</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Dodatne informacije: lokacija, materijali, posebne napomene..."
                      rows={4}
                    />
                  </div>
                </div>
              </div>

              {/* Desna kolona - Pregled i informacije */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-medium text-lg">Pregled obuke</h3>
                  
                  {selectedTrainingType ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <h4 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          Detalji odabranog tipa obuke
                        </h4>
                        <div className="space-y-3 text-sm">
                          <div>
                            <span className="text-muted-foreground">Naziv:</span>
                            <p className="font-medium">{selectedTrainingType.name}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Šifra:</span>
                            <p className="font-mono bg-blue-100 px-2 py-1 rounded inline-block">
                              {selectedTrainingType.code}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Vrsta:</span>
                            <Badge variant="outline" className="ml-2 capitalize">
                              {selectedTrainingType.training_type?.replace('_', ' ') || 'N/A'}
                            </Badge>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Kategorija:</span>
                            <Badge variant="secondary" className="ml-2 capitalize">
                              {selectedTrainingType.category || 'N/A'}
                            </Badge>
                          </div>
                          {selectedTrainingType.description && (
                            <div className="pt-2 border-t">
                              <span className="text-muted-foreground">Opis:</span>
                              <p className="mt-1 text-gray-600 text-sm">{selectedTrainingType.description}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {expiryDate && (
                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                          <h4 className="font-medium text-green-800 mb-3">Detalji važenja</h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Datum završetka:</span>
                              <p className="font-medium">{formatDateForDisplay(formData.completion_date)}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Datum isteka:</span>
                              <p className="font-medium text-green-700">
                                {formatDateForDisplay(expiryDate)}
                              </p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Trajanje:</span>
                              <p>{selectedTrainingType.validity_period_months || 12} meseci</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Status:</span>
                              <p className="font-semibold">Važeći</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Dodatni podaci iz forme */}
                      {(formData.certificate_number || formData.grade || formData.training_provider || formData.instructor_name) && (
                        <div className="p-4 bg-gray-50 rounded-lg border">
                          <h4 className="font-medium mb-3">Dodatni podaci</h4>
                          <div className="space-y-2 text-sm">
                            {formData.certificate_number && (
                              <div>
                                <span className="text-muted-foreground">Broj sertifikata:</span>
                                <p className="font-mono">{formData.certificate_number}</p>
                              </div>
                            )}
                            {formData.grade && (
                              <div>
                                <span className="text-muted-foreground">Ocena:</span>
                                <p>{formData.grade}</p>
                              </div>
                            )}
                            {formData.training_provider && (
                              <div>
                                <span className="text-muted-foreground">Organizator:</span>
                                <p>{formData.training_provider}</p>
                              </div>
                            )}
                            {formData.instructor_name && (
                              <div>
                                <span className="text-muted-foreground">Instruktor:</span>
                                <p>{formData.instructor_name}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-8 text-center border-2 border-dashed rounded-lg">
                      <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h4 className="font-medium mb-2">Odaberite tip obuke</h4>
                      <p className="text-sm text-muted-foreground">
                        Izaberite tip obuke iz padajućeg menija da biste videli detalje
                      </p>
                    </div>
                  )}
                </div>

                {/* Brzi linkovi za dodavanje tipova obuka */}
                {trainingTypes.length === 0 && (
                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <h4 className="font-medium text-amber-800 mb-2">Kako da dodate tipove obuka:</h4>
                    <div className="space-y-2">
                      <p className="text-sm text-amber-700">
                        Prvo morate da kreirate tipove obuka kroz stranicu "Tipovi Obuka".
                      </p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <Link href="/dashboard/training-types">
                          <Button size="sm" className="gap-1 bg-amber-600 hover:bg-amber-700">
                            <BookOpen className="h-3 w-3" />
                            Upravljaj tipovima obuka
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tehničke informacije */}
            <div className="p-4 bg-gray-50 rounded-lg border">
              <h4 className="font-medium text-sm mb-2">Kako sistem radi:</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Sistem automatski kreira zapis u <code>training_certificates_master</code> ako ne postoji</li>
                <li>• Dodaje sertifikat zaposlenom u <code>training_certificate_records</code></li>
                <li>• Datum isteka se automatski izračunava na osnovu trajanja obuke</li>
                <li>• Sertifikat se označava kao "valid" prilikom kreiranja</li>
              </ul>
            </div>

            {/* Dugmad za akciju */}
            <div className="flex gap-3 pt-6 border-t">
              <Button 
                type="submit" 
                disabled={saving || trainingTypes.length === 0 || !formData.training_type_id}
                className="gap-2"
              >
                {saving ? (
                  <>
                    <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    Čuvanje...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Sačuvaj obuku zaposlenom
                  </>
                )}
              </Button>
              <Link href={`/dashboard/employees/${params.id}`}>
                <Button type="button" variant="outline">
                  Otkaži
                </Button>
              </Link>
              {trainingTypes.length > 0 && (
                <Link href="/dashboard/training-types">
                  <Button type="button" variant="outline" className="gap-1">
                    <BookOpen className="h-4 w-4" />
                    Upravljaj tipovima
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}