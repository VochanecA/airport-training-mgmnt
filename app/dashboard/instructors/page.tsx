// app/dashboard/instructors/page.tsx
"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Filter, User, Calendar, Award, RefreshCw, Mail, Phone } from "lucide-react"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Instructor {
  id: string
  staff_id: string
  instructor_code: string | null
  specializations: string[] | null
  certification_number: string | null
  certification_expiry: string | null
  status: string
  created_at: string
  updated_at: string
  // Joined fields from staff
  staff: {
    id: string
    employee_number: string
    first_name: string
    last_name: string
    email: string | null
    phone: string | null
    position_id: string | null
    status: string
    hire_date: string | null
  } | null
  // Joined fields from position
  position: {
    title: string | null
    department: string | null
  } | null
}

export default function InstructorsPage() {
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [filteredInstructors, setFilteredInstructors] = useState<Instructor[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [specializationFilter, setSpecializationFilter] = useState("all")
  
  const supabase = getSupabaseBrowserClient()

  // Fetch data
  const fetchInstructors = async () => {
    try {
      // Fetch instructors with staff details
      const { data: instructorsData, error: instructorsError } = await supabase
        .from("instructors")
        .select(`
          *,
          staff:staff_id (
            id,
            employee_number,
            first_name,
            last_name,
            email,
            phone,
            position_id,
            status,
            hire_date
          )
        `)
        .order("created_at", { ascending: false })

      if (instructorsError) throw instructorsError

      // Fetch positions for each instructor
      const enrichedInstructors = await Promise.all(
        (instructorsData || []).map(async (instructor) => {
          if (instructor.staff?.position_id) {
            const { data: positionData } = await supabase
              .from("working_positions")
              .select("title, department")
              .eq("id", instructor.staff.position_id)
              .single()
            
            return {
              ...instructor,
              position: positionData || null
            }
          }
          return { ...instructor, position: null }
        })
      )

      return enrichedInstructors
    } catch (error) {
      console.error("Error fetching instructors:", error)
      return []
    }
  }

  const loadData = async () => {
    setLoading(true)
    const data = await fetchInstructors()
    setInstructors(data)
    setFilteredInstructors(data)
    setLoading(false)
  }

  const refreshData = async () => {
    setRefreshing(true)
    const data = await fetchInstructors()
    setInstructors(data)
    applyFilters(data, {
      searchTerm,
      statusFilter,
      departmentFilter,
      specializationFilter
    })
    setRefreshing(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  // Apply filters function
  const applyFilters = (
    instructors: Instructor[], 
    filters: {
      searchTerm: string
      statusFilter: string
      departmentFilter: string
      specializationFilter: string
    }
  ) => {
    let filtered = [...instructors]

    // Search filter
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase()
      filtered = filtered.filter(instructor => {
        const fullName = `${instructor.staff?.first_name || ''} ${instructor.staff?.last_name || ''}`.toLowerCase()
        const employeeNumber = instructor.staff?.employee_number?.toLowerCase() || ''
        const email = instructor.staff?.email?.toLowerCase() || ''
        const specializations = instructor.specializations?.join(' ').toLowerCase() || ''
        
        return (
          fullName.includes(term) ||
          employeeNumber.includes(term) ||
          email.includes(term) ||
          specializations.includes(term) ||
          (instructor.instructor_code?.toLowerCase() || '').includes(term)
        )
      })
    }

    // Status filter
    if (filters.statusFilter !== "all") {
      filtered = filtered.filter(instructor => instructor.status === filters.statusFilter)
    }

    // Department filter
    if (filters.departmentFilter !== "all") {
      filtered = filtered.filter(instructor => 
        instructor.position?.department?.toLowerCase() === filters.departmentFilter.toLowerCase()
      )
    }

    // Specialization filter
    if (filters.specializationFilter !== "all") {
      filtered = filtered.filter(instructor => 
        instructor.specializations?.some(spec => 
          spec.toLowerCase().includes(filters.specializationFilter.toLowerCase())
        )
      )
    }

    setFilteredInstructors(filtered)
  }

  // Apply filters when filter states change
  useEffect(() => {
    if (instructors.length > 0) {
      applyFilters(instructors, {
        searchTerm,
        statusFilter,
        departmentFilter,
        specializationFilter
      })
    }
  }, [searchTerm, statusFilter, departmentFilter, specializationFilter, instructors])

  // Get unique values for filters
  const uniqueDepartments = useMemo(() => {
    const departments = instructors
      .map(instructor => instructor.position?.department)
      .filter(Boolean)
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort()
    
    return departments
  }, [instructors])

  const allSpecializations = useMemo(() => {
    const specializations = new Set<string>()
    
    instructors.forEach(instructor => {
      instructor.specializations?.forEach(spec => {
        if (spec) specializations.add(spec)
      })
    })
    
    return Array.from(specializations).sort()
  }, [instructors])

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString('sr-RS', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // Get initials for avatar
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase()
  }

  // Check certification status
  const getCertificationStatus = (expiryDate: string | null) => {
    if (!expiryDate) {
      return {
        label: "Bez isteka",
        color: "bg-gray-100 text-gray-800 border-gray-200",
        status: "no_expiry"
      }
    }

    const today = new Date()
    const expiry = new Date(expiryDate)
    const daysUntilExpiry = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (expiry < today) {
      return {
        label: "Istekla",
        color: "bg-red-100 text-red-800 border-red-200",
        status: "expired"
      }
    } else if (daysUntilExpiry <= 30) {
      return {
        label: "Ističe uskoro",
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        status: "expiring_soon"
      }
    } else {
      return {
        label: "Važeća",
        color: "bg-green-100 text-green-800 border-green-200",
        status: "valid"
      }
    }
  }

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("")
    setStatusFilter("all")
    setDepartmentFilter("all")
    setSpecializationFilter("all")
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Instruktori</h1>
          <p className="text-muted-foreground">Upravljanje svim instruktorima i njihovim certifikatima</p>
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
          <Link href="/dashboard/instructors/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Dodaj Instruktora
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
                placeholder="Pretraži po imenu, kodu, sertifikatu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <Filter className="h-4 w-4" />
                Status
              </label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Svi statusi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Svi statusi</SelectItem>
                  <SelectItem value="active">Aktivni</SelectItem>
                  <SelectItem value="inactive">Neaktivni</SelectItem>
                  <SelectItem value="pending">Na čekanju</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <User className="h-4 w-4" />
                Odjel
              </label>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Svi odjeli" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Svi odjeli</SelectItem>
                  {uniqueDepartments.map(dept => (
                    <SelectItem key={dept} value={dept || ""}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <Award className="h-4 w-4" />
                Specijalizacija
              </label>
              <Select value={specializationFilter} onValueChange={setSpecializationFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Sve specijalizacije" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Sve specijalizacije</SelectItem>
                  {allSpecializations.map(spec => (
                    <SelectItem key={spec} value={spec}>
                      {spec}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dodatni filteri i reset */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Prikazano: {filteredInstructors.length} od {instructors.length} instruktora
            </div>
            <Button
              variant="outline"
              onClick={clearFilters}
              className="w-full md:w-auto"
            >
              Očisti sve filtere
            </Button>
          </div>

          {/* Aktivni filteri */}
          {(searchTerm || statusFilter !== "all" || departmentFilter !== "all" || 
            specializationFilter !== "all") && (
            <div className="flex flex-wrap items-center gap-2 mt-4 p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">Aktivni filteri:</span>
              
              {searchTerm && (
                <Badge variant="secondary" className="gap-1">
                  Pretraga: "{searchTerm}"
                </Badge>
              )}
              
              {statusFilter !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  Status: {statusFilter}
                </Badge>
              )}
              
              {departmentFilter !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  Odjel: {departmentFilter}
                </Badge>
              )}
              
              {specializationFilter !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  Specijalizacija: {specializationFilter}
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
                <p className="text-sm font-medium text-muted-foreground">Ukupno instruktora</p>
                <p className="text-2xl font-bold">{instructors.length}</p>
              </div>
              <User className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Aktivni</p>
                <p className="text-2xl font-bold">
                  {instructors.filter(i => i.status === 'active').length}
                </p>
              </div>
              <div className="p-2 bg-green-100 rounded-full">
                <User className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sertifikati</p>
                <p className="text-2xl font-bold">
                  {instructors.filter(i => i.certification_number).length}
                </p>
              </div>
              <div className="p-2 bg-purple-100 rounded-full">
                <Award className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Kursevi u toku</p>
                <p className="text-2xl font-bold">-</p>
                <p className="text-xs text-muted-foreground">Uskoro...</p>
              </div>
              <div className="p-2 bg-yellow-100 rounded-full">
                <Calendar className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle>Svi Instruktori ({filteredInstructors.length})</CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span>Aktivan</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-red-500"></div>
                <span>Neaktivan</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-gray-500"></div>
                <span>Na čekanju</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredInstructors.length === 0 ? (
            <div className="text-center py-12">
              <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                {instructors.length === 0 
                  ? "Nema instruktora u sistemu" 
                  : "Nema instruktora koji odgovaraju filterima"}
              </p>
              {instructors.length === 0 ? (
                <Link href="/dashboard/instructors/new">
                  <Button variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Dodaj Prvog Instruktora
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
                    <TableHead>Instruktor</TableHead>
                    <TableHead>Podaci</TableHead>
                    <TableHead>Specijalizacije</TableHead>
                    <TableHead>Sertifikacija</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Akcije</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInstructors.map((instructor) => {
                    const staff = instructor.staff
                    const certStatus = getCertificationStatus(instructor.certification_expiry)
                    
                    return (
                      <TableRow key={instructor.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>
                                {staff ? getInitials(staff.first_name, staff.last_name) : "I"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">
                                {staff ? `${staff.first_name} ${staff.last_name}` : "Nepoznato"}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {instructor.instructor_code || "Bez koda"}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {staff?.employee_number && (
                              <div className="text-sm">Br. zaposlenog: {staff.employee_number}</div>
                            )}
                            {staff?.email && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                {staff.email}
                              </div>
                            )}
                            {staff?.phone && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {staff.phone}
                              </div>
                            )}
                            {instructor.position?.title && (
                              <div className="text-sm">
                                Pozicija: {instructor.position.title}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {instructor.specializations?.length ? (
                            <div className="flex flex-wrap gap-1">
                              {instructor.specializations.slice(0, 3).map((spec, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {spec}
                                </Badge>
                              ))}
                              {instructor.specializations.length > 3 && (
                                <span className="text-xs text-muted-foreground">
                                  +{instructor.specializations.length - 3}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">Nema specijalizacija</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {instructor.certification_number && (
                              <div className="font-medium text-sm">
                                {instructor.certification_number}
                              </div>
                            )}
                            {instructor.certification_expiry && (
                              <Badge className={`text-xs ${certStatus.color}`}>
                                {certStatus.label}
                              </Badge>
                            )}
                            {instructor.certification_expiry && (
                              <div className="text-xs text-muted-foreground">
                                Do: {formatDate(instructor.certification_expiry)}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            instructor.status === 'active' ? 'default' :
                            instructor.status === 'inactive' ? 'destructive' :
                            'outline'
                          }>
                            {instructor.status === 'active' ? 'Aktivan' :
                             instructor.status === 'inactive' ? 'Neaktivan' :
                             'Na čekanju'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Link href={`/dashboard/instructors/${instructor.id}`}>
                              <Button variant="ghost" size="sm">
                                Detalji
                              </Button>
                            </Link>
                            <Link href={`/dashboard/instructors/${instructor.id}/edit`}>
                              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                                Uredi
                              </Button>
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}