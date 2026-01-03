// app/dashboard/instructors/page.tsx
"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, 
  Search, 
  Filter, 
  User, 
  Calendar, 
  Award, 
  RefreshCw, 
  Mail, 
  Phone,
  Briefcase,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MoreHorizontal
} from "lucide-react"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Type definitions
interface Staff {
  id: string
  employee_number: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  position_id: string | null
  status: string
  hire_date: string | null
}

interface Position {
  title: string | null
  department: string | null
}

interface Instructor {
  id: string
  staff_id: string
  instructor_code: string | null
  specializations: string[] | null
  certification_number: string | null
  certification_expiry: string | null
  status: "active" | "inactive" | "pending"
  created_at: string
  updated_at: string
  staff: Staff | null
  position: Position | null
}

interface Filters {
  searchTerm: string
  statusFilter: string
  departmentFilter: string
  specializationFilter: string
  certificationStatus: string
}

type CertificationStatus = "valid" | "expiring_soon" | "expired" | "no_expiry"

export default function InstructorsPage() {
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  
  // Filter states
  const [filters, setFilters] = useState<Filters>({
    searchTerm: "",
    statusFilter: "all",
    departmentFilter: "all",
    specializationFilter: "all",
    certificationStatus: "all"
  })

  const supabase = getSupabaseBrowserClient()

  // Memoized function to fetch data
  const fetchInstructors = useCallback(async (): Promise<Instructor[]> => {
    try {
      // Single optimized query with joins
      const { data, error } = await supabase
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
          ),
          staff_position:staff_id!inner(position_id),
          position:staff_id!inner(position_id) (
            title,
            department
          )
        `)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching instructors:", error)
        return []
      }

      // Transform the data to match our interface
      return (data || []).map(item => ({
        ...item,
        staff: item.staff as Staff,
        position: (item as any).position as Position | null
      }))
    } catch (error) {
      console.error("Error:", error)
      return []
    }
  }, [supabase])

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true)
    const data = await fetchInstructors()
    setInstructors(data)
    setLoading(false)
  }, [fetchInstructors])

  const refreshData = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  useEffect(() => {
    loadData()
  }, [loadData])

  // Memoized filtered instructors
  const filteredInstructors = useMemo(() => {
    let result = [...instructors]

    // Search filter
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase()
      result = result.filter(instructor => {
        const fullName = `${instructor.staff?.first_name || ''} ${instructor.staff?.last_name || ''}`.toLowerCase()
        const employeeNumber = instructor.staff?.employee_number?.toLowerCase() || ''
        const email = instructor.staff?.email?.toLowerCase() || ''
        const specializations = instructor.specializations?.join(' ').toLowerCase() || ''
        const code = instructor.instructor_code?.toLowerCase() || ''
        
        return (
          fullName.includes(term) ||
          employeeNumber.includes(term) ||
          email.includes(term) ||
          specializations.includes(term) ||
          code.includes(term)
        )
      })
    }

    // Status filter
    if (filters.statusFilter !== "all") {
      result = result.filter(instructor => instructor.status === filters.statusFilter)
    }

    // Department filter
    if (filters.departmentFilter !== "all") {
      result = result.filter(instructor => 
        instructor.position?.department?.toLowerCase() === filters.departmentFilter.toLowerCase()
      )
    }

    // Specialization filter
    if (filters.specializationFilter !== "all") {
      result = result.filter(instructor => 
        instructor.specializations?.some(spec => 
          spec.toLowerCase().includes(filters.specializationFilter.toLowerCase())
        )
      )
    }

    // Certification status filter
    if (filters.certificationStatus !== "all") {
      result = result.filter(instructor => {
        const status = getCertificationStatus(instructor.certification_expiry)
        return status.status === filters.certificationStatus
      })
    }

    return result
  }, [instructors, filters])

  // Get unique values for filters
  const { uniqueDepartments, allSpecializations, statusCounts } = useMemo(() => {
    const departments = new Set<string>()
    const specializations = new Set<string>()
    const statuses = {
      active: 0,
      inactive: 0,
      pending: 0
    }

    instructors.forEach(instructor => {
      // Departments
      if (instructor.position?.department) {
        departments.add(instructor.position.department)
      }

      // Specializations
      instructor.specializations?.forEach(spec => {
        if (spec) specializations.add(spec)
      })

      // Status counts
      if (instructor.status === "active") statuses.active++
      else if (instructor.status === "inactive") statuses.inactive++
      else if (instructor.status === "pending") statuses.pending++
    })

    return {
      uniqueDepartments: Array.from(departments).sort(),
      allSpecializations: Array.from(specializations).sort(),
      statusCounts: statuses
    }
  }, [instructors])

  // Utility functions
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString('sr-RS', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getInitials = (firstName: string, lastName: string): string => {
    return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase()
  }

  const getCertificationStatus = (expiryDate: string | null): { 
    label: string; 
    color: string;
    status: CertificationStatus
  } => {
    if (!expiryDate) {
      return {
        label: "Bez isteka",
        color: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300",
        status: "no_expiry"
      }
    }

    const today = new Date()
    const expiry = new Date(expiryDate)
    const daysUntilExpiry = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (expiry < today) {
      return {
        label: "Istekla",
        color: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300",
        status: "expired"
      }
    } else if (daysUntilExpiry <= 30) {
      return {
        label: "Ističe uskoro",
        color: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300",
        status: "expiring_soon"
      }
    } else {
      return {
        label: "Važeća",
        color: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300",
        status: "valid"
      }
    }
  }

  const getCertificationCounts = useMemo(() => {
    const counts = {
      valid: 0,
      expiring_soon: 0,
      expired: 0,
      no_expiry: 0
    }

    instructors.forEach(instructor => {
      const status = getCertificationStatus(instructor.certification_expiry)
      counts[status.status]++
    })

    return counts
  }, [instructors])

  const clearFilters = () => {
    setFilters({
      searchTerm: "",
      statusFilter: "all",
      departmentFilter: "all",
      specializationFilter: "all",
      certificationStatus: "all"
    })
  }

  const updateFilter = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const activeInstructors = useMemo(() => 
    instructors.filter(i => i.status === "active"), 
    [instructors]
  )

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array(4).fill(0).map((_, i) => (
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

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array(5).fill(0).map((_, i) => (
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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 p-2">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Instruktori</h1>
              <p className="text-muted-foreground">
                Upravljajte instruktorima i njihovim certifikacijama
              </p>
            </div>
          </div>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Ukupno instruktora</p>
                <p className="text-3xl font-bold text-blue-900 dark:text-blue-100 mt-2">
                  {instructors.length}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  {activeInstructors.length} aktivno
                </p>
              </div>
              <div className="rounded-full bg-blue-500/20 p-3">
                <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-300">Aktivni instruktori</p>
                <p className="text-3xl font-bold text-green-900 dark:text-green-100 mt-2">
                  {statusCounts.active}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  {Math.round((statusCounts.active / instructors.length) * 100)}% od ukupnog
                </p>
              </div>
              <div className="rounded-full bg-green-500/20 p-3">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 border-amber-200 dark:border-amber-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-700 dark:text-amber-300">Sertifikati ističu</p>
                <p className="text-3xl font-bold text-amber-900 dark:text-amber-100 mt-2">
                  {getCertificationCounts.expiring_soon}
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  u narednih 30 dana
                </p>
              </div>
              <div className="rounded-full bg-amber-500/20 p-3">
                <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Važeći sertifikati</p>
                <p className="text-3xl font-bold text-purple-900 dark:text-purple-100 mt-2">
                  {getCertificationCounts.valid}
                </p>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                  {Math.round((getCertificationCounts.valid / instructors.length) * 100)}% pokrivenosti
                </p>
              </div>
              <div className="rounded-full bg-purple-500/20 p-3">
                <Award className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs and Filters */}
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="all" className="gap-2">
              Svi
              <Badge variant="secondary" className="ml-1">
                {instructors.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="active" className="gap-2">
              <CheckCircle className="h-4 w-4" />
              Aktivni
              <Badge variant="secondary" className="ml-1">
                {statusCounts.active}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="expiring" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              Ističe
              <Badge variant="secondary" className="ml-1">
                {getCertificationCounts.expiring_soon}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all" className="space-y-4">
          {/* Filters */}
          <Card className="border border-blue-100 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Pretraži instruktore po imenu, kodu, sertifikatu..."
                        className="pl-9"
                        value={filters.searchTerm}
                        onChange={(e) => updateFilter("searchTerm", e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Select value={filters.statusFilter} onValueChange={(v) => updateFilter("statusFilter", v)}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Svi statusi</SelectItem>
                        <SelectItem value="active">Aktivni</SelectItem>
                        <SelectItem value="inactive">Neaktivni</SelectItem>
                        <SelectItem value="pending">Na čekanju</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={filters.certificationStatus} onValueChange={(v) => updateFilter("certificationStatus", v)}>
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Sertifikat" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Svi sertifikati</SelectItem>
                        <SelectItem value="valid">Važeći</SelectItem>
                        <SelectItem value="expiring_soon">Ističe uskoro</SelectItem>
                        <SelectItem value="expired">Istekli</SelectItem>
                        <SelectItem value="no_expiry">Bez isteka</SelectItem>
                      </SelectContent>
                    </Select>

                    {Object.values(filters).some(v => v !== "all" && v !== "") && (
                      <Button variant="outline" onClick={clearFilters} className="gap-2">
                        <XCircle className="h-4 w-4" />
                        Očisti
                      </Button>
                    )}
                  </div>
                </div>

                {/* Advanced Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select value={filters.departmentFilter} onValueChange={(v) => updateFilter("departmentFilter", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Svi odjeli" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Svi odjeli</SelectItem>
                      {uniqueDepartments.map(dept => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filters.specializationFilter} onValueChange={(v) => updateFilter("specializationFilter", v)}>
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

                {/* Active Filters */}
                {(filters.searchTerm || 
                  filters.statusFilter !== "all" || 
                  filters.departmentFilter !== "all" || 
                  filters.specializationFilter !== "all" ||
                  filters.certificationStatus !== "all") && (
                  <div className="pt-4 border-t">
                    <div className="flex items-center gap-2 mb-2">
                      <Filter className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Aktivni filteri:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {filters.searchTerm && (
                        <Badge variant="secondary" className="gap-1">
                          <Search className="h-3 w-3" />
                          "{filters.searchTerm}"
                        </Badge>
                      )}
                      {filters.statusFilter !== "all" && (
                        <Badge variant="secondary" className="gap-1">
                          Status: {filters.statusFilter}
                        </Badge>
                      )}
                      {filters.departmentFilter !== "all" && (
                        <Badge variant="secondary" className="gap-1">
                          Odjel: {filters.departmentFilter}
                        </Badge>
                      )}
                      {filters.specializationFilter !== "all" && (
                        <Badge variant="secondary" className="gap-1">
                          Specijalizacija: {filters.specializationFilter}
                        </Badge>
                      )}
                      {filters.certificationStatus !== "all" && (
                        <Badge variant="secondary" className="gap-1">
                          Sertifikat: {filters.certificationStatus}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Instructors Table */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle>Svi Instruktori ({filteredInstructors.length})</CardTitle>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <span>Važeći</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-amber-500" />
                      <span>Ističe</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-red-500" />
                      <span>Istekao</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredInstructors.length === 0 ? (
                <div className="text-center py-12">
                  <User className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nema pronađenih instruktora</h3>
                  <p className="text-muted-foreground mb-4">
                    {instructors.length === 0 
                      ? "Nema instruktora u sistemu. Dodajte prvog instruktora." 
                      : "Nema instruktora koji odgovaraju filterima. Pokušajte da promenite filtere."}
                  </p>
                  <div className="flex gap-3 justify-center">
                    {instructors.length === 0 ? (
                      <Link href="/dashboard/instructors/new">
                        <Button>
                          <Plus className="mr-2 h-4 w-4" />
                          Dodaj Instruktora
                        </Button>
                      </Link>
                    ) : (
                      <Button variant="outline" onClick={clearFilters}>
                        Očisti filtere
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold">Instruktor</TableHead>
                        <TableHead className="font-semibold">Podaci</TableHead>
                        <TableHead className="font-semibold">Specijalizacije</TableHead>
                        <TableHead className="font-semibold">Sertifikacija</TableHead>
                        <TableHead className="font-semibold text-center">Status</TableHead>
                        <TableHead className="font-semibold text-right">Akcije</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInstructors.map((instructor) => {
                        const staff = instructor.staff
                        const certStatus = getCertificationStatus(instructor.certification_expiry)
                        
                        return (
                          <TableRow key={instructor.id} className="hover:bg-muted/50">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar>
                                  <AvatarFallback>
                                    {staff ? getInitials(staff.first_name, staff.last_name) : "I"}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="space-y-1">
                                  <div className="font-medium">
                                    {staff ? `${staff.first_name} ${staff.last_name}` : "Nepoznato"}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs font-mono">
                                      {instructor.instructor_code || "Bez koda"}
                                    </Badge>
                                    {instructor.position?.department && (
                                      <Badge variant="secondary" className="text-xs">
                                        {instructor.position.department}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                {staff?.employee_number && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <Briefcase className="h-3 w-3 text-muted-foreground" />
                                    {staff.employee_number}
                                  </div>
                                )}
                                {staff?.email && (
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Mail className="h-3 w-3" />
                                    {staff.email}
                                  </div>
                                )}
                                {staff?.phone && (
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Phone className="h-3 w-3" />
                                    {staff.phone}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {instructor.specializations?.length ? (
                                <div className="flex flex-wrap gap-1">
                                  {instructor.specializations.slice(0, 2).map((spec, index) => (
                                    <Badge key={`${instructor.id}-${index}`} variant="outline" className="text-xs">
                                      {spec}
                                    </Badge>
                                  ))}
                                  {instructor.specializations.length > 2 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{instructor.specializations.length - 2}
                                    </Badge>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">Nema</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="space-y-2">
                                {instructor.certification_number && (
                                  <div className="font-medium text-sm">
                                    {instructor.certification_number}
                                  </div>
                                )}
                                <div className="flex items-center gap-2">
                                  <Badge className={`text-xs ${certStatus.color}`}>
                                    {certStatus.label}
                                  </Badge>
                                  {instructor.certification_expiry && (
                                    <span className="text-xs text-muted-foreground">
                                      {formatDate(instructor.certification_expiry)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge 
                                variant={
                                  instructor.status === 'active' ? 'default' :
                                  instructor.status === 'inactive' ? 'destructive' :
                                  'outline'
                                }
                                className="min-w-[80px] justify-center"
                              >
                                {instructor.status === 'active' ? 'Aktivan' :
                                 instructor.status === 'inactive' ? 'Neaktivan' :
                                 'Na čekanju'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem asChild>
                                      <Link href={`/dashboard/instructors/${instructor.id}`}>
                                        Detalji
                                      </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                      <Link href={`/dashboard/instructors/${instructor.id}/edit`}>
                                        Uredi
                                      </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                      <Link href={`/dashboard/training-records?instructor_id=${instructor.id}`}>
                                        Trening historija
                                      </Link>
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
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
        </TabsContent>

        {/* Active Instructors Tab */}
        <TabsContent value="active">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Aktivni Instruktori ({statusCounts.active})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Similar table structure but filtered for active only */}
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 mx-auto text-green-600 mb-4" />
                <p className="text-muted-foreground">Prikaz aktivnih instruktora</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Expiring Certificates Tab */}
        <TabsContent value="expiring">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                Sertifikati Ističu Uskoro ({getCertificationCounts.expiring_soon})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 mx-auto text-amber-600 mb-4" />
                <p className="text-muted-foreground">Prikaz sertifikata koji ističu u narednih 30 dana</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}