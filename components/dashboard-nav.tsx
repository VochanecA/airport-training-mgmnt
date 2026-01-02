"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth-provider"
import { GraduationCap, Users, Briefcase, Award, Clock, Calendar, AlertCircle,BarChart3, LogOut, Menu, Layers, UserCircle } from "lucide-react"
import { useState } from "react"
import { Sheet, SheetContent, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet"
import { ThemeToggle } from "@/components/theme-toggle"
import { Separator } from "@/components/ui/separator"

// TypeScript tipovi za navigation
import type { LucideIcon } from "lucide-react"
import type { ComponentProps } from "react"

type NavigationItem = 
  | {
      name: string
      href: string
      icon: LucideIcon
      color?: 'orange'
    }
  | { separator: true }

const navigation: NavigationItem[] = [
  { name: "Pregled", href: "/dashboard", icon: BarChart3 },
  { name: "Tipovi Obuka", href: "/dashboard/training-types", icon: Layers },
  { name: "Predavanja i Obuke", href: "/dashboard/trainings", icon: GraduationCap },
  { name: "Radne Pozicije", href: "/dashboard/positions", icon: Briefcase },
  { name: "Instruktori", href: "/dashboard/instructors", icon: UserCircle },
  { name: "Zaposleni", href: "/dashboard/employees", icon: Users },
  { name: "Sertifikati", href: "/dashboard/certificates", icon: Award },
  { name: "Istek Obuka", href: "/dashboard/training-expiry", icon: Clock },
  { name: "Raspored", href: "/dashboard/schedule", icon: Calendar },
  { name: "Istek Potvrda i Obuka", href: "/dashboard/schedule/expiries", icon: AlertCircle }, 
  { separator: true },  
  { name: "Plana Rada", href: "/dashboard/work-schedule", icon: Calendar, color: 'orange' },
]

export function DashboardNav() {
  const pathname = usePathname()
  const { user, signOut, isSigningOut } = useAuth()
  const [open, setOpen] = useState(false)

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (isSigningOut) return
    
    setOpen(false)
    await signOut()
    
    setTimeout(() => {
      if (window.location.pathname.startsWith('/dashboard')) {
        window.location.href = '/'
      }
    }, 1000)
  }

  const NavContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <>
      <div className="flex items-center gap-2 px-6 py-4 border-b">
        <Link 
          href="/dashboard" 
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          onClick={() => setOpen(false)}
        >
          <GraduationCap className="h-6 w-6 text-primary" />
          <span className="font-semibold text-lg">Airport Training Management - Galiot Copy</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item, index) => {
          // Separator
          if ('separator' in item && item.separator) {
            return <Separator key={`sep-${index}`} className="my-2 shrink-0 bg-border" />
          }
          
          // Link item
          const typedItem = item as NavigationItem & { name: string; href: string; icon: LucideIcon; color?: 'orange' }
          const Icon = typedItem.icon
          const isActive = pathname === typedItem.href || (typedItem.href !== "/dashboard" && pathname.startsWith(typedItem.href))
          
          return (
            <Link
              key={typedItem.name}
              href={typedItem.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                typedItem.color === 'orange' && !isActive
                  ? "text-orange-500 hover:text-orange-600 hover:bg-orange-50"
                  : ""
              )}
            >
              <Icon className="h-5 w-5" />
              {typedItem.name}
            </Link>
          )
        })}
      </nav>

      <div className="border-t p-4 space-y-3">
        <div className="px-3 text-sm">
          <p className="font-medium truncate">{user?.email}</p>
          <p className="text-xs text-muted-foreground">{user?.role || "Korisnik"}</p>
        </div>

        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-sm font-medium">Izgled</span>
          <ThemeToggle />
        </div>

        <Button 
          variant="ghost" 
          className="w-full justify-start gap-2 hover:bg-destructive/10 hover:text-destructive transition-colors" 
          onClick={handleLogout}
          disabled={isSigningOut}
        >
          <LogOut className="h-4 w-4" />
          {isSigningOut ? (
            <span className="flex items-center gap-1">
              <span className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full"></span>
              Odjavljujem...
            </span>
          ) : "Odjavi se"}
        </Button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile Navigation */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link 
            href="/dashboard" 
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            onClick={() => setOpen(false)}
          >
            <GraduationCap className="h-6 w-6 text-primary" />
            <span className="font-semibold truncate">Airport Training</span>
          </Link>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Otvori menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetTitle className="sr-only">Navigacija</SheetTitle>
            <SheetDescription className="sr-only">
              Glavni meni za Airport Training Management sistem
            </SheetDescription>
            <NavContent isMobile={true} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Navigation */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:w-64 lg:border-r lg:bg-background">
        <NavContent />
      </aside>
      
      {/* Spacing for mobile fixed header */}
      <div className="lg:hidden h-16" />
    </>
  )
}
