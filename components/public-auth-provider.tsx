"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

type UserWithRole = User & {
  role?: string
}

type AuthContextType = {
  user: UserWithRole | null
  loading: boolean
  signOut: () => Promise<void>
  isSigningOut: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false, // Početno false za public rute
  signOut: async () => {},
  isSigningOut: false,
})

export function PublicAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserWithRole | null>(null)
  const [loading, setLoading] = useState(false) // Početno false
  const [isSigningOut, setIsSigningOut] = useState(false)
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    // Funkcija za dobijanje korisnika - samo ako je potrebno
    const checkAuth = async () => {
      // Proveri da li smo na public ruti
      const isPublicRoute = window.location.pathname === '/' || 
                           window.location.pathname === '/login'
      
      if (isPublicRoute) {
        // Za public rute, pokušaj da dobiješ user-a bez blokiranja UI
        setTimeout(async () => {
          try {
            const {
              data: { user: authUser },
            } = await supabase.auth.getUser()

            if (authUser) {
              setUser(authUser)
            }
          } catch (error) {
            // Ignoriši greške na public rutama
          }
        }, 1000) // Delay od 1s da ne blokira landing page
      }
    }

    checkAuth()

    // Subscribe na auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user)
      } else {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const signOut = async () => {
    if (isSigningOut) return
    
    setIsSigningOut(true)
    
    try {
      setUser(null)
      
      // Odmah briši Supabase cookie-e
      document.cookie = "sb-access-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
      document.cookie = "sb-refresh-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
      
      window.location.href = "/login"
      
      // Signout u pozadini
      setTimeout(async () => {
        try {
          await supabase.auth.signOut()
        } catch (error) {
          console.error("Background signout error:", error)
        }
      }, 100)
      
    } catch (error) {
      console.error("Signout error:", error)
      setIsSigningOut(false)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut, isSigningOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}