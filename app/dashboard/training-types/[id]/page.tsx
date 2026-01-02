"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Clock, 
  BookOpen, 
  Award, 
  Users, 
  Calendar, 
  FileText,
  CheckCircle,
  XCircle,
  Layers,
  AlertCircle,
  Briefcase,
  GraduationCap
} from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

type TrainingType = {
  id: string
  code: string
  name: string
  description: string
  training_type: string
  category: string
  hours_initial_theory: number
  hours_initial_practical: number
  hours_initial_ojt: number
  hours_initial_total: number
  hours_recurrent_theory: number
  hours_recurrent_practical: number
  hours_recurrent_ojt: number
  hours_recurrent_total: number
  hours_re_qualification_theory: number
  hours_re_qualification_practical: number
  hours_re_qualification_ojt: number
  hours_re_qualification_total: number
  hours_update_theory: number
  hours_update_practical: number
  hours_update_ojt: number
  hours_update_total: number
  hours_ojt_theory: number
  hours_ojt_practical: number
  hours_ojt_total: number
  validity_period_months: number
  renewal_notice_days: number
  is_mandatory: boolean
  difficulty_level: string
  reference_standard: string
  passing_score: number
  requires_practical: boolean
  requires_written_exam: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

type AssociatedTrainings = {
  id: string
  title: string
  start_date: string
  end_date: string
  status: string
  instructor: string
}[]

export default function TrainingTypeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  
  const [trainingType, setTrainingType] = useState<TrainingType | null>(null)
  const [associatedTrainings, setAssociatedTrainings] = useState<AssociatedTrainings>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (id) {
      fetchTrainingType()
      fetchAssociatedTrainings()
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
      setTrainingType(data)
    } catch (err) {
      console.error("Error fetching training type:", err)
      setError("Greška pri učitavanju tipa obuke")
    } finally {
      setLoading(false)
    }
  }

  const fetchAssociatedTrainings = async () => {
    try {
      const supabase = getSupabaseBrowserClient()
      const { data, error } = await supabase
        .from("trainings")
        .select("id, title, start_date, end_date, status, instructor")
        .eq("training_type_id", id)
        .order("start_date", { ascending: false })

      if (error) throw error
      setAssociatedTrainings(data || [])
    } catch (err) {
      console.error("Error fetching associated trainings:", err)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const supabase = getSupabaseBrowserClient()
      
      // Prvo proverimo da li postoje vezane obuke
      if (associatedTrainings.length > 0) {
        setError("Ne možete obrisati tip obuke jer postoje vezane obuke. Prvo obrišite sve vezane obuke.")
        setDeleting(false)
        return
      }

      const { error } = await supabase
        .from("training_types")
        .delete()
        .eq("id", id)

      if (error) throw error

      router.push("/dashboard/training-types")
      router.refresh()
    } catch (err) {
      console.error("Error deleting training type:", err)
      setError("Greška pri brisanju tipa obuke")
      setDeleting(false)
    }
  }

  const handleToggleActive = async () => {
    if (!trainingType) return

    try {
      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase
        .from("training_types")
        .update({ 
          is_active: !trainingType.is_active,
          updated_at: new Date().toISOString()
        })
        .eq("id", id)

      if (error) throw error

      // Update local state
      setTrainingType({
        ...trainingType,
        is_active: !trainingType.is_active,
        updated_at: new Date().toISOString()
      })
    } catch (err) {
      console.error("Error toggling active status:", err)
      setError("Greška pri promeni statusa")
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

        {/* Main Content Skeleton */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (!trainingType) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard/training-types">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Tip obuke nije pronađen</h1>
            <p className="text-muted-foreground">Tip obuke sa ovim ID-om ne postoji</p>
          </div>
        </div>
        
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">Tip obuke nije pronađen</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Tip obuke koji tražite možda je obrisan ili ne postoji
              </p>
              <Button asChild className="mt-4">
                <Link href="/dashboard/training-types">Vrati se na listu</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("sr-RS", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  const getTrainingTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      initial: "Initial Training",
      recurrent: "Recurrent Training",
      re_qualification: "Re-qualification Training",
      update: "Update Training",
      ojt: "OJT (On-the-Job Training)",
      refresher: "Refresher Training",
      conversion: "Conversion Training",
    }
    return labels[type] || type
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      safety: "Safety & Security",
      technical: "Technical / Ramp",
      operational: "Operational",
      administrative: "Administrative",
      customer_service: "Customer Service",
      management: "Management & Supervision",
    }
    return labels[category] || category
  }

  const getDifficultyLabel = (level: string) => {
    const labels: Record<string, string> = {
      basic: "Basic (Osnovni)",
      intermediate: "Intermediate (Srednji)",
      advanced: "Advanced (Napredni)",
      expert: "Expert (Ekspertski)",
    }
    return labels[level] || level
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard/training-types">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{trainingType.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                {trainingType.code}
              </code>
              <Badge variant={trainingType.is_active ? "default" : "secondary"}>
                {trainingType.is_active ? "Aktivan" : "Neaktivan"}
              </Badge>
              <Badge variant="outline">
                {getTrainingTypeLabel(trainingType.training_type)}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant={trainingType.is_active ? "outline" : "default"}
            size="sm"
            onClick={handleToggleActive}
            className="gap-2"
          >
            {trainingType.is_active ? (
              <>
                <XCircle className="h-4 w-4" />
                Deaktiviraj
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Aktiviraj
              </>
            )}
          </Button>
          
          <Button variant="outline" size="sm" className="gap-2" asChild>
            <Link href={`/dashboard/training-types/${id}/edit`}>
              <Edit className="h-4 w-4" />
              Izmeni
            </Link>
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="destructive" 
                size="sm"
                className="gap-2"
                disabled={associatedTrainings.length > 0}
              >
                <Trash2 className="h-4 w-4" />
                Obriši
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Da li ste sigurni?</AlertDialogTitle>
                <AlertDialogDescription>
                  Ova akcija trajno će obrisati tip obuke "{trainingType.name}".
                  {associatedTrainings.length > 0 && (
                    <Alert className="mt-2">
                      <AlertDescription>
                        Ne možete obrisati ovaj tip obuke jer postoje {associatedTrainings.length} vezane obuke.
                      </AlertDescription>
                    </Alert>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Otkaži</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={deleting || associatedTrainings.length > 0}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleting ? "Brisanje..." : "Obriši"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Pregled</TabsTrigger>
          <TabsTrigger value="details">Detalji</TabsTrigger>
          <TabsTrigger value="trainings">
            Povezane obuke ({associatedTrainings.length})
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              {/* Description */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Opis obuke
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-line">
                    {trainingType.description || "Nema opisa"}
                  </p>
                </CardContent>
              </Card>

              {/* Training Hours */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Trajanje obuke (sati)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Teorija</div>
                      <div className="text-2xl font-bold">
                        {trainingType.hours_initial_theory || trainingType.hours_recurrent_theory || trainingType.hours_ojt_theory || 0}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Praksa</div>
                      <div className="text-2xl font-bold">
                        {trainingType.hours_initial_practical || trainingType.hours_recurrent_practical || trainingType.hours_ojt_practical || 0}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium">OJT</div>
                      <div className="text-2xl font-bold">
                        {trainingType.hours_initial_ojt || trainingType.hours_recurrent_ojt || trainingType.hours_ojt_total || 0}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Ukupno</div>
                      <div className="text-2xl font-bold">
                        {trainingType.hours_initial_total || trainingType.hours_recurrent_total || trainingType.hours_ojt_total || 0}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar Info */}
            <div className="space-y-6">
              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Osnovne informacije
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Vrsta obuke</div>
                    <div className="font-medium">{getTrainingTypeLabel(trainingType.training_type)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Kategorija</div>
                    <div className="font-medium">{getCategoryLabel(trainingType.category)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Nivo težine</div>
                    <div className="font-medium">{getDifficultyLabel(trainingType.difficulty_level)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Obavezna</div>
                    <div className="font-medium">
                      {trainingType.is_mandatory ? "Da" : "Ne"}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Validity & Requirements */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Validnost i zahtevi
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Validnost sertifikata</div>
                    <div className="font-medium">
                      {trainingType.validity_period_months 
                        ? `${trainingType.validity_period_months} mjeseci`
                        : "Nije definirano"}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Obaveštenje pre isteka</div>
                    <div className="font-medium">
                      {trainingType.renewal_notice_days 
                        ? `${trainingType.renewal_notice_days} dana`
                        : "Nije definirano"}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Prolazni rezultat</div>
                    <div className="font-medium">
                      {trainingType.passing_score ? `${trainingType.passing_score}%` : "Nije definisan"}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Praktični deo</div>
                      <div className="font-medium">
                        {trainingType.requires_practical ? "Da" : "Ne"}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Pismeni ispit</div>
                      <div className="font-medium">
                        {trainingType.requires_written_exam ? "Da" : "Ne"}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Reference Standards */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Reference i standardi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Referentni standard</div>
                  <div className="font-medium">
                    {trainingType.reference_standard || "Nije definisan"}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Metadata */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Metapodaci
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm text-muted-foreground">Kreiran</div>
                  <div className="font-medium">{formatDate(trainingType.created_at)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Ažuriran</div>
                  <div className="font-medium">{formatDate(trainingType.updated_at)}</div>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Hours */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Detaljne satnice po vrstama obuke
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 font-medium">Vrsta obuke</th>
                        <th className="text-center py-2 font-medium">Teorija</th>
                        <th className="text-center py-2 font-medium">Praksa</th>
                        <th className="text-center py-2 font-medium">OJT</th>
                        <th className="text-center py-2 font-medium">Ukupno</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trainingType.hours_initial_total > 0 && (
                        <tr className="border-b">
                          <td className="py-2">Initial Training</td>
                          <td className="text-center py-2">{trainingType.hours_initial_theory || 0}</td>
                          <td className="text-center py-2">{trainingType.hours_initial_practical || 0}</td>
                          <td className="text-center py-2">{trainingType.hours_initial_ojt || 0}</td>
                          <td className="text-center py-2 font-bold">{trainingType.hours_initial_total || 0}</td>
                        </tr>
                      )}
                      {trainingType.hours_recurrent_total > 0 && (
                        <tr className="border-b">
                          <td className="py-2">Recurrent Training</td>
                          <td className="text-center py-2">{trainingType.hours_recurrent_theory || 0}</td>
                          <td className="text-center py-2">{trainingType.hours_recurrent_practical || 0}</td>
                          <td className="text-center py-2">{trainingType.hours_recurrent_ojt || 0}</td>
                          <td className="text-center py-2 font-bold">{trainingType.hours_recurrent_total || 0}</td>
                        </tr>
                      )}
                      {trainingType.hours_re_qualification_total > 0 && (
                        <tr className="border-b">
                          <td className="py-2">Re-qualification</td>
                          <td className="text-center py-2">{trainingType.hours_re_qualification_theory || 0}</td>
                          <td className="text-center py-2">{trainingType.hours_re_qualification_practical || 0}</td>
                          <td className="text-center py-2">{trainingType.hours_re_qualification_ojt || 0}</td>
                          <td className="text-center py-2 font-bold">{trainingType.hours_re_qualification_total || 0}</td>
                        </tr>
                      )}
                      {trainingType.hours_update_total > 0 && (
                        <tr className="border-b">
                          <td className="py-2">Update Training</td>
                          <td className="text-center py-2">{trainingType.hours_update_theory || 0}</td>
                          <td className="text-center py-2">{trainingType.hours_update_practical || 0}</td>
                          <td className="text-center py-2">{trainingType.hours_update_ojt || 0}</td>
                          <td className="text-center py-2 font-bold">{trainingType.hours_update_total || 0}</td>
                        </tr>
                      )}
                      {trainingType.hours_ojt_total > 0 && (
                        <tr>
                          <td className="py-2">OJT Training</td>
                          <td className="text-center py-2">{trainingType.hours_ojt_theory || 0}</td>
                          <td className="text-center py-2">{trainingType.hours_ojt_practical || 0}</td>
                          <td className="text-center py-2">{trainingType.hours_ojt_total || 0}</td>
                          <td className="text-center py-2 font-bold">{trainingType.hours_ojt_total || 0}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trainings Tab */}
        <TabsContent value="trainings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Povezane obuke ({associatedTrainings.length})
              </CardTitle>
              <CardDescription>
                Obuke koje koriste ovaj tip obuke
              </CardDescription>
            </CardHeader>
            <CardContent>
              {associatedTrainings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Users className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">Nema povezanih obuka</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Nema obuka koje koriste ovaj tip obuke
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {associatedTrainings.map((training) => (
                    <div
                      key={training.id}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <GraduationCap className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{training.title}</p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(training.start_date)}
                              </span>
                              <Badge variant="outline" className="capitalize">
                                {training.status}
                              </Badge>
                              {training.instructor && (
                                <span className="flex items-center gap-1">
                                  <Briefcase className="h-3 w-3" />
                                  {training.instructor}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/dashboard/trainings/${training.id}`}>
                          Detalji
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}