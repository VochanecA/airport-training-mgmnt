"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Filter, Search, Calendar, User, GraduationCap, RefreshCw } from "lucide-react"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Skeleton } from "@/components/ui/skeleton"

interface TrainingRecord {
  id: string
  staff_id: string
  training_title: string
  training_type_id: string | null
  training_date: string
  training_end_date: string | null
  validity_months: number | null
  expiry_date: string | null
  competency_achieved: boolean
  competency_level: string | null
  competency_notes: string | null
  passing_score: number | null
  actual_score: number | null
  score_type: string | null
  trainer_id: string | null
  trainer_name: string | null
  training_hours_theory: number
  training_hours_practical: number
  training_hours_ojt: number
  training_hours_total: number
  training_method: string
  location: string | null
  training_provider: string | null
  status: string
  notes: string | null
  attachments: string[] | null
  created_at: string
  updated_at: string
  created_by: string | null
  employee_number: string
  staff_full_name: string
  training_type_name: string | null
  trainer_full_name: string | null
}

export default function TrainingRecordsPage() {
  const [trainingRecords, setTrainingRecords] = useState<TrainingRecord[]>([])
  const [filteredRecords, setFilteredRecords] = useState<TrainingRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [employeeFilter, setEmployeeFilter] = useState("all")
  const [trainingTypeFilter, setTrainingTypeFilter] = useState("all")
  const [validityFilter, setValidityFilter] = useState("all")
  
  const supabase = getSupabaseBrowserClient()

  // Fetch data
  const fetchTrainingRecords = async () => {
    try {
      const { data, error } = await supabase
        .from("v_training_records_summary")
        .select("*")
        .order("training_date", { ascending: false })
        .limit(200)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Error fetching training records:", error)
      return []
    }
  }

  const loadData = async () => {
    setLoading(true)
    const data = await fetchTrainingRecords()
    setTrainingRecords(data)
    setFilteredRecords(data)
    setLoading(false)
  }

  const refreshData = async () => {
    setRefreshing(true)
    const data = await fetchTrainingRecords()
    setTrainingRecords(data)
    applyFilters(data, {
      searchTerm,
      statusFilter,
      employeeFilter,
      trainingTypeFilter,
      validityFilter
    })
    setRefreshing(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  // Apply filters function
  const applyFilters = (
    records: TrainingRecord[], 
    filters: {
      searchTerm: string
      statusFilter: string
      employeeFilter: string
      trainingTypeFilter: string
      validityFilter: string
    }
  ) => {
    let filtered = [...records]

    // Search filter
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase()
      filtered = filtered.filter(record =>
        record.training_title.toLowerCase().includes(term) ||
        record.staff_full_name.toLowerCase().includes(term) ||
        record.employee_number.toLowerCase().includes(term) ||
        (record.training_type_name && record.training_type_name.toLowerCase().includes(term)) ||
        (record.location && record.location.toLowerCase().includes(term))
      )
    }

    // Status filter
    if (filters.statusFilter !== "all") {
      filtered = filtered.filter(record => record.status === filters.statusFilter)
    }

    // Employee filter
    if (filters.employeeFilter !== "all") {
      filtered = filtered.filter(record => record.staff_id === filters.employeeFilter)
    }

    // Training type filter
    if (filters.trainingTypeFilter !== "all") {
      filtered = filtered.filter(record => 
        record.training_method === filters.trainingTypeFilter ||
        (record.training_type_name && record.training_type_name.toLowerCase().includes(filters.trainingTypeFilter))
      )
    }

    // Validity filter
    if (filters.validityFilter !== "all") {
      const today = new Date()
      
      filtered = filtered.filter(record => {
        if (!record.expiry_date) return filters.validityFilter === "no_expiry"
        
        const expiryDate = new Date(record.expiry_date)
        const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        
        switch (filters.validityFilter) {
          case "valid":
            return expiryDate > today
          case "expiring_soon":
            return expiryDate > today && daysUntilExpiry <= 30
          case "expired":
            return expiryDate <= today
          case "no_expiry":
            return !record.expiry_date
          default:
            return true
        }
      })
    }

    setFilteredRecords(filtered)
  }

  // Apply filters when filter states change
  useEffect(() => {
    if (trainingRecords.length > 0) {
      applyFilters(trainingRecords, {
        searchTerm,
        statusFilter,
        employeeFilter,
        trainingTypeFilter,
        validityFilter
      })
    }
  }, [searchTerm, statusFilter, employeeFilter, trainingTypeFilter, validityFilter, trainingRecords])

  // Get unique values for filters
  const uniqueEmployees = useMemo(() => {
    const employees = trainingRecords
      .filter((record, index, self) =>
        self.findIndex(r => r.staff_id === record.staff_id) === index
      )
      .map(record => ({
        id: record.staff_id,
        name: record.staff_full_name,
        employee_number: record.employee_number
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
    
    return employees
  }, [trainingRecords])

  const uniqueTrainingMethods = useMemo(() => {
    const methods = Array.from(
      new Set(trainingRecords.map(r => r.training_method).filter(Boolean))
    ).sort()
    return methods
  }, [trainingRecords])

  // Function to get validity badge
  const getValidityBadge = (expiryDate: string | null) => {
    if (!expiryDate) {
      return (
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-full bg-gray-400"></div>
          <span className="text-xs">Neograničeno</span>
        </div>
      )
    }

    const today = new Date()
    const expiry = new Date(expiryDate)
    const daysUntilExpiry = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (expiry < today) {
      return (
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-full bg-red-500"></div>
          <span className="text-xs text-red-600">
            Istekao {new Date(expiryDate).toLocaleDateString()}
          </span>
        </div>
      )
    } else if (daysUntilExpiry <= 30) {
      return (
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
          <span className="text-xs text-yellow-600">
            Ističe za {daysUntilExpiry} dana
          </span>
        </div>
      )
    } else {
      return (
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-full bg-green-500"></div>
          <span className="text-xs text-green-600">
            Važi do {new Date(expiryDate).toLocaleDateString()}
          </span>
        </div>
      )
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sr-RS', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("")
    setStatusFilter("all")
    setEmployeeFilter("all")
    setTrainingTypeFilter("all")
    setValidityFilter("all")
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Filters Skeleton */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Table Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Evidencija Obuka - Dnevnik Obuke</h1>
          <p className="text-muted-foreground">Sve teorijske, praktične i OJT obuke - 8.2 Records Identification</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={refreshData}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Osvežavanje...' : 'Osveži'}
          </Button>
          <Link href="/dashboard/training-records/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novi Trening
            </Button>
          </Link>
        </div>
      </div>

      {/* Filteri */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <Search className="h-4 w-4" />
                Pretraga
              </label>
              <Input
                placeholder="Pretraži po nazivu, zaposlenom..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <Calendar className="h-4 w-4" />
                Status
              </label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Svi statusi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Svi statusi</SelectItem>
                  <SelectItem value="planned">Planirani</SelectItem>
                  <SelectItem value="in_progress">U toku</SelectItem>
                  <SelectItem value="completed">Završeni</SelectItem>
                  <SelectItem value="cancelled">Otkazani</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <User className="h-4 w-4" />
                Zaposleni
              </label>
              <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Svi zaposleni" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Svi zaposleni</SelectItem>
                  {uniqueEmployees.map(employee => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name} ({employee.employee_number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <GraduationCap className="h-4 w-4" />
                Tip treninga
              </label>
              <Select value={trainingTypeFilter} onValueChange={setTrainingTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Svi tipovi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Svi tipovi</SelectItem>
                  {uniqueTrainingMethods.map(method => (
                    <SelectItem key={method} value={method}>
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dodatni filteri i reset */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <Filter className="h-4 w-4" />
                Validnost
              </label>
              <Select value={validityFilter} onValueChange={setValidityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Sva stanja" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Sva stanja</SelectItem>
                  <SelectItem value="valid">Važeći</SelectItem>
                  <SelectItem value="expiring_soon">Ističe uskoro (&lt;30 dana)</SelectItem>
                  <SelectItem value="expired">Istekli</SelectItem>
                  <SelectItem value="no_expiry">Bez isteka</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2 flex items-end">
              <Button
                variant="outline"
                onClick={clearFilters}
                className="w-full md:w-auto"
              >
                Očisti sve filtere
              </Button>
            </div>
          </div>

          {/* Aktivni filteri */}
          {(searchTerm || statusFilter !== "all" || employeeFilter !== "all" || 
            trainingTypeFilter !== "all" || validityFilter !== "all") && (
            <div className="flex flex-wrap items-center gap-2 mt-4 p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">Aktivni filteri:</span>
              
              {searchTerm && (
                <Badge variant="secondary" className="gap-1">
                  Pretraga: "{searchTerm}"
                </Badge>
              )}
              
              {statusFilter !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  Status: {
                    statusFilter === 'planned' ? 'Planirani' :
                    statusFilter === 'in_progress' ? 'U toku' :
                    statusFilter === 'completed' ? 'Završeni' : 'Otkazani'
                  }
                </Badge>
              )}
              
              {employeeFilter !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  Zaposleni: {uniqueEmployees.find(e => e.id === employeeFilter)?.name}
                </Badge>
              )}
              
              {trainingTypeFilter !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  Tip: {trainingTypeFilter}
                </Badge>
              )}
              
              {validityFilter !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  Validnost: {
                    validityFilter === 'valid' ? 'Važeći' :
                    validityFilter === 'expiring_soon' ? 'Ističe uskoro' :
                    validityFilter === 'expired' ? 'Istekli' : 'Bez isteka'
                  }
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistike */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ukupno treninga</p>
                <p className="text-2xl font-bold">{filteredRecords.length}</p>
                <p className="text-xs text-muted-foreground">
                  Od {trainingRecords.length} ukupno
                </p>
              </div>
              <GraduationCap className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Završeni</p>
                <p className="text-2xl font-bold">
                  {filteredRecords.filter(t => t.status === 'completed').length}
                </p>
              </div>
              <div className="p-2 bg-green-100 rounded-full">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">U toku</p>
                <p className="text-2xl font-bold">
                  {filteredRecords.filter(t => t.status === 'in_progress').length}
                </p>
              </div>
              <div className="p-2 bg-yellow-100 rounded-full">
                <User className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Kompetencije</p>
                <p className="text-2xl font-bold">
                  {filteredRecords.filter(t => t.competency_achieved).length}
                </p>
              </div>
              <div className="p-2 bg-purple-100 rounded-full">
                <Filter className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle>Svi Trening Zapisnici ({filteredRecords.length})</CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span>Važeći</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                <span>Ističe uskoro</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-red-500"></div>
                <span>Istekao</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredRecords.length === 0 ? (
            <div className="text-center py-12">
              <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                {trainingRecords.length === 0 
                  ? "Nema treninga u evidenciji" 
                  : "Nema treninga koji odgovaraju filterima"}
              </p>
              {trainingRecords.length === 0 ? (
                <Link href="/dashboard/training-records/new">
                  <Button variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Dodaj Prvi Trening
                  </Button>
                </Link>
              ) : (
                <Button variant="outline" onClick={clearFilters}>
                  Očisti filtere
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Zaposleni</TableHead>
                    <TableHead>Trening</TableHead>
                    <TableHead>Datum</TableHead>
                    <TableHead>Tip</TableHead>
                    <TableHead>Rezultat</TableHead>
                    <TableHead>Kompetencije</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Akcije</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div className="font-medium">{record.staff_full_name}</div>
                        <div className="text-sm text-muted-foreground">{record.employee_number}</div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {record.training_title}
                        {record.training_type_name && (
                          <div className="text-xs text-muted-foreground">
                            {record.training_type_name}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {formatDate(record.training_date)}
                        </div>
                        {record.expiry_date && (
                          <div className="mt-1">
                            {getValidityBadge(record.expiry_date)}
                          </div>
                        )}
                        {record.training_end_date && record.training_end_date !== record.training_date && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Do: {formatDate(record.training_end_date)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {record.training_method || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {record.actual_score !== null && record.passing_score !== null ? (
                          <div>
                            <div className={`font-medium ${
                              record.actual_score >= record.passing_score 
                                ? 'text-green-700' 
                                : 'text-red-700'
                            }`}>
                              {record.actual_score} / {record.passing_score}
                            </div>
                            <div className={`text-xs ${
                              record.actual_score >= record.passing_score 
                                ? 'text-green-600' 
                                : 'text-red-600'
                            }`}>
                              {record.actual_score >= record.passing_score ? 'Položeno' : 'Palo'}
                              {record.score_type && ` (${record.score_type})`}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {record.competency_achieved ? (
                          <div>
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
                              {record.competency_level || 'Dokazano'}
                            </Badge>
                            {record.competency_notes && (
                              <div className="text-xs text-muted-foreground mt-1 truncate max-w-[150px]">
                                {record.competency_notes.substring(0, 50)}...
                              </div>
                            )}
                          </div>
                        ) : (
                          <Badge variant="outline">U toku</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          record.status === 'completed' ? 'default' :
                          record.status === 'in_progress' ? 'secondary' :
                          record.status === 'planned' ? 'outline' :
                          'destructive'
                        }>
                          {record.status === 'completed' ? 'Završeno' :
                           record.status === 'in_progress' ? 'U toku' :
                           record.status === 'planned' ? 'Planirano' :
                           'Otkazano'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/dashboard/training-records/${record.id}`}>
                            <Button variant="ghost" size="sm">
                              Detalji
                            </Button>
                          </Link>
                          <Link href={`/dashboard/training-records/${record.id}/edit`}>
                            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                              Uredi
                            </Button>
                          </Link>
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
    </div>
  )
}