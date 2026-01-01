"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
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
import { Trash2, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface DeleteTrainingButtonProps {
  trainingId: string
  employeeId: string
  trainingName: string
  isCertificate?: boolean
}

export default function DeleteTrainingButton({ 
  trainingId, 
  employeeId, 
  trainingName,
  isCertificate = false 
}: DeleteTrainingButtonProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)
    
    try {
      const supabase = getSupabaseBrowserClient()
      
      const { error } = await supabase
        .from("training_certificate_records")
        .delete()
        .eq("id", trainingId)

      if (error) {
        throw error
      }

      // Success toast
      toast({
        title: isCertificate ? "Sertifikat uspešno obrisan" : "Obuka uspešno obrisana",
        description: `${trainingName} je uklonjen iz evidencije`,
      })

      // Refresh the page to show updated data
      router.refresh()
      
    } catch (error) {
      console.error("Greška pri brisanju:", error)
      
      // Error toast
      toast({
        title: "Greška pri brisanju",
        description: "Došlo je do greške prilikom brisanja. Pokušajte ponovo.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setOpen(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button 
          size="sm" 
          variant="outline" 
          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Obriši</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isCertificate ? "Brisanje sertifikata" : "Brisanje obuke"}
          </AlertDialogTitle>
          <div className="text-sm text-muted-foreground">
            Da li ste sigurni da želite da obrišete {isCertificate ? "sertifikat" : "obuku"}:{" "}
            <span className="font-semibold text-foreground">{trainingName}</span>?
            
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">
                <strong>Upozorenje:</strong> Ova akcija je trajna. {isCertificate ? "Sertifikat" : "Obuka"} će biti 
                trajno obrisan iz evidencije i neće biti moguće ga povratiti.
              </p>
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Otkaži</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Brisanje...
              </>
            ) : (
              "Obriši"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}