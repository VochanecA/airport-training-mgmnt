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
import { ArrowLeft, Download, FileText, Users, BookOpen } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { Badge } from "@/components/ui/badge"

// Type definitions
interface StaffMember {
  id: string
  first_name: string
  last_name: string
  employee_number: string
  email?: string
  position_id?: string

  status: string
}

interface TrainingCertificateMaster {
  id: string
  code: string
  title: string
  validity_months?: number
}

export default function NewCertificatePage() {
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState("")
  
  const [employees, setEmployees] = useState<StaffMember[]>([])
  const [trainings, setTrainings] = useState<TrainingCertificateMaster[]>([])
  
  const [formData, setFormData] = useState({
    staff_id: "",
    training_master_id: "",
    certificate_number: "",
    issue_date: new Date().toISOString().split('T')[0],
    expiry_date: "",
    status: "valid",
    issued_by: "",
    notes: "",
    grade: "",
    instructor_name: "",
    training_provider: "",
    completion_date: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    async function loadData() {
      try {
        setLoadingData(true)
        
        // POKUŠAJ 1: Pokušaj da učitaš samo osnovne podatke bez JOIN
        console.log("Pokušavam da učitam zaposlene...")
        
        const { data: staffData, error: staffError } = await supabase
          .from("staff")
          .select(`
            id,
            first_name,
            last_name,
            employee_number,
            email,
            position_id,
  
            status
          `)
          .eq("status", "active")
          .order("last_name", { ascending: true })

        console.log("Rezultat učitavanja zaposlenih:", {
          data: staffData,
          error: staffError,
          count: staffData?.length || 0
        })

        if (staffError) {
          console.error("Supabase greška pri učitavanju zaposlenih:", {
            message: staffError.message,
            code: staffError.code,
            details: staffError.details,
            hint: staffError.hint
          })
          throw new Error(`Greška pri učitavanju zaposlenih: ${staffError.message || "Nepoznata greška"}`)
        }
        
        // Učitaj treninge iz training_certificates_master
        console.log("Pokušavam da učitam treninge...")
        
        const { data: trainingsData, error: trainingsError } = await supabase
          .from("training_certificates_master")
          .select("id, code, title, validity_months")
          .eq("is_active", true)
          .order("title")

        console.log("Rezultat učitavanja treninga:", {
          data: trainingsData,
          error: trainingsError,
          count: trainingsData?.length || 0
        })

        if (trainingsError) {
          console.error("Greška pri učitavanju treninga:", trainingsError)
          // Ne baci grešku, samo loguj - možemo da radimo bez treninga
        }

        setEmployees(staffData || [])
        setTrainings(trainingsData || [])

        // Ako nema zaposlenih, prikaži upozorenje
        if (!staffData || staffData.length === 0) {
          toast({
            title: "Nema zaposlenih",
            description: "Nema aktivnih zaposlenih u sistemu. Prvo dodajte zaposlene.",
            variant: "destructive",
          })
        }

      } catch (err: any) {
        console.error("Kritična greška pri učitavanju podataka:", err)
        const errorMessage = err?.message || "Došlo je do nepoznate greške pri učitavanju podataka"
        setError(errorMessage)
        
        toast({
          title: "Greška pri učitavanju",
          description: errorMessage,
          variant: "destructive",
        })
      } finally {
        setLoadingData(false)
      }
    }
    loadData()
  }, [supabase, toast])

  const calculateExpiryDate = (issueDate: string, validityMonths: number = 12): string => {
    if (!issueDate) return ""
    const date = new Date(issueDate)
    date.setMonth(date.getMonth() + validityMonths)
    return date.toISOString().split('T')[0]
  }

  // Kada se promeni obuka, automatski izračunaj datum isteka
  const handleTrainingChange = (trainingId: string) => {
    const selectedTraining = trainings.find(t => t.id === trainingId)
    if (selectedTraining && formData.issue_date) {
      const expiryDate = calculateExpiryDate(
        formData.issue_date,
        selectedTraining.validity_months || 12
      )
      setFormData(prev => ({
        ...prev,
        training_master_id: trainingId,
        expiry_date: expiryDate
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        training_master_id: trainingId
      }))
    }
  }

  // Kada se promeni datum izdavanja, ponovo izračunaj datum isteka
  const handleIssueDateChange = (date: string) => {
    const selectedTraining = trainings.find(t => t.id === formData.training_master_id)
    if (selectedTraining) {
      const expiryDate = calculateExpiryDate(
        date,
        selectedTraining.validity_months || 12
      )
      setFormData(prev => ({
        ...prev,
        issue_date: date,
        expiry_date: expiryDate,
        completion_date: date
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        issue_date: date,
        completion_date: date
      }))
    }
  }

  const generatePDF = (
    certificateData: any,
    employee: StaffMember | undefined,
    training: TrainingCertificateMaster | undefined
  ) => {
    const doc = new jsPDF()
    
    // Logo i zaglavlje
    doc.setFontSize(20)
    doc.setTextColor(40, 40, 40)
    doc.text("POTVRDA", 105, 30, { align: 'center' })
    
    doc.setFontSize(14)
    doc.setTextColor(100, 100, 100)
    doc.text("POTVRDA O POLOŽENOJ OBUCI", 105, 40, { align: 'center' })
    
    // Linija ispod naslova
    doc.setDrawColor(200, 200, 200)
    doc.line(20, 45, 190, 45)
    
    // Podaci o zaposlenom
    const employeeName = employee ? `${employee.first_name} ${employee.last_name}` : 'N/A'
    const employeeNumber = employee?.employee_number || 'N/A'
    const employeeEmail = employee?.email || 'N/A'
    
    // Podaci o sertifikatu
    const trainingName = training?.title || certificateData.notes || 'Opšti sertifikat'
    const trainingCode = training?.code || 'GENERAL-CERT'
    
    // Tabela sa podacima
    autoTable(doc, {
      startY: 60,
      head: [['Podatak', 'Vrednost']],
      body: [
        ['Broj sertifikata', certificateData.certificate_number || 'N/A'],
        ['Ime i prezime', employeeName],
        ['Broj zaposlenog', employeeNumber],
        ['Email', employeeEmail],
        ['Naziv obuke', trainingName],
        ['Šifra obuke', trainingCode],
        ['Datum izdavanja', certificateData.issue_date ? new Date(certificateData.issue_date).toLocaleDateString('sr-RS') : 'N/A'],
        ['Datum isteka', certificateData.expiry_date ? new Date(certificateData.expiry_date).toLocaleDateString('sr-RS') : 'N/A'],
        ['Ocjena', certificateData.grade || 'N/A'],
        ['Instruktor', certificateData.instructor_name || 'N/A'],
        ['Izdavač', certificateData.issued_by || 'N/A'],
        ['Status', certificateData.status === 'valid' ? 'Važeci' : 'Nevažeci'],
      ],
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      styles: { fontSize: 10, cellPadding: 5 },
    })
    
    // Napomene
    if (certificateData.notes) {
      doc.setFontSize(11)
      doc.setTextColor(60, 60, 60)
      doc.text('Napomene:', 20, doc.internal.pageSize.height - 60)
      doc.setFontSize(10)
      const splitNotes = doc.splitTextToSize(certificateData.notes, 170)
      doc.text(splitNotes, 20, doc.internal.pageSize.height - 50)
    }
    
    // Potpis
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text('Potpis i pečat:', 20, doc.internal.pageSize.height - 20)
    doc.line(60, doc.internal.pageSize.height - 20, 120, doc.internal.pageSize.height - 20)
    
    // Footer
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text('Dokument generisan u Training Management System', 105, doc.internal.pageSize.height - 10, { align: 'center' })
    doc.text(new Date().toLocaleDateString('sr-RS'), 105, doc.internal.pageSize.height - 5, { align: 'center' })
    
    // Sačuvaj PDF
    const fileName = `certifikat_${certificateData.certificate_number || 'novi'}_${employeeNumber}.pdf`
    doc.save(fileName)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      // Validacija
      if (!formData.staff_id) {
        throw new Error("Izaberite zaposlenog")
      }
      if (!formData.certificate_number) {
        throw new Error("Unesite broj sertifikata")
      }
      if (!formData.issue_date) {
        throw new Error("Unesite datum izdavanja")
      }

      // Ako nije odabran trening, koristite opšti sertifikat
      let training_master_id = formData.training_master_id
      
      if (!training_master_id) {
        // Kreiraj opšti sertifikat ako nije odabran konkretan trening
        const { data: generalTraining, error: trainingError } = await supabase
          .from("training_certificates_master")
          .select("id")
          .eq("code", "GENERAL-CERT")
          .single()

        if (trainingError || !generalTraining) {
          // Kreiraj opšti sertifikat tip ako ne postoji
          const { data: newTraining, error: createError } = await supabase
            .from("training_certificates_master")
            .insert({
              code: "GENERAL-CERT",
              title: "Opšti sertifikat",
              description: "Opšti sertifikat bez specifične obuke",
              validity_months: 12,
              is_active: true,
              is_mandatory: false
            })
            .select()
            .single()

          if (createError) throw new Error(`Greška pri kreiranju opšteg sertifikata: ${createError.message}`)
          training_master_id = newTraining.id
        } else {
          training_master_id = generalTraining.id
        }
      }

      // Kreiraj sertifikat record
      const recordData = {
        staff_id: formData.staff_id,
        training_master_id: training_master_id,
        certificate_number: formData.certificate_number.trim(),
        issue_date: formData.issue_date,
        expiry_date: formData.expiry_date || null,
        completion_date: formData.completion_date || formData.issue_date,
        status: formData.status,
        issued_by: formData.issued_by.trim() || null,
        notes: formData.notes.trim() || null,
        grade: formData.grade.trim() || null,
        instructor_name: formData.instructor_name.trim() || null,
        training_provider: formData.training_provider.trim() || null
      }

      console.log("Podaci za čuvanje sertifikata:", recordData)

      const { error: insertError, data: insertedData } = await supabase
        .from("training_certificate_records")
        .insert(recordData)
        .select()

      if (insertError) {
        console.error("Greška pri čuvanju sertifikata:", insertError)
        if (insertError.code === '23505') {
          throw new Error("Već postoji sertifikat sa tim brojem")
        }
        throw new Error(`Greška pri čuvanju: ${insertError.message || "Nepoznata greška"}`)
      }

      // Pronađi podatke za PDF
      const selectedEmployee = employees.find(e => e.id === formData.staff_id)
      const selectedTraining = trainings.find(t => t.id === formData.training_master_id)

      // Generiši PDF
      if (insertedData && insertedData[0]) {
        generatePDF(insertedData[0], selectedEmployee, selectedTraining)
      }

      // Prikaži uspešnu poruku
      toast({
        title: "Sertifikat uspešno kreiran",
        description: "Sertifikat je sačuvan i PDF je preuzet",
      })

      // Vrati se na listu sertifikata
      setTimeout(() => {
        router.push("/dashboard/certificates")
        router.refresh()
      }, 1500)

    } catch (err: any) {
      console.error("Greška pri čuvanju sertifikata:", err)
      const errorMessage = err?.message || "Došlo je do greške pri čuvanju sertifikata"
      setError(errorMessage)
      
      toast({
        title: "Greška",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const selectedEmployee = employees.find(e => e.id === formData.staff_id)
  const selectedTraining = trainings.find(t => t.id === formData.training_master_id)

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-2 text-muted-foreground">Učitavanje podataka...</p>
        </div>
      </div>
    )
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

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Kreiraj Novi Sertifikat
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Leva kolona */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="staff_id">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Zaposleni <span className="text-red-500">*</span>
                    </div>
                    <span className="text-xs text-muted-foreground block mt-1">
                      Ukupno dostupnih zaposlenih: {employees.length}
                    </span>
                  </Label>
                  <Select
                    value={formData.staff_id}
                    onValueChange={(value) => setFormData({ ...formData, staff_id: value })}
                    required
                    disabled={loading || employees.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        employees.length === 0 
                          ? "Nema dostupnih zaposlenih" 
                          : "Izaberite zaposlenog"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground">
                          Nema aktivnih zaposlenih. Prvo dodajte zaposlene.
                        </div>
                      ) : (
                        employees.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            <div className="flex flex-col">
                              <span>{emp.first_name} {emp.last_name}</span>
                              <span className="text-xs text-muted-foreground">
                                {emp.employee_number} • {emp.email || 'Nema email'}
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {employees.length === 0 && (
                    <p className="text-sm text-red-500">
                      Nema aktivnih zaposlenih. Prvo dodajte zaposlene kroz stranicu "Zaposleni".
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="certificate_number">
                    Broj Sertifikata <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="certificate_number"
                    value={formData.certificate_number}
                    onChange={(e) => setFormData({ ...formData, certificate_number: e.target.value })}
                    required
                    disabled={loading}
                    placeholder="npr: CERT-2024-001"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="training_master_id">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Obuka (opciono)
                    </div>
                  </Label>
                  <Select
                    value={formData.training_master_id}
                    onValueChange={handleTrainingChange}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Izaberite obuku (opciono)" />
                    </SelectTrigger>
                    <SelectContent>
                      {trainings.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground">
                          Nema definisanih obuka. Koristiće se opšti sertifikat.
                        </div>
                      ) : (
                        trainings.map((training) => (
                          <SelectItem key={training.id} value={training.id}>
                            <div className="flex flex-col">
                              <span>{training.title}</span>
                              <span className="text-xs text-muted-foreground">
                                {training.code} • {training.validity_months || 12} meseci
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {trainings.length === 0 
                      ? "Nema definisanih obuka. Kreiraće se opšti sertifikat." 
                      : "Ako ne izaberete obuku, kreiraće se opšti sertifikat"}
                  </p>
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
                      onChange={(e) => handleIssueDateChange(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expiry_date">Datum isteka</Label>
                    <Input
                      id="expiry_date"
                      type="date"
                      value={formData.expiry_date}
                      onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                      disabled={loading}
                      readOnly={!!formData.training_master_id}
                      className={formData.training_master_id ? "bg-gray-50" : ""}
                    />
                    {formData.training_master_id && (
                      <p className="text-xs text-muted-foreground">
                        Automatski izračunato na osnovu obuke
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Desna kolona */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="grade">Ocena</Label>
                    <Input
                      id="grade"
                      value={formData.grade}
                      onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                      disabled={loading}
                      placeholder="npr: Odličan, 95%"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                      disabled={loading}
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
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="issued_by">Izdao</Label>
                    <Input
                      id="issued_by"
                      value={formData.issued_by}
                      onChange={(e) => setFormData({ ...formData, issued_by: e.target.value })}
                      disabled={loading}
                      placeholder="Ime i prezime"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="instructor_name">Instruktor</Label>
                    <Input
                      id="instructor_name"
                      value={formData.instructor_name}
                      onChange={(e) => setFormData({ ...formData, instructor_name: e.target.value })}
                      disabled={loading}
                      placeholder="Ime instruktora"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="training_provider">Organizator / Provajder</Label>
                  <Input
                    id="training_provider"
                    value={formData.training_provider}
                    onChange={(e) => setFormData({ ...formData, training_provider: e.target.value })}
                    disabled={loading}
                    placeholder="npr: Kompanija ABC"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Napomene</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    disabled={loading}
                    placeholder="Dodatne informacije o sertifikatu..."
                  />
                </div>
              </div>
            </div>

            {/* Preview sekcija */}
            {(formData.staff_id || formData.training_master_id || formData.certificate_number) && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-3">Pregled sertifikata:</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {selectedEmployee && (
                    <>
                      <div>
                        <span className="text-muted-foreground">Zaposleni:</span>
                        <p className="font-medium">{selectedEmployee.first_name} {selectedEmployee.last_name}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Broj zaposlenog:</span>
                        <p className="font-mono">{selectedEmployee.employee_number}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Email:</span>
                        <p>{selectedEmployee.email || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Status:</span>
                        <Badge variant={selectedEmployee.status === "active" ? "default" : "secondary"}>
                          {selectedEmployee.status === "active" ? "Aktivan" : "Neaktivan"}
                        </Badge>
                      </div>
                    </>
                  )}
                  {formData.certificate_number && (
                    <div>
                      <span className="text-muted-foreground">Broj sertifikata:</span>
                      <p className="font-mono font-medium">{formData.certificate_number}</p>
                    </div>
                  )}
                  {selectedTraining && (
                    <div>
                      <span className="text-muted-foreground">Obuka:</span>
                      <p className="font-medium">{selectedTraining.title}</p>
                    </div>
                  )}
                  {formData.issue_date && (
                    <div>
                      <span className="text-muted-foreground">Datum izdavanja:</span>
                      <p>{new Date(formData.issue_date).toLocaleDateString('sr-RS')}</p>
                    </div>
                  )}
                  {formData.expiry_date && (
                    <div>
                      <span className="text-muted-foreground">Datum isteka:</span>
                      <p className="font-semibold">{new Date(formData.expiry_date).toLocaleDateString('sr-RS')}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button 
                type="submit" 
                disabled={loading || employees.length === 0 || !formData.certificate_number || !formData.issue_date}
                className="gap-2"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    Čuvanje i generisanje PDF...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Kreiraj i Preuzmi PDF
                  </>
                )}
              </Button>
              <Link href="/dashboard/certificates">
                <Button type="button" variant="outline" disabled={loading}>
                  Otkaži
                </Button>
              </Link>
              {employees.length === 0 && (
                <Link href="/dashboard/employees">
                  <Button type="button" variant="outline" className="gap-2">
                    <Users className="h-4 w-4" />
                    Dodaj Zaposlene
                  </Button>
                </Link>
              )}
              {trainings.length === 0 && (
                <Link href="/dashboard/training-types">
                  <Button type="button" variant="outline" className="gap-2">
                    <BookOpen className="h-4 w-4" />
                    Dodaj Obuke
                  </Button>
                </Link>
              )}
            </div>

            <div className="text-xs text-muted-foreground pt-4 border-t">
              <p><strong>Napomena:</strong> Sertifikat će biti sačuvan u tabeli <code>training_certificate_records</code> i automatski će biti generisan PDF dokument.</p>
              <p className="mt-1"><strong>Dostupno zaposlenih:</strong> {employees.length} | <strong>Dostupnih obuka:</strong> {trainings.length}</p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}