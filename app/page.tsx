import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LayoutHeader } from "@/components/layout-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Shield, Users, Zap, BarChart, Clock, FileCheck, Bell, Calendar, Award, Target, Lock } from "lucide-react"

export default function HomePage() {
  return (
    <>
      <LayoutHeader /> {/* UKLONJEN KOMENTAR - HEADER ĆE SE PRIKAZATI */}
      
      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
          <div className="container relative px-4 py-24 md:py-32">
            <div className="mx-auto max-w-4xl text-center">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                <span className="block">Sistem za upravljanje</span>
                <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  obukama i sertifikatima
                </span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground md:text-xl">
                Kompletna platforma za upravljanje obukama zaposlenih, praćenje sertifikata
                i optimizaciju trening programa. Povećajte produktivnost i smanjite
                administrativne troškove.
              </p>
              <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
                <Button size="lg" asChild className="h-12 px-8">
                  <Link href="/login">Prijavite se</Link>
                </Button>
                <Button size="lg" variant="outline" className="h-12 px-8" asChild>
                  <a href="#features">Pogledajte funkcije</a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="container px-4 py-12">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-3xl font-bold">1,000+</h3>
              <p className="text-sm text-muted-foreground">Zaposlenih u sistemu</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Award className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-3xl font-bold">5,000+</h3>
              <p className="text-sm text-muted-foreground">Izdatih sertifikata</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Calendar className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-3xl font-bold">500+</h3>
              <p className="text-sm text-muted-foreground">Obuka mesečno</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Target className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-3xl font-bold">99%</h3>
              <p className="text-sm text-muted-foreground">Zadovoljstvo korisnika</p>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="container px-4 py-24">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Kompletno rešenje za upravljanje obukama
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Sve što vam je potrebno za efikasno upravljanje obukama i sertifikatima zaposlenih
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="border hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Upravljanje Zaposlenima</CardTitle>
                <CardDescription>
                  Kompletna evidencija zaposlenih sa detaljnim pregledom obuka
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Profil svakog zaposlenog</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Istorija obuka i sertifikata</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Planiranje budućih obuka</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Sertifikati i Compliance</CardTitle>
                <CardDescription>
                  Automatsko praćenje važenja i obaveštenja o isticanju
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Automatska obaveštenja</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">PDF sertifikati</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Izveštaji za audit</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <BarChart className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Analitika i Izveštaji</CardTitle>
                <CardDescription>
                  Detaljni pregledi za donošenje informisanih odluka
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Dashboard sa statistikama</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Prilagođeni izveštaji</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Real-time ažuriranja</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Raspored Obuka</CardTitle>
                <CardDescription>
                  Planiranje i upravljanje rasporedom sa konfliktnim proverama
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Interaktivni kalendar</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Obaveštenja učesnicima</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Rezervacija prostorija</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Bell className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Obaveštenja i Podsetnici</CardTitle>
                <CardDescription>
                  Automatski podsetnici za obuke i sertifikate
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Email obaveštenja</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">SMS podsetnici</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">In-app notifikacije</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Lock className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Bezbednost i Pristup</CardTitle>
                <CardDescription>
                  Višestepena bezbednost i kontrola pristupa
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">RBAC kontrola pristupa</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Enkripcija podataka</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Audit log</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container px-4 py-24">
          <div className="mx-auto max-w-4xl rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 p-8 text-center md:p-12">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Spremni da unapredite obuke vaših zaposlenih?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Pridružite se kompanijama koje već koriste naš sistem za efikasnije upravljanje obukama
            </p>
            <div className="mt-8">
              <Button size="lg" className="h-12 px-8" asChild>
                <Link href="/login">Započnite besplatnu probu</Link>
              </Button>
              <p className="mt-4 text-sm text-muted-foreground">
                Nema kreditne kartice • 30 dana probne verzije • Puna podrška
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t py-12">
          <div className="container px-4">
            <div className="grid gap-8 md:grid-cols-4">
              <div>
                <div className="flex items-center gap-2">
                  <Award className="h-6 w-6 text-primary" />
                  <span className="font-bold">TrainingPro</span>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  Vodeći sistem za upravljanje obukama i sertifikatima u regionu.
                </p>
              </div>
              <div>
                <h3 className="font-semibold">Proizvod</h3>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <li><Link href="#features" className="hover:text-primary">Funkcije</Link></li>
                  <li><Link href="/login" className="hover:text-primary">Prijava</Link></li>
                  <li><Link href="#" className="hover:text-primary">Cenovnik</Link></li>
                  <li><Link href="#" className="hover:text-primary">FAQ</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold">Kompanija</h3>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <li><Link href="#" className="hover:text-primary">O nama</Link></li>
                  <li><Link href="#" className="hover:text-primary">Blog</Link></li>
                  <li><Link href="#" className="hover:text-primary">Karijera</Link></li>
                  <li><Link href="#" className="hover:text-primary">Kontakt</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold">Kontakt</h3>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <li>support@trainingpro.me</li>
                  <li>+382 32 123 4567</li>
                  <li>Tivat, C Rna GOra</li>
                  <li>Radno vreme: 08-16h</li>
                </ul>
              </div>
            </div>
            <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
              <p>© {new Date().getFullYear()} TrainingPro. Sva prava zadržana.</p>
              <p className="mt-2">Sistem za upravljanje obukama i sertifikatima zaposlenih</p>
            </div>
          </div>
        </footer>
      </main>
    </>
  )
}