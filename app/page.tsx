// "use client"

// import { useState, useEffect } from "react"
// import Link from "next/link"
// import Image from "next/image"
// import { Button } from "@/components/ui/button"
// import { LayoutHeader } from "@/components/layout-header"
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// import { CheckCircle, Shield, Users, Zap, BarChart, Clock, FileCheck, Bell, Calendar, Award, Target, Lock, Mail, Phone, MapPin, Send } from "lucide-react"
// import { Input } from "@/components/ui/input"
// import { Textarea } from "@/components/ui/textarea"

// export default function HomePage() {
//   const [currentImage, setCurrentImage] = useState(0)
//   const images = [
//     "/images/training1.jpg",
//     "/images/training2.jpg",
//     "/images/training3.jpg"
//   ]

//   useEffect(() => {
//     const interval = setInterval(() => {
//       setCurrentImage((prev) => (prev + 1) % images.length)
//     }, 5000)

//     return () => clearInterval(interval)
//   }, [])

//   return (
//     <>
//       <LayoutHeader />
      
//       <main className="min-h-screen">
//         {/* Hero Section with Background Images */}
//         <section className="relative overflow-hidden h-[600px] md:h-[700px]">
//           {/* Background Images with Fade Transition */}
//           {images.map((image, index) => (
//             <div
//               key={image}
//               className={`absolute inset-0 transition-opacity duration-1000 ${
//                 index === currentImage ? "opacity-100" : "opacity-0"
//               }`}
//             >
//               <Image
//                 src={image}
//                 alt={`Training background ${index + 1}`}
//                 fill
//                 className="object-cover"
//                 priority={index === 0}
//               />
//               <div className="absolute inset-0 bg-black/60" />
//             </div>
//           ))}

//           {/* Content */}
//           <div className="container relative z-10 px-4 py-24 md:py-32 h-full flex items-center">
//             <div className="mx-auto max-w-4xl text-center text-white">
//               <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl drop-shadow-lg">
//                 <span className="block">Sistem za upravljanje</span>
//                 <span className="bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
//                   obukama i sertifikatima
//                 </span>
//               </h1>
//               <p className="mt-6 text-lg md:text-xl text-gray-100 drop-shadow-md">
//                 Kompletna platforma za upravljanje obukama zaposlenih, praćenje sertifikata
//                 i optimizaciju trening programa. Povećajte produktivnost i smanjite
//                 administrativne troškove.
//               </p>
//               <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
//                 <Button size="lg" asChild className="h-12 px-8 shadow-xl">
//                   <Link href="/login">Prijavite se</Link>
//                 </Button>
//                 <Button 
//                   size="lg" 
//                   variant="outline" 
//                   className="h-12 px-8 bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 shadow-xl" 
//                   asChild
//                 >
//                   <a href="#features">Pogledajte funkcije</a>
//                 </Button>
//               </div>

//               {/* Image Indicators */}
//               <div className="mt-8 flex justify-center gap-2">
//                 {images.map((_, index) => (
//                   <button
//                     key={index}
//                     onClick={() => setCurrentImage(index)}
//                     className={`h-2 rounded-full transition-all ${
//                       index === currentImage 
//                         ? "w-8 bg-white" 
//                         : "w-2 bg-white/50 hover:bg-white/75"
//                     }`}
//                     aria-label={`Prikaži sliku ${index + 1}`}
//                   />
//                 ))}
//               </div>
//             </div>
//           </div>
//         </section>

//         {/* Stats Section */}
//         <section className="container px-4 py-12">
//           <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
//             <div className="flex flex-col items-center text-center">
//               <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
//                 <Users className="h-8 w-8 text-primary" />
//               </div>
//               <h3 className="text-3xl font-bold">1,000+</h3>
//               <p className="text-sm text-muted-foreground">Zaposlenih u sistemu</p>
//             </div>
//             <div className="flex flex-col items-center text-center">
//               <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
//                 <Award className="h-8 w-8 text-primary" />
//               </div>
//               <h3 className="text-3xl font-bold">5,000+</h3>
//               <p className="text-sm text-muted-foreground">Izdatih sertifikata</p>
//             </div>
//             <div className="flex flex-col items-center text-center">
//               <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
//                 <Calendar className="h-8 w-8 text-primary" />
//               </div>
//               <h3 className="text-3xl font-bold">500+</h3>
//               <p className="text-sm text-muted-foreground">Obuka mesečno</p>
//             </div>
//             <div className="flex flex-col items-center text-center">
//               <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
//                 <Target className="h-8 w-8 text-primary" />
//               </div>
//               <h3 className="text-3xl font-bold">99%</h3>
//               <p className="text-sm text-muted-foreground">Zadovoljstvo korisnika</p>
//             </div>
//           </div>
//         </section>

//         {/* Features Section */}
//         <section id="features" className="container px-4 py-24">
//           <div className="mx-auto max-w-4xl text-center">
//             <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
//               Kompletno rešenje za upravljanje obukama
//             </h2>
//             <p className="mt-4 text-lg text-muted-foreground">
//               Sve što vam je potrebno za efikasno upravljanje obukama i sertifikatima zaposlenih
//             </p>
//           </div>

