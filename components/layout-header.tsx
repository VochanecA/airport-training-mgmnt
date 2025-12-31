"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/public-auth-provider" // Koristite novi provider
import { GraduationCap, Menu } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { usePathname } from "next/navigation"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useState } from "react"

export function LayoutHeader() {
  const { user, loading } = useAuth()
  const pathname = usePathname()
  const isDashboard = pathname?.startsWith("/dashboard")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navigation = [
    { name: "Funkcije", href: "/#features", show: !isDashboard },
    { name: "O nama", href: "/#about", show: !isDashboard },
    { name: "Kontakt", href: "/#contact", show: !isDashboard },
  ]

  // Ako je loading, prikaži skeleton
  if (loading) {
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-gray-200 animate-pulse"></div>
            <div className="h-6 w-48 rounded bg-gray-200 animate-pulse hidden sm:block"></div>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-9 w-24 rounded bg-gray-200 animate-pulse"></div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg hidden sm:inline-block">
              Airport Training System
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4">
          {navigation.map((item) => 
            item.show && (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm font-medium hover:text-primary transition-colors px-3 py-2 rounded-md"
              >
                {item.name}
              </Link>
            )
          )}

          <ThemeToggle />

          {user ? (
            isDashboard ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                  {user.email}
                </span>
              </div>
            ) : (
              <Button asChild size="sm">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            )
          ) : !isDashboard ? (
            <Button asChild size="sm">
              <Link href="/login">Prijavi se</Link>
            </Button>
          ) : null}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <div className="flex flex-col gap-4 mt-6">
                {navigation.map((item) =>
                  item.show && (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="text-sm font-medium hover:text-primary transition-colors px-3 py-2 rounded-md"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  )
                )}
                {user ? (
                  isDashboard ? (
                    <div className="px-3 py-2">
                      <p className="text-sm font-medium truncate">{user.email}</p>
                      <p className="text-xs text-muted-foreground">Prijavljen</p>
                    </div>
                  ) : (
                    <Button asChild className="w-full">
                      <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                        Dashboard
                      </Link>
                    </Button>
                  )
                ) : !isDashboard ? (
                  <Button asChild className="w-full">
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                      Prijavi se
                    </Link>
                  </Button>
                ) : null}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}