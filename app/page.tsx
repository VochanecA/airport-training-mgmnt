"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { LayoutHeader } from "@/components/layout-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Shield, Users, Zap, BarChart, Clock, FileCheck, Bell, Calendar, Award, Target, Lock, Mail, Phone, MapPin, Send } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export default function HomePage() {
  const [currentImage, setCurrentImage] = useState(0)
  const images = [
    "/images/training1.jpg",
    "/images/training2.jpg",
    "/images/training3.jpg"
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  return (
    <>
      <LayoutHeader />
      
      <main className="min-h-screen">
        {/* Hero Section with Background Images */}
        <section className="relative overflow-hidden h-[600px] md:h-[700px]">
          {/* Background Images with Fade Transition */}
          {images.map((image, index) => (
            <div
              key={image}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentImage ? "opacity-100" : "opacity-0"
              }`}
            >
              <Image
                src={image}
                alt={`Training background ${index + 1}`}
                fill
                className="object-cover"
                priority={index === 0}
              />
              <div className="absolute inset-0 bg-black/60" />
            </div>
          ))}

          {/* Content */}
          <div className="container relative z-10 px-4 py-24 md:py-32 h-full flex items-center">
            <div className="mx-auto max-w-4xl text-center text-white">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl drop-shadow-lg">
                <span className="block">Sistem za upravljanje</span>
                <span className="bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                  obukama i sertifikatima
                </span>
              </h1>
              <p className="mt-6 text-lg md:text-xl text-gray-100 drop-shadow-md">
                Kompletna platforma za upravljanje obukama zaposlenih, praćenje sertifikata
                i optimizaciju trening programa. Povećajte produktivnost i smanjite
                administrativne troškove.
              </p>
              <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
                <Button size="lg" asChild className="h-12 px-8 shadow-xl">
                  <Link href="/login">Prijavite se</Link>
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="h-12 px-8 bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 shadow-xl" 
                  asChild
                >
                  <a href="#features">Pogledajte funkcije</a>
                </Button>
              </div>

              {/* Image Indicators */}
              <div className="mt-8 flex justify-center gap-2">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImage(index)}
                    className={`h-2 rounded-full transition-all ${
                      index === currentImage 
                        ? "w-8 bg-white" 
                        : "w-2 bg-white/50 hover:bg-white/75"
                    }`}
                    aria-label={`Prikaži sliku ${index + 1}`}
                  />
                ))}
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

        {/* About Section */}
        <section id="about" className="bg-muted/50 py-24">
          <div className="container px-4">
            <div className="mx-auto max-w-4xl">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                  O nama
                </h2>
                <p className="text-lg text-muted-foreground">
                  Vaš pouzdani partner za upravljanje obukama i razvojem zaposlenih
                </p>
              </div>

              <div className="grid gap-8 md:grid-cols-2 mb-12">
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      Naša Misija
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Omogućavamo kompanijama da efikasno upravljaju obukama svojih zaposlenih kroz 
                      modernu, intuitivnu platformu koja automatizuje administrativne procese i pruža 
                      uvid u napredak i compliance zahteve u realnom vremenu.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-primary" />
                      Naša Vizija
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Težimo da postanemo vodeća platforma za upravljanje obukama u regionu, 
                      pružajući inovativna rešenja koja pomažu organizacijama da razvijaju 
                      svoje najvrednije resurse - svoje ljude.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="bg-background rounded-lg p-8 shadow-lg">
                <h3 className="text-2xl font-bold mb-6 text-center">Zašto izabrati nas?</h3>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <CheckCircle className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Iskustvo</h4>
                      <p className="text-sm text-muted-foreground">
                        Preko 10 godina iskustva u razvoju HR i training sistema
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <CheckCircle className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Podrška</h4>
                      <p className="text-sm text-muted-foreground">
                        24/7 tehnička podrška i obuka za sve korisnike
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <CheckCircle className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Prilagodljivost</h4>
                      <p className="text-sm text-muted-foreground">
                        Sistem se prilagođava potrebama vaše organizacije
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <CheckCircle className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Sigurnost</h4>
                      <p className="text-sm text-muted-foreground">
                        Najviši standardi zaštite podataka i privatnosti
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="container px-4 py-24">
          <div className="mx-auto max-w-5xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                Kontaktirajte nas
              </h2>
              <p className="text-lg text-muted-foreground">
                Imate pitanja? Javite nam se i rado ćemo vam pomoći
              </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
              {/* Contact Information */}
              <div className="space-y-6">
                <Card className="border-0 shadow-lg">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <Mail className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1">Email</h3>
                          <p className="text-sm text-muted-foreground">support@trainingpro.me</p>
                          <p className="text-sm text-muted-foreground">info@trainingpro.me</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <Phone className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1">Telefon</h3>
                          <p className="text-sm text-muted-foreground">+382 32 123 4567</p>
                          <p className="text-sm text-muted-foreground">+382 68 123 456</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <MapPin className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1">Adresa</h3>
                          <p className="text-sm text-muted-foreground">Aerodrom Tivat</p>
                          <p className="text-sm text-muted-foreground">85320 Tivat, Crna Gora</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <Clock className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1">Radno vreme</h3>
                          <p className="text-sm text-muted-foreground">Ponedeljak - Petak: 08:00 - 16:00</p>
                          <p className="text-sm text-muted-foreground">Vikend: Zatvoreno</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Contact Form */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Pošaljite nam poruku</CardTitle>
                  <CardDescription>
                    Popunite formu i odgovorićemo vam u najkraćem roku
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label htmlFor="firstName" className="text-sm font-medium">
                          Ime
                        </label>
                        <Input id="firstName" placeholder="Vaše ime" />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="lastName" className="text-sm font-medium">
                          Prezime
                        </label>
                        <Input id="lastName" placeholder="Vaše prezime" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium">
                        Email
                      </label>
                      <Input id="email" type="email" placeholder="vasa.email@example.com" />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="phone" className="text-sm font-medium">
                        Telefon
                      </label>
                      <Input id="phone" type="tel" placeholder="+382 XX XXX XXX" />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="message" className="text-sm font-medium">
                        Poruka
                      </label>
                      <Textarea 
                        id="message" 
                        placeholder="Vaša poruka..." 
                        rows={5}
                      />
                    </div>

                    <Button className="w-full" size="lg">
                      <Send className="h-4 w-4 mr-2" />
                      Pošalji poruku
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
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
                  <li><Link href="#about" className="hover:text-primary">O nama</Link></li>
                  <li><Link href="#" className="hover:text-primary">Blog</Link></li>
                  <li><Link href="#" className="hover:text-primary">Karijera</Link></li>
                  <li><Link href="#contact" className="hover:text-primary">Kontakt</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold">Kontakt</h3>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <li>support@trainingpro.me</li>
                  <li>+382 32 123 4567</li>
                  <li>Tivat, Crna Gora</li>
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