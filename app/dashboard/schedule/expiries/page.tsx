"use client"

import { useState, useEffect } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  AlertTriangle, 
  Calendar, 
  User, 
  FileText, 
  Clock, 
  Filter, 
  Search,
  RefreshCw,
  Download,
  Eye,
  Users,
  Building
} from "lucide-react"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"

interface CertificateExpiry {
  certificate_id: string
  certificate_number: string
  issue_date: string
  expiry_date: string
  days_until_expiry: number
  recommended_training_date: string
  planning_window_start: string
  
  staff_id: string
  employee_number: string
  first_name: string
  last_name: string
  email: string | null
  position_id: string | null
  
  training_master_id: string | null
  training_title: string | null
  training_code: string | null
  
  training_type_id: string | null
  training_type_name: string | null
  training_type_code: string | null
  training_type_category: string | null
  hours_recurrent_total: number | null
  
  position_title: string | null
  department: string | null
  
  has_scheduled_training: boolean
}

export default function CertificateExpiriesPage() {
  const { toast } = useToast()
  const supabase = getSupabaseBrowserClient()
  
  const [expiries, setExpiries] = useState<CertificateExpiry[]>([])
  const [filteredExpiries, setFilteredExpiries] = useState<CertificateExpiry[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [timeframeFilter, setTimeframeFilter] = useState("90") // days
  
  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    urgent: 0, // < 30 days
    upcoming: 0, // 30-90 days
    future: 0, // > 90 days
    byCategory: {} as Record<string, number>,
    byDepartment: {} as Record<string, number>
  })

  // Učitaj podatke
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        
        const { data, error } = await supabase
          .from("certificate_expiry_detailed_view")
          .select("*")
          .order("expiry_date", { ascending: true })

        if (error) throw error

        setExpiries(data || [])
        calculateStats(data || [])
      } catch (error: any) {
        console.error("Greška pri učitavanju isteka sertifikata:", error)
        toast({
          title: "Greška",
          description: "Došlo je do greške pri učitavanju podataka",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [supabase, toast])

  // Izračunaj statistike
  const calculateStats = (data: CertificateExpiry[]) => {
    const stats = {
      total: data.length,
      urgent: data.filter(d => d.days_until_expiry <= 30 && d.days_until_expiry > 0).length,
      upcoming: data.filter(d => d.days_until_expiry > 30 && d.days_until_expiry <= 90).length,
      future: data.filter(d => d.days_until_expiry > 90).length,
      byCategory: {} as Record<string, number>,
      byDepartment: {} as Record<string, number>
    }

    // Po kategorijama
    data.forEach(item => {
      const category = item.training_type_category || 'Nepoznato'
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1
      
      const department = item.department || 'Nepoznato'
      stats.byDepartment[department] = (stats.byDepartment[department] || 0) + 1
    })

    setStats(stats)
  }

  // Filtriraj podatke
  useEffect(() => {
    let filtered = [...expiries]

    // Filter po vremenskom okviru
    if (timeframeFilter !== "all") {
      const days = parseInt(timeframeFilter)
      if (days === 30) {
        filtered = filtered.filter(d => d.days_until_expiry <= 30 && d.days_until_expiry > 0)
      } else if (days === 90) {
        filtered = filtered.filter(d => d.days_until_expiry <= 90 && d.days_until_expiry > 30)
      } else if (days === 180) {
        filtered = filtered.filter(d => d.days_until_expiry > 90)
      }
    }

    // Filter po kategoriji
    if (categoryFilter !== "all") {
      filtered = filtered.filter(d => d.training_type_category === categoryFilter)
    }

    // Filter po odjeljenju
    if (departmentFilter !== "all") {
      filtered = filtered.filter(d => d.department === departmentFilter)
    }

    // Pretraga
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(d => 
        d.certificate_number.toLowerCase().includes(term) ||
        d.first_name.toLowerCase().includes(term) ||
        d.last_name.toLowerCase().includes(term) ||
        d.employee_number.toLowerCase().includes(term) ||
        (d.training_title && d.training_title.toLowerCase().includes(term)) ||
        (d.training_type_name && d.training_type_name.toLowerCase().includes(term))
      )
    }

    setFilteredExpiries(filtered)
  }, [expiries, searchTerm, categoryFilter, departmentFilter, timeframeFilter])

  // Funkcija za export CSV
  const handleExportCSV = () => {
    const headers = [
      "Broj sertifikata",
      "Zaposleni",
      "Broj zaposlenog",
      "Email",
      "Obuka",
      "Kategorija",
      "Odjeljenje",
      "Datum izdavanja",
      "Datum isteka",
      "Dana do isteka",
      "Preporučeni datum obuke",
      "Već zakazano"
    ]

    const csvData = filteredExpiries.map(item => [
      item.certificate_number,
      `${item.first_name} ${item.last_name}`,
      item.employee_number,
      item.email || "",
      item.training_title || item.training_type_name || "Nepoznato",
      item.training_type_category || "Nepoznato",
      item.department || "Nepoznato",
      new Date(item.issue_date).toLocaleDateString('sr-RS'),
      new Date(item.expiry_date).toLocaleDateString('sr-RS'),
      item.days_until_expiry,
      item.recommended_training_date ? new Date(item.recommended_training_date).toLocaleDateString('sr-RS') : "",
      item.has_scheduled_training ? "Da" : "Ne"
    ])

    const csvContent = [
      headers.join(","),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `istek_sertifikata_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Helper funkcije
  const getUrgencyBadge = (days: number) => {
    if (days <= 0) {
      return <Badge variant="destructive">Istekao</Badge>
    } else if (days <= 7) {
      return <Badge variant="destructive">HITNO ({days} dana)</Badge>
    } else if (days <= 30) {
      return <Badge className="bg-amber-500 text-white">Uskoro ({days} dana)</Badge>
    } else if (days <= 90) {
      return <Badge className="bg-blue-500 text-white">U naredna 3 meseca ({days} dana)</Badge>
    } else {
      return <Badge variant="outline">U budućnosti ({days} dana)</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-2 text-muted-foreground">Učitavanje podataka o isteku sertifikata...</p>
        </div>
      </div>
    )
  }

  // Dobij unique kategorije i odjeljenja za filter
  const categories = Array.from(
    new Set(expiries.map(e => e.training_type_category).filter(Boolean) as string[])
  ).sort()

  const departments = Array.from(
    new Set(expiries.map(e => e.department).filter(Boolean) as string[])
  ).sort()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/schedule">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Pregled Isteka Sertifikata</h1>
            <p className="text-muted-foreground">
              Automatsko planiranje obuka na osnovu isteka sertifikata
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Izvezi CSV
          </Button>
          <Link href="/dashboard/schedule/generate?source=certificates">
            <Button>
              <RefreshCw className="mr-2 h-4 w-4" />
              Generiši Raspored
            </Button>
          </Link>
        </div>
      </div>

      {/* Filteri */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pretraži sertifikate..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={timeframeFilter} onValueChange={setTimeframeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Vremenski okvir" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Svi periodi</SelectItem>
                <SelectItem value="30">Hitno (&lt;30 dana)</SelectItem>
                <SelectItem value="90">U naredna 3 meseca</SelectItem>
                <SelectItem value="180">U budućnosti (&gt;90 dana)</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Kategorija obuke" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Sve kategorije</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Odjeljenje" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Sva odjeljenja</SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-muted-foreground">
              Prikazano: {filteredExpiries.length} od {stats.total} sertifikata
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                setSearchTerm("")
                setCategoryFilter("all")
                setDepartmentFilter("all")
                setTimeframeFilter("90")
              }}
            >
              <Filter className="mr-2 h-3 w-3" />
              Resetuj filtere
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistike */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ukupno sertifikata</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Hitno ističe</p>
                <p className="text-2xl font-bold text-red-600">{stats.urgent}</p>
                <p className="text-xs text-muted-foreground">&lt;30 dana</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">U naredna 3 meseca</p>
                <p className="text-2xl font-bold text-amber-600">{stats.upcoming}</p>
                <p className="text-xs text-muted-foreground">30-90 dana</p>
              </div>
              <Calendar className="h-8 w-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">U budućnosti</p>
                <p className="text-2xl font-bold text-blue-600">{stats.future}</p>
                <p className="text-xs text-muted-foreground">&gt;90 dana</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela */}
      <Tabs defaultValue="table">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="table">Tabelarni pregled</TabsTrigger>
          <TabsTrigger value="analysis">Analiza po grupama</TabsTrigger>
        </TabsList>
        
        <TabsContent value="table">
          <Card>
            <CardHeader>
              <CardTitle>Detaljan pregled isteka sertifikata</CardTitle>
              <CardDescription>
                Svi sertifikati čija validnost ističe, sortirani po hitnosti
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredExpiries.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nema sertifikata koji odgovaraju filterima</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Zaposleni</TableHead>
                        <TableHead>Obuka / Sertifikat</TableHead>
                        <TableHead>Kategorija</TableHead>
                        <TableHead>Odjeljenje</TableHead>
                        <TableHead>Datum isteka</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Preporučeni datum obuke</TableHead>
                        <TableHead>Već zakazano</TableHead>
                        <TableHead className="text-right">Akcije</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredExpiries.map((item) => (
                        <TableRow key={item.certificate_id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {item.first_name} {item.last_name}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {item.employee_number}
                              </span>
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {item.training_title || item.training_type_name || "Opšti sertifikat"}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {item.certificate_number}
                                {item.training_type_code && ` • ${item.training_type_code}`}
                              </span>
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {item.training_type_category || "Nepoznato"}
                            </Badge>
                          </TableCell>
                          
                          <TableCell>
                            {item.department || "Nepoznato"}
                          </TableCell>
                          
                          <TableCell>
                            <div className="flex flex-col">
                              <span>{new Date(item.expiry_date).toLocaleDateString('sr-RS')}</span>
                              <span className="text-xs text-muted-foreground">
                                ({item.days_until_expiry} dana)
                              </span>
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            {getUrgencyBadge(item.days_until_expiry)}
                          </TableCell>
                          
                          <TableCell>
                            {item.recommended_training_date ? (
                              <div className="flex flex-col">
                                <span>{new Date(item.recommended_training_date).toLocaleDateString('sr-RS')}</span>
                                <span className="text-xs text-muted-foreground">
                                  (30 dana pre isteka)
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">N/A</span>
                            )}
                          </TableCell>
                          
                          <TableCell>
                            {item.has_scheduled_training ? (
                              <Badge className="bg-green-500 text-white">Da</Badge>
                            ) : (
                              <Badge variant="outline">Ne</Badge>
                            )}
                          </TableCell>
                          
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Link href={`/dashboard/certificates/${item.certificate_id}`}>
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Link href={`/dashboard/employees/${item.staff_id}`}>
                                <Button variant="ghost" size="sm">
                                  <User className="h-4 w-4" />
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
        </TabsContent>
        
        <TabsContent value="analysis">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Analiza po kategorijama */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Po kategorijama obuke
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(stats.byCategory).map(([category, count]) => {
                    const categoryData = expiries.filter(e => e.training_type_category === category)
                    const urgentCount = categoryData.filter(e => e.days_until_expiry <= 30).length
                    const upcomingCount = categoryData.filter(e => e.days_until_expiry > 30 && e.days_until_expiry <= 90).length
                    
                    return (
                      <div key={category} className="p-3 border rounded-lg space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{category}</span>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                        
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Hitno:</span>
                            <span className="text-red-600 font-medium">{urgentCount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">U naredna 3 meseca:</span>
                            <span className="text-amber-600 font-medium">{upcomingCount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Potrebne grupe (po 15):</span>
                            <span className="font-medium">{Math.ceil(count / 15)}</span>
                          </div>
                        </div>
                        
                        <div className="pt-2">
                          <Link 
                            href={`/dashboard/schedule/generate?category=${encodeURIComponent(category)}`}
                            className="text-sm text-primary hover:underline"
                          >
                            Generiši raspored za ovu kategoriju →
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
            
            {/* Analiza po odjeljenjima */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Po odjeljenjima
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(stats.byDepartment).map(([department, count]) => {
                    const departmentData = expiries.filter(e => e.department === department)
                    const urgentCount = departmentData.filter(e => e.days_until_expiry <= 30).length
                    const upcomingCount = departmentData.filter(e => e.days_until_expiry > 30 && e.days_until_expiry <= 90).length
                    
                    return (
                      <div key={department} className="p-3 border rounded-lg space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{department}</span>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                        
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Hitno:</span>
                            <span className="text-red-600 font-medium">{urgentCount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">U naredna 3 meseca:</span>
                            <span className="text-amber-600 font-medium">{upcomingCount}</span>
                          </div>
                          
                          {/* Distribucija po kategorijama */}
                          <div className="pt-2">
                            <div className="text-xs text-muted-foreground mb-1">Kategorije obuka:</div>
                            <div className="flex flex-wrap gap-1">
                              {Array.from(
                                new Set(departmentData.map(d => d.training_type_category).filter(Boolean) as string[])
                              ).map(category => (
                                <Badge key={category} variant="secondary" className="text-xs">
                                  {category}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Preporuke za akciju */}
      {stats.urgent > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="h-6 w-6 text-red-600 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-800 mb-2">
                  Hitna akcija potrebna!
                </h3>
                <p className="text-red-700 mb-3">
                  {stats.urgent} sertifikata ističe u narednih 30 dana. 
                  Preporučujemo hitno generisanje rasporeda za ove obuke.
                </p>
                <Link href="/dashboard/schedule/generate?timeframe=30">
                  <Button variant="destructive">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Generiši hitni raspored
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}