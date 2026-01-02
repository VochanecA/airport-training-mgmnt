"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { 
  Loader2, 
  ArrowLeft, 
  Download, 
  FileText, 
  Calendar, 
  Building2,
  Filter,
  Printer,
  UserCheck,
  Award,
  Users,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet
} from "lucide-react"
import Link from "next/link"
import { months, airports, trainingCategories } from "./data"

// Tipovi za našu aplikaciju
interface StaffData {
  id: string;
}

interface CertificateData {
  id: string;
  employee: string;
  certificate: string;
  expiry_date: string;
  airport: string;
}

interface TrainingData {
  id: string;
  employee: string;
  training: string;
  type: string;
  expiry_date: string;
  airport: string;
}

interface MonthData {
  certificates: CertificateData[];
  trainings: TrainingData[];
  employees: Set<string>;
}

interface AirportData {
  certificates: (CertificateData & { month: string })[];
  trainings: (TrainingData & { month: string })[];
  employees: Set<string>;
}

interface ScheduleData {
  summary: {
    totalCertificates: number;
    totalTrainings: number;
    uniqueEmployees: number;
    byMonthSummary: Array<{ month: string; certificates: number; trainings: number }>;
    byAirportSummary: Array<{ airport: string; certificates: number; trainings: number }>;
  };
  byMonth: Record<string, MonthData>;
  byAirport: Record<string, AirportData>;
  certificates: Array<any & { month: string }>;
  trainings: Array<any & { month: string }>;
}

