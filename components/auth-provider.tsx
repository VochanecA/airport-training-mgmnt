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
  loading: true,
  signOut: async () => {},
  isSigningOut: false,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserWithRole | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    const getUser = async () => {
      try {
        const {
          data: { user: authUser },
          error: authError,
        } = await supabase.auth.getUser()

        if (authError) {
          console.log("Auth error (non-critical):", authError.message)
          setUser(null)
          return
        }

        if (authUser) {
          setUser(authUser)
        }
      } catch (error) {
        console.log("Error getting user:", error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user)
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const signOut = async () => {
    if (isSigningOut) return
    
    setIsSigningOut(true)
    
    try {
      // 1. Optimistički clear lokalni state
      setUser(null)
      
      // 2. Odmah redirect na login---stavio sam na home
      window.location.href = "/"
      
      // 3. Pokreni signout u pozadini
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