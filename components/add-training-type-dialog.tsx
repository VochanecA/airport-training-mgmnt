"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Clock, BookOpen, Briefcase, GraduationCap } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

export function AddTrainingTypeDialog({ onTrainingTypeAdded }: { onTrainingTypeAdded: () => void }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    training_type: "", // initial, recurrent, re_qualification, update, ojt
    category: "", // safety, technical, operational, administrative
    
    // Sati za svaku vrstu obuke
    hours_initial_theory: "",
    hours_initial_practical: "",
    hours_initial_ojt: "",
    
    hours_recurrent_theory: "",
    hours_recurrent_practical: "",
    hours_recurrent_ojt: "",
    
    hours_re_qualification_theory: "",
    hours_re_qualification_practical: "",
    hours_re_qualification_ojt: "",
    
    hours_update_theory: "",
    hours_update_practical: "",
    hours_update_ojt: "",
    
    hours_ojt_theory: "",
    hours_ojt_practical: "",
    hours_ojt_total: "",
    
    // Validnost
    validity_period_months: "",
    validity_period_days: "",
    renewal_notice_days: "",
    
    is_mandatory: "true",
    difficulty_level: "basic",
    reference_standard: "", // IATA AHM 1110 reference
    passing_score: "",
    requires_practical: "false",
    requires_written_exam: "false",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const supabase = getSupabaseBrowserClient()
      
      // Izračunaj ukupne sate za svaku vrstu obuke
      const calculateTotalHours = (theory: string, practical: string, ojt: string) => {
        const t = parseFloat(theory) || 0
        const p = parseFloat(practical) || 0
        const o = parseFloat(ojt) || 0
        return t + p + o
      }

      // Calculate total validity in months
      let totalValidityMonths = null
      if (formData.validity_period_months || formData.validity_period_days) {
        const months = parseInt(formData.validity_period_months) || 0
        const days = parseInt(formData.validity_period_days) || 0
        totalValidityMonths = months + (days / 30)
      }

      const { error: insertError } = await supabase.from("training_types").insert([
        {
          code: formData.code,
          name: formData.name,
          description: formData.description || null,
          training_type: formData.training_type || null,
          category: formData.category || null,
          
          // Initial Training Hours
          hours_initial_theory: formData.hours_initial_theory ? parseFloat(formData.hours_initial_theory) : null,
          hours_initial_practical: formData.hours_initial_practical ? parseFloat(formData.hours_initial_practical) : null,
          hours_initial_ojt: formData.hours_initial_ojt ? parseFloat(formData.hours_initial_ojt) : null,
          hours_initial_total: calculateTotalHours(
            formData.hours_initial_theory,
            formData.hours_initial_practical,
            formData.hours_initial_ojt
          ),
          
          // Recurrent Training Hours
          hours_recurrent_theory: formData.hours_recurrent_theory ? parseFloat(formData.hours_recurrent_theory) : null,
          hours_recurrent_practical: formData.hours_recurrent_practical ? parseFloat(formData.hours_recurrent_practical) : null,
          hours_recurrent_ojt: formData.hours_recurrent_ojt ? parseFloat(formData.hours_recurrent_ojt) : null,
          hours_recurrent_total: calculateTotalHours(
            formData.hours_recurrent_theory,
            formData.hours_recurrent_practical,
            formData.hours_recurrent_ojt
          ),
          
          // Re-qualification Training Hours
          hours_re_qualification_theory: formData.hours_re_qualification_theory ? parseFloat(formData.hours_re_qualification_theory) : null,
          hours_re_qualification_practical: formData.hours_re_qualification_practical ? parseFloat(formData.hours_re_qualification_practical) : null,
          hours_re_qualification_ojt: formData.hours_re_qualification_ojt ? parseFloat(formData.hours_re_qualification_ojt) : null,
          hours_re_qualification_total: calculateTotalHours(
            formData.hours_re_qualification_theory,
            formData.hours_re_qualification_practical,
            formData.hours_re_qualification_ojt
          ),
          
          // Update Training Hours
          hours_update_theory: formData.hours_update_theory ? parseFloat(formData.hours_update_theory) : null,
          hours_update_practical: formData.hours_update_practical ? parseFloat(formData.hours_update_practical) : null,
          hours_update_ojt: formData.hours_update_ojt ? parseFloat(formData.hours_update_ojt) : null,
          hours_update_total: calculateTotalHours(
            formData.hours_update_theory,
            formData.hours_update_practical,
            formData.hours_update_ojt
          ),
          
          // OJT Hours
          hours_ojt_theory: formData.hours_ojt_theory ? parseFloat(formData.hours_ojt_theory) : null,
          hours_ojt_practical: formData.hours_ojt_practical ? parseFloat(formData.hours_ojt_practical) : null,
          hours_ojt_total: formData.hours_ojt_total ? parseFloat(formData.hours_ojt_total) : null,
          
          // Validnost
          validity_period_months: totalValidityMonths,
          renewal_notice_days: formData.renewal_notice_days ? Number(formData.renewal_notice_days) : null,
          
          // Ostali parametri
          is_mandatory: formData.is_mandatory === "true",
          difficulty_level: formData.difficulty_level || null,
          reference_standard: formData.reference_standard || null,
          passing_score: formData.passing_score ? Number(formData.passing_score) : null,
          requires_practical: formData.requires_practical === "true",
          requires_written_exam: formData.requires_written_exam === "true",
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])

      if (insertError) {
        console.error("Insert error:", insertError)
        throw insertError
      }

      // Reset form
      setFormData({
        code: "",
        name: "",
        description: "",
        training_type: "",
        category: "",
        
        hours_initial_theory: "",
        hours_initial_practical: "",
        hours_initial_ojt: "",
        
        hours_recurrent_theory: "",
        hours_recurrent_practical: "",
        hours_recurrent_ojt: "",
        
        hours_re_qualification_theory: "",
        hours_re_qualification_practical: "",
        hours_re_qualification_ojt: "",
        
        hours_update_theory: "",
        hours_update_practical: "",
        hours_update_ojt: "",
        
        hours_ojt_theory: "",
        hours_ojt_practical: "",
        hours_ojt_total: "",
        
        validity_period_months: "",
        validity_period_days: "",
        renewal_notice_days: "",
        
        is_mandatory: "true",
        difficulty_level: "basic",
        reference_standard: "",
        passing_score: "",
        requires_practical: "false",
        requires_written_exam: "false",
      })
      
      setOpen(false)
      onTrainingTypeAdded()
      
    } catch (err: unknown) {
      if (err instanceof Error) {
        // Proverite da li tabela postoji
        if (err.message.includes("relation") && err.message.includes("does not exist")) {
          setError("Tabela 'training_types' ne postoji u bazi. Kreirajte je prvo u Supabase.")
        } else {
          setError(err.message)
        }
      } else {
        setError("Došlo je do greške pri dodavanju tipa obuke")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
          <Plus className="h-4 w-4" />
          Dodaj Novi Tip Obuke
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Dodaj Novi Tip Obuke
            </DialogTitle>
            <DialogDescription>
              Kreirajte novi tip obuke prema IATA AHM 1110 standardu za Ground Operations Training
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription className="font-medium">{error}</AlertDescription>
              </Alert>
            )}
            
            {/* Osnovne informacije */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Osnovne informacije
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">
                    Kod obuke <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    required
                    disabled={loading}
                    placeholder="Npr. RAMP-SAF-001"
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">Jedinstveni identifikator</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Naziv obuke <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    disabled={loading}
                    placeholder="Npr. Ramp Safety Awareness"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Opis obuke (syllabus)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  disabled={loading}
                  placeholder="Detaljan opis obuke, ciljevi, teme, očekivani ishodi..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="training_type">Vrsta obuke <span className="text-red-500">*</span></Label>
                  <Select
                    value={formData.training_type}
                    onValueChange={(value) => setFormData({ ...formData, training_type: value })}
                    required
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Izaberite vrstu" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="initial">Initial Training</SelectItem>
                      <SelectItem value="recurrent">Recurrent Training</SelectItem>
                      <SelectItem value="re_qualification">Re-qualification Training</SelectItem>
                      <SelectItem value="update">Update Training</SelectItem>
                      <SelectItem value="ojt">OJT (On-the-Job Training)</SelectItem>
                      <SelectItem value="refresher">Refresher Training</SelectItem>
                      <SelectItem value="conversion">Conversion Training</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Prema IATA AHM 1110</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category">Kategorija</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Izaberite kategoriju" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="safety">Safety & Security</SelectItem>
                      <SelectItem value="technical">Technical / Ramp</SelectItem>
                      <SelectItem value="operational">Operational</SelectItem>
                      <SelectItem value="administrative">Administrative</SelectItem>
                      <SelectItem value="customer_service">Customer Service</SelectItem>
                      <SelectItem value="management">Management & Supervision</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            {/* Satnice za različite vrste obuke */}
{/* Satnice za različite vrste obuke */}
<div className="space-y-4 pt-4 border-t dark:border-gray-700">
  <h3 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
    <Clock className="h-4 w-4" />
    Trajanje obuke po komponentama (sati)
  </h3>
  
  <div className="dark:bg-gray-900/50 bg-gray-50 rounded-lg p-4">
    <div className="grid grid-cols-4 gap-3 mb-2">
      <div className="font-medium text-sm">Vrsta obuke</div>
      <div className="font-medium text-sm text-center">Teorija</div>
      <div className="font-medium text-sm text-center">Praksa</div>
      <div className="font-medium text-sm text-center">OJT</div>
    </div>
    
    {/* Initial Training */}
    <div className="grid grid-cols-4 gap-3 py-2 border-b dark:border-gray-700 border-gray-200">
      <div className="text-sm dark:text-gray-300">Initial Training</div>
      <div>
        <Input
          type="number"
          min="0"
          step="0.5"
          value={formData.hours_initial_theory}
          onChange={(e) => setFormData({ ...formData, hours_initial_theory: e.target.value })}
          disabled={loading}
          placeholder="0"
          className="h-8 text-sm"
        />
      </div>
      <div>
        <Input
          type="number"
          min="0"
          step="0.5"
          value={formData.hours_initial_practical}
          onChange={(e) => setFormData({ ...formData, hours_initial_practical: e.target.value })}
          disabled={loading}
          placeholder="0"
          className="h-8 text-sm"
        />
      </div>
      <div>
        <Input
          type="number"
          min="0"
          step="0.5"
          value={formData.hours_initial_ojt}
          onChange={(e) => setFormData({ ...formData, hours_initial_ojt: e.target.value })}
          disabled={loading}
          placeholder="0"
          className="h-8 text-sm"
        />
      </div>
    </div>
    
    {/* Recurrent Training */}
    <div className="grid grid-cols-4 gap-3 py-2 border-b dark:border-gray-700 border-gray-200">
      <div className="text-sm dark:text-gray-300">Recurrent Training</div>
      <div>
        <Input
          type="number"
          min="0"
          step="0.5"
          value={formData.hours_recurrent_theory}
          onChange={(e) => setFormData({ ...formData, hours_recurrent_theory: e.target.value })}
          disabled={loading}
          placeholder="0"
          className="h-8 text-sm"
        />
      </div>
      <div>
        <Input
          type="number"
          min="0"
          step="0.5"
          value={formData.hours_recurrent_practical}
          onChange={(e) => setFormData({ ...formData, hours_recurrent_practical: e.target.value })}
          disabled={loading}
          placeholder="0"
          className="h-8 text-sm"
        />
      </div>
      <div>
        <Input
          type="number"
          min="0"
          step="0.5"
          value={formData.hours_recurrent_ojt}
          onChange={(e) => setFormData({ ...formData, hours_recurrent_ojt: e.target.value })}
          disabled={loading}
          placeholder="0"
          className="h-8 text-sm"
        />
      </div>
    </div>
    
    {/* Re-qualification Training */}
    <div className="grid grid-cols-4 gap-3 py-2 border-b dark:border-gray-700 border-gray-200">
      <div className="text-sm dark:text-gray-300">Re-qualification</div>
      <div>
        <Input
          type="number"
          min="0"
          step="0.5"
          value={formData.hours_re_qualification_theory}
          onChange={(e) => setFormData({ ...formData, hours_re_qualification_theory: e.target.value })}
          disabled={loading}
          placeholder="0"
          className="h-8 text-sm"
        />
      </div>
      <div>
        <Input
          type="number"
          min="0"
          step="0.5"
          value={formData.hours_re_qualification_practical}
          onChange={(e) => setFormData({ ...formData, hours_re_qualification_practical: e.target.value })}
          disabled={loading}
          placeholder="0"
          className="h-8 text-sm"
        />
      </div>
      <div>
        <Input
          type="number"
          min="0"
          step="0.5"
          value={formData.hours_re_qualification_ojt}
          onChange={(e) => setFormData({ ...formData, hours_re_qualification_ojt: e.target.value })}
          disabled={loading}
          placeholder="0"
          className="h-8 text-sm"
        />
      </div>
    </div>
    
    {/* Update Training */}
    <div className="grid grid-cols-4 gap-3 py-2 border-b dark:border-gray-700 border-gray-200">
      <div className="text-sm dark:text-gray-300">Update Training</div>
      <div>
        <Input
          type="number"
          min="0"
          step="0.5"
          value={formData.hours_update_theory}
          onChange={(e) => setFormData({ ...formData, hours_update_theory: e.target.value })}
          disabled={loading}
          placeholder="0"
          className="h-8 text-sm"
        />
      </div>
      <div>
        <Input
          type="number"
          min="0"
          step="0.5"
          value={formData.hours_update_practical}
          onChange={(e) => setFormData({ ...formData, hours_update_practical: e.target.value })}
          disabled={loading}
          placeholder="0"
          className="h-8 text-sm"
        />
      </div>
      <div>
        <Input
          type="number"
          min="0"
          step="0.5"
          value={formData.hours_update_ojt}
          onChange={(e) => setFormData({ ...formData, hours_update_ojt: e.target.value })}
          disabled={loading}
          placeholder="0"
          className="h-8 text-sm"
        />
      </div>
    </div>
    
    {/* OJT Training */}
    <div className="grid grid-cols-4 gap-3 py-2">
      <div className="text-sm dark:text-gray-300">OJT Training</div>
      <div>
        <Input
          type="number"
          min="0"
          step="0.5"
          value={formData.hours_ojt_theory}
          onChange={(e) => setFormData({ ...formData, hours_ojt_theory: e.target.value })}
          disabled={loading}
          placeholder="0"
          className="h-8 text-sm"
        />
      </div>
      <div>
        <Input
          type="number"
          min="0"
          step="0.5"
          value={formData.hours_ojt_practical}
          onChange={(e) => setFormData({ ...formData, hours_ojt_practical: e.target.value })}
          disabled={loading}
          placeholder="0"
          className="h-8 text-sm"
        />
      </div>
      <div>
        <Input
          type="number"
          min="0"
          step="0.5"
          value={formData.hours_ojt_total}
          onChange={(e) => setFormData({ ...formData, hours_ojt_total: e.target.value })}
          disabled={loading}
          placeholder="0"
          className="h-8 text-sm"
        />
      </div>
    </div>
  </div>
  
  <div className="flex items-center gap-2 text-xs text-muted-foreground">
    <Briefcase className="h-3 w-3" />
    <span>Unesite broj sati za svaku komponentu obuke</span>
  </div>
</div>
            
            {/* Validnost i obaveštenja */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-medium text-sm text-muted-foreground">Validnost sertifikata</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="validity_period_months">Period važenja - meseci</Label>
                  <Input
                    id="validity_period_months"
                    type="number"
                    min="0"
                    max="120"
                    value={formData.validity_period_months}
                    onChange={(e) => setFormData({ ...formData, validity_period_months: e.target.value })}
                    disabled={loading}
                    placeholder="Npr. 24"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="validity_period_days">Period važenja - dani</Label>
                  <Input
                    id="validity_period_days"
                    type="number"
                    min="0"
                    max="365"
                    value={formData.validity_period_days}
                    onChange={(e) => setFormData({ ...formData, validity_period_days: e.target.value })}
                    disabled={loading}
                    placeholder="Npr. 30"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="renewal_notice_days">Obaveštenje pre isteka (dani)</Label>
                <Input
                  id="renewal_notice_days"
                  type="number"
                  min="0"
                  max="365"
                  value={formData.renewal_notice_days}
                  onChange={(e) => setFormData({ ...formData, renewal_notice_days: e.target.value })}
                  disabled={loading}
                  placeholder="Npr. 30"
                />
                <p className="text-xs text-muted-foreground">Koliko dana pre isteka slati obaveštenje</p>
              </div>
            </div>
            
            {/* Zahtevi za obuku */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-medium text-sm text-muted-foreground">Zahtevi za obuku</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="passing_score">Minimalni prolazni rezultat (%)</Label>
                  <Input
                    id="passing_score"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.passing_score}
                    onChange={(e) => setFormData({ ...formData, passing_score: e.target.value })}
                    disabled={loading}
                    placeholder="Npr. 80"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="difficulty_level">Nivo težine</Label>
                  <Select
                    value={formData.difficulty_level}
                    onValueChange={(value) => setFormData({ ...formData, difficulty_level: value })}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Izaberite nivo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic (Osnovni)</SelectItem>
                      <SelectItem value="intermediate">Intermediate (Srednji)</SelectItem>
                      <SelectItem value="advanced">Advanced (Napredni)</SelectItem>
                      <SelectItem value="expert">Expert (Ekspertski)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="is_mandatory">Obaveznost</Label>
                  <Select
                    value={formData.is_mandatory}
                    onValueChange={(value) => setFormData({ ...formData, is_mandatory: value })}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Da li je obavezna?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Mandatory (Obavezna)</SelectItem>
                      <SelectItem value="false">Recommended (Preporučena)</SelectItem>
                      <SelectItem value="optional">Optional (Opcionalna)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="requires_written_exam">Zahteva pismeni ispit</Label>
                  <Select
                    value={formData.requires_written_exam}
                    onValueChange={(value) => setFormData({ ...formData, requires_written_exam: value })}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Izaberite" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Yes (Da)</SelectItem>
                      <SelectItem value="false">No (Ne)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="requires_practical">Zahteva praktični deo</Label>
                <Select
                  value={formData.requires_practical}
                  onValueChange={(value) => setFormData({ ...formData, requires_practical: value })}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Izaberite" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Yes (Da)</SelectItem>
                    <SelectItem value="false">No (Ne)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Ako je "Da", unesite broj sati praktičnog dela iznad
                </p>
              </div>
            </div>
            
            {/* Reference i standardi */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-medium text-sm text-muted-foreground">Reference i standardi</h3>
              
              <div className="space-y-2">
                <Label htmlFor="reference_standard">Referentni standard</Label>
                <Input
                  id="reference_standard"
                  value={formData.reference_standard}
                  onChange={(e) => setFormData({ ...formData, reference_standard: e.target.value })}
                  disabled={loading}
                  placeholder="Npr. IATA AHM 1110 Chapter 3.4, ICAO Annex 1"
                />
                <p className="text-xs text-muted-foreground">IATA, ICAO, lokalni regulativi</p>
              </div>
            </div>
          </div>
          
          <DialogFooter className="pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Otkaži
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 min-w-[180px]"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                  Čuvanje...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Sačuvaj Tip Obuke
                </span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}