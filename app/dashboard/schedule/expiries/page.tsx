"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  AlertTriangle,
  Calendar,
  User,
  FileText,
  Clock,
  Filter,
  Search,
  RefreshCw,
  Download,
  Eye,
  Users,
  Building,
  CheckCircle,
  ChevronRight,
  Bell,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

interface Isteksertifikata {
  certificate_id: string;
  certificate_number: string;
  issue_date: string;
  expiry_date: string;
  days_until_expiry: number;
  recommended_training_date: string;
  planning_window_start: string;

  staff_id: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  email: string | null;
  position_id: string | null;

  training_master_id: string | null;
  training_title: string | null;
  training_code: string | null;

  training_type_id: string | null;
  training_type_name: string | null;
  training_type_code: string | null;
  training_type_category: string | null;
  hours_recurrent_total: number | null;

  position_title: string | null;
  department: string | null;

  has_scheduled_training: boolean;
}

export default function StranicaIstekasertifikata() {
  const { toast } = useToast();
  const supabase = getSupabaseBrowserClient();

  const [istek, setIstek] = useState<Isteksertifikata[]>([]);
  const [filtriraniIstek, setFiltriraniIstek] = useState<Isteksertifikata[]>([]);
  const [učitavanje, setUčitavanje] = useState(true);

  // Filter stanja
  const [terminPretrage, setTerminPretrage] = useState("");
  const [filterKategorije, setFilterKategorije] = useState("sve");
  const [filterOdjeljenja, setFilterOdjeljenja] = useState("sva");
  const [filterVremenskogOkvira, setFilterVremenskogOkvira] = useState("90"); // dana

  // Statistike
  const [statistike, setStatistike] = useState({
    ukupno: 0,
    hitno: 0, // < 30 dana
    nadolazeće: 0, // 30-90 dana
    budućnost: 0, // > 90 dana
    poKategorijama: {} as Record<string, number>,
    poOdjeljenjima: {} as Record<string, number>,
  });

  // Učitaj podatke
  useEffect(() => {
    async function učitajPodatke() {
      try {
        setUčitavanje(true);

        const { data, error } = await supabase
          .from("certificate_expiry_detailed_view")
          .select("*")
          .order("expiry_date", { ascending: true });

        if (error) throw error;

        setIstek(data || []);
        izračunajStatistike(data || []);
      } catch (error: any) {
        console.error("Greška pri učitavanju isteka sertifikata:", error);
        toast({
          title: "Greška",
          description: "Došlo je do greške pri učitavanju podataka",
          variant: "destructive",
        });
      } finally {
        setUčitavanje(false);
      }
    }

    učitajPodatke();
  }, [supabase, toast]);

  // Izračunaj statistike
  const izračunajStatistike = (podaci: Isteksertifikata[]) => {
    const podaciStatistike = {
      ukupno: podaci.length,
      hitno: podaci.filter((d) => d.days_until_expiry <= 30 && d.days_until_expiry > 0).length,
      nadolazeće: podaci.filter((d) => d.days_until_expiry > 30 && d.days_until_expiry <= 90).length,
      budućnost: podaci.filter((d) => d.days_until_expiry > 90).length,
      poKategorijama: {} as Record<string, number>,
      poOdjeljenjima: {} as Record<string, number>,
    };

    // Po kategorijama
    podaci.forEach((stavka) => {
      const kategorija = stavka.training_type_category || "Nepoznato";
      podaciStatistike.poKategorijama[kategorija] = (podaciStatistike.poKategorijama[kategorija] || 0) + 1;

      const odjeljenje = stavka.department || "Nepoznato";
      podaciStatistike.poOdjeljenjima[odjeljenje] = (podaciStatistike.poOdjeljenjima[odjeljenje] || 0) + 1;
    });

    setStatistike(podaciStatistike);
  };

  // Filtriraj podatke
  useEffect(() => {
    let filtrirano = [...istek];

    // Filter po vremenskom okviru
    if (filterVremenskogOkvira !== "sve") {
      const dana = parseInt(filterVremenskogOkvira);
      if (dana === 30) {
        filtrirano = filtrirano.filter((d) => d.days_until_expiry <= 30 && d.days_until_expiry > 0);
      } else if (dana === 90) {
        filtrirano = filtrirano.filter((d) => d.days_until_expiry <= 90 && d.days_until_expiry > 30);
      } else if (dana === 180) {
        filtrirano = filtrirano.filter((d) => d.days_until_expiry > 90);
      }
    }

    // Filter po kategoriji
    if (filterKategorije !== "sve") {
      filtrirano = filtrirano.filter((d) => d.training_type_category === filterKategorije);
    }

    // Filter po odjeljenju
    if (filterOdjeljenja !== "sva") {
      filtrirano = filtrirano.filter((d) => d.department === filterOdjeljenja);
    }

    // Pretraga
    if (terminPretrage) {
      const termin = terminPretrage.toLowerCase();
      filtrirano = filtrirano.filter(
        (d) =>
          d.certificate_number.toLowerCase().includes(termin) ||
          d.first_name.toLowerCase().includes(termin) ||
          d.last_name.toLowerCase().includes(termin) ||
          d.employee_number.toLowerCase().includes(termin) ||
          (d.training_title && d.training_title.toLowerCase().includes(termin)) ||
          (d.training_type_name && d.training_type_name.toLowerCase().includes(termin))
      );
    }

    setFiltriraniIstek(filtrirano);
  }, [istek, terminPretrage, filterKategorije, filterOdjeljenja, filterVremenskogOkvira]);

  // Funkcija za export CSV
  const rukujIzveziCSV = () => {
    const zaglavlja = [
      "Broj sertifikata",
      "Zaposleni",
      "Broj zaposlenog",
      "Email",
      "Trening",
      "Kategorija",
      "Odjeljenje",
      "Datum izdavanja",
      "Datum isteka",
      "Dana do isteka",
      "Preporučeni datum treninga",
      "Već zakazano",
    ];

    const csvPodaci = filtriraniIstek.map((stavka) => [
      stavka.certificate_number,
      `${stavka.first_name} ${stavka.last_name}`,
      stavka.employee_number,
      stavka.email || "",
      stavka.training_title || stavka.training_type_name || "Nepoznato",
      stavka.training_type_category || "Nepoznato",
      stavka.department || "Nepoznato",
      new Date(stavka.issue_date).toLocaleDateString("sr-RS"),
      new Date(stavka.expiry_date).toLocaleDateString("sr-RS"),
      stavka.days_until_expiry,
      stavka.recommended_training_date
        ? new Date(stavka.recommended_training_date).toLocaleDateString("sr-RS")
        : "",
      stavka.has_scheduled_training ? "Da" : "Ne",
    ]);

    const csvSadržaj = [
      zaglavlja.join(","),
      ...csvPodaci.map((red) => red.map((ćelija) => `"${ćelija}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvSadržaj], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `istek_sertifikata_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper funkcije
  const dobijOznakuHitnosti = (dani: number) => {
    if (dani <= 0) {
      return (
        <div className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800 border border-red-200">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Istekao
        </div>
      );
    } else if (dani <= 7) {
      return (
        <div className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800 border border-red-200 animate-pulse">
          <AlertTriangle className="h-3 w-3 mr-1" />
          HITNO ({dani} dana)
        </div>
      );
    } else if (dani <= 30) {
      return (
        <div className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800 border border-amber-200">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Uskoro ({dani} dana)
        </div>
      );
    } else if (dani <= 90) {
      return (
        <div className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800 border border-blue-200">
          <Clock className="h-3 w-3 mr-1" />
          U naredna 3 mjeseca ({dani} dana)
        </div>
      );
    } else {
      return (
        <div className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800 border border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          U budućnosti ({dani} dana)
        </div>
      );
    }
  };

  // Funkcija za određivanje CSS klase za datum isteka
  const dobijKlaseDatumaIsteka = (daniDoIsteka: number) => {
    if (daniDoIsteka < 0) {
      // Istekao
      return "bg-red-100 text-red-800 border-red-200";
    } else if (daniDoIsteka <= 30) {
      // Ističe u narednih 30 dana
      return "bg-amber-100 text-amber-800 border-amber-200";
    } else if (daniDoIsteka <= 90) {
      // Ističe u naredna 3 mjeseca
      return "bg-blue-100 text-blue-800 border-blue-200";
    } else {
      // Više od 90 dana
      return "bg-green-100 text-green-800 border-green-200";
    }
  };

  // Funkcija za boju teksta preostalih dana
  const dobijKlasuPreostalihDana = (dani: number) => {
    if (dani <= 0) {
      return "text-red-700 font-bold";
    } else if (dani <= 7) {
      return "text-red-600 font-bold animate-pulse";
    } else if (dani <= 30) {
      return "text-amber-600 font-semibold";
    } else if (dani <= 90) {
      return "text-blue-600";
    } else {
      return "text-green-600";
    }
  };

  if (učitavanje) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-2 text-muted-foreground">Učitavanje podataka o isteku sertifikata...</p>
        </div>
      </div>
    );
  }

  // Dobij jedinstvene kategorije i odjeljenja za filter
  const kategorije = Array.from(
    new Set(istek.map((e) => e.training_type_category).filter(Boolean) as string[])
  ).sort();

  const odjeljenja = Array.from(new Set(istek.map((e) => e.department).filter(Boolean) as string[])).sort();

  return (
    <div className="space-y-6">
      {/* Zaglavlje */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/schedule">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Pregled Isteka Sertifikata</h1>
            <p className="text-muted-foreground">Automatsko planiranje treninga na osnovu isteka sertifikata</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={rukujIzveziCSV} className="gap-2">
            <Download className="h-4 w-4" />
            Izvezi CSV
          </Button>
          <Link href="/dashboard/schedule/generate?source=certificates">
            <Button className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Generiši Raspored
            </Button>
          </Link>
        </div>
      </div>

      {/* Filteri */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pretraži sertifikate..."
                value={terminPretrage}
                onChange={(e) => setTerminPretrage(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={filterVremenskogOkvira} onValueChange={setFilterVremenskogOkvira}>
              <SelectTrigger>
                <SelectValue placeholder="Vremenski okvir" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sve">Svi periodi</SelectItem>
                <SelectItem value="30">Hitno (&lt;30 dana)</SelectItem>
                <SelectItem value="90">U naredna 3 mjeseca</SelectItem>
                <SelectItem value="180">U budućnosti (&gt;90 dana)</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterKategorije} onValueChange={setFilterKategorije}>
              <SelectTrigger>
                <SelectValue placeholder="Kategorija treninga" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sve">Sve kategorije</SelectItem>
                {kategorije.map((kat) => (
                  <SelectItem key={kat} value={kat}>
                    {kat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterOdjeljenja} onValueChange={setFilterOdjeljenja}>
              <SelectTrigger>
                <SelectValue placeholder="Odjeljenje" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sva">Sva odjeljenja</SelectItem>
                {odjeljenja.map((odjeljenje) => (
                  <SelectItem key={odjeljenje} value={odjeljenje}>
                    {odjeljenje}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-2">
            <div className="text-sm text-muted-foreground">
              Prikazano: {filtriraniIstek.length} od {statistike.ukupno} sertifikata
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setTerminPretrage("");
                setFilterKategorije("sve");
                setFilterOdjeljenja("sva");
                setFilterVremenskogOkvira("90");
              }}
              className="gap-2"
            >
              <Filter className="h-3 w-3" />
              Resetuj filtere
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistike */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Ukupno sertifikata</p>
                <p className="text-2xl font-bold text-blue-900">{statistike.ukupno}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700">Hitno ističe</p>
                <p className="text-2xl font-bold text-red-900">{statistike.hitno}</p>
                <p className="text-xs text-red-600">&lt;30 dana</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-700">U naredna 3 mjeseca</p>
                <p className="text-2xl font-bold text-amber-900">{statistike.nadolazeće}</p>
                <p className="text-xs text-amber-600">30-90 dana</p>
              </div>
              <Calendar className="h-8 w-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">U budućnosti</p>
                <p className="text-2xl font-bold text-green-900">{statistike.budućnost}</p>
                <p className="text-xs text-green-600">&gt;90 dana</p>
              </div>
              <Clock className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Legenda statusa */}
      <Card className="bg-gray-50">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="font-medium text-gray-700">Legenda statusa:</span>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full px-3 py-1 bg-red-100 text-red-800 border border-red-200 text-xs font-medium">
                <AlertTriangle className="h-3 w-3 mr-1" />
                HITNO
              </span>
              <span className="text-gray-600">→ Ističe za 7 dana</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full px-3 py-1 bg-amber-100 text-amber-800 border border-amber-200 text-xs font-medium">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Uskoro
              </span>
              <span className="text-gray-600">→ Ističe za 30 dana</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full px-3 py-1 bg-blue-100 text-blue-800 border border-blue-200 text-xs font-medium">
                <Clock className="h-3 w-3 mr-1" />
                Naredna 3 mjeseca
              </span>
              <span className="text-gray-600">→ Ističe za 90 dana</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full px-3 py-1 bg-green-100 text-green-800 border border-green-200 text-xs font-medium">
                <CheckCircle className="h-3 w-3 mr-1" />
                U budućnosti
              </span>
              <span className="text-gray-600">→ Više od 90 dana</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Tabs defaultValue="tabela">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tabela" className="gap-2">
            <FileText className="h-4 w-4" />
            Tabelarni pregled
          </TabsTrigger>
          <TabsTrigger value="analiza" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Analiza po grupama
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tabela">
          <Card>
            <CardHeader>
              <CardTitle>Detaljan pregled isteka sertifikata</CardTitle>
              <CardDescription>Svi sertifikati čija validnost ističe, sortirani po hitnosti</CardDescription>
            </CardHeader>
            <CardContent>
              {filtriraniIstek.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                  <p className="text-muted-foreground mb-4">Nema sertifikata koji odgovaraju filterima</p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setTerminPretrage("");
                      setFilterKategorije("sve");
                      setFilterOdjeljenja("sva");
                      setFilterVremenskogOkvira("sve");
                    }}
                    className="gap-2"
                  >
                    <Filter className="h-4 w-4" />
                    Poništi filtere
                  </Button>
                </div>
              ) : (
                <div className="rounded-lg border overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow>
                          <TableHead className="font-semibold text-gray-700">Zaposleni</TableHead>
                          <TableHead className="font-semibold text-gray-700">Trening / Sertifikat</TableHead>
                          <TableHead className="font-semibold text-gray-700">Kategorija</TableHead>
                          <TableHead className="font-semibold text-gray-700">Odjeljenje</TableHead>
                          <TableHead className="font-semibold text-gray-700">Datum isteka</TableHead>
                          <TableHead className="font-semibold text-gray-700">Status</TableHead>
                          <TableHead className="font-semibold text-gray-700">Preporučeni datum treninga</TableHead>
                          <TableHead className="font-semibold text-gray-700">Već zakazano</TableHead>
                          <TableHead className="font-semibold text-gray-700 text-right">Akcije</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filtriraniIstek.map((stavka) => (
                          <TableRow key={stavka.certificate_id} className="hover:bg-gray-50 transition-colors">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                  <User className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                  <div className="font-medium">
                                    {stavka.first_name} {stavka.last_name}
                                  </div>
                                  <div className="text-sm text-muted-foreground">{stavka.employee_number}</div>
                                  {stavka.email && (
                                    <div className="text-xs text-blue-600 truncate max-w-[150px]">
                                      {stavka.email}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TableCell>

                            <TableCell>
                              <div className="font-medium">
                                {stavka.training_title || stavka.training_type_name || "Opšti sertifikat"}
                              </div>
                              <div className="text-sm text-muted-foreground flex items-center gap-2">
                                <span className="font-mono">{stavka.certificate_number}</span>
                                {stavka.training_type_code && (
                                  <Badge variant="outline" className="text-xs">
                                    {stavka.training_type_code}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>

                            <TableCell>
                              <Badge
                                variant="outline"
                                className="capitalize bg-gray-100 text-gray-800 border-gray-200"
                              >
                                {stavka.training_type_category || "Nepoznato"}
                              </Badge>
                            </TableCell>

                            <TableCell>
                              <div className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                                {stavka.department || "Nepoznato"}
                              </div>
                            </TableCell>

                            <TableCell>
                              <div
                                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm ${dobijKlaseDatumaIsteka(
                                  stavka.days_until_expiry
                                )}`}
                              >
                                <Calendar className="h-3 w-3" />
                                <span>{new Date(stavka.expiry_date).toLocaleDateString("sr-RS")}</span>
                              </div>
                            </TableCell>

                            <TableCell>{dobijOznakuHitnosti(stavka.days_until_expiry)}</TableCell>

                            <TableCell>
                              {stavka.recommended_training_date ? (
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-green-600" />
                                  <div>
                                    <span>{new Date(stavka.recommended_training_date).toLocaleDateString("sr-RS")}</span>
                                    <div className="text-xs text-muted-foreground">(30 dana prije isteka)</div>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">N/A</span>
                              )}
                            </TableCell>

                            <TableCell>
                              {stavka.has_scheduled_training ? (
                                <div className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800 border border-green-200">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Da
                                </div>
                              ) : (
                                <div className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-800 border border-gray-200">
                                  Ne
                                </div>
                              )}
                            </TableCell>

                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Link href={`/dashboard/certificates/${stavka.certificate_id}`}>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-blue-50">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </Link>
                                <Link href={`/dashboard/employees/${stavka.staff_id}`}>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100">
                                    <User className="h-4 w-4" />
                                  </Button>
                                </Link>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analiza">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Analiza po kategorijama */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Po kategorijama treninga
                </CardTitle>
                <CardDescription>Raspodjela isteka po vrstama treninga</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(statistike.poKategorijama).map(([kategorija, broj]) => {
                    const podaciKategorije = istek.filter((e) => e.training_type_category === kategorija);
                    const hitno = podaciKategorije.filter((e) => e.days_until_expiry <= 30).length;
                    const nadolazeće = podaciKategorije.filter((e) => e.days_until_expiry > 30 && e.days_until_expiry <= 90)
                      .length;

                    return (
                      <div key={kategorija} className="p-4 border rounded-lg space-y-3 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{kategorija}</span>
                          <Badge
                            variant="outline"
                            className="bg-blue-50 text-blue-700 border-blue-200 font-semibold"
                          >
                            {broj}
                          </Badge>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-red-500"></div>
                              <span className="text-muted-foreground">Hitno:</span>
                            </div>
                            <span className="font-medium text-red-600">{hitno}</span>
                          </div>
                          <div className="flex justify-between">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                              <span className="text-muted-foreground">U naredna 3 mjeseca:</span>
                            </div>
                            <span className="font-medium text-amber-600">{nadolazeće}</span>
                          </div>
                          <div className="flex justify-between">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-green-500"></div>
                              <span className="text-muted-foreground">Potrebne grupe (po 15):</span>
                            </div>
                            <span className="font-medium text-green-600">{Math.ceil(broj / 15)}</span>
                          </div>
                        </div>

                        <div className="pt-2">
                          <Link
                            href={`/dashboard/schedule/generate?category=${encodeURIComponent(kategorija)}`}
                            className="text-sm text-primary hover:underline flex items-center gap-1"
                          >
                            <RefreshCw className="h-3 w-3" />
                            Generiši raspored za ovu kategoriju
                            <ChevronRight className="h-3 w-3" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Analiza po odjeljenjima */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Po odjeljenjima
                </CardTitle>
                <CardDescription>Raspodjela isteka po organizacionim jedinicama</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(statistike.poOdjeljenjima).map(([odjeljenje, broj]) => {
                    const podaciOdjeljenja = istek.filter((e) => e.department === odjeljenje);
                    const hitno = podaciOdjeljenja.filter((e) => e.days_until_expiry <= 30).length;
                    const nadolazeće = podaciOdjeljenja.filter((e) => e.days_until_expiry > 30 && e.days_until_expiry <= 90)
                      .length;

                    return (
                      <div key={odjeljenje} className="p-4 border rounded-lg space-y-3 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{odjeljenje}</span>
                          <Badge
                            variant="outline"
                            className="bg-purple-50 text-purple-700 border-purple-200 font-semibold"
                          >
                            {broj}
                          </Badge>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-red-500"></div>
                              <span className="text-muted-foreground">Hitno:</span>
                            </div>
                            <span className="font-medium text-red-600">{hitno}</span>
                          </div>
                          <div className="flex justify-between">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                              <span className="text-muted-foreground">U naredna 3 mjeseca:</span>
                            </div>
                            <span className="font-medium text-amber-600">{nadolazeće}</span>
                          </div>

                          {/* Distribucija po kategorijama */}
                          <div className="pt-2">
                            <div className="text-xs text-muted-foreground mb-1">Kategorije treninga:</div>
                            <div className="flex flex-wrap gap-1">
                              {Array.from(
                                new Set(
                                  podaciOdjeljenja
                                    .map((d) => d.training_type_category)
                                    .filter(Boolean) as string[]
                                )
                              ).map((kategorija) => (
                                <Badge
                                  key={kategorija}
                                  variant="secondary"
                                  className="text-xs bg-gray-100 text-gray-800 border-gray-200"
                                >
                                  {kategorija}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="pt-2">
                          <Link
                            href={`/dashboard/schedule/generate?department=${encodeURIComponent(odjeljenje)}`}
                            className="text-sm text-primary hover:underline flex items-center gap-1"
                          >
                            <RefreshCw className="h-3 w-3" />
                            Generiši raspored za ovo odjeljenje
                            <ChevronRight className="h-3 w-3" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Preporuke za akciju */}
      {statistike.hitno > 0 && (
        <Card className="border-red-200 bg-gradient-to-br from-red-50 to-red-100">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="h-8 w-8 text-red-600 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-800 text-lg mb-2">Hitna akcija potrebna!</h3>
                <p className="text-red-700 mb-4">
                  {statistike.hitno} sertifikata ističe u narednih 30 dana. Preporučujemo hitno generisanje rasporeda
                  za ove treninge.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link href="/dashboard/schedule/generate?timeframe=30">
                    <Button variant="destructive" className="gap-2">
                      <RefreshCw className="h-4 w-4" />
                      Generiši hitni raspored
                    </Button>
                  </Link>
                  <Link href="/dashboard/training-expiry">
                    <Button variant="outline" className="gap-2 border-red-300 text-red-700 hover:bg-red-50">
                      <Bell className="h-4 w-4" />
                      Pregled isteka
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}