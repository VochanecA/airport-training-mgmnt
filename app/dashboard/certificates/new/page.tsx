"use client"

import type React from "react"

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
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function NewCertificatePage() {
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [employees, setEmployees] = useState<any[]>([])
  const [trainings, setTrainings] = useState<any[]>([])
  const [trainingTypes, setTrainingTypes] = useState<any[]>([])

  const [formData, setFormData] = useState({
    employee_id: "",
    training_id: "",
    training_type_id: "",
    certificate_number: "",
    issue_date: "",
    expiry_date: "",
    status: "valid",
    issued_by: "",
    notes: "",
  })

  useEffect(() => {
    async function loadData() {
      const [{ data: employeesData }, { data: trainingsData }, { data: trainingTypesData }] = await Promise.all([
        supabase.from("employees").select("id, first_name, last_name").eq("status", "active").order("last_name"),
        supabase.from("trainings").select("id, title").order("title"),
        supabase.from("training_types").select("id, name").order("name"),
      ])

      setEmployees(employeesData || [])
      setTrainings(trainingsData || [])
      setTrainingTypes(trainingTypesData || [])
    }
    loadData()
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const dataToInsert: any = {
        employee_id: formData.employee_id,
        certificate_number: formData.certificate_number,
        issue_date: formData.issue_date,
        status: formData.status,
      }

      if (formData.training_id) dataToInsert.training_id = formData.training_id
      if (formData.training_type_id) dataToInsert.training_type_id = formData.training_type_id
      if (formData.expiry_date) dataToInsert.expiry_date = formData.expiry_date
      if (formData.issued_by) dataToInsert.issued_by = formData.issued_by
      if (formData.notes) dataToInsert.notes = formData.notes

      const { error: insertError } = await supabase.from("certificates").insert([dataToInsert])

      if (insertError) throw insertError

      router.push("/dashboard/certificates")
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Došlo je do greške")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/certificates">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Novi Sertifikat</h1>
          <p className="text-muted-foreground">Izdajte novi sertifikat zaposlenom</p>
        </div>
      </div>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Detalji Sertifikata</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="employee_id">Zaposleni *</Label>
                <Select
                  value={formData.employee_id}
                  onValueChange={(value) => setFormData({ ...formData, employee_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Izaberite zaposlenog" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.first_name} {emp.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="certificate_number">Broj Sertifikata *</Label>
                <Input
                  id="certificate_number"
                  value={formData.certificate_number}
                  onChange={(e) => setFormData({ ...formData, certificate_number: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="training_id">Obuka</Label>
                <Select
                  value={formData.training_id}
                  onValueChange={(value) => setFormData({ ...formData, training_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Opciono - Izaberite obuku" />
                  </SelectTrigger>
                  <SelectContent>
                    {trainings.map((training) => (
                      <SelectItem key={training.id} value={training.id}>
                        {training.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="training_type_id">Tip Obuke</Label>
                <Select
                  value={formData.training_type_id}
                  onValueChange={(value) => setFormData({ ...formData, training_type_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Opciono - Izaberite tip" />
                  </SelectTrigger>
                  <SelectContent>
                    {trainingTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="issue_date">Datum Izdavanja *</Label>
                <Input
                  id="issue_date"
                  type="date"
                  value={formData.issue_date}
                  onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiry_date">Datum Isteka</Label>
                <Input
                  id="expiry_date"
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
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
                <Label htmlFor="issued_by">Izdao</Label>
                <Input
                  id="issued_by"
                  value={formData.issued_by}
                  onChange={(e) => setFormData({ ...formData, issued_by: e.target.value })}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">Napomene</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? "Čuvanje..." : "Izdaj Sertifikat"}
              </Button>
              <Link href="/dashboard/certificates">
                <Button type="button" variant="outline" disabled={loading}>
                  Otkaži
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
