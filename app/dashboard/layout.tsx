import type React from "react"
import { DashboardNav } from "@/components/dashboard-nav"
import { AuthProvider } from "@/components/auth-provider"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-slate-50">
        <DashboardNav />
        <main className="lg:pl-64 pt-16 lg:pt-0">
          <div className="p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </AuthProvider>
  )
}