//           <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
//             <Card className="border hover:shadow-lg transition-shadow">
//               <CardHeader>
//                 <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
//                   <Users className="h-6 w-6 text-primary" />
//                 </div>
//                 <CardTitle>Upravljanje Zaposlenima</CardTitle>
//                 <CardDescription>
//                   Kompletna evidencija zaposlenih sa detaljnim pregledom obuka
//                 </CardDescription>
//               </CardHeader>
//               <CardContent>
//                 <ul className="space-y-2">
//                   <li className="flex items-center gap-2">
//                     <CheckCircle className="h-4 w-4 text-green-500" />
//                     <span className="text-sm">Profil svakog zaposlenog</span>
//                   </li>
//                   <li className="flex items-center gap-2">
//                     <CheckCircle className="h-4 w-4 text-green-500" />
//                     <span className="text-sm">Istorija obuka i sertifikata</span>
//                   </li>
//                   <li className="flex items-center gap-2">
//                     <CheckCircle className="h-4 w-4 text-green-500" />
//                     <span className="text-sm">Planiranje budućih obuka</span>
//                   </li>
//                 </ul>
//               </CardContent>
//             </Card>

//             <Card className="border hover:shadow-lg transition-shadow">
//               <CardHeader>
//                 <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
//                   <Shield className="h-6 w-6 text-primary" />
//                 </div>
//                 <CardTitle>Sertifikati i Compliance</CardTitle>
//                 <CardDescription>
//                   Automatsko praćenje važenja i obaveštenja o isticanju
//                 </CardDescription>
//               </CardHeader>
//               <CardContent>
//                 <ul className="space-y-2">
//                   <li className="flex items-center gap-2">
//                     <CheckCircle className="h-4 w-4 text-green-500" />
//                     <span className="text-sm">Automatska obaveštenja</span>
//                   </li>
//                   <li className="flex items-center gap-2">
//                     <CheckCircle className="h-4 w-4 text-green-500" />
//                     <span className="text-sm">PDF sertifikati</span>
//                   </li>
//                   <li className="flex items-center gap-2">
//                     <CheckCircle className="h-4 w-4 text-green-500" />
//                     <span className="text-sm">Izveštaji za audit</span>
//                   </li>
//                 </ul>
//               </CardContent>
//             </Card>

//             <Card className="border hover:shadow-lg transition-shadow">
//               <CardHeader>
//                 <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
//                   <BarChart className="h-6 w-6 text-primary" />
//                 </div>
//                 <CardTitle>Analitika i Izveštaji</CardTitle>
//                 <CardDescription>
//                   Detaljni pregledi za donošenje informisanih odluka
//                 </CardDescription>
//               </CardHeader>
//               <CardContent>
//                 <ul className="space-y-2">
//                   <li className="flex items-center gap-2">
//                     <CheckCircle className="h-4 w-4 text-green-500" />
//                     <span className="text-sm">Dashboard sa statistikama</span>
//                   </li>
//                   <li className="flex items-center gap-2">
//                     <CheckCircle className="h-4 w-4 text-green-500" />
//                     <span className="text-sm">Prilagođeni izveštaji</span>
//                   </li>
//                   <li className="flex items-center gap-2">
//                     <CheckCircle className="h-4 w-4 text-green-500" />
//                     <span className="text-sm">Real-time ažuriranja</span>
//                   </li>
//                 </ul>
//               </CardContent>
//             </Card>

//             <Card className="border hover:shadow-lg transition-shadow">
//               <CardHeader>
//                 <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
//                   <Calendar className="h-6 w-6 text-primary" />
//                 </div>
//                 <CardTitle>Raspored Obuka</CardTitle>
//                 <CardDescription>
//                   Planiranje i upravljanje rasporedom sa konfliktnim proverama
//                 </CardDescription>
//               </CardHeader>
//               <CardContent>
//                 <ul className="space-y-2">
//                   <li className="flex items-center gap-2">
//                     <CheckCircle className="h-4 w-4 text-green-500" />
//                     <span className="text-sm">Interaktivni kalendar</span>
//                   </li>
//                   <li className="flex items-center gap-2">
//                     <CheckCircle className="h-4 w-4 text-green-500" />
//                     <span className="text-sm">Obaveštenja učesnicima</span>
//                   </li>
//                   <li className="flex items-center gap-2">
//                     <CheckCircle className="h-4 w-4 text-green-500" />
//                     <span className="text-sm">Rezervacija prostorija</span>
//                   </li>
//                 </ul>
//               </CardContent>
//             </Card>

//             <Card className="border hover:shadow-lg transition-shadow">
//               <CardHeader>
//                 <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
//                   <Bell className="h-6 w-6 text-primary" />
//                 </div>
//                 <CardTitle>Obaveštenja i Podsetnici</CardTitle>
//                 <CardDescription>
//                   Automatski podsetnici za obuke i sertifikate
//                 </CardDescription>
//               </CardHeader>
//               <CardContent>
//                 <ul className="space-y-2">
//                   <li className="flex items-center gap-2">
//                     <CheckCircle className="h-4 w-4 text-green-500" />
//                     <span className="text-sm">Email obaveštenja</span>
//                   </li>
//                   <li className="flex items-center gap-2">
//                     <CheckCircle className="h-4 w-4 text-green-500" />
//                     <span className="text-sm">SMS podsetnici</span>
//                   </li>
//                   <li className="flex items-center gap-2">
//                     <CheckCircle className="h-4 w-4 text-green-500" />
//                     <span className="text-sm">In-app notifikacije</span>
//                   </li>
//                 </ul>
//               </CardContent>
//             </Card>

