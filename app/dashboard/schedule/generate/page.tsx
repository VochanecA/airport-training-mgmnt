"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, ArrowLeft, RefreshCw, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"

export default function GenerateSchedulePage() {
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()
  
  const [sourceType, setSourceType] = useState<"certificates" | "training_records">("training_records")
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [results, setResults] = useState<any>(null)
  
  const [formData, setFormData] = useState({
    days_before_expiry: 30,
    expiry_lookahead_days: 90,
    capacity: 15,
    location: "",
    airport: "",
    user_id: ""
  })

  const handleGenerate = async () => {
    setGenerating(true)
    setError("")
    setSuccess("")
    setResults(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Niste prijavljeni")

      let data, error
      
      if (sourceType === "certificates") {
        // Generisanje na osnovu sertifikata
        const { data: certData, error: certError } = await supabase.rpc(
          'generate_schedule_from_certificates',
          {
            p_days_before: formData.days_before_expiry,
            p_capacity: formData.capacity,
            p_location: formData.location || null,
            p_airport: formData.airport || null,
            p_user_id: user.id
          }
        )
        
        data = certData
        error = certError
      } else {
        // Generisanje na osnovu training records
        const { data: trainingData, error: trainingError } = await supabase.rpc(
          'generate_schedule_from_expiries',
          {
            p_days_before: formData.days_before_expiry,
            p_capacity: formData.capacity,
            p_location: formData.location || null,
            p_airport: formData.airport || null,
            p_user_id: user.id
          }
        )
        
        data = trainingData
        error = trainingError
      }

      if (error) throw error

      if (data && data.length > 0) {
        setResults(data[0])
        setSuccess(`Uspešno generisano ${data[0].generated_count} treninga sa ${data[0].assigned_count} dodela.`)
      }

      router.refresh()
    } catch (err: any) {
      console.error("Error generating schedule:", err)
      setError(err.message || "Došlo je do greške prilikom generisanja rasporeda")
    } finally {
      setGenerating(false)
    }
  }

  const handleRegenerateWithCapacity = async () => {
    if (!formData.capacity) return
    
    setLoading(true)
    setError("")

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Niste prijavljeni")

      const { data, error } = await supabase.rpc(
        'regenerate_schedule_with_capacity',
        {
          p_capacity: formData.capacity,
          p_user_id: user.id
        }
      )

      if (error) throw error

      if (data && data.length > 0) {
        setSuccess(`Uspešno regenerisano ${data[0].updated_count} grupa sa kapacitetom ${formData.capacity}.`)
      }

      router.refresh()
    } catch (err: any) {
      console.error("Error regenerating schedule:", err)
      setError(err.message || "Došlo je do greške prilikom regenerisanja rasporeda")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/schedule">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Generiši Automatski Raspored</h1>
          <p className="text-muted-foreground">Automatsko planiranje obuka na osnovu isteka validnosti</p>
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

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Forma za generisanje */}
        <Card>
          <CardHeader>
            <CardTitle>Parametri generisanja</CardTitle>
            <CardDescription>
              Podesite parametre za automatsko generisanje rasporeda
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Dodajte ovaj Select unutar CardContent */}
            <div className="space-y-2">
              <Label>Izvor podataka za generisanje</Label>
              <Select
                value={sourceType}
                onValueChange={(value: "certificates" | "training_records") => setSourceType(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="training_records">Training Records (8.2 evidencija)</SelectItem>
                  <SelectItem value="certificates">Sertifikati</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {sourceType === "certificates" 
                  ? "Generiše raspored na osnovu isteka sertifikata" 
                  : "Generiše raspored na osnovu isteka trening zapisa"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="days_before_expiry">Dana pre isteka</Label>
                <Input
                  id="days_before_expiry"
                  type="number"
                  min="1"
                  max="180"
                  value={formData.days_before_expiry}
                  onChange={(e) => setFormData({...formData, days_before_expiry: parseInt(e.target.value) || 30})}
                />
                <p className="text-xs text-muted-foreground">
                  Koliko dana pre isteka zakazati obuku
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="expiry_lookahead_days">Period praćenja</Label>
                <Input
                  id="expiry_lookahead_days"
                  type="number"
                  min="30"
                  max="365"
                  value={formData.expiry_lookahead_days}
                  onChange={(e) => setFormData({...formData, expiry_lookahead_days: parseInt(e.target.value) || 90})}
                />
                <p className="text-xs text-muted-foreground">
                  Koliko dana unapred pratiti isteke
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="capacity">Kapacitet grupe</Label>
                <Select
                  value={formData.capacity.toString()}
                  onValueChange={(value) => setFormData({...formData, capacity: parseInt(value)})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 12, 15, 17, 20, 22].map(num => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} polaznika
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Maksimalni broj polaznika po grupi
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="airport">Aerodrom</Label>
                <Input
                  id="airport"
                  value={formData.airport}
                  onChange={(e) => setFormData({...formData, airport: e.target.value})}
                  placeholder="Podgorica Aerodrom"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Lokacija</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                placeholder="Sala za obuke - Terminal A"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                onClick={handleGenerate}
                disabled={generating}
                className="flex-1"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generisanje...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Generiši Raspored
                  </>
                )}
              </Button>
              
              <Button
                onClick={handleRegenerateWithCapacity}
                disabled={loading}
                variant="outline"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Promeni Kapacitet"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Informacije i rezultati */}
        <Card>
          <CardHeader>
            <CardTitle>Kako radi automatsko generisanje</CardTitle>
            <CardDescription>
              Sistem automatski planira obuke na osnovu sledećih pravila:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <div className="h-2 w-2 bg-primary rounded-full mt-1.5"></div>
                <span>Prati <strong>isteče validnosti</strong> u narednih {formData.expiry_lookahead_days} dana</span>
              </li>
              
              <li className="flex items-start gap-2">
                <div className="h-2 w-2 bg-primary rounded-full mt-1.5"></div>
                <span>Obuke se zakazuju <strong>{formData.days_before_expiry} dana pre isteka</strong></span>
              </li>
              
              <li className="flex items-start gap-2">
                <div className="h-2 w-2 bg-primary rounded-full mt-1.5"></div>
                <span>Grupisanje po <strong>tipu treninga</strong> i <strong>vremenu isteka</strong></span>
              </li>
              
              <li className="flex items-start gap-2">
                <div className="h-2 w-2 bg-primary rounded-full mt-1.5"></div>
                <span>Maksimalni kapacitet grupe: <strong>{formData.capacity} polaznika</strong></span>
              </li>
              
              <li className="flex items-start gap-2">
                <div className="h-2 w-2 bg-primary rounded-full mt-1.5"></div>
                <span>Trajanje obuke određeno prema <strong>tipu treninga</strong></span>
              </li>
              
              <li className="flex items-start gap-2">
                <div className="h-2 w-2 bg-primary rounded-full mt-1.5"></div>
                <span>Automatska dodela <strong>instruktora</strong> (ako je dostupan)</span>
              </li>
            </ul>

            {results && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">Rezultati generisanja</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-700">Generisano treninga:</span>
                    <span className="font-medium">{results.generated_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Ukupno dodela:</span>
                    <span className="font-medium">{results.assigned_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Prosečno po grupi:</span>
                    <span className="font-medium">
                      {results.generated_count > 0 ? 
                        Math.round(results.assigned_count / results.generated_count) : 0
                      }
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                <strong>Napomena:</strong> Automatski generisani treningi se mogu ručno uređivati, 
                dodavati polaznici ili menjati vreme i lokacija.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}