// lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Dodajte ovu funkciju
export function formatDate(dateString: string | null | Date): string {
  if (!dateString) return "N/A"
  
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString
    return date.toLocaleDateString('sr-RS', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  } catch (error) {
    console.error("Greška pri formatiranju datuma:", error, dateString)
    return "N/A"
  }
}

// Dodatna helper funkcija za datum i vreme
export function formatDateTime(dateString: string | null | Date): string {
  if (!dateString) return "N/A"
  
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString
    return date.toLocaleDateString('sr-RS', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (error) {
    console.error("Greška pri formatiranju datuma i vremena:", error, dateString)
    return "N/A"
  }
}