//             <Card className="border hover:shadow-lg transition-shadow">
//               <CardHeader>
//                 <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
//                   <Lock className="h-6 w-6 text-primary" />
//                 </div>
//                 <CardTitle>Bezbednost i Pristup</CardTitle>
//                 <CardDescription>
//                   Višestepena bezbednost i kontrola pristupa
//                 </CardDescription>
//               </CardHeader>
//               <CardContent>
//                 <ul className="space-y-2">
//                   <li className="flex items-center gap-2">
//                     <CheckCircle className="h-4 w-4 text-green-500" />
//                     <span className="text-sm">RBAC kontrola pristupa</span>
//                   </li>
//                   <li className="flex items-center gap-2">
//                     <CheckCircle className="h-4 w-4 text-green-500" />
//                     <span className="text-sm">Enkripcija podataka</span>
//                   </li>
//                   <li className="flex items-center gap-2">
//                     <CheckCircle className="h-4 w-4 text-green-500" />
//                     <span className="text-sm">Audit log</span>
//                   </li>
//                 </ul>
//               </CardContent>
//             </Card>
//           </div>
//         </section>

//         {/* About Section */}
//         <section id="about" className="bg-muted/50 py-24">
//           <div className="container px-4">
//             <div className="mx-auto max-w-4xl">
//               <div className="text-center mb-12">
//                 <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
//                   O nama
//                 </h2>
//                 <p className="text-lg text-muted-foreground">
//                   Vaš pouzdani partner za upravljanje obukama i razvojem zaposlenih
//                 </p>
//               </div>

//               <div className="grid gap-8 md:grid-cols-2 mb-12">
//                 <Card className="border-0 shadow-lg">
//                   <CardHeader>
//                     <CardTitle className="flex items-center gap-2">
//                       <Target className="h-5 w-5 text-primary" />
//                       Naša Misija
//                     </CardTitle>
//                   </CardHeader>
//                   <CardContent>
//                     <p className="text-muted-foreground">
//                       Omogućavamo kompanijama da efikasno upravljaju obukama svojih zaposlenih kroz 
//                       modernu, intuitivnu platformu koja automatizuje administrativne procese i pruža 
//                       uvid u napredak i compliance zahteve u realnom vremenu.
//                     </p>
//                   </CardContent>
//                 </Card>

//                 <Card className="border-0 shadow-lg">
//                   <CardHeader>
//                     <CardTitle className="flex items-center gap-2">
//                       <Award className="h-5 w-5 text-primary" />
//                       Naša Vizija
//                     </CardTitle>
//                   </CardHeader>
//                   <CardContent>
//                     <p className="text-muted-foreground">
//                       Težimo da postanemo vodeća platforma za upravljanje obukama u regionu, 
//                       pružajući inovativna rešenja koja pomažu organizacijama da razvijaju 
//                       svoje najvrednije resurse - svoje ljude.
//                     </p>
//                   </CardContent>
//                 </Card>
//               </div>

//               <div className="bg-background rounded-lg p-8 shadow-lg">
//                 <h3 className="text-2xl font-bold mb-6 text-center">Zašto izabrati nas?</h3>
//                 <div className="grid gap-6 md:grid-cols-2">
//                   <div className="flex gap-4">
//                     <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
//                       <CheckCircle className="h-5 w-5 text-primary" />
//                     </div>
//                     <div>
//                       <h4 className="font-semibold mb-1">Iskustvo</h4>
//                       <p className="text-sm text-muted-foreground">
//                         Preko 10 godina iskustva u razvoju HR i training sistema
//                       </p>
//                     </div>
//                   </div>

//                   <div className="flex gap-4">
//                     <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
//                       <CheckCircle className="h-5 w-5 text-primary" />
//                     </div>
//                     <div>
//                       <h4 className="font-semibold mb-1">Podrška</h4>
//                       <p className="text-sm text-muted-foreground">
//                         24/7 tehnička podrška i obuka za sve korisnike
//                       </p>
//                     </div>
//                   </div>

//                   <div className="flex gap-4">
//                     <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
//                       <CheckCircle className="h-5 w-5 text-primary" />
//                     </div>
//                     <div>
//                       <h4 className="font-semibold mb-1">Prilagodljivost</h4>
//                       <p className="text-sm text-muted-foreground">
//                         Sistem se prilagođava potrebama vaše organizacije
//                       </p>
//                     </div>
//                   </div>

//                   <div className="flex gap-4">
//                     <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
//                       <CheckCircle className="h-5 w-5 text-primary" />
//                     </div>
//                     <div>
//                       <h4 className="font-semibold mb-1">Sigurnost</h4>
//                       <p className="text-sm text-muted-foreground">
//                         Najviši standardi zaštite podataka i privatnosti
//                       </p>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </section>

//         {/* Contact Section */}
//         <section id="contact" className="container px-4 py-24">
//           <div className="mx-auto max-w-5xl">
//             <div className="text-center mb-12">
//               <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
//                 Kontaktirajte nas
//               </h2>
//               <p className="text-lg text-muted-foreground">
//                 Imate pitanja? Javite nam se i rado ćemo vam pomoći
//               </p>
//             </div>

//             <div className="grid gap-8 lg:grid-cols-2">
//               {/* Contact Information */}
//               <div className="space-y-6">
//                 <Card className="border-0 shadow-lg">
//                   <CardContent className="pt-6">
//                     <div className="space-y-4">
//                       <div className="flex items-start gap-4">
//                         <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
//                           <Mail className="h-6 w-6 text-primary" />
//                         </div>
//                         <div>
//                           <h3 className="font-semibold mb-1">Email</h3>
//                           <p className="text-sm text-muted-foreground">support@trainingpro.me</p>
//                           <p className="text-sm text-muted-foreground">info@trainingpro.me</p>
//                         </div>
//                       </div>

//                       <div className="flex items-start gap-4">
//                         <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
//                           <Phone className="h-6 w-6 text-primary" />
//                         </div>
//                         <div>
//                           <h3 className="font-semibold mb-1">Telefon</h3>
//                           <p className="text-sm text-muted-foreground">+382 32 123 4567</p>
//                           <p className="text-sm text-muted-foreground">+382 68 123 456</p>
//                         </div>
//                       </div>

