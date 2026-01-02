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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Save, Plus } from "lucide-react"
import Link from "next/link"

interface TrainingCertificateType {
  id: string
  code: string
  name: string
}

interface TrainingType {
  id: string
  code: string
  name: string
}

export default function NewTrainingCertificateMasterPage() {
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()
  
  const [loading, setLoading] = useState(false)
  const [loadingTypes, setLoadingTypes] = useState(true)
  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState(false)
  const [certificateTypes, setCertificateTypes] = useState<TrainingCertificateType[]>([])
  const [trainingTypes, setTrainingTypes] = useState<TrainingType[]>([])
  
  const [formData, setFormData] = useState({
    code: "",
    title: "",
    description: "",
    type_id: "",
    training_type_id: "",
    training_provider: "",
    duration_hours: "",
    validity_months: "12",
    is_mandatory: "true"
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        // Učitaj tipove certifikata
        const { data: certTypesData } = await supabase
          .from("training_certificate_types")
          .select("id, code, name")
          .eq("is_active", true)
          .order("name")

        // Učitaj tipove obuka
        const { data: trainingTypesData } = await supabase
          .from("training_types")
          .select("id, code, name")
          .eq("is_active", true)
          .order("name")

        setCertificateTypes(certTypesData || [])
        setTrainingTypes(trainingTypesData || [])
      } catch (err) {
        console.error("Greška pri učitavanju:", err)
      } finally {
        setLoadingTypes(false)
      }
    }

    loadData()
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      // Validacija
      if (!formData.code.trim()) {
        throw new Error("Šifra je obavezna")
      }
      if (!formData.title.trim()) {
        throw new Error("Naziv je obavezan")
      }

      const { error: insertError } = await supabase
        .from("training_certificates_master")
        .insert({
          code: formData.code.trim(),
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          type_id: formData.type_id || null,
          training_provider: formData.training_provider.trim() || null,
          duration_hours: formData.duration_hours ? parseFloat(formData.duration_hours) : null,
          validity_months: parseInt(formData.validity_months) || 12,
          is_mandatory: formData.is_mandatory === "true",
          is_active: true
        })

      if (insertError) {
        if (insertError.code === '23505') {
          throw new Error("Trening sa ovom šifrom već postoji")
        }
        throw new Error(`Greška pri čuvanju: ${insertError.message}`)
      }

      setSuccess(true)
      
      // Vrati se na listu
      setTimeout(() => {
        router.push("/dashboard/training-certificates")
      }, 1500)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Došlo je do greške"
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (loadingTypes) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-2 text-muted-foreground">Učitavanje...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/training-certificates">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dodaj Novi Trening</h1>
          <p className="text-muted-foreground">
            Dodajte novu vrstu treninga/certifikata koji se može dodeliti zaposlenima
          </p>
        </div>
      </div>

      {success && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">
            Trening je uspešno dodat! Preusmeravam na listu...
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Osnovni podaci o treningu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">
                    Šifra treninga <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="npr: SAFETY-001"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Jedinstvena šifra za ovaj trening
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">
                    Naziv treninga <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="npr: Osnovna bezbednost na radu"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Opis treninga</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detaljan opis treninga, ciljevi, teme..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type_id">Tip certifikata</Label>
                  <Select
                    value={formData.type_id}
                    onValueChange={(value) => setFormData({ ...formData, type_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Izaberite tip certifikata" />
                    </SelectTrigger>
                    <SelectContent>
                      {certificateTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name} ({type.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="training_provider">Organizator/Pružalac</Label>
                  <Input
                    id="training_provider"
                    value={formData.training_provider}
                    onChange={(e) => setFormData({ ...formData, training_provider: e.target.value })}
                    placeholder="npr: Company ABC ili Interni trening"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration_hours">Trajanje (sati)</Label>
                  <Input
                    id="duration_hours"
                    type="number"
                    min="0"
                    step="0.5"
                    value={formData.duration_hours}
                    onChange={(e) => setFormData({ ...formData, duration_hours: e.target.value })}
                    placeholder="npr: 8"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="validity_months">
                    Važi (meseci) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="validity_months"
                    type="number"
                    min="1"
                    max="120"
                    value={formData.validity_months}
                    onChange={(e) => setFormData({ ...formData, validity_months: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="is_mandatory">Obavezan?</Label>
                  <Select
                    value={formData.is_mandatory}
                    onValueChange={(value) => setFormData({ ...formData, is_mandatory: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Izaberite" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Da</SelectItem>
                      <SelectItem value="false">Ne</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading} className="gap-2">
                {loading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    Čuvanje...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Sačuvaj Trening
                  </>
                )}
              </Button>
              <Link href="/dashboard/training-certificates">
                <Button type="button" variant="outline">
                  Otkaži
                </Button>
              </Link>
              <Link href="/dashboard/training-types">
                <Button type="button" variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Tipovi obuka
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}