export default function WorkSchedulePage() {
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()
  
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  
  const [year, setYear] = useState(new Date().getFullYear())
  const [selectedAirports, setSelectedAirports] = useState<string[]>(["Tivat", "Podgorica"])
  const [notes, setNotes] = useState("")
  const [managerName, setManagerName] = useState("")
  const [managerTitle, setManagerTitle] = useState("")
  
  const [scheduleData, setScheduleData] = useState<ScheduleData>({
    summary: {
      totalCertificates: 0,
      totalTrainings: 0,
      uniqueEmployees: 0,
      byMonthSummary: [],
      byAirportSummary: []
    },
    byAirport: {},
    byMonth: {},
    certificates: [],
    trainings: []
  })

  // Učitaj postojeći plan ako postoji
  useEffect(() => {
    loadExistingSchedule()
  }, [year])

  const loadExistingSchedule = async () => {
    try {
      const { data: existingSchedule, error } = await supabase
        .from('work_schedule_plans')
        .select('*')
        .eq('year', year)
        .order('created_at', { ascending: false })
        .limit(1)

      if (error) throw error

      if (existingSchedule && existingSchedule.length > 0) {
        const plan = existingSchedule[0]
        setNotes(plan.notes || "")
        setManagerName(plan.manager_name || "")
        setManagerTitle(plan.manager_title || "")
        
        // Ako postoje podaci, učitaj ih
        if (plan.schedule_data) {
          setScheduleData(plan.schedule_data)
        }
      }
    } catch (err) {
      console.error("Error loading schedule:", err)
    }
  }

  // Funkcija za čuvanje plana
  const saveWorkSchedulePlan = async (
    yearToSave: number,
    scheduleDataToSave: ScheduleData,
    notesToSave: string,
    managerNameToSave: string,
    managerTitleToSave: string
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Niste prijavljeni")

      // Prvo probajte da pronađete staff_id za trenutnog korisnika
      let staffId = null
      if (user.email) {
        let staffData = null
        try {
          const { data, error } = await supabase
            .from('staff')
            .select('id')
            .eq('email', user.email)
            .limit(1)
            .single()
          
          if (!error && data) {
            staffData = data
          }
        } catch (error) {
          console.log("Error fetching staff record:", error)
        }
        
        staffId = staffData?.id || null
      }

      // Prvo probajte UPDATE (ako postoji)
      const { data: updateData, error: updateError } = await supabase
        .from('work_schedule_plans')
        .update({
          schedule_data: scheduleDataToSave,
          notes: notesToSave || null,
          manager_name: managerNameToSave || null,
          manager_title: managerTitleToSave || null,
          created_by: staffId,
          updated_at: new Date().toISOString()
        })
        .eq('year', yearToSave)
        .select()

      console.log("Update result:", { data: updateData, error: updateError })

      // Ako UPDATE nije uspeo (verovatno jer ne postoji), probajte INSERT
      if (updateError || !updateData || updateData.length === 0) {
        console.log("Trying INSERT...")
        
        const { data: insertData, error: insertError } = await supabase
          .from('work_schedule_plans')
          .insert({
            year: yearToSave,
            schedule_data: scheduleDataToSave,
            notes: notesToSave || null,
            manager_name: managerNameToSave || null,
            manager_title: managerTitleToSave || null,
            created_by: staffId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()

        console.log("Insert result:", { data: insertData, error: insertError })
        
        if (insertError) {
          // Ako je unique constraint error, znači da je neko drugi upravo dodao plan
          if (insertError.code === '23505') {
            console.log("Unique violation, plan already exists, retrying UPDATE...")
            // Probajte UPDATE ponovo
            const { data: retryUpdate, error: retryError } = await supabase
              .from('work_schedule_plans')
              .update({
                schedule_data: scheduleDataToSave,
                notes: notesToSave || null,
                manager_name: managerNameToSave || null,
                manager_title: managerTitleToSave || null,
                created_by: staffId,
                updated_at: new Date().toISOString()
              })
              .eq('year', yearToSave)
              .select()
            
            if (retryError) throw retryError
            return { success: true, data: retryUpdate }
          }
          throw insertError
        }
        
        return { success: true, data: insertData }
      }

      return { success: true, data: updateData }
      
    } catch (error: any) {
      console.error("Error saving plan:", error)
      return { success: false, error }
    }
  }

const generateYearlyPlan = async () => {
  setGenerating(true)
  setError("")
  setSuccess("")

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Niste prijavljeni")

    console.log(`Generating plan for year: ${year}`)

    // 1. Direktno testiranje baze prvo
    const { data: testData, error: testError } = await supabase
      .from('training_certificate_records')
      .select('id, expiry_date')
      .eq('status', 'valid')
      .not('expiry_date', 'is', null)
      .limit(1)

    console.log("Test query result:", testData)
    console.log("Test query error:", testError)

    // 2. Dohvati sve sertifikate koji ističu u godini
    console.log("Calling get_certificates_expiring_in_year RPC...")
    const { data: expiringCertificates, error: certError } = await supabase
      .rpc('get_certificates_expiring_in_year', { p_year: year })

    console.log("Certificates RPC response:", { data: expiringCertificates, error: certError })
    
    if (certError) {
      console.error("Certificate RPC error details:", certError)
      throw new Error(`Greška pri učitavanju sertifikata: ${certError.message}`)
    }

    // 3. Dohvati sve treninge koji ističu u godini
    console.log("Calling get_trainings_expiring_in_year RPC...")
    const { data: expiringTrainings, error: trainingError } = await supabase
      .rpc('get_trainings_expiring_in_year', { p_year: year })

    console.log("Trainings RPC response:", { data: expiringTrainings, error: trainingError })
    
    if (trainingError) {
      console.error("Training RPC error details:", trainingError)
      throw new Error(`Greška pri učitavanju treninga: ${trainingError.message}`)
    }

    // 4. Logujte šta ste dobili
    console.log(`Found ${expiringCertificates?.length || 0} certificates for year ${year}`)
    console.log(`Found ${expiringTrainings?.length || 0} trainings for year ${year}`)
    
    if (expiringCertificates && expiringCertificates.length > 0) {
      console.log("Sample certificate:", expiringCertificates[0])
    }
    
    if (expiringTrainings && expiringTrainings.length > 0) {
      console.log("Sample training:", expiringTrainings[0])
    }

    // 5. Grupiši podatke po mesecima i aerodromima
    const byMonth: Record<string, MonthData> = {}
    const byAirport: Record<string, AirportData> = {}
    const certificates: any[] = []
    const trainings: any[] = []
    
    // Inicijalizuj objekte za svaki mesec
    months.forEach(month => {
      byMonth[month.value] = {
        certificates: [],
        trainings: [],
        employees: new Set<string>()
      }
    })

    // Inicijalizuj objekte za svaki aerodrom
    airports.forEach(airport => {
      byAirport[airport.value] = {
        certificates: [],
        trainings: [],
        employees: new Set<string>()
      }
    })

    // Obradi sertifikate
    if (expiringCertificates && Array.isArray(expiringCertificates)) {
      console.log(`Processing ${expiringCertificates.length} certificates...`)
      
      expiringCertificates.forEach((cert: any, index: number) => {
        console.log(`Certificate ${index + 1}:`, cert)
        
        if (!cert.expiry_date) {
          console.warn(`Certificate ${index + 1} has no expiry date`)
          return
        }
        
        try {
          const expiryDate = new Date(cert.expiry_date)
          if (isNaN(expiryDate.getTime())) {
            console.warn(`Certificate ${index + 1} has invalid expiry date:`, cert.expiry_date)
            return
          }
          
          const expiryMonth = expiryDate.getMonth() // 0-11
          const monthName = months[expiryMonth]?.value
          
          console.log(`Certificate ${index + 1}: month ${expiryMonth} -> ${monthName}`)
          
          if (monthName) {
            const certificateData: CertificateData = {
              id: cert.id || `cert-${Math.random()}`,
              employee: `${cert.first_name || ''} ${cert.last_name || ''}`.trim() || 'Nepoznat zaposleni',
              certificate: cert.training_title || 'Nepoznat sertifikat',
              expiry_date: cert.expiry_date,
              airport: cert.airport || 'Nepoznat aerodrom'
            }

            // Dodaj u mesec
            if (!byMonth[monthName]) {
              byMonth[monthName] = { certificates: [], trainings: [], employees: new Set<string>() }
            }
            byMonth[monthName].certificates.push(certificateData)

            // Dodaj u aerodrom
            const airportName = cert.airport || 'Nepoznat aerodrom'
            if (!byAirport[airportName]) {
              byAirport[airportName] = { certificates: [], trainings: [], employees: new Set<string>() }
            }
            byAirport[airportName].certificates.push({
              ...certificateData,
              month: monthName
            })
            byAirport[airportName].employees.add(certificateData.employee)

            certificates.push({
              ...cert,
              month: monthName
            })
          }
        } catch (error) {
          console.error(`Error processing certificate ${index + 1}:`, cert, error)
        }
      })
    }

    // Obradi treninge
    if (expiringTrainings && Array.isArray(expiringTrainings)) {
      console.log(`Processing ${expiringTrainings.length} trainings...`)
      
      expiringTrainings.forEach((training: any, index: number) => {
        console.log(`Training ${index + 1}:`, training)
        
        if (!training.expiry_date) {
          console.warn(`Training ${index + 1} has no expiry date`)
          return
        }
        
        try {
          const expiryDate = new Date(training.expiry_date)
          if (isNaN(expiryDate.getTime())) {
            console.warn(`Training ${index + 1} has invalid expiry date:`, training.expiry_date)
            return
          }
          
          const expiryMonth = expiryDate.getMonth()
          const monthName = months[expiryMonth]?.value
          
          console.log(`Training ${index + 1}: month ${expiryMonth} -> ${monthName}`)
          
          if (monthName) {
            const trainingData: TrainingData = {
              id: training.id || `training-${Math.random()}`,
              employee: `${training.first_name || ''} ${training.last_name || ''}`.trim() || 'Nepoznat zaposleni',
              training: training.training_title || 'Nepoznat trening',
              type: training.training_type_name || 'Nepoznat tip',
              expiry_date: training.expiry_date,
              airport: training.airport || 'Nepoznat aerodrom'
            }

            // Dodaj u mesec
            if (!byMonth[monthName]) {
              byMonth[monthName] = { certificates: [], trainings: [], employees: new Set<string>() }
            }
            byMonth[monthName].trainings.push(trainingData)

            // Dodaj u aerodrom
            const airportName = training.airport || 'Nepoznat aerodrom'
            if (!byAirport[airportName]) {
              byAirport[airportName] = { certificates: [], trainings: [], employees: new Set<string>() }
            }
            byAirport[airportName].trainings.push({
              ...trainingData,
              month: monthName
            })
            byAirport[airportName].employees.add(trainingData.employee)

            trainings.push({
              ...training,
              month: monthName
            })
          }
        } catch (error) {
          console.error(`Error processing training ${index + 1}:`, training, error)
        }
      })
    }

    console.log("Processing complete:")
    console.log("Certificates found:", certificates.length)
    console.log("Trainings found:", trainings.length)
    console.log("ByMonth data:", byMonth)
    console.log("ByAirport data:", byAirport)

    // Izračunaj statistike
    const allEmployees = new Set<string>()
    
    certificates.forEach((cert: any) => {
      if (cert.staff_id) allEmployees.add(cert.staff_id)
    })
    
    trainings.forEach((training: any) => {
      if (training.staff_id) allEmployees.add(training.staff_id)
    })

    const byMonthSummary = months.map(month => ({
      month: month.label,
      certificates: byMonth[month.value]?.certificates.length || 0,
      trainings: byMonth[month.value]?.trainings.length || 0
    }))

    const byAirportSummary = airports.map(airport => ({
      airport: airport.label,
      certificates: byAirport[airport.value]?.certificates.length || 0,
      trainings: byAirport[airport.value]?.trainings.length || 0
    }))

    const summary = {
      totalCertificates: certificates.length,
      totalTrainings: trainings.length,
      uniqueEmployees: allEmployees.size,
      byMonthSummary,
      byAirportSummary
    }

    const finalScheduleData: ScheduleData = {
      summary,
      byMonth,
      byAirport,
      certificates,
      trainings
    }

    console.log("Final schedule data:", finalScheduleData)
    setScheduleData(finalScheduleData)

    // Sačuvaj plan u bazu
    const saveResult = await saveWorkSchedulePlan(
      year,
      finalScheduleData,
      notes,
      managerName,
      managerTitle
    )

    if (!saveResult.success) {
      console.error("Save failed:", saveResult.error)
      
      // Probajte sa jednostavnijim save-om bez created_by
      console.log("Trying simple save without created_by...")
      
      const { data: simpleSave, error: simpleError } = await supabase
        .from('work_schedule_plans')
        .upsert({
          year,
          schedule_data: finalScheduleData,
          notes: notes || null,
          manager_name: managerName || null,
          manager_title: managerTitle || null,
          // Ne šaljemo created_by uopšte
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'year'
        })
        .select()

      console.log("Simple save result:", { data: simpleSave, error: simpleError })
      
      if (simpleError) {
        throw new Error(`Greška pri čuvanju plana: ${simpleError.message}`)
      }
    }

    setSuccess(`Uspešno generisan godišnji plan za ${year}. godinu. Pronađeno: ${certificates.length} sertifikata i ${trainings.length} treninga.`)
  } catch (err: any) {
    console.error("Error generating plan:", err)
    setError(err.message || "Došlo je do greške prilikom generisanja plana")
  } finally {
    setGenerating(false)
  }
}

  const exportToPDF = async () => {
    setExporting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Niste prijavljeni")

      // Poziv ka server funkciji za generisanje PDF-a
      const response = await fetch('/api/generate-work-schedule-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          year,
          scheduleData,
          notes,
          managerName,
          managerTitle,
          selectedAirports,
          userId: user.id
        }),
      })

      if (!response.ok) throw new Error("Greška pri generisanju PDF-a")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Godisnji_Plan_Rada_${year}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setSuccess("PDF uspešno preuzet")
    } catch (err: any) {
      console.error("Error exporting PDF:", err)
      setError(err.message || "Došlo je do greške prilikom izvoza u PDF")
    } finally {
      setExporting(false)
    }
  }

  const exportToExcel = async () => {
    setExporting(true)
    try {
      // Simple Excel export
      const data: string[][] = []
      
      // Header
      data.push(['GODIŠNJI PLAN RADA', '', '', '', ''])
      data.push([`Za godinu: ${year}`, '', '', '', ''])
      data.push([])
      
      // Po mesecima
      months.forEach(month => {
        const monthData = scheduleData.byMonth[month.value]
        if (monthData && (monthData.certificates.length > 0 || monthData.trainings.length > 0)) {
          data.push([`${month.label.toUpperCase()}`, '', '', '', ''])
          data.push(['Tip', 'Zaposleni', 'Naziv', 'Datum isteka', 'Aerodrom'])
          
          // Certifikati
          monthData.certificates.forEach((cert: CertificateData) => {
            data.push(['Sertifikat', cert.employee, cert.certificate, cert.expiry_date, cert.airport])
          })
          
          // Treningi
          monthData.trainings.forEach((training: TrainingData) => {
            data.push(['Obuke', training.employee, training.training, training.expiry_date, training.airport])
          })
          
          data.push([])
        }
      })

      const csvContent = data.map(row => row.join(',')).join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Godisnji_Plan_Rada_${year}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setSuccess("Excel izvežen uspešno")
    } catch (err: any) {
      console.error("Error exporting Excel:", err)
      setError(err.message || "Došlo je do greške prilikom izvoza")
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Godišnji Plan Rada</h1>
          <p className="text-muted-foreground">Planiranje obuka i sertifikata po mjesecima za odabranu godinu</p>
        </div>
      </div>

      {/* Poruke */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Forma za generisanje */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Parametri plana</CardTitle>
              <CardDescription>
                Podesite godinu i ostale parametre za generisanje plana
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="year">Godina</Label>
                <Input
                  id="year"
                  type="number"
                  min="2023"
                  max="2030"
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value) || new Date().getFullYear())}
                />
              </div>

              <div className="space-y-2">
                <Label>Aerodromi</Label>
                <div className="space-y-2">
                  {airports.map((airport) => (
                    <div key={airport.value} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`airport-${airport.value}`}
                        checked={selectedAirports.includes(airport.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAirports([...selectedAirports, airport.value])
                          } else {
                            setSelectedAirports(selectedAirports.filter(a => a !== airport.value))
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor={`airport-${airport.value}`} className="cursor-pointer">
                        {airport.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="managerName">Ime i prezime rukovodioca</Label>
                <Input
                  id="managerName"
                  value={managerName}
                  onChange={(e) => setManagerName(e.target.value)}
                  placeholder="Marko Marković"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="managerTitle">Funkcija rukovodioca</Label>
                <Input
                  id="managerTitle"
                  value={managerTitle}
                  onChange={(e) => setManagerTitle(e.target.value)}
                  placeholder="Direktor obuke"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Dodatne napomene</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Unesite dodatne napomene ili uputstva..."
                  rows={4}
                />
              </div>

              <div className="flex flex-col gap-3 pt-4">
                <Button
                  onClick={generateYearlyPlan}
                  disabled={generating}
                  className="w-full"
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generisanje...
                    </>
                  ) : (
                    <>
                      <Calendar className="h-4 w-4 mr-2" />
                      Generiši Plan
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Eksport opcije */}
          <Card>
            <CardHeader>
              <CardTitle>Eksport</CardTitle>
              <CardDescription>Preuzmite generisani plan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={exportToPDF}
                disabled={exporting || !scheduleData.summary.totalCertificates}
                className="w-full"
                variant="outline"
              >
                {exporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4 mr-2" />
                )}
                Preuzmi PDF
              </Button>
              
              <Button
                onClick={exportToExcel}
                disabled={exporting || !scheduleData.summary.totalCertificates}
                className="w-full"
                variant="outline"
              >
                {exporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                )}
                Preuzmi Excel
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Prikaz i rezultati */}
        <div className="lg:col-span-2 space-y-6">
          {/* Statistike */}
          <Card>
            <CardHeader>
              <CardTitle>Statistika plana</CardTitle>
              <CardDescription>
                Pregled generisanog plana za {year}. godinu
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-blue-600" />
                    <span className="text-sm text-blue-700">Sertifikati</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-800 mt-2">
                    {scheduleData.summary.totalCertificates || 0}
                  </div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-green-600" />
                    <span className="text-sm text-green-700">Obuke</span>
                  </div>
                  <div className="text-2xl font-bold text-green-800 mt-2">
                    {scheduleData.summary.totalTrainings || 0}
                  </div>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-600" />
                    <span className="text-sm text-purple-700">Zaposleni</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-800 mt-2">
                    {scheduleData.summary.uniqueEmployees || 0}
                  </div>
                </div>
                
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-amber-600" />
                    <span className="text-sm text-amber-700">Aerodroma</span>
                  </div>
                  <div className="text-2xl font-bold text-amber-800 mt-2">
                    {selectedAirports.length}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Prikaz po mjesecima */}
          <Card>
            <CardHeader>
              <CardTitle>Plan po mjesecima</CardTitle>
              <CardDescription>
                Pregled isteka sertifikata i treninga po mjesecima
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {months.map((month) => {
                  const monthData = scheduleData.byMonth?.[month.value]
                  const hasData = monthData && 
                    (monthData.certificates.length > 0 || monthData.trainings.length > 0)
                  
                  if (!hasData) return null
                  
                  return (
                    <div key={month.value} className="border rounded-lg p-4">
                      <h4 className="font-semibold text-lg mb-3">{month.label}</h4>
                      
                      {monthData.certificates.length > 0 && (
                        <div className="mb-3">
                          <h5 className="font-medium text-sm text-blue-600 mb-2 flex items-center gap-1">
                            <Award className="h-4 w-4" />
                            Sertifikati koji ističu ({monthData.certificates.length})
                          </h5>
                          <div className="space-y-1 text-sm">
                            {monthData.certificates.slice(0, 5).map((cert: CertificateData, idx: number) => (
                              <div key={idx} className="flex justify-between">
                                <span>{cert.employee}</span>
                                <span className="text-muted-foreground">{cert.certificate}</span>
                              </div>
                            ))}
                            {monthData.certificates.length > 5 && (
                              <div className="text-sm text-muted-foreground">
                                + {monthData.certificates.length - 5} više...
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {monthData.trainings.length > 0 && (
                        <div>
                          <h5 className="font-medium text-sm text-green-600 mb-2 flex items-center gap-1">
                            <UserCheck className="h-4 w-4" />
                            Obuke koji ističu ({monthData.trainings.length})
                          </h5>
                          <div className="space-y-1 text-sm">
                            {monthData.trainings.slice(0, 5).map((training: TrainingData, idx: number) => (
                              <div key={idx} className="flex justify-between">
                                <span>{training.employee}</span>
                                <span className="text-muted-foreground">{training.training}</span>
                              </div>
                            ))}
                            {monthData.trainings.length > 5 && (
                              <div className="text-sm text-muted-foreground">
                                + {monthData.trainings.length - 5} više...
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
                
                {months.every(month => {
                  const monthData = scheduleData.byMonth?.[month.value]
                  return !monthData || 
                    (monthData.certificates.length === 0 && monthData.trainings.length === 0)
                }) && (
                  <div className="text-center py-8 text-muted-foreground">
                    Nema podataka za prikaz. Generišite plan za odabranu godinu.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Prikaz po aerodromima */}
          <Card>
            <CardHeader>
              <CardTitle>Plan po aerodromima</CardTitle>
              <CardDescription>
                Pregled pojedinačno za svaki aerodrom
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {airports
                  .filter(airport => selectedAirports.includes(airport.value))
                  .map((airport) => {
                    const airportData = scheduleData.byAirport?.[airport.value]
                    const hasData = airportData && 
                      (airportData.certificates.length > 0 || airportData.trainings.length > 0)
                    
                    if (!hasData) return null
                    
                    return (
                      <div key={airport.value} className="border rounded-lg p-4">
                        <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                          <Building2 className="h-5 w-5" />
                          {airport.label}
                        </h4>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <h5 className="font-medium text-sm text-blue-600">
                              Sertifikati: {airportData.certificates.length}
                            </h5>
                            <div className="space-y-1 text-sm">
                              {airportData.certificates.slice(0, 3).map((cert: CertificateData & { month: string }, idx: number) => (
                                <div key={idx} className="truncate">
                                  {cert.employee}: {cert.certificate}
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <h5 className="font-medium text-sm text-green-600">
                              Obuke: {airportData.trainings.length}
                            </h5>
                            <div className="space-y-1 text-sm">
                              {airportData.trainings.slice(0, 3).map((training: TrainingData & { month: string }, idx: number) => (
                                <div key={idx} className="truncate">
                                  {training.employee}: {training.training}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                
                {airports.every(airport => {
                  const airportData = scheduleData.byAirport?.[airport.value]
                  return !airportData || 
                    (airportData.certificates.length === 0 && airportData.trainings.length === 0)
                }) && (
                  <div className="text-center py-8 text-muted-foreground">
                    Nema podataka za prikaz.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}