//                       <div className="flex items-start gap-4">
//                         <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
//                           <MapPin className="h-6 w-6 text-primary" />
//                         </div>
//                         <div>
//                           <h3 className="font-semibold mb-1">Adresa</h3>
//                           <p className="text-sm text-muted-foreground">Aerodrom Tivat</p>
//                           <p className="text-sm text-muted-foreground">85320 Tivat, Crna Gora</p>
//                         </div>
//                       </div>

//                       <div className="flex items-start gap-4">
//                         <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
//                           <Clock className="h-6 w-6 text-primary" />
//                         </div>
//                         <div>
//                           <h3 className="font-semibold mb-1">Radno vreme</h3>
//                           <p className="text-sm text-muted-foreground">Ponedeljak - Petak: 08:00 - 16:00</p>
//                           <p className="text-sm text-muted-foreground">Vikend: Zatvoreno</p>
//                         </div>
//                       </div>
//                     </div>
//                   </CardContent>
//                 </Card>
//               </div>

//               {/* Contact Form */}
//               <Card className="border-0 shadow-lg">
//                 <CardHeader>
//                   <CardTitle>Pošaljite nam poruku</CardTitle>
//                   <CardDescription>
//                     Popunite formu i odgovorićemo vam u najkraćem roku
//                   </CardDescription>
//                 </CardHeader>
//                 <CardContent>
//                   <form className="space-y-4">
//                     <div className="grid gap-4 sm:grid-cols-2">
//                       <div className="space-y-2">
//                         <label htmlFor="firstName" className="text-sm font-medium">
//                           Ime
//                         </label>
//                         <Input id="firstName" placeholder="Vaše ime" />
//                       </div>
//                       <div className="space-y-2">
//                         <label htmlFor="lastName" className="text-sm font-medium">
//                           Prezime
//                         </label>
//                         <Input id="lastName" placeholder="Vaše prezime" />
//                       </div>
//                     </div>

//                     <div className="space-y-2">
//                       <label htmlFor="email" className="text-sm font-medium">
//                         Email
//                       </label>
//                       <Input id="email" type="email" placeholder="vasa.email@example.com" />
//                     </div>

//                     <div className="space-y-2">
//                       <label htmlFor="phone" className="text-sm font-medium">
//                         Telefon
//                       </label>
//                       <Input id="phone" type="tel" placeholder="+382 XX XXX XXX" />
//                     </div>

//                     <div className="space-y-2">
//                       <label htmlFor="message" className="text-sm font-medium">
//                         Poruka
//                       </label>
//                       <Textarea 
//                         id="message" 
//                         placeholder="Vaša poruka..." 
//                         rows={5}
//                       />
//                     </div>

//                     <Button className="w-full" size="lg">
//                       <Send className="h-4 w-4 mr-2" />
//                       Pošalji poruku
//                     </Button>
//                   </form>
//                 </CardContent>
//               </Card>
//             </div>
//           </div>
//         </section>

//         {/* CTA Section */}
//         <section className="container px-4 py-24">
//           <div className="mx-auto max-w-4xl rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 p-8 text-center md:p-12">
//             <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
//               Spremni da unapredite obuke vaših zaposlenih?
//             </h2>
//             <p className="mt-4 text-lg text-muted-foreground">
//               Pridružite se kompanijama koje već koriste naš sistem za efikasnije upravljanje obukama
//             </p>
//             <div className="mt-8">
//               <Button size="lg" className="h-12 px-8" asChild>
//                 <Link href="/login">Započnite besplatnu probu</Link>
//               </Button>
//               <p className="mt-4 text-sm text-muted-foreground">
//                 Nema kreditne kartice • 30 dana probne verzije • Puna podrška
//               </p>
//             </div>
//           </div>
//         </section>

//         {/* Footer */}
//         <footer className="border-t py-12">
//           <div className="container px-4">
//             <div className="grid gap-8 md:grid-cols-4">
//               <div>
//                 <div className="flex items-center gap-2">
//                   <Award className="h-6 w-6 text-primary" />
//                   <span className="font-bold">TrainingPro</span>
//                 </div>
//                 <p className="mt-4 text-sm text-muted-foreground">
//                   Vodeći sistem za upravljanje obukama i sertifikatima u regionu.
//                 </p>
//               </div>
//               <div>
//                 <h3 className="font-semibold">Proizvod</h3>
//                 <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
//                   <li><Link href="#features" className="hover:text-primary">Funkcije</Link></li>
//                   <li><Link href="/login" className="hover:text-primary">Prijava</Link></li>
//                   <li><Link href="#" className="hover:text-primary">Cenovnik</Link></li>
//                   <li><Link href="#" className="hover:text-primary">FAQ</Link></li>
//                 </ul>
//               </div>
//               <div>
//                 <h3 className="font-semibold">Kompanija</h3>
//                 <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
//                   <li><Link href="#about" className="hover:text-primary">O nama</Link></li>
//                   <li><Link href="#" className="hover:text-primary">Blog</Link></li>
//                   <li><Link href="#" className="hover:text-primary">Karijera</Link></li>
//                   <li><Link href="#contact" className="hover:text-primary">Kontakt</Link></li>
//                 </ul>
//               </div>
//               <div>
//                 <h3 className="font-semibold">Kontakt</h3>
//                 <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
//                   <li>support@trainingpro.me</li>
//                   <li>+382 32 123 4567</li>
//                   <li>Tivat, Crna Gora</li>
//                   <li>Radno vreme: 08-16h</li>
//                 </ul>
//               </div>
//             </div>
//             <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
//               <p>© {new Date().getFullYear()} TrainingPro. Sva prava zadržana.</p>
//               <p className="mt-2">Sistem za upravljanje obukama i sertifikatima zaposlenih</p>
//             </div>
//           </div>
//         </footer>
//       </main>
//     </>
//   )
// }


