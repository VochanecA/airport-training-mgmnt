"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Layers, 
  Clock, 
  BookOpen, 
  Award, 
  AlertCircle, 
  Plus, 
  Eye, 
  Edit, 
  Filter, 
  RefreshCw, 
  Search,
  CheckCircle2,
  XCircle,
  Bookmark,
  BarChart3,
  Calendar,
  FileText,
  Users,
  Download,
  Upload,
  Settings
} from "lucide-react"
import Link from "next/link"
import { AddTrainingTypeDialog } from "@/components/add-training-type-dialog"
import { TrainingTypesFilters, TrainingFilters } from "@/components/training-types-filters"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"

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
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")
  const [sortBy, setSortBy] = useState<"name" | "code" | "created" | "hours">("name")

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
    setFilteredTrainingTypes(data)
    setLoading(false)
  }

  const refreshData = async () => {
    setRefreshing(true)
    const data = await fetchTrainingTypes()
    setAllTrainingTypes(data)
    applyFilters(data, filters)
    setRefreshing(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const applyFilters = (data: TrainingType[], currentFilters: TrainingFilters) => {
    let filtered = [...data]

    if (currentFilters.search) {
      const searchTerm = currentFilters.search.toLowerCase()
      filtered = filtered.filter(type =>
        type.code.toLowerCase().includes(searchTerm) ||
        type.name.toLowerCase().includes(searchTerm) ||
        (type.description && type.description.toLowerCase().includes(searchTerm))
      )
    }

    if (currentFilters.category && currentFilters.category !== "all") {
      filtered = filtered.filter(type => type.category === currentFilters.category)
    }

    if (currentFilters.training_type && currentFilters.training_type !== "all") {
      filtered = filtered.filter(type => type.training_type === currentFilters.training_type)
    }

    if (currentFilters.is_active && currentFilters.is_active !== "all") {
      const isActive = currentFilters.is_active === "active"
      filtered = filtered.filter(type => type.is_active === isActive)
    }

    if (currentFilters.is_mandatory && currentFilters.is_mandatory !== "all") {
      const isMandatory = currentFilters.is_mandatory === "mandatory"
      filtered = filtered.filter(type => type.is_mandatory === isMandatory)
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name)
        case "code":
          return a.code.localeCompare(b.code)
        case "created":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case "hours":
          const aHours = a.hours_initial_total || a.hours_recurrent_total || a.hours_ojt_total || 0
          const bHours = b.hours_initial_total || b.hours_recurrent_total || b.hours_ojt_total || 0
          return bHours - aHours
        default:
          return 0
      }
    })

    setFilteredTrainingTypes(filtered)
  }

  useEffect(() => {
    if (allTrainingTypes.length > 0) {
      applyFilters(allTrainingTypes, filters)
    }
  }, [filters, allTrainingTypes, sortBy])

  const handleFilterChange = (newFilters: TrainingFilters) => {
    setFilters(newFilters)
  }

  const handleSearchChange = (search: string) => {
    setFilters(prev => ({ ...prev, search }))
  }

  const clearFilters = () => {
    setFilters({
      category: "all",
      training_type: "all",
      is_active: "all",
      is_mandatory: "all",
      search: "",
    })
  }

  // Memorized statistics
  const stats = useMemo(() => {
    const total = allTrainingTypes.length
    const active = allTrainingTypes.filter(t => t.is_active).length
    const mandatory = allTrainingTypes.filter(t => t.is_mandatory).length
    const withCertificates = allTrainingTypes.filter(t => t.requires_written_exam).length
    const withPractical = allTrainingTypes.filter(t => t.requires_practical).length
    const ojtTypes = allTrainingTypes.filter(t => t.training_type === 'ojt').length
    const averageHours = total > 0 
      ? Math.round(allTrainingTypes.reduce((sum, t) => 
          sum + (t.hours_initial_total || t.hours_recurrent_total || t.hours_ojt_total || 0), 0) / total
        )
      : 0

    return { total, active, mandatory, withCertificates, withPractical, ojtTypes, averageHours }
  }, [allTrainingTypes])

  const categories = useMemo(() => {
    const categoryCounts: Record<string, number> = {}
    allTrainingTypes.forEach(type => {
      if (type.category) {
        categoryCounts[type.category] = (categoryCounts[type.category] || 0) + 1
      }
    })
    return categoryCounts
  }, [allTrainingTypes])

  const typeDistribution = useMemo(() => {
    const distribution: Record<string, number> = {}
    allTrainingTypes.forEach(type => {
      if (type.training_type) {
        distribution[type.training_type] = (distribution[type.training_type] || 0) + 1
      }
    })
    return distribution
  }, [allTrainingTypes])

  if (loading) {
    return (
      <div className="space-y-6">
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
      {/* Header with Actions */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 p-2">
              <Layers className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Tipovi Obuka</h1>
              <p className="text-muted-foreground">
                Upravljajte katalogom obuka prema IATA AHM 1110 standardima
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AddTrainingTypeDialog onTrainingTypeAdded={refreshData} />
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Izvezi
          </Button>
          <Button variant="outline" className="gap-2">
            <Upload className="h-4 w-4" />
            Uvezi
          </Button>
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={refreshData}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Osvežavanje...' : 'Osveži'}
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Ukupno tipova</p>
                <p className="text-3xl font-bold text-blue-900 dark:text-blue-100 mt-2">
                  {stats.total}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  {stats.active} aktivno
                </p>
              </div>
              <div className="rounded-full bg-blue-500/20 p-3">
                <Layers className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-300">Obavezne obuke</p>
                <p className="text-3xl font-bold text-green-900 dark:text-green-100 mt-2">
                  {stats.mandatory}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  {Math.round((stats.mandatory / stats.total) * 100)}% od ukupnog
                </p>
              </div>
              <div className="rounded-full bg-green-500/20 p-3">
                <Bookmark className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 border-amber-200 dark:border-amber-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-700 dark:text-amber-300">Prosečno sati</p>
                <p className="text-3xl font-bold text-amber-900 dark:text-amber-100 mt-2">
                  {stats.averageHours}
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  po obuci
                </p>
              </div>
              <div className="rounded-full bg-amber-500/20 p-3">
                <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Sertifikati</p>
                <p className="text-3xl font-bold text-purple-900 dark:text-purple-100 mt-2">
                  {stats.withCertificates}
                </p>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                  {stats.withPractical} sa praktičnim delom
                </p>
              </div>
              <div className="rounded-full bg-purple-500/20 p-3">
                <Award className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters Bar */}
      <Card className="border border-blue-100 dark:border-blue-800">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Pretraži tipove obuka po kodu, nazivu ili opisu..."
                    className="pl-9"
                    value={filters.search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sortiraj po" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Naziv (A-Z)</SelectItem>
                    <SelectItem value="code">Kod (A-Z)</SelectItem>
                    <SelectItem value="created">Najnovije</SelectItem>
                    <SelectItem value="hours">Najviše sati</SelectItem>
                  </SelectContent>
                </Select>
                <TrainingTypesFilters 
                  onFilterChange={handleFilterChange}
                  onSearchChange={handleSearchChange}
                />
                <Button 
                  variant="outline" 
                  onClick={clearFilters}
                  className="gap-2"
                  disabled={!Object.values(filters).some(v => v !== "all" && v !== "")}
                >
                  <XCircle className="h-4 w-4" />
                  Očisti
                </Button>
              </div>
            </div>

            {/* Active Filters */}
            {(filters.category !== "all" || 
              filters.training_type !== "all" || 
              filters.is_active !== "all" || 
              filters.is_mandatory !== "all" ||
              filters.search) && (
              <div className="pt-4 border-t">
                <div className="flex items-center gap-2 mb-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Aktivni filteri:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {filters.search && (
                    <Badge variant="secondary" className="gap-1">
                      <Search className="h-3 w-3" />
                      "{filters.search}"
                    </Badge>
                  )}
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
                      {filters.is_active === "active" ? "Aktivni" : "Neaktivni"}
                    </Badge>
                  )}
                  {filters.is_mandatory !== "all" && (
                    <Badge variant="secondary" className="gap-1">
                      {filters.is_mandatory === "mandatory" ? "Obavezne" : "Neobavezne"}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="list" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="list" className="gap-2">
              <Layers className="h-4 w-4" />
              Lista ({filteredTrainingTypes.length})
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Statistika
            </TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            <Button 
              variant={viewMode === "list" ? "default" : "outline"} 
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <Layers className="h-4 w-4" />
            </Button>
            <Button 
              variant={viewMode === "grid" ? "default" : "outline"} 
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <BookOpen className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <TabsContent value="list">
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Lista tipova obuka</CardTitle>
                  <CardDescription>
                    {filteredTrainingTypes.length === 0 
                      ? "Nema rezultata koji odgovaraju vašim filterima" 
                      : `Prikazano ${filteredTrainingTypes.length} od ${allTrainingTypes.length} tipova obuka`}
                  </CardDescription>
                </div>
                <div className="text-sm text-muted-foreground">
                  Sortirano po: <span className="font-medium">{sortBy}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {filteredTrainingTypes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Layers className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">Nema pronađenih tipova obuka</h3>
                  <p className="text-sm text-muted-foreground mt-1 text-center">
                    Pokušajte da promenite filtere pretrage ili kreirajte novi tip obuke.
                  </p>
                  <div className="mt-4">
                    <AddTrainingTypeDialog onTrainingTypeAdded={refreshData} />
                  </div>
                </div>
              ) : (
                <div className="overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold">Kod</TableHead>
                        <TableHead className="font-semibold">Naziv</TableHead>
                        <TableHead className="font-semibold">Detalji</TableHead>
                        <TableHead className="font-semibold text-center">Sati</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold text-right">Akcije</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTrainingTypes.map((type) => (
                        <TableRow key={type.id} className="hover:bg-muted/50">
                          <TableCell>
                            <div className="font-mono font-bold text-blue-600 dark:text-blue-400">
                              {type.code}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium">{type.name}</div>
                              <div className="text-xs text-muted-foreground line-clamp-2">
                                {type.description}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs capitalize">
                                  {type.training_type || 'N/A'}
                                </Badge>
                                <Badge variant="secondary" className="text-xs capitalize">
                                  {type.category || 'N/A'}
                                </Badge>
                              </div>
                              {type.validity_period_months && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  {type.validity_period_months} mjeseci validnosti
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="space-y-1">
                              <div className="text-lg font-bold">
                                {type.hours_initial_total || type.hours_recurrent_total || type.hours_ojt_total || 0}
                              </div>
                              <div className="text-xs text-muted-foreground">sati</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-2">
                              <Badge 
                                className={`gap-1 ${type.is_active 
                                  ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300' 
                                  : 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300'}`}
                              >
                                {type.is_active ? (
                                  <CheckCircle2 className="h-3 w-3" />
                                ) : (
                                  <XCircle className="h-3 w-3" />
                                )}
                                {type.is_active ? 'Aktivan' : 'Neaktivan'}
                              </Badge>
                              {type.is_mandatory && (
                                <Badge variant="outline" className="text-xs">
                                  Obavezno
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="ghost" asChild className="gap-1">
                                <Link href={`/dashboard/training-types/${type.id}`}>
                                  <Eye className="h-4 w-4" />
                                  Pregled
                                </Link>
                              </Button>
                              <Button size="sm" variant="ghost" asChild className="gap-1">
                                <Link href={`/dashboard/training-types/${type.id}/edit`}>
                                  <Edit className="h-4 w-4" />
                                  Izmeni
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
        </TabsContent>

        <TabsContent value="stats">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Category Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Distribucija po kategorijama
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(categories).map(([category, count]) => {
                    const percentage = (count / stats.total) * 100
                    return (
                      <div key={category} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium capitalize">{category.replace('_', ' ')}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{count}</span>
                            <Badge variant="outline">{Math.round(percentage)}%</Badge>
                          </div>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Type Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Distribucija po vrstama
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(typeDistribution).map(([type, count]) => {
                    const percentage = (count / stats.total) * 100
                    return (
                      <div key={type} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-md ${
                            type === 'initial' ? 'bg-blue-100 text-blue-600' :
                            type === 'recurrent' ? 'bg-green-100 text-green-600' :
                            type === 'ojt' ? 'bg-purple-100 text-purple-600' :
                            'bg-amber-100 text-amber-600'
                          }`}>
                            {type === 'initial' && <Users className="h-4 w-4" />}
                            {type === 'recurrent' && <RefreshCw className="h-4 w-4" />}
                            {type === 'ojt' && <FileText className="h-4 w-4" />}
                          </div>
                          <div>
                            <div className="font-medium capitalize">{type}</div>
                            <div className="text-sm text-muted-foreground">
                              {Math.round(percentage)}% od ukupnog
                            </div>
                          </div>
                        </div>
                        <div className="text-2xl font-bold">{count}</div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Requirements Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Zahtevi i uslovi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <span>Sertifikati</span>
                    </div>
                    <div className="font-bold">{stats.withCertificates}</div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-green-600" />
                      <span>Praktični deo</span>
                    </div>
                    <div className="font-bold">{stats.withPractical}</div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                    <div className="flex items-center gap-3">
                      <Bookmark className="h-5 w-5 text-purple-600" />
                      <span>OJT obuke</span>
                    </div>
                    <div className="font-bold">{stats.ojtTypes}</div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                    <div className="flex items-center gap-3">
                      <Award className="h-5 w-5 text-amber-600" />
                      <span>Napredni nivo</span>
                    </div>
                    <div className="font-bold">
                      {allTrainingTypes.filter(t => t.difficulty_level === 'advanced' || t.difficulty_level === 'expert').length}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Additions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Nedavno dodato
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {allTrainingTypes.slice(0, 5).map((type) => (
                    <div key={type.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <div className="font-medium">{type.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(type.created_at).toLocaleDateString('sr-RS')}
                        </div>
                      </div>
                      <Badge variant={type.is_active ? "default" : "secondary"}>
                        {type.is_active ? "Aktivan" : "Neaktivan"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}


// ili:
// "use client"

// import { useState, useEffect, useMemo } from "react"
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
// import { Button } from "@/components/ui/button"
// import { Badge } from "@/components/ui/badge"
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
// import { Input } from "@/components/ui/input"
// import { 
//   Layers, 
//   Clock, 
//   BookOpen, 
//   Award, 
//   AlertCircle, 
//   Plus, 
//   Eye, 
//   Edit, 
//   Filter, 
//   RefreshCw,
//   Search,
//   X,
//   Grid3x3,
//   List,
//   ChevronDown
// } from "lucide-react"
// import Link from "next/link"
// import { AddTrainingTypeDialog } from "@/components/add-training-type-dialog"
// import { TrainingTypesFilters, TrainingFilters } from "@/components/training-types-filters"
// import { getSupabaseBrowserClient } from "@/lib/supabase/client"
// import { Skeleton } from "@/components/ui/skeleton"
// import { 
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu"

// type TrainingType = {
//   id: string
//   code: string
//   name: string
//   description?: string
//   training_type?: string
//   category?: string
//   hours_initial_total?: number
//   hours_recurrent_total?: number
//   hours_ojt_total?: number
//   validity_period_months?: number
//   is_active: boolean
//   is_mandatory: boolean
//   requires_practical: boolean
//   requires_written_exam: boolean
//   difficulty_level?: string
//   created_at: string
//   updated_at: string
// }

// export default function TrainingTypesPage() {
//   const [allTrainingTypes, setAllTrainingTypes] = useState<TrainingType[]>([])
//   const [filteredTrainingTypes, setFilteredTrainingTypes] = useState<TrainingType[]>([])
//   const [loading, setLoading] = useState(true)
//   const [refreshing, setRefreshing] = useState(false)
//   const [searchQuery, setSearchQuery] = useState("")
//   const [viewMode, setViewMode] = useState<"table" | "grid">("table")
//   const [filters, setFilters] = useState<TrainingFilters>({
//     category: "all",
//     training_type: "all",
//     is_active: "all",
//     is_mandatory: "all",
//     search: "", // Ovo će se sinhronizovati sa searchQuery
//   })

//   const fetchTrainingTypes = async () => {
//     try {
//       const supabase = getSupabaseBrowserClient()
//       const { data, error } = await supabase
//         .from("training_types")
//         .select("*")
//         .order("created_at", { ascending: false })

//       if (error) {
//         console.error("Error fetching training types:", error)
//         return []
//       }

//       return data || []
//     } catch (error) {
//       console.error("Error:", error)
//       return []
//     }
//   }

//   const loadData = async () => {
//     setLoading(true)
//     const data = await fetchTrainingTypes()
//     setAllTrainingTypes(data)
//     setFilteredTrainingTypes(data)
//     setLoading(false)
//   }

//   const refreshData = async () => {
//     setRefreshing(true)
//     const data = await fetchTrainingTypes()
//     setAllTrainingTypes(data)
//     applyFilters(data, filters)
//     setRefreshing(false)
//   }

//   useEffect(() => {
//     loadData()
//   }, [])

//   const applyFilters = (data: TrainingType[], currentFilters: TrainingFilters) => {
//     let filtered = [...data]

//     // Koristi i searchQuery iz glavne trake i search iz filtera
//     const searchTerm = (currentFilters.search || searchQuery).toLowerCase()
//     if (searchTerm) {
//       filtered = filtered.filter(type =>
//         type.code.toLowerCase().includes(searchTerm) ||
//         type.name.toLowerCase().includes(searchTerm) ||
//         (type.description && type.description.toLowerCase().includes(searchTerm)) ||
//         (type.category && type.category.toLowerCase().includes(searchTerm))
//       )
//     }

//     if (currentFilters.category && currentFilters.category !== "all") {
//       filtered = filtered.filter(type => type.category === currentFilters.category)
//     }

//     if (currentFilters.training_type && currentFilters.training_type !== "all") {
//       filtered = filtered.filter(type => type.training_type === currentFilters.training_type)
//     }

//     if (currentFilters.is_active && currentFilters.is_active !== "all") {
//       const isActive = currentFilters.is_active === "active"
//       filtered = filtered.filter(type => type.is_active === isActive)
//     }

//     if (currentFilters.is_mandatory && currentFilters.is_mandatory !== "all") {
//       const isMandatory = currentFilters.is_mandatory === "mandatory"
//       filtered = filtered.filter(type => type.is_mandatory === isMandatory)
//     }

//     setFilteredTrainingTypes(filtered)
//   }

//   useEffect(() => {
//     if (allTrainingTypes.length > 0) {
//       applyFilters(allTrainingTypes, { ...filters, search: searchQuery })
//     }
//   }, [filters, allTrainingTypes, searchQuery])

//   const handleFilterChange = (newFilters: TrainingFilters) => {
//     setFilters(newFilters)
//   }

//   // NOVA FUNKCIJA: Za glavnu traku za pretragu (prima event)
//   const handleMainSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setSearchQuery(e.target.value)
//   }

//   // NOVA FUNKCIJA: Za komponentu filtera (prima string)
//   const handleFilterSearchChange = (search: string) => {
//     setSearchQuery(search)
//   }

//   const clearAllFilters = () => {
//     setSearchQuery("")
//     setFilters({
//       category: "all",
//       training_type: "all",
//       is_active: "all",
//       is_mandatory: "all",
//       search: "",
//     })
//   }

//   const stats = useMemo(() => {
//     const total = allTrainingTypes.length
//     const active = allTrainingTypes.filter(t => t.is_active).length
//     const mandatory = allTrainingTypes.filter(t => t.is_mandatory).length
//     const withCertificates = allTrainingTypes.filter(t => t.requires_written_exam).length

//     return { total, active, mandatory, withCertificates }
//   }, [allTrainingTypes])

//   const categories = useMemo(() => {
//     const categoryCounts: Record<string, number> = {}
//     allTrainingTypes.forEach(type => {
//       if (type.category) {
//         categoryCounts[type.category] = (categoryCounts[type.category] || 0) + 1
//       }
//     })
//     return categoryCounts
//   }, [allTrainingTypes])

//   if (loading) {
//     return (
//       <div className="space-y-6">
//         <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
//           <div className="space-y-2">
//             <Skeleton className="h-8 w-48" />
//             <Skeleton className="h-4 w-64" />
//           </div>
//           <div className="flex gap-2">
//             <Skeleton className="h-10 w-40" />
//             <Skeleton className="h-10 w-24" />
//           </div>
//         </div>

//         <div className="grid gap-4 md:grid-cols-4">
//           {[1, 2, 3, 4].map((i) => (
//             <Card key={i}>
//               <CardHeader className="pb-2">
//                 <Skeleton className="h-4 w-24" />
//               </CardHeader>
//               <CardContent>
//                 <Skeleton className="h-8 w-16" />
//               </CardContent>
//             </Card>
//           ))}
//         </div>

//         <Card>
//           <CardHeader>
//             <Skeleton className="h-6 w-48" />
//             <Skeleton className="h-4 w-64" />
//           </CardHeader>
//           <CardContent>
//             <div className="space-y-3">
//               {[1, 2, 3, 4, 5].map((i) => (
//                 <Skeleton key={i} className="h-12 w-full" />
//               ))}
//             </div>
//           </CardContent>
//         </Card>
//       </div>
//     )
//   }

//   return (
//     <div className="space-y-6">
//       {/* Header with Search */}
//       <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
//         <div className="space-y-2">
//           <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
//             Tipovi Obuka
//           </h1>
//           <p className="text-muted-foreground">
//             Pregled i upravljanje tipovima obuka prema IATA AHM 1110 standardu
//           </p>
//         </div>
        
//         <div className="flex flex-wrap gap-2">
//           <AddTrainingTypeDialog onTrainingTypeAdded={refreshData} />
//           <Button 
//             variant="outline" 
//             className="gap-2"
//             onClick={refreshData}
//             disabled={refreshing}
//           >
//             <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
//             {refreshing ? 'Osvežavanje...' : 'Osveži'}
//           </Button>
//           <TrainingTypesFilters 
//             onFilterChange={handleFilterChange}
//             onSearchChange={handleFilterSearchChange} // Ispravljeno: prosleđujemo funkciju koja prima string
//           />
//         </div>
//       </div>

//       {/* Enhanced Search Bar */}
//       <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
//         <CardContent className="pt-6">
//           <div className="relative">
//             <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
//             <Input
//               placeholder="Pretražite po kodu, nazivu, opisu ili kategoriji..."
//               value={searchQuery}
//               onChange={handleMainSearchChange} // Ispravljeno: koristimo funkciju koja prima event
//               className="pl-10 pr-10"
//             />
//             {searchQuery && (
//               <Button
//                 variant="ghost"
//                 size="sm"
//                 className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0"
//                 onClick={() => setSearchQuery("")}
//               >
//                 <X className="h-4 w-4" />
//                 <span className="sr-only">Obriši pretragu</span>
//               </Button>
//             )}
//           </div>
          
//           {/* Active Filters */}
//           {(filters.category !== "all" || 
//             filters.training_type !== "all" || 
//             filters.is_active !== "all" || 
//             filters.is_mandatory !== "all" ||
//             searchQuery) && (
//             <div className="flex items-center justify-between mt-4">
//               <div className="flex flex-wrap gap-2">
//                 {filters.category !== "all" && (
//                   <Badge variant="secondary" className="gap-1">
//                     Kategorija: {filters.category}
//                     <button
//                       onClick={() => setFilters(prev => ({ ...prev, category: "all" }))}
//                       className="h-3 w-3 p-0 ml-1 rounded-full bg-transparent hover:bg-transparent"
//                     >
//                       <X className="h-3 w-3" />
//                     </button>
//                   </Badge>
//                 )}
//                 {filters.training_type !== "all" && (
//                   <Badge variant="secondary" className="gap-1">
//                     Vrsta: {filters.training_type}
//                     <button
//                       onClick={() => setFilters(prev => ({ ...prev, training_type: "all" }))}
//                       className="h-3 w-3 p-0 ml-1 rounded-full bg-transparent hover:bg-transparent"
//                     >
//                       <X className="h-3 w-3" />
//                     </button>
//                   </Badge>
//                 )}
//                 {filters.is_active !== "all" && (
//                   <Badge variant="secondary" className="gap-1">
//                     Status: {filters.is_active === "active" ? "Aktivni" : "Neaktivni"}
//                     <button
//                       onClick={() => setFilters(prev => ({ ...prev, is_active: "all" }))}
//                       className="h-3 w-3 p-0 ml-1 rounded-full bg-transparent hover:bg-transparent"
//                     >
//                       <X className="h-3 w-3" />
//                     </button>
//                   </Badge>
//                 )}
//                 {filters.is_mandatory !== "all" && (
//                   <Badge variant="secondary" className="gap-1">
//                     Obaveznost: {filters.is_mandatory === "mandatory" ? "Obavezne" : "Neobavezne"}
//                     <button
//                       onClick={() => setFilters(prev => ({ ...prev, is_mandatory: "all" }))}
//                       className="h-3 w-3 p-0 ml-1 rounded-full bg-transparent hover:bg-transparent"
//                     >
//                       <X className="h-3 w-3" />
//                     </button>
//                   </Badge>
//                 )}
//                 {searchQuery && (
//                   <Badge variant="secondary" className="gap-1">
//                     Pretraga: "{searchQuery}"
//                     <button
//                       onClick={() => setSearchQuery("")}
//                       className="h-3 w-3 p-0 ml-1 rounded-full bg-transparent hover:bg-transparent"
//                     >
//                       <X className="h-3 w-3" />
//                     </button>
//                   </Badge>
//                 )}
//               </div>
//               <Button 
//                 variant="ghost" 
//                 size="sm" 
//                 onClick={clearAllFilters}
//                 className="text-xs"
//               >
//                 Očisti sve
//               </Button>
//             </div>
//           )}
//         </CardContent>
//       </Card>

//       {/* Stats Cards */}
//       <div className="grid gap-4 md:grid-cols-4">
//         <Card className="relative overflow-hidden border-0 shadow-md">
//           <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 opacity-10"></div>
//           <CardHeader className="pb-2 relative">
//             <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
//               Ukupno tipova obuka
//             </CardTitle>
//           </CardHeader>
//           <CardContent className="relative">
//             <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
//               {stats.total}
//             </div>
//             <div className="mt-2 flex items-center text-xs text-blue-600 dark:text-blue-400">
//               <Layers className="h-3 w-3 mr-1" />
//               Svi tipovi obuka
//             </div>
//           </CardContent>
//         </Card>

//         <Card className="relative overflow-hidden border-0 shadow-md">
//           <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-green-600 opacity-10"></div>
//           <CardHeader className="pb-2 relative">
//             <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">
//               Aktivni tipovi obuka
//             </CardTitle>
//           </CardHeader>
//           <CardContent className="relative">
//             <div className="text-3xl font-bold text-green-900 dark:text-green-100">
//               {stats.active}
//             </div>
//             <div className="mt-2 flex items-center text-xs text-green-600 dark:text-green-400">
//               <Award className="h-3 w-3 mr-1" />
//               {Math.round((stats.active / stats.total) * 100) || 0}% od ukupnog broja
//             </div>
//           </CardContent>
//         </Card>

//         <Card className="relative overflow-hidden border-0 shadow-md">
//           <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-amber-600 opacity-10"></div>
//           <CardHeader className="pb-2 relative">
//             <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-300">
//               Obavezne obuke
//             </CardTitle>
//           </CardHeader>
//           <CardContent className="relative">
//             <div className="text-3xl font-bold text-amber-900 dark:text-amber-100">
//               {stats.mandatory}
//             </div>
//             <div className="mt-2 flex items-center text-xs text-amber-600 dark:text-amber-400">
//               <AlertCircle className="h-3 w-3 mr-1" />
//               {Math.round((stats.mandatory / stats.total) * 100) || 0}% od ukupnog broja
//             </div>
//           </CardContent>
//         </Card>

//         <Card className="relative overflow-hidden border-0 shadow-md">
//           <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-purple-600 opacity-10"></div>
//           <CardHeader className="pb-2 relative">
//             <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">
//               Sertifikati
//             </CardTitle>
//           </CardHeader>
//           <CardContent className="relative">
//             <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">
//               {stats.withCertificates}
//             </div>
//             <div className="mt-2 flex items-center text-xs text-purple-600 dark:text-purple-400">
//               <BookOpen className="h-3 w-3 mr-1" />
//               {Math.round((stats.withCertificates / stats.total) * 100) || 0}% sa sertifikatom
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       {/* View Toggle and Results Count */}
//       <div className="flex items-center justify-between">
//         <div className="flex items-center gap-2">
//           <h2 className="text-lg font-semibold">
//             Lista tipova obuka ({filteredTrainingTypes.length})
//           </h2>
//           {filteredTrainingTypes.length !== allTrainingTypes.length && (
//             <span className="text-sm text-muted-foreground">
//               od {allTrainingTypes.length} ukupno
//             </span>
//           )}
//         </div>
        
//         <div className="flex items-center gap-2">
//           <DropdownMenu>
//             <DropdownMenuTrigger asChild>
//               <Button variant="outline" size="sm" className="gap-1">
//                 {viewMode === "table" ? <List className="h-4 w-4" /> : <Grid3x3 className="h-4 w-4" />}
//                 Prikaz
//                 <ChevronDown className="h-3 w-3" />
//               </Button>
//             </DropdownMenuTrigger>
//             <DropdownMenuContent align="end">
//               <DropdownMenuItem onClick={() => setViewMode("table")}>
//                 <List className="h-4 w-4 mr-2" />
//                 Tabelarni prikaz
//               </DropdownMenuItem>
//               <DropdownMenuItem onClick={() => setViewMode("grid")}>
//                 <Grid3x3 className="h-4 w-4 mr-2" />
//                 Mrežni prikaz
//               </DropdownMenuItem>
//             </DropdownMenuContent>
//           </DropdownMenu>
//         </div>
//       </div>

//       {/* Training Types Table/Grid */}
//       {viewMode === "table" ? (
//         <Card className="shadow-sm">
//           <CardHeader className="pb-3">
//             <CardTitle className="flex items-center gap-2">
//               <Layers className="h-5 w-5" />
//               Tabelarni prikaz
//             </CardTitle>
//             <CardDescription>
//               {filteredTrainingTypes.length === 0 
//                 ? "Nema tipova obuka koji odgovaraju filterima" 
//                 : "Pregled svih tipova obuka sa detaljima o trajanju, validnosti i zahtevima"}
//             </CardDescription>
//           </CardHeader>
//           <CardContent>
//             {filteredTrainingTypes.length === 0 ? (
//               <div className="flex flex-col items-center justify-center py-12">
//                 <Layers className="h-16 w-16 text-muted-foreground mb-4" />
//                 <h3 className="text-lg font-semibold">Nema tipova obuka</h3>
//                 <p className="text-sm text-muted-foreground mt-1">
//                   {allTrainingTypes.length === 0 
//                     ? "Kreirajte prvi tip obuke koristeći dugme 'Dodaj Novi Tip Obuke'" 
//                     : "Nema tipova obuka koji odgovaraju vašim filterima. Pokušajte da promenite filtere."}
//                 </p>
//                 {allTrainingTypes.length > 0 && filteredTrainingTypes.length === 0 && (
//                   <Button variant="outline" className="mt-4" onClick={clearAllFilters}>
//                     Očisti filtere
//                   </Button>
//                 )}
//               </div>
//             ) : (
//               <div className="overflow-x-auto">
//                 <Table>
//                   <TableHeader>
//                     <TableRow>
//                       <TableHead>Kod</TableHead>
//                       <TableHead>Naziv</TableHead>
//                       <TableHead>Vrsta</TableHead>
//                       <TableHead>Kategorija</TableHead>
//                       <TableHead className="text-center">Ukupno sati</TableHead>
//                       <TableHead>Validnost</TableHead>
//                       <TableHead className="text-center">Status</TableHead>
//                       <TableHead className="text-right">Akcije</TableHead>
//                     </TableRow>
//                   </TableHeader>
//                   <TableBody>
//                     {filteredTrainingTypes.map((type) => (
//                       <TableRow key={type.id} className="hover:bg-muted/50">
//                         <TableCell>
//                           <div className="font-mono font-bold">{type.code}</div>
//                         </TableCell>
//                         <TableCell>
//                           <div className="font-medium">{type.name}</div>
//                           <div className="text-xs text-muted-foreground truncate max-w-[200px]">
//                             {type.description?.substring(0, 50)}...
//                           </div>
//                         </TableCell>
//                         <TableCell>
//                           <Badge variant="outline" className="capitalize">
//                             {type.training_type?.replace('_', ' ') || 'N/A'}
//                           </Badge>
//                         </TableCell>
//                         <TableCell>
//                           <Badge variant="secondary" className="capitalize">
//                             {type.category || 'N/A'}
//                           </Badge>
//                         </TableCell>
//                         <TableCell className="text-center">
//                           <div className="flex flex-col">
//                             <span className="font-medium">
//                               {type.hours_initial_total || type.hours_recurrent_total || type.hours_ojt_total || 0}
//                             </span>
//                             <span className="text-xs text-muted-foreground">sati</span>
//                           </div>
//                         </TableCell>
//                         <TableCell>
//                           <div className="flex items-center gap-1">
//                             <Clock className="h-3 w-3 text-muted-foreground" />
//                             <span>
//                               {type.validity_period_months 
//                                 ? `${type.validity_period_months} mj.` 
//                                 : 'Nije definirano'}
//                             </span>
//                           </div>
//                         </TableCell>
//                         <TableCell className="text-center">
//                           <Badge 
//                             variant={type.is_active ? "default" : "secondary"}
//                             className={type.is_active 
//                               ? "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300" 
//                               : ""}
//                           >
//                             {type.is_active ? "Aktivan" : "Neaktivan"}
//                           </Badge>
//                         </TableCell>
//                         <TableCell className="text-right">
//                           <div className="flex justify-end gap-2">
//                             <Button size="sm" variant="outline" asChild>
//                               <Link href={`/dashboard/training-types/${type.id}`}>
//                                 <Eye className="h-4 w-4" />
//                                 <span className="sr-only">Pregled</span>
//                               </Link>
//                             </Button>
//                             <Button size="sm" variant="outline" asChild>
//                               <Link href={`/dashboard/training-types/${type.id}/edit`}>
//                                 <Edit className="h-4 w-4" />
//                                 <span className="sr-only">Izmeni</span>
//                               </Link>
//                             </Button>
//                           </div>
//                         </TableCell>
//                       </TableRow>
//                     ))}
//                   </TableBody>
//                 </Table>
//               </div>
//             )}
//           </CardContent>
//         </Card>
//       ) : (
//         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
//           {filteredTrainingTypes.length === 0 ? (
//             <div className="col-span-full flex flex-col items-center justify-center py-12">
//               <Layers className="h-16 w-16 text-muted-foreground mb-4" />
//               <h3 className="text-lg font-semibold">Nema tipova obuka</h3>
//               <p className="text-sm text-muted-foreground mt-1">
//                 {allTrainingTypes.length === 0 
//                   ? "Kreirajte prvi tip obuke koristeći dugme 'Dodaj Novi Tip Obuke'" 
//                   : "Nema tipova obuka koji odgovaraju vašim filterima. Pokušajte da promenite filtere."}
//               </p>
//               {allTrainingTypes.length > 0 && filteredTrainingTypes.length === 0 && (
//                 <Button variant="outline" className="mt-4" onClick={clearAllFilters}>
//                   Očisti filtere
//                 </Button>
//               )}
//             </div>
//           ) : (
//             filteredTrainingTypes.map((type) => (
//               <Card key={type.id} className="shadow-sm hover:shadow-md transition-shadow">
//                 <CardHeader className="pb-3">
//                   <div className="flex items-start justify-between">
//                     <div className="space-y-1">
//                       <div className="font-mono font-bold text-sm">{type.code}</div>
//                       <CardTitle className="text-lg">{type.name}</CardTitle>
//                     </div>
//                     <Badge 
//                       variant={type.is_active ? "default" : "secondary"}
//                       className={type.is_active 
//                         ? "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300" 
//                         : ""}
//                     >
//                       {type.is_active ? "Aktivan" : "Neaktivan"}
//                     </Badge>
//                   </div>
//                   <div className="flex gap-2 mt-2">
//                     <Badge variant="outline" className="capitalize text-xs">
//                       {type.training_type?.replace('_', ' ') || 'N/A'}
//                     </Badge>
//                     {type.category && (
//                       <Badge variant="secondary" className="capitalize text-xs">
//                         {type.category}
//                       </Badge>
//                     )}
//                   </div>
//                 </CardHeader>
//                 <CardContent>
//                   {type.description && (
//                     <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
//                       {type.description}
//                     </p>
//                   )}
                  
//                   <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
//                     <div>
//                       <span className="text-muted-foreground">Trajanje:</span>
//                       <div className="font-medium">
//                         {type.hours_initial_total || type.hours_recurrent_total || type.hours_ojt_total || 0} sati
//                       </div>
//                     </div>
//                     <div>
//                       <span className="text-muted-foreground">Validnost:</span>
//                       <div className="font-medium">
//                         {type.validity_period_months 
//                           ? `${type.validity_period_months} mj.` 
//                           : 'Nije definirano'}
//                       </div>
//                     </div>
//                   </div>
                  
//                   <div className="flex gap-2 mb-4">
//                     {type.is_mandatory && (
//                       <Badge variant="outline" className="text-xs">Obavezna</Badge>
//                     )}
//                     {type.requires_practical && (
//                       <Badge variant="outline" className="text-xs">Praktični deo</Badge>
//                     )}
//                     {type.requires_written_exam && (
//                       <Badge variant="outline" className="text-xs">Sertifikat</Badge>
//                     )}
//                   </div>
                  
//                   <div className="flex justify-end gap-2">
//                     <Button size="sm" variant="outline" asChild>
//                       <Link href={`/dashboard/training-types/${type.id}`}>
//                         <Eye className="h-4 w-4 mr-1" />
//                         Pregled
//                       </Link>
//                     </Button>
//                     <Button size="sm" variant="outline" asChild>
//                       <Link href={`/dashboard/training-types/${type.id}/edit`}>
//                         <Edit className="h-4 w-4 mr-1" />
//                         Izmeni
//                       </Link>
//                     </Button>
//                   </div>
//                 </CardContent>
//               </Card>
//             ))
//           )}
//         </div>
//       )}

//       {/* Additional Information */}
//       <div className="grid gap-4 md:grid-cols-2">
//         <Card className="shadow-sm">
//           <CardHeader>
//             <CardTitle className="flex items-center gap-2 text-sm">
//               <BookOpen className="h-4 w-4" />
//               Kategorije obuka
//             </CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="space-y-3">
//               {Object.entries(categories).map(([category, count]) => (
//                 <div key={category} className="flex items-center justify-between p-2 rounded-md bg-muted/30">
//                   <span className="capitalize">{category.replace('_', ' ')}</span>
//                   <Badge variant="outline">{count}</Badge>
//                 </div>
//               ))}
//               {Object.keys(categories).length === 0 && (
//                 <p className="text-sm text-muted-foreground text-center py-2">
//                   Nema kategorija
//                 </p>
//               )}
//             </div>
//           </CardContent>
//         </Card>

//         <Card className="shadow-sm">
//           <CardHeader>
//             <CardTitle className="flex items-center gap-2 text-sm">
//               <AlertCircle className="h-4 w-4" />
//               Brzi pregled
//             </CardTitle>
//           </CardHeader>
//           <CardContent className="space-y-3">
//             <div className="flex items-center justify-between p-2 rounded-md bg-muted/30">
//               <span>Sa praktičnim delom</span>
//               <Badge variant="outline">
//                 {allTrainingTypes.filter(t => t.requires_practical).length}
//               </Badge>
//             </div>
//             <div className="flex items-center justify-between p-2 rounded-md bg-muted/30">
//               <span>Zahtevaju sertifikat</span>
//               <Badge variant="outline">
//                 {allTrainingTypes.filter(t => t.requires_written_exam).length}
//               </Badge>
//             </div>
//             <div className="flex items-center justify-between p-2 rounded-md bg-muted/30">
//               <span>OJT obuke</span>
//               <Badge variant="outline">
//                 {allTrainingTypes.filter(t => t.training_type === 'ojt').length}
//               </Badge>
//             </div>
//             <div className="flex items-center justify-between p-2 rounded-md bg-muted/30">
//               <span>Napredni nivo</span>
//               <Badge variant="outline">
//                 {allTrainingTypes.filter(t => t.difficulty_level === 'advanced' || t.difficulty_level === 'expert').length}
//               </Badge>
//             </div>
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   )
// }