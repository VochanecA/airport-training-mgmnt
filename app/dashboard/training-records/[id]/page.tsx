import { getSupabaseServerClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  GraduationCap, 
  Target, 
  Award,
  Clock,
  MapPin,
  FileText,
  CheckCircle,
  XCircle,
  Edit
} from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

async function getTrainingRecordDetails(id: string) {
  const supabase = await getSupabaseServerClient()

  const { data: trainingRecord } = await supabase
    .from("v_training_records_summary")
    .select("*")
    .eq("id", id)
    .single()

  return trainingRecord
}

export default async function TrainingRecordDetailsPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params
  const trainingRecord = await getTrainingRecordDetails(id)

  if (!trainingRecord) {
    notFound()
  }

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString('sr-RS', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/training-records">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Nazad na listu
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Detalji Treninga</h1>
            <p className="text-muted-foreground">Evidencija treninga prema 8.2 Records Identification</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/training-records/${id}/edit`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Uredi
            </Button>
          </Link>
        </div>
      </div>

      {/* Glavne informacije */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Osnovne informacije */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5" />
              Osnovne informacije
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Zaposleni</p>
              <p className="text-lg font-semibold">
                {trainingRecord.staff_full_name}
              </p>
              <p className="text-sm text-muted-foreground">
                Broj zaposlenog: {trainingRecord.employee_number}
              </p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-muted-foreground">Naziv treninga</p>
              <p className="text-lg font-semibold">
                {trainingRecord.training_title}
              </p>
              {trainingRecord.training_type_name && (
                <p className="text-sm text-muted-foreground">
                  Tip: {trainingRecord.training_type_name}
                </p>
              )}
            </div>
            
            <div>
              <p className="text-sm font-medium text-muted-foreground">Metoda treninga</p>
              <Badge variant="outline" className="mt-1">
                {trainingRecord.training_method || 'Nije navedeno'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Datumi i validnost */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5" />
              Datumi i validnost
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Datum treninga</p>
              <p className="text-lg font-semibold">
                {formatDate(trainingRecord.training_date)}
              </p>
            </div>
            
            {trainingRecord.training_end_date && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Završni datum</p>
                <p className="text-lg font-semibold">
                  {formatDate(trainingRecord.training_end_date)}
                </p>
              </div>
            )}
            
            <div>
              <p className="text-sm font-medium text-muted-foreground">Važi do</p>
              {trainingRecord.expiry_date ? (
                <div className="flex items-center gap-2">
                  <p className="text-lg font-semibold">
                    {formatDate(trainingRecord.expiry_date)}
                  </p>
                  <Badge variant={
                    new Date(trainingRecord.expiry_date) > new Date() 
                      ? "default" 
                      : "destructive"
                  }>
                    {new Date(trainingRecord.expiry_date) > new Date() 
                      ? "Aktivan" 
                      : "Istekao"}
                  </Badge>
                </div>
              ) : (
                <p className="text-lg font-semibold text-muted-foreground">Neograničeno</p>
              )}
            </div>
            
            {trainingRecord.validity_months && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Validnost</p>
                <p className="text-lg font-semibold">
                  {trainingRecord.validity_months} mjeseci
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rezultati */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5" />
              Rezultati
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <Badge variant={
                trainingRecord.status === 'completed' ? 'default' :
                trainingRecord.status === 'in_progress' ? 'secondary' :
                trainingRecord.status === 'planned' ? 'outline' :
                'destructive'
              } className="mt-1">
                {trainingRecord.status === 'completed' ? 'Završeno' :
                 trainingRecord.status === 'in_progress' ? 'U toku' :
                 trainingRecord.status === 'planned' ? 'Planirano' :
                 'Otkazano'}
              </Badge>
            </div>
            
            {trainingRecord.actual_score !== null && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rezultat</p>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-semibold">
                    {trainingRecord.actual_score}
                    {trainingRecord.passing_score && ` / ${trainingRecord.passing_score}`}
                  </p>
                  {trainingRecord.passing_score && (
                    <Badge variant={
                      trainingRecord.actual_score >= trainingRecord.passing_score 
                        ? "default" 
                        : "destructive"
                    }>
                      {trainingRecord.actual_score >= trainingRecord.passing_score 
                        ? 'Položeno' 
                        : 'Palo'}
                    </Badge>
                  )}
                </div>
              </div>
            )}
            
            <div>
              <p className="text-sm font-medium text-muted-foreground">Kompetencije</p>
              <div className="flex items-center gap-2 mt-1">
                {trainingRecord.competency_achieved ? (
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Dokazano
                  </Badge>
                ) : (
                  <Badge variant="outline">
                    <XCircle className="h-3 w-3 mr-1" />
                    U toku
                  </Badge>
                )}
                {trainingRecord.competency_level && (
                  <span className="text-sm text-muted-foreground">
                    ({trainingRecord.competency_level})
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dodatne informacije */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Instruktor i lokacija */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <GraduationCap className="h-5 w-5" />
              Instruktor i lokacija
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Instruktor</p>
              <p className="text-lg font-semibold">
                {trainingRecord.trainer_full_name || trainingRecord.trainer_name || 'Nije navedeno'}
              </p>
            </div>
            
            {trainingRecord.location && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Lokacija</p>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <p className="text-lg font-semibold">
                    {trainingRecord.location}
                  </p>
                </div>
              </div>
            )}
            
            {trainingRecord.training_provider && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Organizator</p>
                <p className="text-lg font-semibold">
                  {trainingRecord.training_provider}
                </p>
              </div>
            )}
            
            {/* Potpisi */}
            <div className="pt-4 border-t">
              <p className="text-sm font-medium text-muted-foreground mb-2">Potpisi</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Instruktor</p>
                  <p className="text-sm">
                    {trainingRecord.trainer_signature_date 
                      ? formatDate(trainingRecord.trainer_signature_date)
                      : 'Nije potpisano'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Polaznik</p>
                  <p className="text-sm">
                    {trainingRecord.trainee_signature_date 
                      ? formatDate(trainingRecord.trainee_signature_date)
                      : 'Nije potpisano'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Satnice i bilješke */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5" />
              Satnice i bilješke
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Satnice treninga</p>
              <div className="grid grid-cols-3 gap-4 mt-2">
                <div className="text-center">
                  <p className="text-2xl font-bold">{trainingRecord.training_hours_theory || 0}</p>
                  <p className="text-xs text-muted-foreground">Teorija</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{trainingRecord.training_hours_practical || 0}</p>
                  <p className="text-xs text-muted-foreground">Praksa</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{trainingRecord.training_hours_ojt || 0}</p>
                  <p className="text-xs text-muted-foreground">OJT</p>
                </div>
              </div>
              <div className="text-center mt-4">
                <p className="text-sm font-medium">Ukupno sati</p>
                <p className="text-3xl font-bold">{trainingRecord.training_hours_total || 0}</p>
              </div>
            </div>
            
            {trainingRecord.competency_notes && (
              <div className="pt-4 border-t">
                <p className="text-sm font-medium text-muted-foreground mb-2">Bilješke o kompetencijama</p>
                <p className="text-sm whitespace-pre-line">{trainingRecord.competency_notes}</p>
              </div>
            )}
            
            {trainingRecord.notes && (
              <div className="pt-4 border-t">
                <p className="text-sm font-medium text-muted-foreground mb-2">Dodatne bilješke</p>
                <p className="text-sm whitespace-pre-line">{trainingRecord.notes}</p>
              </div>
            )}
            
            {trainingRecord.signature_notes && (
              <div className="pt-4 border-t">
                <p className="text-sm font-medium text-muted-foreground mb-2">Bilješke o potpisima</p>
                <p className="text-sm whitespace-pre-line">{trainingRecord.signature_notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Timestamp informacije */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row justify-between text-sm text-muted-foreground">
            <div>
              <p>Zapis kreiran: {formatDate(trainingRecord.created_at)}</p>
              {trainingRecord.updated_at !== trainingRecord.created_at && (
                <p>Zadnja izmjena: {formatDate(trainingRecord.updated_at)}</p>
              )}
            </div>
            <div className="mt-2 sm:mt-0">
              <Link href={`/dashboard/training-records/${id}/edit`}>
                <Button>
                  <Edit className="h-4 w-4 mr-2" />
                  Uredi zapisnik
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}