"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { LayoutHeader } from "@/components/layout-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Shield, Users, Zap, BarChart, Clock, FileCheck, Bell, Calendar, Award, Target, Lock, Mail, Phone, MapPin, Send, Sparkles, ArrowRight, Star, TrendingUp, Globe, Layers, Cpu, Eye, Brain, Lightbulb, Rocket } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

export default function HomePage() {
  const [currentImage, setCurrentImage] = useState(0)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState(0)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    message: ""
  })
  const [isSubmitted, setIsSubmitted] = useState(false)
  
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

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitted(true)
    setTimeout(() => setIsSubmitted(false), 3000)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <>
      <LayoutHeader />
      
      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">
        {/* Animated Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute top-40 right-20 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
          <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '4s' }}></div>
        </div>

        {/* Hero Section with Modern Design */}
        <section className="relative overflow-hidden h-[700px] md:h-[800px]">
          {/* Animated Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-purple-900/30 to-slate-900/90 z-10"></div>
          
          {/* Background Images with Parallax Effect */}
          {images.map((image, index) => (
            <div
              key={image}
              className={cn(
                "absolute inset-0 transition-all duration-1000 ease-in-out",
                index === currentImage ? "opacity-30 scale-100" : "opacity-0 scale-110"
              )}
              style={{
                transform: `translateY(${mousePosition.y * 0.02}px) translateX(${mousePosition.x * 0.02}px)`
              }}
            >
              <Image
                src={image}
                alt={`Training background ${index + 1}`}
                fill
                className="object-cover"
                priority={index === 0}
              />
            </div>
          ))}

          {/* Floating Elements */}
          <div className="absolute top-20 left-10 w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl rotate-12 shadow-2xl shadow-cyan-500/20 animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '3s' }}></div>
          <div className="absolute bottom-20 right-10 w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-600 rounded-2xl -rotate-12 shadow-2xl shadow-purple-500/20 animate-bounce" style={{ animationDelay: '1s', animationDuration: '3s' }}></div>
          <div className="absolute top-1/2 left-1/4 w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-600 rounded-2xl rotate-45 shadow-2xl shadow-amber-500/20 animate-bounce" style={{ animationDelay: '1.5s', animationDuration: '3s' }}></div>

          {/* Content */}
          <div className="container relative z-20 px-4 py-24 md:py-32 h-full flex items-center">
            <div className="mx-auto max-w-5xl text-center">
              <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-sm">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span>Napredna platforma za 2026. godinu</span>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
                <span className="block bg-gradient-to-r from-white via-cyan-100 to-white bg-clip-text text-transparent">
                  Sistem za upravljanje
                </span>
                <span className="block bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                  obukama i sertifikatima
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed">
                Revolucionarna platforma koja koristi AI da optimizuje obuke zaposlenih, 
                prati sertifikate u realnom vremenu i predviđa buduće potrebe za obukom.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
                <Button size="lg" className="h-14 px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-2xl shadow-purple-500/25 transition-all duration-300 hover:scale-105 rounded-full" asChild>
                  <Link href="/login" className="flex items-center gap-2">
                    <Rocket className="h-5 w-5" />
                    <span>Započite revoluciju</span>
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="h-14 px-8 bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 shadow-2xl shadow-white/10 transition-all duration-300 hover:scale-105 rounded-full" 
                  asChild
                >
                  <a href="#features" className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    <span>Pogledajte funkcije</span>
                  </a>
                </Button>
              </div>

              {/* Image Indicators */}
              <div className="flex justify-center gap-2">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImage(index)}
                    className={cn(
                      "h-2 rounded-full transition-all duration-300",
                      index === currentImage 
                        ? "w-8 bg-gradient-to-r from-cyan-400 to-blue-500" 
                        : "w-2 bg-white/30 hover:bg-white/50"
                    )}
                    aria-label={`Prikaži sliku ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section with Glassmorphism */}
        <section className="container px-4 py-16 relative">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Users, value: "1,000+", label: "Zaposlenih u sistemu", color: "from-cyan-400 to-blue-500" },
              { icon: Award, value: "5,000+", label: "Izdatih sertifikata", color: "from-purple-400 to-pink-500" },
              { icon: Calendar, value: "500+", label: "Obuka mesečno", color: "from-amber-400 to-orange-500" },
              { icon: Target, value: "99%", label: "Zadovoljstvo korisnika", color: "from-green-400 to-emerald-500" }
            ].map((stat, index) => (
              <Card key={index} className="border-0 bg-white/5 backdrop-blur-md shadow-xl shadow-black/20 hover:shadow-2xl hover:shadow-black/30 transition-all duration-300 hover:-translate-y-2 rounded-2xl overflow-hidden group">
                <CardContent className="pt-6 pb-6 text-center">
                  <div className="mb-4 mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br p-0.5 group-hover:scale-110 transition-transform duration-300">
                    <div className="h-full w-full rounded-2xl bg-slate-900 flex items-center justify-center">
                      <stat.icon className={cn("h-8 w-8 bg-gradient-to-br bg-clip-text text-transparent", stat.color)} />
                    </div>
                  </div>
                  <h3 className="text-3xl md:text-4xl font-bold bg-gradient-to-r bg-clip-text text-transparent from-white to-gray-300">{stat.value}</h3>
                  <p className="text-sm text-gray-400 mt-2">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Features Section with 3D Cards */}
        <section id="features" className="container px-4 py-24">
          <div className="mx-auto max-w-4xl text-center mb-16">
            <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 backdrop-blur-md border border-cyan-500/30 rounded-full text-sm">
              <Layers className="h-4 w-4 text-cyan-400" />
              <span>Napredne funkcionalnosti</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
              <span className="bg-gradient-to-r from-white via-cyan-100 to-white bg-clip-text text-transparent">
                Kompletno rešenje za
              </span>
              <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                {" "}upravljanje obukama
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Sve što vam je potrebno za efikasno upravljanje obukama i sertifikatima zaposlenih, 
              podržano najnovijom AI tehnologijom
            </p>
          </div>

          {/* Interactive Tabs */}
          <div className="flex justify-center mb-12">
            <div className="inline-flex p-1 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl">
              {["Sve funkcije", "AI alati", "Analitika", "Bezbednost"].map((tab, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTab(index)}
                  className={cn(
                    "px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300",
                    activeTab === index 
                      ? "bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-lg shadow-purple-500/25" 
                      : "text-gray-400 hover:text-white hover:bg-white/10"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Users,
                title: "Upravljanje Zaposlenima",
                description: "Kompletna evidencija zaposlenih sa detaljnim pregledom obuka",
                features: ["Profil svakog zaposlenog", "Istorija obuka i sertifikata", "Planiranje budućih obuka"],
                color: "from-cyan-400 to-blue-500",
                delay: 0
              },
              {
                icon: Shield,
                title: "Sertifikati i Compliance",
                description: "Automatsko praćenje važenja i obaveštenja o isticanju",
                features: ["Automatska obaveštenja", "PDF sertifikati", "Izveštaji za audit"],
                color: "from-purple-400 to-pink-500",
                delay: 100
              },
              {
                icon: BarChart,
                title: "Analitika i Izveštaji",
                description: "Detaljni pregledi za donošenje informisanih odluka",
                features: ["Dashboard sa statistikama", "Prilagođeni izveštaji", "Real-time ažuriranja"],
                color: "from-amber-400 to-orange-500",
                delay: 200
              },
              {
                icon: Calendar,
                title: "Raspored Obuka",
                description: "Planiranje i upravljanje rasporedom sa konfliktnim proverama",
                features: ["Interaktivni kalendar", "Obaveštenja učesnicima", "Rezervacija prostorija"],
                color: "from-green-400 to-emerald-500",
                delay: 300
              },
              {
                icon: Bell,
                title: "Obaveštenja i Podsetnici",
                description: "Automatski podsetnici za obuke i sertifikate",
                features: ["Email obaveštenja", "SMS podsetnici", "In-app notifikacije"],
                color: "from-rose-400 to-pink-500",
                delay: 400
              },
              {
                icon: Lock,
                title: "Bezbednost i Pristup",
                description: "Višestepena bezbednost i kontrola pristupa",
                features: ["RBAC kontrola pristupa", "Enkripcija podataka", "Audit log"],
                color: "from-indigo-400 to-purple-500",
                delay: 500
              }
            ].map((feature, index) => (
              <Card 
                key={index} 
                className="border-0 bg-white/5 backdrop-blur-md shadow-xl shadow-black/20 hover:shadow-2xl hover:shadow-black/30 transition-all duration-500 hover:-translate-y-3 rounded-2xl overflow-hidden group"
                style={{ animationDelay: `${feature.delay}ms` }}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-bl-full"></div>
                <CardHeader className="pb-4">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br p-0.5 group-hover:scale-110 transition-transform duration-300">
                    <div className="h-full w-full rounded-2xl bg-slate-900 flex items-center justify-center">
                      <feature.icon className={cn("h-7 w-7 bg-gradient-to-br bg-clip-text text-transparent", feature.color)} />
                    </div>
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-gray-400">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="space-y-3">
                    {feature.features.map((item, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-green-400 to-emerald-500">
                          <CheckCircle className="h-3.5 w-3.5 text-white" />
                        </div>
                        <span className="text-sm text-gray-300">{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Button variant="ghost" className="mt-6 w-full group-hover:bg-white/10 transition-colors duration-300 rounded-xl">
                    Saznajte više
                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* About Section with Modern Design */}
        <section id="about" className="relative py-24 overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900"></div>
          <div className="absolute inset-0 bg-[url('/data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSJub25lIi8+CjxwYXRoIGQ9Ik0zMCA2MEM0Ni41NjA0IDYwIDYwIDQ2LjU2MDQgNjAgMzBDNjAgMTMuNDM5NiA0Ni41NjA0IDAgMzAgMEMxMy40Mzk2IDAgMCAxMy40Mzk2IDAgMzBDMCA0Ni41NjA0IDEzLjQzOTYgNjAgMzAgNjBaIiBmaWxsPSJ3aGl0ZSIgZmlsbC1vcGFjaXR5PSIwLjA1Ii8+Cjwvc3ZnPgo=')] opacity-5"></div>
          
          <div className="container px-4 relative z-10">
            <div className="mx-auto max-w-5xl">
              <div className="text-center mb-16">
                <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-md border border-purple-500/30 rounded-full text-sm">
                  <Brain className="h-4 w-4 text-purple-400" />
                  <span>Naša priča</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
                  <span className="bg-gradient-to-r from-white via-purple-100 to-white bg-clip-text text-transparent">
                    O nama
                  </span>
                </h2>
                <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                  Vaš pouzdani partner za upravljanje obukama i razvojem zaposlenih
                </p>
              </div>

              <div className="grid gap-8 md:grid-cols-2 mb-16">
                <Card className="border-0 bg-gradient-to-br from-purple-900/20 to-pink-900/20 backdrop-blur-md shadow-2xl shadow-purple-500/10 hover:shadow-purple-500/20 transition-all duration-500 hover:-translate-y-2 rounded-2xl overflow-hidden">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-purple-500/20 to-transparent rounded-full"></div>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-2xl">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-400 to-pink-500 p-0.5">
                        <div className="h-full w-full rounded-xl bg-slate-900 flex items-center justify-center">
                          <Target className="h-6 w-6 bg-gradient-to-br bg-clip-text text-transparent from-purple-400 to-pink-500" />
                        </div>
                      </div>
                      Naša Misija
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300 leading-relaxed">
                      Omogućavamo kompanijama da efikasno upravljaju obukama svojih zaposlenih kroz 
                      modernu, intuitivnu platformu koja automatizuje administrativne procese i pruža 
                      uvid u napredak i compliance zahteve u realnom vremenu.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-0 bg-gradient-to-br from-cyan-900/20 to-blue-900/20 backdrop-blur-md shadow-2xl shadow-cyan-500/10 hover:shadow-cyan-500/20 transition-all duration-500 hover:-translate-y-2 rounded-2xl overflow-hidden">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-cyan-500/20 to-transparent rounded-full"></div>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-2xl">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 p-0.5">
                        <div className="h-full w-full rounded-xl bg-slate-900 flex items-center justify-center">
                          <Award className="h-6 w-6 bg-gradient-to-br bg-clip-text text-transparent from-cyan-400 to-blue-500" />
                        </div>
                      </div>
                      Naša Vizija
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300 leading-relaxed">
                      Težimo da postanemo vodeća platforma za upravljanje obukama u regionu, 
                      pružajući inovativna rešenja koja pomažu organizacijama da razvijaju 
                      svoje najvrednije resurse - svoje ljude.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-0 bg-white/5 backdrop-blur-md shadow-2xl shadow-black/20 rounded-2xl overflow-hidden">
                <CardHeader className="pb-6">
                  <h3 className="text-2xl font-bold text-center mb-2">Zašto izabrati nas?</h3>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2">
                    {[
                      { icon: TrendingUp, title: "Iskustvo", description: "Preko 10 godina iskustva u razvoju HR i training sistema" },
                      { icon: Users, title: "Podrška", description: "24/7 tehnička podrška i obuka za sve korisnike" },
                      { icon: Cpu, title: "Prilagodljivost", description: "Sistem se prilagođava potrebama vaše organizacije" },
                      { icon: Shield, title: "Sigurnost", description: "Najviši standardi zaštite podataka i privatnosti" }
                    ].map((item, index) => (
                      <div key={index} className="flex gap-4 group hover:translate-x-2 transition-transform duration-300">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400/20 to-blue-500/20 p-0.5 group-hover:scale-110 transition-transform duration-300">
                          <div className="h-full w-full rounded-xl bg-slate-900 flex items-center justify-center">
                            <item.icon className="h-6 w-6 bg-gradient-to-br bg-clip-text text-transparent from-cyan-400 to-blue-500" />
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-1 text-lg">{item.title}</h4>
                          <p className="text-sm text-gray-400">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Contact Section with Modern Form */}
        <section id="contact" className="container px-4 py-24">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 backdrop-blur-md border border-cyan-500/30 rounded-full text-sm">
                <Mail className="h-4 w-4 text-cyan-400" />
                <span>Kontaktirajte nas</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
                <span className="bg-gradient-to-r from-white via-cyan-100 to-white bg-clip-text text-transparent">
                  Kontaktirajte nas
                </span>
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Imate pitanja? Javite nam se i rado ćemo vam pomoći
              </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
              {/* Contact Information */}
              <div className="space-y-6">
                {[
                  { icon: Mail, title: "Email", values: ["support@trainingpro.me", "info@trainingpro.me"] },
                  { icon: Phone, title: "Telefon", values: ["+382 32 123 4567", "+382 68 123 456"] },
                  { icon: MapPin, title: "Adresa", values: ["Aerodrom Tivat", "85320 Tivat, Crna Gora"] },
                  { icon: Clock, title: "Radno vreme", values: ["Ponedeljak - Petak: 08:00 - 16:00", "Vikend: Zatvoreno"] }
                ].map((item, index) => (
                  <Card key={index} className="border-0 bg-white/5 backdrop-blur-md shadow-xl shadow-black/20 hover:shadow-2xl hover:shadow-black/30 transition-all duration-500 hover:-translate-y-2 rounded-2xl overflow-hidden">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400/20 to-blue-500/20 p-0.5">
                          <div className="h-full w-full rounded-xl bg-slate-900 flex items-center justify-center">
                            <item.icon className="h-6 w-6 bg-gradient-to-br bg-clip-text text-transparent from-cyan-400 to-blue-500" />
                          </div>
                        </div>
                        <div>
                          <h3 className="font-semibold mb-2 text-lg">{item.title}</h3>
                          {item.values.map((value, i) => (
                            <p key={i} className="text-sm text-gray-300">{value}</p>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Contact Form */}
              <Card className="border-0 bg-white/5 backdrop-blur-md shadow-2xl shadow-black/30 rounded-2xl overflow-hidden">
                <CardHeader className="pb-6">
                  <CardTitle className="text-2xl">Pošaljite nam poruku</CardTitle>
                  <CardDescription className="text-gray-400">
                    Popunite formu i odgovorićemo vam u najkraćem roku
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isSubmitted ? (
                    <div className="text-center py-12">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-500 mb-4">
                        <CheckCircle className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">Poruka poslata!</h3>
                      <p className="text-gray-400">Javićemo vam se u najkraćem mogućem roku.</p>
                    </div>
                  ) : (
                    <form onSubmit={handleFormSubmit} className="space-y-6">
                      <div className="grid gap-6 sm:grid-cols-2">
                        <div className="space-y-2">
                          <label htmlFor="firstName" className="text-sm font-medium text-gray-300">
                            Ime
                          </label>
                          <Input 
                            id="firstName" 
                            placeholder="Vaše ime" 
                            className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-cyan-400 focus:ring-cyan-400 rounded-xl"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="lastName" className="text-sm font-medium text-gray-300">
                            Prezime
                          </label>
                          <Input 
                            id="lastName" 
                            placeholder="Vaše prezime" 
                            className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-cyan-400 focus:ring-cyan-400 rounded-xl"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium text-gray-300">
                          Email
                        </label>
                        <Input 
                          id="email" 
                          type="email" 
                          placeholder="vasa.email@example.com" 
                          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-cyan-400 focus:ring-cyan-400 rounded-xl"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="phone" className="text-sm font-medium text-gray-300">
                          Telefon
                        </label>
                        <Input 
                          id="phone" 
                          type="tel" 
                          placeholder="+382 XX XXX XXX" 
                          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-cyan-400 focus:ring-cyan-400 rounded-xl"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                        />
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="message" className="text-sm font-medium text-gray-300">
                          Poruka
                        </label>
                        <Textarea 
                          id="message" 
                          placeholder="Vaša poruka..." 
                          rows={5}
                          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-cyan-400 focus:ring-cyan-400 rounded-xl resize-none"
                          name="message"
                          value={formData.message}
                          onChange={handleInputChange}
                          required
                        />
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full h-14 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white border-0 shadow-2xl shadow-cyan-500/25 transition-all duration-300 hover:scale-105 rounded-xl text-lg font-medium"
                      >
                        <Send className="h-5 w-5 mr-2" />
                        Pošalji poruku
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section with Modern Design */}
        <section className="container px-4 py-24">
          <div className="mx-auto max-w-5xl relative">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl blur-xl"></div>
            
            <div className="relative bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-3xl p-8 md:p-16 text-center shadow-2xl shadow-black/30">
              <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-md border border-amber-500/30 rounded-full text-sm">
                <Star className="h-4 w-4 text-amber-400" />
                <span>Posebna ponuda</span>
              </div>
              
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
                <span className="bg-gradient-to-r from-white via-amber-100 to-white bg-clip-text text-transparent">
                  Spremni da unapredite
                </span>
                <span className="bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
                  {" "}obuke vaših zaposlenih?
                </span>
              </h2>
              
              <p className="text-xl text-gray-300 mb-10 max-w-3xl mx-auto">
                Pridružite se kompanijama koje već koriste naš sistem za efikasnije upravljanje obukama
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <Button size="lg" className="h-14 px-8 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-0 shadow-2xl shadow-orange-500/25 transition-all duration-300 hover:scale-105 rounded-full text-lg font-medium" asChild>
                  <Link href="/login" className="flex items-center gap-2">
                    <Rocket className="h-5 w-5" />
                    <span>Započite besplatnu probu</span>
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
              </div>
              
              <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span>Nema kreditne kartice</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span>30 dana probne verzije</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span>Puna podrška</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer with Modern Design */}
        <footer className="border-t border-white/10 py-16">
          <div className="container px-4">
            <div className="grid gap-12 md:grid-cols-4">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 p-0.5">
                    <div className="h-full w-full rounded-xl bg-slate-900 flex items-center justify-center">
                      <Award className="h-5 w-5 bg-gradient-to-br bg-clip-text text-transparent from-cyan-400 to-blue-500" />
                    </div>
                  </div>
                  <span className="font-bold text-xl">TrainingPro</span>
                </div>
                <p className="text-gray-400 mb-6">
                  Vodeći sistem za upravljanje obukama i sertifikatima u regionu.
                </p>
                <div className="flex gap-4">
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10">
                    <Globe className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10">
                    <Mail className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10">
                    <Phone className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-lg mb-6">Proizvod</h3>
                <ul className="space-y-3">
                  <li><Link href="#features" className="text-gray-400 hover:text-white transition-colors duration-300">Funkcije</Link></li>
                  <li><Link href="/login" className="text-gray-400 hover:text-white transition-colors duration-300">Prijava</Link></li>
                  <li><Link href="#" className="text-gray-400 hover:text-white transition-colors duration-300">Cenovnik</Link></li>
                  <li><Link href="#" className="text-gray-400 hover:text-white transition-colors duration-300">FAQ</Link></li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-lg mb-6">Kompanija</h3>
                <ul className="space-y-3">
                  <li><Link href="#about" className="text-gray-400 hover:text-white transition-colors duration-300">O nama</Link></li>
                  <li><Link href="#" className="text-gray-400 hover:text-white transition-colors duration-300">Blog</Link></li>
                  <li><Link href="#" className="text-gray-400 hover:text-white transition-colors duration-300">Karijera</Link></li>
                  <li><Link href="#contact" className="text-gray-400 hover:text-white transition-colors duration-300">Kontakt</Link></li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-lg mb-6">Newsletter</h3>
                <p className="text-gray-400 mb-4">Prijavite se na naš newsletter i dobijajte najnovije vesti</p>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Vaš email" 
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-cyan-400 focus:ring-cyan-400 rounded-xl"
                  />
                  <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white border-0 rounded-xl">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="mt-12 border-t border-white/10 pt-8 text-center">
              <p className="text-gray-400">© {new Date().getFullYear()} TrainingPro. Sva prava zadržana.</p>
              <p className="text-gray-500 text-sm mt-2">Sistem za upravljanje obukama i sertifikatima zaposlenih</p>
            </div>
          </div>
        </footer>
      </main>
    </>
  )
}