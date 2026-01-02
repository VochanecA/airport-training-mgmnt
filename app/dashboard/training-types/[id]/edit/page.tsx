"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  ArrowLeft, 
  Save, 
  X,
  Clock,
  BookOpen,
  GraduationCap,
  Layers
} from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Skeleton } from "@/components/ui/skeleton"

export default function EditTrainingTypePage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    training_type: "",
    category: "",
    
    // Sati
    hours_initial_theory: "",
    hours_initial_practical: "",
    hours_initial_ojt: "",
    hours_recurrent_theory: "",
    hours_recurrent_practical: "",
    hours_recurrent_ojt: "",
    hours_re_qualification_theory: "",
    hours_re_qualification_practical: "",
    hours_re_qualification_ojt: "",
    hours_update_theory: "",
    hours_update_practical: "",
    hours_update_ojt: "",
    hours_ojt_theory: "",
    hours_ojt_practical: "",
    hours_ojt_total: "",
    
    // Validnost
    validity_period_months: "",
    renewal_notice_days: "",
    
    // Zahtevi
    is_mandatory: "true",
    difficulty_level: "basic",
    reference_standard: "",
    passing_score: "",
    requires_practical: "false",
    requires_written_exam: "false",
    is_active: "true",
  })

  useEffect(() => {
    if (id) {
      fetchTrainingType()
    }
  }, [id])

  const fetchTrainingType = async () => {
    try {
      const supabase = getSupabaseBrowserClient()
      const { data, error } = await supabase
        .from("training_types")
        .select("*")
        .eq("id", id)
        .single()

      if (error) throw error

      // Popuni formu sa podacima
      setFormData({
        code: data.code || "",
        name: data.name || "",
        description: data.description || "",
        training_type: data.training_type || "",
        category: data.category || "",
        
        hours_initial_theory: data.hours_initial_theory?.toString() || "",
        hours_initial_practical: data.hours_initial_practical?.toString() || "",
        hours_initial_ojt: data.hours_initial_ojt?.toString() || "",
        hours_recurrent_theory: data.hours_recurrent_theory?.toString() || "",
        hours_recurrent_practical: data.hours_recurrent_practical?.toString() || "",
        hours_recurrent_ojt: data.hours_recurrent_ojt?.toString() || "",
        hours_re_qualification_theory: data.hours_re_qualification_theory?.toString() || "",
        hours_re_qualification_practical: data.hours_re_qualification_practical?.toString() || "",
        hours_re_qualification_ojt: data.hours_re_qualification_ojt?.toString() || "",
        hours_update_theory: data.hours_update_theory?.toString() || "",
        hours_update_practical: data.hours_update_practical?.toString() || "",
        hours_update_ojt: data.hours_update_ojt?.toString() || "",
        hours_ojt_theory: data.hours_ojt_theory?.toString() || "",
        hours_ojt_practical: data.hours_ojt_practical?.toString() || "",
        hours_ojt_total: data.hours_ojt_total?.toString() || "",
        
        validity_period_months: data.validity_period_months?.toString() || "",
        renewal_notice_days: data.renewal_notice_days?.toString() || "",
        
        is_mandatory: data.is_mandatory?.toString() || "true",
        difficulty_level: data.difficulty_level || "basic",
        reference_standard: data.reference_standard || "",
        passing_score: data.passing_score?.toString() || "",
        requires_practical: data.requires_practical?.toString() || "false",
        requires_written_exam: data.requires_written_exam?.toString() || "false",
        is_active: data.is_active?.toString() || "true",
      })
    } catch (err) {
      console.error("Error fetching training type:", err)
      setError("Greška pri učitavanju tipa obuke")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setSaving(true)

    try {
      const supabase = getSupabaseBrowserClient()

      // Calculate total hours
      const calculateTotalHours = (theory: string, practical: string, ojt: string) => {
        const t = parseFloat(theory) || 0
        const p = parseFloat(practical) || 0
        const o = parseFloat(ojt) || 0
        return t + p + o
      }

      const updateData = {
        code: formData.code,
        name: formData.name,
        description: formData.description || null,
        training_type: formData.training_type || null,
        category: formData.category || null,
        
        // Initial Training Hours
        hours_initial_theory: formData.hours_initial_theory ? parseFloat(formData.hours_initial_theory) : null,
        hours_initial_practical: formData.hours_initial_practical ? parseFloat(formData.hours_initial_practical) : null,
        hours_initial_ojt: formData.hours_initial_ojt ? parseFloat(formData.hours_initial_ojt) : null,
        hours_initial_total: calculateTotalHours(
          formData.hours_initial_theory,
          formData.hours_initial_practical,
          formData.hours_initial_ojt
        ),
        
        // Recurrent Training Hours
        hours_recurrent_theory: formData.hours_recurrent_theory ? parseFloat(formData.hours_recurrent_theory) : null,
        hours_recurrent_practical: formData.hours_recurrent_practical ? parseFloat(formData.hours_recurrent_practical) : null,
        hours_recurrent_ojt: formData.hours_recurrent_ojt ? parseFloat(formData.hours_recurrent_ojt) : null,
        hours_recurrent_total: calculateTotalHours(
          formData.hours_recurrent_theory,
          formData.hours_recurrent_practical,
          formData.hours_recurrent_ojt
        ),
        
        // Re-qualification Training Hours
        hours_re_qualification_theory: formData.hours_re_qualification_theory ? parseFloat(formData.hours_re_qualification_theory) : null,
        hours_re_qualification_practical: formData.hours_re_qualification_practical ? parseFloat(formData.hours_re_qualification_practical) : null,
        hours_re_qualification_ojt: formData.hours_re_qualification_ojt ? parseFloat(formData.hours_re_qualification_ojt) : null,
        hours_re_qualification_total: calculateTotalHours(
          formData.hours_re_qualification_theory,
          formData.hours_re_qualification_practical,
          formData.hours_re_qualification_ojt
        ),
        
        // Update Training Hours
        hours_update_theory: formData.hours_update_theory ? parseFloat(formData.hours_update_theory) : null,
        hours_update_practical: formData.hours_update_practical ? parseFloat(formData.hours_update_practical) : null,
        hours_update_ojt: formData.hours_update_ojt ? parseFloat(formData.hours_update_ojt) : null,
        hours_update_total: calculateTotalHours(
          formData.hours_update_theory,
          formData.hours_update_practical,
          formData.hours_update_ojt
        ),
        
        // OJT Hours
        hours_ojt_theory: formData.hours_ojt_theory ? parseFloat(formData.hours_ojt_theory) : null,
        hours_ojt_practical: formData.hours_ojt_practical ? parseFloat(formData.hours_ojt_practical) : null,
        hours_ojt_total: formData.hours_ojt_total ? parseFloat(formData.hours_ojt_total) : null,
        
        // Validnost
        validity_period_months: formData.validity_period_months ? Number(formData.validity_period_months) : null,
        renewal_notice_days: formData.renewal_notice_days ? Number(formData.renewal_notice_days) : null,
        
        // Ostali parametri
        is_mandatory: formData.is_mandatory === "true",
        difficulty_level: formData.difficulty_level || null,
        reference_standard: formData.reference_standard || null,
        passing_score: formData.passing_score ? Number(formData.passing_score) : null,
        requires_practical: formData.requires_practical === "true",
        requires_written_exam: formData.requires_written_exam === "true",
        is_active: formData.is_active === "true",
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from("training_types")
        .update(updateData)
        .eq("id", id)

      if (error) throw error

      setSuccess("Tip obuke uspešno ažuriran")
      
      // Preusmeri nakon 2 sekunde
      setTimeout(() => {
        router.push(`/dashboard/training-types/${id}`)
        router.refresh()
      }, 2000)
      
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Došlo je do greške pri ažuriranju tipa obuke")
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>

        {/* Form Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-40" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/dashboard/training-types/${id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Izmeni tip obuke</h1>
            <p className="text-muted-foreground">Ažurirajte detalje tipa obuke</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Edit Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Osnovne informacije
            </CardTitle>
            <CardDescription>
              Ažurirajte osnovne informacije o tipu obuke
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">
                  Kod obuke <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  required
                  disabled={saving}
                  placeholder="Npr. RAMP-SAF-001"
                  className="font-mono"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="name">
                  Naziv obuke <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  disabled={saving}
                  placeholder="Npr. Ramp Safety Awareness"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Opis obuke (syllabus)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                disabled={saving}
                placeholder="Detaljan opis obuke, ciljevi, teme, očekivani ishodi..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="training_type">Vrsta obuke</Label>
                <Select
                  value={formData.training_type}
                  onValueChange={(value) => setFormData({ ...formData, training_type: value })}
                  disabled={saving}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Izaberite vrstu" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="initial">Initial Training</SelectItem>
                    <SelectItem value="recurrent">Recurrent Training</SelectItem>
                    <SelectItem value="re_qualification">Re-qualification Training</SelectItem>
                    <SelectItem value="update">Update Training</SelectItem>
                    <SelectItem value="ojt">OJT (On-the-Job Training)</SelectItem>
                    <SelectItem value="refresher">Refresher Training</SelectItem>
                    <SelectItem value="conversion">Conversion Training</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Kategorija</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                  disabled={saving}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Izaberite kategoriju" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="safety">Safety & Security</SelectItem>
                    <SelectItem value="technical">Technical / Ramp</SelectItem>
                    <SelectItem value="operational">Operational</SelectItem>
                    <SelectItem value="administrative">Administrative</SelectItem>
                    <SelectItem value="customer_service">Customer Service</SelectItem>
                    <SelectItem value="management">Management & Supervision</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Hours Section */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Trajanje obuke po komponentama (sati)
              </h3>
              
              <div className="grid grid-cols-4 gap-3">
                <div className="font-medium text-sm">Vrsta obuke</div>
                <div className="font-medium text-sm text-center">Teorija</div>
                <div className="font-medium text-sm text-center">Praksa</div>
                <div className="font-medium text-sm text-center">OJT</div>
                
                {/* Initial Training */}
                <div className="text-sm">Initial Training</div>
                <div>
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    value={formData.hours_initial_theory}
                    onChange={(e) => setFormData({ ...formData, hours_initial_theory: e.target.value })}
                    disabled={saving}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    value={formData.hours_initial_practical}
                    onChange={(e) => setFormData({ ...formData, hours_initial_practical: e.target.value })}
                    disabled={saving}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    value={formData.hours_initial_ojt}
                    onChange={(e) => setFormData({ ...formData, hours_initial_ojt: e.target.value })}
                    disabled={saving}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Validity and Requirements */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="space-y-4">
                <h3 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Validnost
                </h3>
                
                <div className="space-y-2">
                  <Label htmlFor="validity_period_months">Period važenja (meseci)</Label>
                  <Input
                    id="validity_period_months"
                    type="number"
                    min="0"
                    max="120"
                    value={formData.validity_period_months}
                    onChange={(e) => setFormData({ ...formData, validity_period_months: e.target.value })}
                    disabled={saving}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="renewal_notice_days">Obaveštenje pre isteka (dani)</Label>
                  <Input
                    id="renewal_notice_days"
                    type="number"
                    min="0"
                    max="365"
                    value={formData.renewal_notice_days}
                    onChange={(e) => setFormData({ ...formData, renewal_notice_days: e.target.value })}
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Zahtevi
                </h3>
                
                <div className="space-y-2">
                  <Label htmlFor="is_mandatory">Obaveznost</Label>
                  <Select
                    value={formData.is_mandatory}
                    onValueChange={(value) => setFormData({ ...formData, is_mandatory: value })}
                    disabled={saving}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Izaberite" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Mandatory (Obavezna)</SelectItem>
                      <SelectItem value="false">Recommended (Preporučena)</SelectItem>
                      <SelectItem value="optional">Optional (Opcionalna)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="is_active">Status</Label>
                  <Select
                    value={formData.is_active}
                    onValueChange={(value) => setFormData({ ...formData, is_active: value })}
                    disabled={saving}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Izaberite" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Active (Aktivan)</SelectItem>
                      <SelectItem value="false">Inactive (Neaktivan)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                asChild
                disabled={saving}
              >
                <Link href={`/dashboard/training-types/${id}`}>
                  <X className="h-4 w-4 mr-2" />
                  Otkaži
                </Link>
              </Button>
              <Button 
                type="submit" 
                disabled={saving}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Čuvanje..." : "Sačuvaj izmene"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}