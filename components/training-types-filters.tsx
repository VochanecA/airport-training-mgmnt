"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet"
import { Filter, X, Search, SlidersHorizontal } from "lucide-react"

interface TrainingTypesFiltersProps {
  onFilterChange?: (filters: TrainingFilters) => void
  onSearchChange?: (search: string) => void
}

export interface TrainingFilters {
  category?: string
  training_type?: string
  is_active?: string
  is_mandatory?: string
  search?: string
}

export function TrainingTypesFilters({ onFilterChange, onSearchChange }: TrainingTypesFiltersProps) {
  const [filters, setFilters] = useState<TrainingFilters>({
    category: "all",
    training_type: "all",
    is_active: "all",
    is_mandatory: "all",
    search: "",
  })

  const [open, setOpen] = useState(false)

  const clearFilters = () => {
    const clearedFilters = {
      category: "all",
      training_type: "all",
      is_active: "all",
      is_mandatory: "all",
      search: "",
    }
    
    setFilters(clearedFilters)
    
    // Prosledite obrisane filtere natrag
    if (onFilterChange) {
      onFilterChange(clearedFilters)
    }
    if (onSearchChange) {
      onSearchChange("")
    }
  }

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== "" && value !== "all"
  )

  const activeFiltersCount = Object.values(filters).filter(value => 
    value !== "" && value !== "all"
  ).length

  const handleFilterChange = (key: keyof TrainingFilters, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    
    // Ažurirajte filtere u realnom vremenu
    if (onFilterChange) {
      onFilterChange(newFilters)
    }
  }

  const handleSearchChange = (value: string) => {
    const newFilters = { ...filters, search: value }
    setFilters(newFilters)
    
    if (onSearchChange) {
      onSearchChange(value)
    }
    if (onFilterChange) {
      onFilterChange(newFilters)
    }
  }

  const applyFilters = () => {
    console.log("Applying filters:", filters)
    if (onFilterChange) {
      onFilterChange(filters)
    }
    setOpen(false)
  }

  return (
    <>
      {/* Search input u headeru */}
      <div className="flex items-center gap-2">
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Pretraži tipove obuka..."
            className="pl-9 w-[200px] lg:w-[250px]"
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Filteri
              {hasActiveFilters && (
                <span className="flex items-center justify-center h-5 w-5 text-xs bg-primary text-primary-foreground rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent className="sm:max-w-md">
            <div className="h-full flex flex-col">
              {/* Header */}
              <SheetHeader className="border-b pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <SheetTitle className="text-xl flex items-center gap-2">
                      <Filter className="h-5 w-5" />
                      Filteri
                    </SheetTitle>
                    <SheetDescription>
                      Filtriranje tipova obuka
                    </SheetDescription>
                  </div>
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Očisti sve
                    </Button>
                  )}
                </div>
              </SheetHeader>

              {/* Filter Form */}
              <div className="flex-1 overflow-y-auto py-6">
                <div className="space-y-8 px-1">
                  {/* Search Input in Dialog */}
                  <div className="space-y-2">
                    <Label htmlFor="dialog-search" className="text-sm font-medium">
                      Pretraga
                    </Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="dialog-search"
                        placeholder="Pretraži po kodu, nazivu ili opisu..."
                        className="pl-9"
                        value={filters.search}
                        onChange={(e) => handleSearchChange(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Category Filter */}
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-sm font-medium">
                      Kategorija
                    </Label>
                    <Select
                      value={filters.category}
                      onValueChange={(value) => handleFilterChange("category", value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Izaberite kategoriju" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Sve kategorije</SelectItem>
                        <SelectItem value="safety">Safety & Security</SelectItem>
                        <SelectItem value="technical">Technical / Ramp</SelectItem>
                        <SelectItem value="operational">Operational</SelectItem>
                        <SelectItem value="administrative">Administrative</SelectItem>
                        <SelectItem value="customer_service">Customer Service</SelectItem>
                        <SelectItem value="management">Management & Supervision</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Training Type Filter */}
                  <div className="space-y-2">
                    <Label htmlFor="training_type" className="text-sm font-medium">
                      Vrsta obuke
                    </Label>
                    <Select
                      value={filters.training_type}
                      onValueChange={(value) => handleFilterChange("training_type", value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Izaberite vrstu obuke" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Sve vrste</SelectItem>
                        <SelectItem value="initial">Initial Training</SelectItem>
                        <SelectItem value="recurrent">Recurrent Training</SelectItem>
                        <SelectItem value="re_qualification">Re-qualification</SelectItem>
                        <SelectItem value="update">Update Training</SelectItem>
                        <SelectItem value="ojt">OJT (On-the-Job)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Status and Mandatory Filters */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="is_active" className="text-sm font-medium">
                        Status
                      </Label>
                      <Select
                        value={filters.is_active}
                        onValueChange={(value) => handleFilterChange("is_active", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Svi statusi</SelectItem>
                          <SelectItem value="active">Aktivni</SelectItem>
                          <SelectItem value="inactive">Neaktivni</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="is_mandatory" className="text-sm font-medium">
                        Obaveznost
                      </Label>
                      <Select
                        value={filters.is_mandatory}
                        onValueChange={(value) => handleFilterChange("is_mandatory", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Obaveznost" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Sve</SelectItem>
                          <SelectItem value="mandatory">Obavezne</SelectItem>
                          <SelectItem value="optional">Neobavezne</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Active Filters Preview */}
                  {hasActiveFilters && (
                    <div className="space-y-2 pt-4 border-t">
                      <Label className="text-sm font-medium">Aktivni filteri:</Label>
                      <div className="flex flex-wrap gap-2">
                        {filters.category !== "all" && (
                          <div className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
                            {filters.category}
                            <button
                              onClick={() => handleFilterChange("category", "all")}
                              className="h-3 w-3 rounded-full hover:bg-primary/20 flex items-center justify-center"
                            >
                              <X className="h-2 w-2" />
                            </button>
                          </div>
                        )}
                        {filters.training_type !== "all" && (
                          <div className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
                            {filters.training_type}
                            <button
                              onClick={() => handleFilterChange("training_type", "all")}
                              className="h-3 w-3 rounded-full hover:bg-primary/20 flex items-center justify-center"
                            >
                              <X className="h-2 w-2" />
                            </button>
                          </div>
                        )}
                        {filters.is_active !== "all" && (
                          <div className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
                            {filters.is_active === "active" ? "Aktivni" : "Neaktivni"}
                            <button
                              onClick={() => handleFilterChange("is_active", "all")}
                              className="h-3 w-3 rounded-full hover:bg-primary/20 flex items-center justify-center"
                            >
                              <X className="h-2 w-2" />
                            </button>
                          </div>
                        )}
                        {filters.is_mandatory !== "all" && (
                          <div className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
                            {filters.is_mandatory === "mandatory" ? "Obavezne" : "Neobavezne"}
                            <button
                              onClick={() => handleFilterChange("is_mandatory", "all")}
                              className="h-3 w-3 rounded-full hover:bg-primary/20 flex items-center justify-center"
                            >
                              <X className="h-2 w-2" />
                            </button>
                          </div>
                        )}
                        {filters.search && (
                          <div className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
                            "{filters.search}"
                            <button
                              onClick={() => handleSearchChange("")}
                              className="h-3 w-3 rounded-full hover:bg-primary/20 flex items-center justify-center"
                            >
                              <X className="h-2 w-2" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer with Apply Button */}
              <div className="border-t pt-4">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setOpen(false)}
                  >
                    Otkaži
                  </Button>
                  <Button
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    onClick={applyFilters}
                  >
                    Primijeni filtere
                  </Button>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}