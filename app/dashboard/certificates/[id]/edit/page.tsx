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
import { ArrowLeft, Save, Trash2 } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface Certificate {
  id: string
  certificate_number: string
  issue_date: string
  expiry_date: string | null
  completion_date: string | null
  status: string
  grade: string | null
  notes: string | null
  instructor_name: string | null
  training_provider: string | null
  issued_by: string | null
  staff_id: string
  training_master_id: string | null
}

interface StaffMember {
  id: string
  first_name: string
  last_name: string
  employee_number: string
  email?: string
}

interface TrainingMaster {
  id: string
  code: string
  title: string
  validity_months: number | null
}

export default function EditCertificatePage({ 
  params 
}: { 
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [certificate, setCertificate] = useState<Certificate | null>(null)
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [trainings, setTrainings] = useState<TrainingMaster[]>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null)

  const [formData, setFormData] = useState({
    certificate_number: "",
    issue_date: "",
    expiry_date: "",
    completion_date: "",
    status: "valid",
    grade: "",
    notes: "",
    instructor_name: "",
    training_provider: "",
    issued_by: "",
    staff_id: "",
    training_master_id: ""
  })

  // Unwrap params promise
  useEffect(() => {
    params.then(resolved => {
      setResolvedParams(resolved)
    })
  }, [params])

  useEffect(() => {
    async function loadData() {
      if (!resolvedParams?.id) return

      try {
        setLoading(true)
        
        // Učitaj sertifikat
        const { data: certData, error: certError } = await supabase
          .from("training_certificate_records")
          .select("*")
          .eq("id", resolvedParams.id)
          .single()

        if (certError) throw new Error(`Greška pri učitavanju sertifikata: ${certError.message}`)
        if (!certData) throw new Error("Sertifikat nije pronađen")

        setCertificate(certData)
        
        // Popuni formu sa postojećim podacima
        setFormData({
          certificate_number: certData.certificate_number || "",
          issue_date: certData.issue_date ? new Date(certData.issue_date).toISOString().split('T')[0] : "",
          expiry_date: certData.expiry_date ? new Date(certData.expiry_date).toISOString().split('T')[0] : "",
          completion_date: certData.completion_date ? new Date(certData.completion_date).toISOString().split('T')[0] : "",
          status: certData.status || "valid",
          grade: certData.grade || "",
          notes: certData.notes || "",
          instructor_name: certData.instructor_name || "",
          training_provider: certData.training_provider || "",
          issued_by: certData.issued_by || "",
          staff_id: certData.staff_id || "",
          training_master_id: certData.training_master_id || ""
        })

        // Učitaj zaposlene
        const { data: staffData, error: staffError } = await supabase
          .from("staff")
          .select("id, first_name, last_name, employee_number, email")
          .eq("status", "active")
          .order("last_name")

        if (staffError) throw new Error(`Greška pri učitavanju zaposlenih: ${staffError.message}`)
        setStaff(staffData || [])

        // Učitaj treninge
        const { data: trainingData, error: trainingError } = await supabase
          .from("training_certificates_master")
          .select("id, code, title, validity_months")
          .eq("is_active", true)
          .order("title")

        if (trainingError) throw new Error(`Greška pri učitavanju treninga: ${trainingError.message}`)
        setTrainings(trainingData || [])

      } catch (err: any) {
        console.error("Greška pri učitavanju:", err)
        setError(err.message)
        toast({
          title: "Greška",
          description: err.message,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [resolvedParams?.id, supabase, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")

    try {
      // Validacija
      if (!formData.certificate_number) {
        throw new Error("Unesite broj sertifikata")
      }
      if (!formData.issue_date) {
        throw new Error("Unesite datum izdavanja")
      }
      if (!formData.staff_id) {
        throw new Error("Izaberite zaposlenog")
      }

      const updateData = {
        certificate_number: formData.certificate_number.trim(),
        issue_date: formData.issue_date,
        expiry_date: formData.expiry_date || null,
        completion_date: formData.completion_date || formData.issue_date,
        status: formData.status,
        grade: formData.grade.trim() || null,
        notes: formData.notes.trim() || null,
        instructor_name: formData.instructor_name.trim() || null,
        training_provider: formData.training_provider.trim() || null,
        issued_by: formData.issued_by.trim() || null,
        staff_id: formData.staff_id,
        training_master_id: formData.training_master_id || null,
        updated_at: new Date().toISOString()
      }

      console.log("Podaci za ažuriranje:", updateData)

      const { error: updateError } = await supabase
        .from("training_certificate_records")
        .update(updateData)
        .eq("id", resolvedParams?.id)

      if (updateError) {
        console.error("Greška pri ažuriranju:", updateError)
        if (updateError.code === '23505') {
          throw new Error("Već postoji sertifikat sa tim brojem")
        }
        throw new Error(`Greška pri ažuriranju: ${updateError.message}`)
      }

      toast({
        title: "Uspešno",
        description: "Sertifikat je uspešno ažuriran",
      })

      // Vrati se na detalje
      if (resolvedParams?.id) {
        router.push(`/dashboard/certificates/${resolvedParams.id}`)
        router.refresh()
      }

    } catch (err: any) {
      console.error("Greška pri čuvanju:", err)
      setError(err.message)
      toast({
        title: "Greška",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from("training_certificate_records")
        .delete()
        .eq("id", resolvedParams?.id)

      if (error) throw error

      toast({
        title: "Uspešno",
        description: "Sertifikat je uspešno obrisan",
      })

      router.push("/dashboard/certificates")
      router.refresh()

    } catch (err: any) {
      console.error("Greška pri brisanju:", err)
      toast({
        title: "Greška",
        description: "Došlo je do greške pri brisanju sertifikata",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
    }
  }

  if (loading || !resolvedParams) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-2 text-muted-foreground">Učitavanje sertifikata...</p>
        </div>
      </div>
    )
  }

  if (!certificate) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/certificates">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sertifikat nije pronađen</h1>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center py-12 text-muted-foreground">
              Sertifikat koji tražite ne postoji ili je obrisan.
            </p>
            <div className="flex justify-center">
              <Link href="/dashboard/certificates">
                <Button>Nazad na listu sertifikata</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/certificates/${resolvedParams.id}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Izmeni sertifikat</h1>
            <p className="text-muted-foreground">Ažurirajte podatke sertifikata</p>
          </div>
        </div>
        
        <Button 
          variant="destructive" 
          onClick={() => setDeleteDialogOpen(true)}
          className="gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Obriši
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Leva kolona */}
          <Card>
            <CardHeader>
              <CardTitle>Osnovni podaci</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="certificate_number">
                  Broj sertifikata <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="certificate_number"
                  value={formData.certificate_number}
                  onChange={(e) => setFormData({ ...formData, certificate_number: e.target.value })}
                  required
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="staff_id">
                  Zaposleni <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.staff_id}
                  onValueChange={(value) => setFormData({ ...formData, staff_id: value })}
                  required
                  disabled={saving}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Izaberite zaposlenog" />
                  </SelectTrigger>
                  <SelectContent>
                    {staff.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        <div className="flex flex-col">
                          <span>{emp.first_name} {emp.last_name}</span>
                          <span className="text-xs text-muted-foreground">
                            {emp.employee_number}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="training_master_id">
                  Obuka
                </Label>
                <Select
                  value={formData.training_master_id}
                  onValueChange={(value) => setFormData({ ...formData, training_master_id: value })}
                  disabled={saving}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Izaberite obuku (opciono)" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Ispravka: Koristite posebnu vrednost za "Bez obuke" */}
                    <SelectItem value="no-training">Bez obuke (opšti sertifikat)</SelectItem>
                    {trainings.map((training) => (
                      <SelectItem key={training.id} value={training.id}>
                        <div className="flex flex-col">
                          <span>{training.title}</span>
                          <span className="text-xs text-muted-foreground">
                            {training.code} • {training.validity_months || 12} meseci
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="issue_date">
                    Datum izdavanja <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="issue_date"
                    type="date"
                    value={formData.issue_date}
                    onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                    required
                    disabled={saving}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiry_date">Datum isteka</Label>
                  <Input
                    id="expiry_date"
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="completion_date">Datum završetka obuke</Label>
                <Input
                  id="completion_date"
                  type="date"
                  value={formData.completion_date}
                  onChange={(e) => setFormData({ ...formData, completion_date: e.target.value })}
                  disabled={saving}
                />
              </div>
            </CardContent>
          </Card>

          {/* Desna kolona */}
          <Card>
            <CardHeader>
              <CardTitle>Dodatni podaci</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                    disabled={saving}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="valid">Važeći</SelectItem>
                      <SelectItem value="expired">Istekao</SelectItem>
                      <SelectItem value="revoked">Opozvan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="grade">Ocena</Label>
                  <Input
                    id="grade"
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    disabled={saving}
                    placeholder="npr: Odličan, 95%"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="instructor_name">Instruktor</Label>
                  <Input
                    id="instructor_name"
                    value={formData.instructor_name}
                    onChange={(e) => setFormData({ ...formData, instructor_name: e.target.value })}
                    disabled={saving}
                    placeholder="Ime instruktora"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="issued_by">Izdato od</Label>
                  <Input
                    id="issued_by"
                    value={formData.issued_by}
                    onChange={(e) => setFormData({ ...formData, issued_by: e.target.value })}
                    disabled={saving}
                    placeholder="Ime i prezime"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="training_provider">Organizator / Provajder</Label>
                <Input
                  id="training_provider"
                  value={formData.training_provider}
                  onChange={(e) => setFormData({ ...formData, training_provider: e.target.value })}
                  disabled={saving}
                  placeholder="npr: Kompanija ABC"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Napomene</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                  disabled={saving}
                  placeholder="Dodatne informacije o sertifikatu..."
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-3 pt-6">
          <Button 
            type="submit" 
            disabled={saving}
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
                Sačuvaj izmene
              </>
            )}
          </Button>
          <Link href={`/dashboard/certificates/${resolvedParams.id}`}>
            <Button type="button" variant="outline" disabled={saving}>
              Otkaži
            </Button>
          </Link>
        </div>
      </form>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Brisanje sertifikata</DialogTitle>
            <DialogDescription>
              Da li ste sigurni da želite da obrišete ovaj sertifikat? Ova akcija se ne može poništiti.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
            >
              Otkaži
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDelete}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Obriši
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}