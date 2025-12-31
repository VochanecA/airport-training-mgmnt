import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4">
      <div className="container max-w-4xl py-8">
        <Link 
          href="/login" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6"
        >
          ← Nazad na prijavu
        </Link>
        
        <Card className="border-primary/10">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Politika privatnosti</CardTitle>
            <CardDescription>
              Informacije o zaštiti podataka u Airport Training System
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">1. Prikupljanje podataka</h3>
              <p className="text-muted-foreground">
                Sistem prikuplja samo podatke neophodne za funkcionisanje sistema za upravljanje obukama i sertifikatima.
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">2. Korišćenje podataka</h3>
              <p className="text-muted-foreground">
                Podaci se koriste isključivo za potrebe upravljanja obukama, praćenja sertifikata i generisanje izveštaja.
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">3. Sigurnost podataka</h3>
              <p className="text-muted-foreground">
                Implementirane su odgovarajuće bezbednosne mere za zaštitu podataka od neovlašćenog pristupa.
              </p>
            </div>
            
            <div className="pt-4 border-t">
              <p className="text-muted-foreground">
                Za dodatne informacije kontaktirajte nas na{" "}
                <a href="mailto:admin@aerodrom.rs" className="text-primary hover:underline">
                  admin@aerodrom.rs
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}