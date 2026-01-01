import type React from "react"
import Image from "next/image"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Background Image Layer */}
      <div className="absolute inset-0 -z-10">
        <Image
          src="/images/training2.jpg"
          alt="Background"
          fill
          priority
          className="object-cover opacity-80" // Opacity postavljen na 0.3
          quality={100}
        />
        {/* Overlay gradijent za bolju čitljivost teksta */}
        <div className="absolute inset-0 bg-gradient-to-br from-background/80 to-muted/20" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}