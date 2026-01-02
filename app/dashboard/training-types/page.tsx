"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Layers, Clock, BookOpen, Award, AlertCircle, Plus, Eye, Edit, Filter, RefreshCw } from "lucide-react"
import Link from "next/link"
import { AddTrainingTypeDialog } from "@/components/add-training-type-dialog"
import { TrainingTypesFilters, TrainingFilters } from "@/components/training-types-filters"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Skeleton } from "@/components/ui/skeleton"

type TrainingType = {
  id: string
  code: string
  name: string
  description?: string
  training_type?: string
  category?: string
  hours_initial_total?: number
  hours_recurrent_total?: number
  hours_ojt_total?: number
  validity_period_months?: number
  is_active: boolean
  is_mandatory: boolean
  requires_practical: boolean
  requires_written_exam: boolean
  difficulty_level?: string
  created_at: string
  updated_at: string
}

export default function TrainingTypesPage() {
  const [allTrainingTypes, setAllTrainingTypes] = useState<TrainingType[]>([])
  const [filteredTrainingTypes, setFilteredTrainingTypes] = useState<TrainingType[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filters, setFilters] = useState<TrainingFilters>({
    category: "all",
    training_type: "all",
    is_active: "all",
    is_mandatory: "all",
    search: "",
  })

  const fetchTrainingTypes = async () => {
    try {
      const supabase = getSupabaseBrowserClient()
      const { data, error } = await supabase
        .from("training_types")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching training types:", error)
        return []
      }

      return data || []
    } catch (error) {
      console.error("Error:", error)
      return []
    }
  }

  const loadData = async () => {
    setLoading(true)
    const data = await fetchTrainingTypes()
    setAllTrainingTypes(data)
    setFilteredTrainingTypes(data) // Inicijalno prikaži sve
    setLoading(false)
  }

  const refreshData = async () => {
    setRefreshing(true)
    const data = await fetchTrainingTypes()
    setAllTrainingTypes(data)
    applyFilters(data, filters) // Ponovo primeni filtere na nove podatke
    setRefreshing(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  // Funkcija za filtriranje podataka
  const applyFilters = (data: TrainingType[], currentFilters: TrainingFilters) => {
    let filtered = [...data]

    // Pretraga
    if (currentFilters.search) {
      const searchTerm = currentFilters.search.toLowerCase()
      filtered = filtered.filter(type =>
        type.code.toLowerCase().includes(searchTerm) ||
        type.name.toLowerCase().includes(searchTerm) ||
        (type.description && type.description.toLowerCase().includes(searchTerm))
      )
    }

    // Filter po kategoriji
    if (currentFilters.category && currentFilters.category !== "all") {
      filtered = filtered.filter(type => type.category === currentFilters.category)
    }

    // Filter po vrsti obuke
    if (currentFilters.training_type && currentFilters.training_type !== "all") {
      filtered = filtered.filter(type => type.training_type === currentFilters.training_type)
    }

    // Filter po statusu
    if (currentFilters.is_active && currentFilters.is_active !== "all") {
      const isActive = currentFilters.is_active === "active"
      filtered = filtered.filter(type => type.is_active === isActive)
    }

    // Filter po obaveznosti
    if (currentFilters.is_mandatory && currentFilters.is_mandatory !== "all") {
      const isMandatory = currentFilters.is_mandatory === "mandatory"
      filtered = filtered.filter(type => type.is_mandatory === isMandatory)
    }

    setFilteredTrainingTypes(filtered)
  }

  // Pozivaj se kada se filteri promene
  useEffect(() => {
    if (allTrainingTypes.length > 0) {
      applyFilters(allTrainingTypes, filters)
    }
  }, [filters, allTrainingTypes])

  const handleFilterChange = (newFilters: TrainingFilters) => {
    setFilters(newFilters)
  }

  const handleSearchChange = (search: string) => {
    setFilters(prev => ({ ...prev, search }))
  }

  // Memorizirane statistike
  const stats = useMemo(() => {
    const total = allTrainingTypes.length
    const active = allTrainingTypes.filter(t => t.is_active).length
    const mandatory = allTrainingTypes.filter(t => t.is_mandatory).length
    const withCertificates = allTrainingTypes.filter(t => t.requires_written_exam).length

    return { total, active, mandatory, withCertificates }
  }, [allTrainingTypes])

  // Memorizirane kategorije
  const categories = useMemo(() => {
    const categoryCounts: Record<string, number> = {}
    allTrainingTypes.forEach(type => {
      if (type.category) {
        categoryCounts[type.category] = (categoryCounts[type.category] || 0) + 1
      }
    })
    return categoryCounts
  }, [allTrainingTypes])

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Table Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
            Tipovi Obuka
          </h1>
          <p className="text-muted-foreground mt-2">
            Pregled i upravljanje tipovima obuka prema IATA AHM 1110 standardu
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <AddTrainingTypeDialog onTrainingTypeAdded={refreshData} />
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={refreshData}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Osvežavanje...' : 'Osveži'}
          </Button>
          <TrainingTypesFilters 
            onFilterChange={handleFilterChange}
            onSearchChange={handleSearchChange}
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
              Ukupno tipova obuka
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
              {stats.total}
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 dark:border-green-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">
              Aktivni tipovi obuka
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900 dark:text-green-100">
              {stats.active}
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 dark:border-amber-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-300">
              Obavezne obuke
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-900 dark:text-amber-100">
              {stats.mandatory}
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 dark:border-purple-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">
              Sertifikati
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">
              {stats.withCertificates}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Info */}
      {(filters.category !== "all" || 
        filters.training_type !== "all" || 
        filters.is_active !== "all" || 
        filters.is_mandatory !== "all" ||
        filters.search) && (
        <div className="flex items-center justify-between bg-muted/50 p-3 rounded-lg">
          <div className="text-sm">
            <span className="font-medium">Aktivni filteri:</span>
            <div className="flex flex-wrap gap-2 mt-1">
              {filters.category !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  Kategorija: {filters.category}
                </Badge>
              )}
              {filters.training_type !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  Vrsta: {filters.training_type}
                </Badge>
              )}
              {filters.is_active !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  Status: {filters.is_active === "active" ? "Aktivni" : "Neaktivni"}
                </Badge>
              )}
              {filters.is_mandatory !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  Obaveznost: {filters.is_mandatory === "mandatory" ? "Obavezne" : "Neobavezne"}
                </Badge>
              )}
              {filters.search && (
                <Badge variant="secondary" className="gap-1">
                  Pretraga: "{filters.search}"
                </Badge>
              )}
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setFilters({
              category: "all",
              training_type: "all",
              is_active: "all",
              is_mandatory: "all",
              search: "",
            })}
          >
            Očisti filtere
          </Button>
        </div>
      )}

      {/* Training Types Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Lista tipova obuka ({filteredTrainingTypes.length})
          </CardTitle>
          <CardDescription>
            {filteredTrainingTypes.length === 0 
              ? "Nema tipova obuka koji odgovaraju filterima" 
              : "Pregled svih tipova obuka sa detaljima o trajanju, validnosti i zahtevima"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTrainingTypes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Layers className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">Nema tipova obuka</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {allTrainingTypes.length === 0 
                  ? "Kreirajte prvi tip obuke koristeći dugme 'Dodaj Novi Tip Obuke'" 
                  : "Nema tipova obuka koji odgovaraju vašim filterima. Pokušajte da promenite filtere."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kod</TableHead>
                    <TableHead>Naziv</TableHead>
                    <TableHead>Vrsta</TableHead>
                    <TableHead>Kategorija</TableHead>
                    <TableHead className="text-center">Ukupno sati</TableHead>
                    <TableHead>Validnost</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Akcije</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTrainingTypes.map((type) => (
                    <TableRow key={type.id}>
                      <TableCell>
                        <div className="font-mono font-bold">{type.code}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{type.name}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {type.description?.substring(0, 50)}...
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {type.training_type?.replace('_', ' ') || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">
                          {type.category || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {type.hours_initial_total || type.hours_recurrent_total || type.hours_ojt_total || 0}
                          </span>
                          <span className="text-xs text-muted-foreground">sati</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span>
                            {type.validity_period_months 
                              ? `${type.validity_period_months} mj.` 
                              : 'Nije definirano'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant={type.is_active ? "default" : "secondary"}
                          className={type.is_active 
                            ? "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300" 
                            : ""}
                        >
                          {type.is_active ? "Aktivan" : "Neaktivan"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/dashboard/training-types/${type.id}`}>
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">Pregled</span>
                            </Link>
                          </Button>
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/dashboard/training-types/${type.id}/edit`}>
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Izmeni</span>
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Information */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <BookOpen className="h-4 w-4" />
              Kategorije obuka
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(categories).map(([category, count]) => (
                <div key={category} className="flex items-center justify-between">
                  <span className="capitalize">{category.replace('_', ' ')}</span>
                  <Badge variant="outline">{count}</Badge>
                </div>
              ))}
              {Object.keys(categories).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Nema kategorija
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 dark:border-amber-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <AlertCircle className="h-4 w-4" />
              Brzi pregled
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span>Sa praktičnim delom</span>
              <Badge variant="outline">
                {allTrainingTypes.filter(t => t.requires_practical).length}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Zahtevaju sertifikat</span>
              <Badge variant="outline">
                {allTrainingTypes.filter(t => t.requires_written_exam).length}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>OJT obuke</span>
              <Badge variant="outline">
                {allTrainingTypes.filter(t => t.training_type === 'ojt').length}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Napredni nivo</span>
              <Badge variant="outline">
                {allTrainingTypes.filter(t => t.difficulty_level === 'advanced' || t.difficulty_level === 'expert').length}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}