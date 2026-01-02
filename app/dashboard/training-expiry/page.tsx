"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Calendar,
  Mail,
  User,
  Clock,
  AlertTriangle,
  CheckCircle,
  Send,
  RefreshCw,
  Download,
  ExternalLink,
  Filter,
  Search,
  FileText,
  ChevronRight,
  Bell,
} from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

// Definisanje tipova
interface ZapisCertifikata {
  id: string;
  certificate_number: string;
  issue_date: string;
  expiry_date: string;
  completion_date: string | null;
  status: string;
  grade: string | null;
  notes: string | null;
  instructor_name: string | null;
  training_provider: string | null;
  issued_by: string | null;
  staff: {
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
    employee_number: string;
    phone: string | null;
    status: string;
    working_positions?: {
      title: string | null;
      department: string | null;
    } | null;
  };
  training_certificates_master: {
    id: string;
    title: string;
    code: string;
    validity_months: number | null;
    description: string | null;
    training_provider: string | null;
  } | null;
}

interface StatistikeIsteka {
  ukupno: number;
  istekli: number;
  upozorenje30: number;
  upozorenje7: number;
  važeći: number;
  danas: number;
  ovaSedmica: number;
  ovajMjesec: number;
}

export default function StranicaIstekaTreninga() {
  const { toast } = useToast();
  const [certifikati, setCertifikati] = useState<ZapisCertifikata[]>([]);
  const [učitavanje, setUčitavanje] = useState(true);
  const [slanje, setSlanje] = useState(false);
  const [pretraga, setPretraga] = useState("");
  const [filterDana, setFilterDana] = useState<"7" | "30" | "90" | "svi">("30");
  const [filterStatusa, setFilterStatusa] = useState<"svi" | "istekli" | "upozorenje" | "važeći">("svi");
  const [statistike, setStatistike] = useState<StatistikeIsteka>({
    ukupno: 0,
    istekli: 0,
    upozorenje30: 0,
    upozorenje7: 0,
    važeći: 0,
    danas: 0,
    ovaSedmica: 0,
    ovajMjesec: 0,
  });

  const supabase = getSupabaseBrowserClient();

  const učitajPodatke = async () => {
    try {
      setUčitavanje(true);

      // Učitaj sve certifikate koji imaju datum isteka
      const { data, error } = await supabase
        .from("training_certificate_records")
        .select(
          `
          *,
          staff:staff_id (
            id,
            first_name,
            last_name,
            email,
            employee_number,
            phone,
            status,
            working_positions:position_id (
              title,
              department
            )
          ),
          training_certificates_master:training_master_id (
            id,
            title,
            code,
            validity_months,
            description,
            training_provider
          )
        `
        )
        .not("expiry_date", "is", null) // Samo oni koji imaju datum isteka
        .order("expiry_date", { ascending: true });

      if (error) throw error;

      if (data) {
        // Obrađujemo podatke i dodajemo status
        const danas = new Date();
        const obrađeniCertifikati = data.map((cert) => {
          if (!cert.expiry_date) return { ...cert, status: "nepoznato" };

          const datumIsteka = new Date(cert.expiry_date);
          const razlikaUDanima = Math.ceil(
            (datumIsteka.getTime() - danas.getTime()) / (1000 * 60 * 60 * 24)
          );

          let status = "važeći";
          if (razlikaUDanima < 0) {
            status = "istekli";
          } else if (razlikaUDanima <= 7) {
            status = "upozorenje7";
          } else if (razlikaUDanima <= 30) {
            status = "upozorenje30";
          }

          return { ...cert, status };
        });

        setCertifikati(obrađeniCertifikati);

        // Izračunaj statistike
        const datumDanas = danas.toISOString().split("T")[0];
        const sedamDanaOdSad = new Date();
        sedamDanaOdSad.setDate(danas.getDate() + 7);
        const datumSedamDana = sedamDanaOdSad.toISOString().split("T")[0];
        const tridesetDanaOdSad = new Date();
        tridesetDanaOdSad.setDate(danas.getDate() + 30);
        const datumTridesetDana = tridesetDanaOdSad.toISOString().split("T")[0];

        const podaciStatistike: StatistikeIsteka = {
          ukupno: data.length,
          istekli: obrađeniCertifikati.filter((t) => t.status === "istekli").length,
          upozorenje30: obrađeniCertifikati.filter((t) => t.status === "upozorenje30").length,
          upozorenje7: obrađeniCertifikati.filter((t) => t.status === "upozorenje7").length,
          važeći: obrađeniCertifikati.filter((t) => t.status === "važeći").length,
          danas: data.filter((t) => t.expiry_date === datumDanas).length,
          ovaSedmica: data.filter(
            (t) => t.expiry_date && t.expiry_date >= datumDanas && t.expiry_date <= datumSedamDana
          ).length,
          ovajMjesec: data.filter(
            (t) => t.expiry_date && t.expiry_date >= datumDanas && t.expiry_date <= datumTridesetDana
          ).length,
        };

        setStatistike(podaciStatistike);
      }
    } catch (error) {
      console.error("Greška pri učitavanju podataka:", error);
      toast({
        title: "Greška",
        description: "Došlo je do greške pri učitavanju podataka",
        variant: "destructive",
      });
    } finally {
      setUčitavanje(false);
    }
  };

  useEffect(() => {
    učitajPodatke();
  }, []);

  const rukujSlanjePodsetnika = async () => {
    setSlanje(true);
    try {
      // Pronađi certifikate koji ističu u narednih 30 dana
      const certifikatiZaNotifikaciju = certifikati.filter((cert) => {
        if (!cert.expiry_date || !cert.staff.email) return false;

        const dana = dobijPreostalihDana(cert.expiry_date);
        return dana >= 0 && dana <= 30;
      });

      let brojPoslatih = 0;
      const neuspeliEmailovi: string[] = [];

      // Simulacija slanja email-a
      for (const cert of certifikatiZaNotifikaciju) {
        try {
          const preostalihDana = dobijPreostalihDana(cert.expiry_date);
          const nazivTreninga = cert.training_certificates_master?.title || "Certifikat";
          const formatiranDatumIsteka = formatDate(cert.expiry_date);

          console.log(`Slanje email-a na ${cert.staff.email}:`);
          console.log(`- Naslov: Podsetnik: ${nazivTreninga} ističe za ${preostalihDana} dana`);
          console.log(`- Ističe: ${formatiranDatumIsteka}`);

          // Ovde bi bio pravi Resend API poziv
          brojPoslatih++;

          await new Promise((resolve) => setTimeout(resolve, 50));
        } catch (err) {
          console.error(`Neuspješno slanje email-a na ${cert.staff.email}:`, err);
          neuspeliEmailovi.push(cert.staff.email || "Nepoznat email");
        }
      }

      toast({
        title: "Podsetnici poslati",
        description: `Simulacija: Poslano bi ${brojPoslatih} email podsetnika. Neuspeli: ${neuspeliEmailovi.length}`,
      });

      await učitajPodatke();
    } catch (error) {
      console.error("Greška pri slanju podsetnika:", error);
      toast({
        title: "Greška",
        description: "Došlo je do greške pri slanju podsetnika",
        variant: "destructive",
      });
    } finally {
      setSlanje(false);
    }
  };

  const rukujIzveziUExcel = () => {
    try {
      // Kreiraj CSV podatke
      const zaglavlja = [
        "Ime",
        "Prezime",
        "Broj zaposlenog",
        "Email",
        "Trening",
        "Šifra treninga",
        "Broj certifikata",
        "Datum izdavanja",
        "Datum isteka",
        "Dana preostalo",
        "Status",
        "Instruktor",
        "Izdato od",
      ];

      const csvPodaci = certifikati.map((cert) => {
        const preostalihDana = dobijPreostalihDana(cert.expiry_date);
        const tekstStatusa = dobijTekstStatusa(cert.status, cert.expiry_date);

        return [
          cert.staff.first_name,
          cert.staff.last_name,
          cert.staff.employee_number,
          cert.staff.email || "",
          cert.training_certificates_master?.title || "Opšti certifikat",
          cert.training_certificates_master?.code || "OPŠTI-CERT",
          cert.certificate_number,
          formatDate(cert.issue_date),
          formatDate(cert.expiry_date),
          preostalihDana.toString(),
          tekstStatusa,
          cert.instructor_name || "",
          cert.issued_by || "",
        ];
      });

      const csvSadržaj = [
        zaglavlja.join(","),
        ...csvPodaci.map((red) => red.map((ćelija) => `"${ćelija}"`).join(",")),
      ].join("\n");

      const blob = new Blob([csvSadržaj], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `istek_treninga_${new Date().toISOString().split("T")[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Uspešno",
        description: "Podaci su izveženi u CSV format",
      });
    } catch (error) {
      console.error("Greška pri izvozu u CSV:", error);
      toast({
        title: "Greška",
        description: "Došlo je do greške pri izvozu podataka",
        variant: "destructive",
      });
    }
  };

  const dobijPreostalihDana = (datumIsteka: string | null) => {
    if (!datumIsteka) return 999;

    const danas = new Date();
    const istek = new Date(datumIsteka);
    const razlika = istek.getTime() - danas.getTime();
    return Math.ceil(razlika / (1000 * 60 * 60 * 24));
  };

  const dobijTekstStatusa = (status: string, datumIsteka: string | null) => {
    const dana = dobijPreostalihDana(datumIsteka);

    if (status === "istekli" || dana < 0) {
      return "ISTEKLO";
    } else if (dana <= 7) {
      return `ISTIČE ZA ${dana} DANA`;
    } else if (dana <= 30) {
      return `UPOZORENJE (${dana}d)`;
    } else {
      return `VAŽEĆE (${dana}d)`;
    }
  };

  const dobijOznakuStatusa = (status: string, datumIsteka: string | null) => {
    const dana = dobijPreostalihDana(datumIsteka);

    if (status === "istekli" || dana < 0) {
      return (
        <div className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800 border border-red-200">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Isteklo
        </div>
      );
    } else if (dana <= 7) {
      return (
        <div className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800 border border-red-200 animate-pulse">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Ističe za {dana}d
        </div>
      );
    } else if (dana <= 30) {
      return (
        <div className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800 border border-amber-200">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Ističe za {dana}d
        </div>
      );
    } else {
      return (
        <div className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800 border border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Važeće ({dana}d)
        </div>
      );
    }
  };

  // Funkcija za određivanje CSS klase za datum isteka
  const dobijKlaseDatumaIsteka = (datumIsteka: string | null) => {
    if (!datumIsteka) {
      return "bg-gray-100 text-gray-800 border-gray-200";
    }

    const dana = dobijPreostalihDana(datumIsteka);

    if (dana < 0) {
      // Istekao
      return "bg-red-100 text-red-800 border-red-200 font-bold";
    } else if (dana <= 30) {
      // Ističe u narednih 30 dana
      return "bg-amber-100 text-amber-800 border-amber-200 font-semibold";
    } else {
      // Više od 30 dana
      return "bg-green-100 text-green-800 border-green-200";
    }
  };

  // Filtriranje podataka
  const filtriraniCertifikati = certifikati.filter((cert) => {
    // Pretraga
    const pretragaMala = pretraga.toLowerCase();
    const odgovaraPretrazi =
      pretraga === "" ||
      cert.staff.first_name.toLowerCase().includes(pretragaMala) ||
      cert.staff.last_name.toLowerCase().includes(pretragaMala) ||
      cert.staff.employee_number.toLowerCase().includes(pretragaMala) ||
      cert.training_certificates_master?.title?.toLowerCase().includes(pretragaMala) ||
      cert.training_certificates_master?.code?.toLowerCase().includes(pretragaMala) ||
      cert.certificate_number.toLowerCase().includes(pretragaMala);

    // Filter po statusu
    const odgovaraStatusu =
      filterStatusa === "svi" ||
      (filterStatusa === "istekli" && cert.status === "istekli") ||
      (filterStatusa === "upozorenje" && (cert.status === "upozorenje7" || cert.status === "upozorenje30")) ||
      (filterStatusa === "važeći" && cert.status === "važeći");

    // Filter po danima
    const preostalihDana = dobijPreostalihDana(cert.expiry_date);
    const odgovaraDanima =
      filterDana === "svi"
        ? true
        : filterDana === "7"
        ? preostalihDana >= 0 && preostalihDana <= 7
        : filterDana === "30"
        ? preostalihDana >= 0 && preostalihDana <= 30
        : filterDana === "90"
        ? preostalihDana >= 0 && preostalihDana <= 90
        : true;

    return odgovaraPretrazi && odgovaraStatusu && odgovaraDanima;
  });

  if (učitavanje) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-2 text-muted-foreground">Učitavanje podataka o isteku treninga...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Zaglavlje */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Istek Treninga</h1>
          <p className="text-muted-foreground">Praćenje isteka certifikata zaposlenih</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={rukujSlanjePodsetnika}
            disabled={slanje || filtriraniCertifikati.length === 0}
            className="gap-2"
          >
            {slanje ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Pošalji Podsetnike
          </Button>
          <Button
            onClick={rukujIzveziUExcel}
            variant="outline"
            className="gap-2"
            disabled={filtriraniCertifikati.length === 0}
          >
            <Download className="h-4 w-4" />
            Izvezi CSV
          </Button>
          <Button onClick={učitajPodatke} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Osveži
          </Button>
        </div>
      </div>

      {/* Brzi pregled */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Ukupno certifikata</p>
                <p className="text-2xl font-bold text-blue-900">{statistike.ukupno}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Važeći certifikati</p>
                <p className="text-2xl font-bold text-green-900">{statistike.važeći}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-700">Ističe za 30 dana</p>
                <p className="text-2xl font-bold text-amber-900">{statistike.upozorenje30}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700">Istekli certifikati</p>
                <p className="text-2xl font-bold text-red-900">{statistike.istekli}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detaljne statistike */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Ističe danas</p>
                  <p className="text-2xl font-bold text-orange-600">{statistike.danas}</p>
                </div>
                <Calendar className="h-8 w-8 text-orange-500" />
              </div>
              <div className="text-sm text-muted-foreground">Certifikata čiji datum isteka je danas</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Ističe za 7 dana</p>
                  <p className="text-2xl font-bold text-red-600">{statistike.ovaSedmica}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
              <div className="text-sm text-muted-foreground">Hitno obnoviti</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Ističe za 30 dana</p>
                  <p className="text-2xl font-bold text-amber-600">{statistike.ovajMjesec}</p>
                </div>
                <Bell className="h-8 w-8 text-amber-500" />
              </div>
              <div className="text-sm text-muted-foreground">Zahtijeva pažnju</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filteri i pretraga */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pretraga" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Pretraga
              </Label>
              <Input
                id="pretraga"
                placeholder="Ime, prezime, broj zaposlenog, trening..."
                value={pretraga}
                onChange={(e) => setPretraga(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-dana" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Vremenski period
              </Label>
              <select
                id="filter-dana"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={filterDana}
                onChange={(e) => setFilterDana(e.target.value as any)}
              >
                <option value="7">Ističe za 7 dana</option>
                <option value="30">Ističe za 30 dana</option>
                <option value="90">Ističe za 90 dana</option>
                <option value="svi">Svi rokovi</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-statusa" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Status
              </Label>
              <select
                id="filter-statusa"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={filterStatusa}
                onChange={(e) => setFilterStatusa(e.target.value as any)}
              >
                <option value="svi">Svi statusi</option>
                <option value="važeći">Važeći</option>
                <option value="upozorenje">Upozorenje (7-30 dana)</option>
                <option value="istekli">Istekli</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 opacity-0">Akcije</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setPretraga("");
                    setFilterDana("30");
                    setFilterStatusa("svi");
                  }}
                  className="flex-1"
                >
                  Resetuj
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legenda statusa */}
      <Card className="bg-gray-50">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="font-medium text-gray-700">Legenda statusa:</span>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full px-3 py-1 bg-green-100 text-green-800 border border-green-200 text-xs font-medium">
                <CheckCircle className="h-3 w-3 mr-1" />
                Važeće
              </span>
              <span className="text-gray-600">→ Više od 30 dana do isteka</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full px-3 py-1 bg-amber-100 text-amber-800 border border-amber-200 text-xs font-medium">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Ističe uskoro
              </span>
              <span className="text-gray-600">→ Ističe u narednih 30 dana</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full px-3 py-1 bg-red-100 text-red-800 border border-red-200 text-xs font-medium">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Isteklo
              </span>
              <span className="text-gray-600">→ Datum je prošao</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Glavna tabela */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Lista Certifikata</CardTitle>
              <CardDescription>
                {filtriraniCertifikati.length} certifikata pronađeno
                {filterDana !== "svi" && ` (koji ističu za ${filterDana} dana)`}
              </CardDescription>
            </div>
            {filtriraniCertifikati.length > 0 && (
              <div className="text-sm text-muted-foreground">
                Poslednje ažuriranje: {new Date().toLocaleTimeString("sr-RS")}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {filtriraniCertifikati.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">
                {pretraga || filterStatusa !== "svi" || filterDana !== "svi"
                  ? "Nema pronađenih certifikata"
                  : "Nema evidentiranih certifikata"}
              </h3>
              <p className="text-muted-foreground mb-6">
                {pretraga || filterStatusa !== "svi" || filterDana !== "svi"
                  ? "Pokušajte promijeniti filtere ili pretragu"
                  : "Dodajte prvi certifikat zaposlenom"}
              </p>
              <div className="flex gap-3 justify-center">
                <Link href="/dashboard/certificates/new">
                  <Button variant="outline" className="gap-2">
                    <FileText className="h-4 w-4" />
                    Dodaj certifikat
                  </Button>
                </Link>
                <Link href="/dashboard/certificates">
                  <Button variant="ghost" className="gap-2">
                    Pregled svih certifikata
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="font-semibold text-gray-700">Zaposleni</TableHead>
                      <TableHead className="font-semibold text-gray-700">Trening</TableHead>
                      <TableHead className="font-semibold text-gray-700">Broj certifikata</TableHead>
                      <TableHead className="font-semibold text-gray-700">Datum izdavanja</TableHead>
                      <TableHead className="font-semibold text-gray-700">Datum isteka</TableHead>
                      <TableHead className="font-semibold text-gray-700">Dana preostalo</TableHead>
                      <TableHead className="font-semibold text-gray-700">Status</TableHead>
                      <TableHead className="font-semibold text-gray-700">Akcije</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtriraniCertifikati.map((cert) => {
                      const preostalihDana = dobijPreostalihDana(cert.expiry_date);
                      
                      return (
                        <TableRow key={cert.id} className="hover:bg-gray-50 transition-colors">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <User className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <div className="font-medium">
                                  {cert.staff.first_name} {cert.staff.last_name}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {cert.staff.employee_number}
                                </div>
                                {cert.staff.email && (
                                  <div className="text-xs text-blue-600 truncate max-w-[180px]">
                                    {cert.staff.email}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              {cert.training_certificates_master?.title || "Opšti certifikat"}
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                              <span className="font-mono">
                                {cert.training_certificates_master?.code || "OPŠTI-CERT"}
                              </span>
                              {cert.training_certificates_master?.validity_months && (
                                <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs">
                                  {cert.training_certificates_master.validity_months} mj.
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-mono text-sm bg-gray-50 rounded px-2 py-1 inline-block">
                              {cert.certificate_number}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <span>{formatDate(cert.issue_date)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm ${dobijKlaseDatumaIsteka(cert.expiry_date)}`}>
                              <Clock className="h-3 w-3" />
                              <span>{formatDate(cert.expiry_date)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div
                              className={`font-semibold ${
                                preostalihDana <= 7
                                  ? "text-red-600"
                                  : preostalihDana <= 30
                                  ? "text-amber-600"
                                  : "text-green-600"
                              }`}
                            >
                              {preostalihDana > 0 ? `${preostalihDana} dana` : "ISTEKLO"}
                            </div>
                          </TableCell>
                          <TableCell>{dobijOznakuStatusa(cert.status, cert.expiry_date)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {cert.staff.email && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 hover:bg-blue-50"
                                  onClick={() =>
                                    (window.location.href = `mailto:${cert.staff.email}?subject=Podsetnik: ${cert.training_certificates_master?.title || "Certifikat"} ističe za ${preostalihDana} dana&body=Poštovani ${cert.staff.first_name},%0D%0A%0D%0ACertifikat "${cert.training_certificates_master?.title || ""}" ističe ${formatDate(cert.expiry_date)}.%0D%0APreostalo dana: ${preostalihDana}%0D%0ABroj certifikata: ${cert.certificate_number}%0D%0A%0D%0AMolimo obnovite certifikat prije isteka roka.%0D%0A%0D%0APoštovanje,%0D%0ATim za treninge`)
                                  }
                                  title="Pošalji email"
                                >
                                  <Mail className="h-4 w-4" />
                                </Button>
                              )}
                              <Link href={`/dashboard/certificates/${cert.id}`}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 hover:bg-gray-100"
                                  title="Pogledaj detalje"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Link href={`/dashboard/employees/${cert.staff.id}`}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 hover:bg-gray-100"
                                  title="Pogledaj profil zaposlenog"
                                >
                                  <User className="h-4 w-4" />
                                </Button>
                              </Link>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info box za email notifikacije */}
      <Alert className="border-blue-200 bg-blue-50">
        <Bell className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Email podsetnici:</strong> Kliknite na email ikonu pored zaposlenog za brzo slanje podsetnika.
          Sistem automatski šalje podsetnike za certifikate koji ističu za 30 dana.{" "}
          <Link href="/dashboard/settings/notifications" className="font-medium underline">
            Podesite notifikacije
          </Link>
        </AlertDescription>
      </Alert>
    </div>
  );
}


//redizajn 2
// "use client"

// import { useState, useEffect } from "react"
// import { getSupabaseBrowserClient } from "@/lib/supabase/client"
// import { Button } from "@/components/ui/button"
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
// import { Badge } from "@/components/ui/badge"
// import { Alert, AlertDescription } from "@/components/ui/alert"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import {
//   Calendar,
//   Mail,
//   User,
//   Clock,
//   AlertTriangle,
//   CheckCircle,
//   Send,
//   RefreshCw,
//   Download,
//   ExternalLink,
//   Filter,
//   Search,
//   FileText
// } from "lucide-react"
// import Link from "next/link"
// import { formatDate } from "@/lib/utils"
// import { useToast } from "@/hooks/use-toast"

// // Definišite tipove
// interface CertificateRecord {
//   id: string
//   certificate_number: string
//   issue_date: string
//   expiry_date: string
//   completion_date: string | null
//   status: string
//   grade: string | null
//   notes: string | null
//   instructor_name: string | null
//   training_provider: string | null
//   issued_by: string | null
//   staff: {
//     id: string
//     first_name: string
//     last_name: string
//     email: string | null
//     employee_number: string
//     phone: string | null
//     status: string
//     working_positions?: {
//       title: string | null
//       department: string | null
//     } | null
//   }
//   training_certificates_master: {
//     id: string
//     title: string
//     code: string
//     validity_months: number | null
//     description: string | null
//     training_provider: string | null
//   } | null
// }

// interface ExpiryStats {
//   total: number
//   expired: number
//   warning30: number
//   warning7: number
//   valid: number
//   today: number
//   thisWeek: number
//   thisMonth: number
// }

// export default function TrainingExpiryPage() {
//   const { toast } = useToast()
//   const [certificates, setCertificates] = useState<CertificateRecord[]>([])
//   const [loading, setLoading] = useState(true)
//   const [sending, setSending] = useState(false)
//   const [search, setSearch] = useState("")
//   const [filterDays, setFilterDays] = useState<"7" | "30" | "90" | "all">("30")
//   const [filterStatus, setFilterStatus] = useState<"all" | "expired" | "warning" | "valid">("all")
//   const [stats, setStats] = useState<ExpiryStats>({
//     total: 0,
//     expired: 0,
//     warning30: 0,
//     warning7: 0,
//     valid: 0,
//     today: 0,
//     thisWeek: 0,
//     thisMonth: 0
//   })

//   const supabase = getSupabaseBrowserClient()

//   const loadData = async () => {
//     try {
//       setLoading(true)
      
//       // Učitaj sve sertifikate koji imaju datum isteka
//       const { data, error } = await supabase
//         .from('training_certificate_records')
//         .select(`
//           *,
//           staff:staff_id (
//             id,
//             first_name,
//             last_name,
//             email,
//             employee_number,
//             phone,
//             status,
//             working_positions:position_id (
//               title,
//               department
//             )
//           ),
//           training_certificates_master:training_master_id (
//             id,
//             title,
//             code,
//             validity_months,
//             description,
//             training_provider
//           )
//         `)
//         .not('expiry_date', 'is', null) // Samo oni koji imaju datum isteka
//         .order('expiry_date', { ascending: true })

//       if (error) throw error

//       if (data) {
//         // Obrađujemo podatke i dodajemo status
//         const today = new Date()
//         const processedCertificates = data.map(cert => {
//           if (!cert.expiry_date) return { ...cert, status: 'unknown' }
          
//           const expiresDate = new Date(cert.expiry_date)
//           const daysDiff = Math.ceil((expiresDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          
//           let status = 'valid'
//           if (daysDiff < 0) {
//             status = 'expired'
//           } else if (daysDiff <= 7) {
//             status = 'warning7'
//           } else if (daysDiff <= 30) {
//             status = 'warning30'
//           }
          
//           return { ...cert, status }
//         })

//         setCertificates(processedCertificates)

//         // Izračunaj statistike
//         const todayDate = today.toISOString().split('T')[0]
//         const sevenDaysFromNow = new Date()
//         sevenDaysFromNow.setDate(today.getDate() + 7)
//         const sevenDaysStr = sevenDaysFromNow.toISOString().split('T')[0]
//         const thirtyDaysFromNow = new Date()
//         thirtyDaysFromNow.setDate(today.getDate() + 30)
//         const thirtyDaysStr = thirtyDaysFromNow.toISOString().split('T')[0]

//         const statsData: ExpiryStats = {
//           total: data.length,
//           expired: processedCertificates.filter(t => t.status === 'expired').length,
//           warning30: processedCertificates.filter(t => t.status === 'warning30').length,
//           warning7: processedCertificates.filter(t => t.status === 'warning7').length,
//           valid: processedCertificates.filter(t => t.status === 'valid').length,
//           today: data.filter(t => t.expiry_date === todayDate).length,
//           thisWeek: data.filter(t => 
//             t.expiry_date && t.expiry_date >= todayDate && t.expiry_date <= sevenDaysStr
//           ).length,
//           thisMonth: data.filter(t => 
//             t.expiry_date && t.expiry_date >= todayDate && t.expiry_date <= thirtyDaysStr
//           ).length
//         }

//         setStats(statsData)
//       }

//     } catch (error) {
//       console.error('Error loading data:', error)
//       toast({
//         title: "Greška",
//         description: "Došlo je do greške pri učitavanju podataka",
//         variant: "destructive",
//       })
//     } finally {
//       setLoading(false)
//     }
//   }

//   useEffect(() => {
//     loadData()
//   }, [])

//   const handleSendReminders = async () => {
//     setSending(true)
//     try {
//       // Pronađi sertifikate koji ističu u narednih 30 dana
//       const certificatesToNotify = certificates.filter(cert => {
//         if (!cert.expiry_date || !cert.staff.email) return false
        
//         const days = getDaysRemaining(cert.expiry_date)
//         return days >= 0 && days <= 30
//       })

//       let sentCount = 0
//       const failedEmails: string[] = []

//       // Simulacija slanja email-a
//       for (const cert of certificatesToNotify) {
//         try {
//           const daysRemaining = getDaysRemaining(cert.expiry_date)
//           const trainingName = cert.training_certificates_master?.title || 'Sertifikat'
//           const expiryDateFormatted = formatDate(cert.expiry_date)
          
//           console.log(`Sending email to ${cert.staff.email}:`)
//           console.log(`- Subject: Podsetnik: ${trainingName} ističe za ${daysRemaining} dana`)
//           console.log(`- Expires: ${expiryDateFormatted}`)
          
//           // Ovde bi bio pravi Resend API poziv
//           sentCount++
          
//           await new Promise(resolve => setTimeout(resolve, 50))
          
//         } catch (err) {
//           console.error(`Failed to send email to ${cert.staff.email}:`, err)
//           failedEmails.push(cert.staff.email || 'Unknown email')
//         }
//       }

//       toast({
//         title: "Podsetnici poslati",
//         description: `Simulacija: Poslano bi ${sentCount} email podsetnika. Neuspeli: ${failedEmails.length}`,
//       })
      
//       await loadData()
      
//     } catch (error) {
//       console.error('Error sending reminders:', error)
//       toast({
//         title: "Greška",
//         description: "Došlo je do greške pri slanju podsetnika",
//         variant: "destructive",
//       })
//     } finally {
//       setSending(false)
//     }
//   }

//   const handleExportToExcel = () => {
//     try {
//       // Kreiraj CSV podatke
//       const headers = [
//         'Ime',
//         'Prezime',
//         'Broj zaposlenog',
//         'Email',
//         'Obuka',
//         'Šifra obuke',
//         'Broj sertifikata',
//         'Datum izdavanja',
//         'Datum isteka',
//         'Dana preostalo',
//         'Status',
//         'Instruktor',
//         'Izdato od'
//       ]

//       const csvData = certificates.map(cert => {
//         const daysRemaining = getDaysRemaining(cert.expiry_date)
//         const statusText = getStatusText(cert.status, cert.expiry_date)
        
//         return [
//           cert.staff.first_name,
//           cert.staff.last_name,
//           cert.staff.employee_number,
//           cert.staff.email || '',
//           cert.training_certificates_master?.title || 'Opšti sertifikat',
//           cert.training_certificates_master?.code || 'GENERAL-CERT',
//           cert.certificate_number,
//           formatDate(cert.issue_date),
//           formatDate(cert.expiry_date),
//           daysRemaining.toString(),
//           statusText,
//           cert.instructor_name || '',
//           cert.issued_by || ''
//         ]
//       })

//       const csvContent = [
//         headers.join(','),
//         ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
//       ].join('\n')

//       const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
//       const link = document.createElement('a')
//       const url = URL.createObjectURL(blob)
//       link.setAttribute('href', url)
//       link.setAttribute('download', `obuke_istek_${new Date().toISOString().split('T')[0]}.csv`)
//       link.style.visibility = 'hidden'
//       document.body.appendChild(link)
//       link.click()
//       document.body.removeChild(link)

//       toast({
//         title: "Uspešno",
//         description: "Podaci su izvezeni u CSV format",
//       })
      
//     } catch (error) {
//       console.error('Error exporting to CSV:', error)
//       toast({
//         title: "Greška",
//         description: "Došlo je do greške pri izvozu podataka",
//         variant: "destructive",
//       })
//     }
//   }

//   const getDaysRemaining = (expiryDate: string | null) => {
//     if (!expiryDate) return 999
    
//     const today = new Date()
//     const expiry = new Date(expiryDate)
//     const diff = expiry.getTime() - today.getTime()
//     return Math.ceil(diff / (1000 * 60 * 60 * 24))
//   }

//   const getStatusText = (status: string, expiryDate: string | null) => {
//     const days = getDaysRemaining(expiryDate)
    
//     if (status === 'expired' || days < 0) {
//       return 'ISTEKLO'
//     } else if (days <= 7) {
//       return `ISTIČE ZA ${days} DANA`
//     } else if (days <= 30) {
//       return `UPOZORENJE (${days}d)`
//     } else {
//       return `VAŽEĆE (${days}d)`
//     }
//   }

//   const getStatusBadge = (status: string, expiryDate: string | null) => {
//     const days = getDaysRemaining(expiryDate)
    
//     if (status === 'expired' || days < 0) {
//       return (
//         <Badge variant="destructive" className="gap-1">
//           <AlertTriangle className="h-3 w-3" />
//           Isteklo
//         </Badge>
//       )
//     } else if (days <= 7) {
//       return (
//         <Badge variant="destructive" className="gap-1">
//           <AlertTriangle className="h-3 w-3" />
//           Ističe za {days}d
//         </Badge>
//       )
//     } else if (days <= 30) {
//       return (
//         <Badge variant="outline" className="border-yellow-500 text-yellow-700 gap-1 bg-yellow-50">
//           <AlertTriangle className="h-3 w-3" />
//           Ističe za {days}d
//         </Badge>
//       )
//     } else {
//       return (
//         <Badge variant="secondary" className="gap-1">
//           <CheckCircle className="h-3 w-3" />
//           Važeće ({days}d)
//         </Badge>
//       )
//     }
//   }

//   // Funkcija za određivanje stila badge-a za datum isteka
//   const getExpiryDateBadge = (expiryDate: string | null) => {
//     if (!expiryDate) {
//       return (
//         <Badge variant="outline" className="rounded-full px-3 py-1">
//           Bez isteka
//         </Badge>
//       )
//     }

//     const expiry = new Date(expiryDate)
//     const today = new Date()
//     const thirtyDaysFromNow = new Date()
//     thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

//     // Formatiranje datuma
//     const formattedDate = expiry.toLocaleDateString("sr-RS")

//     // Ako je datum isteka prošao
//     if (expiry < today) {
//       return (
//         <Badge className="rounded-full px-3 py-1 bg-red-500 text-white border-0">
//           {formattedDate}
//         </Badge>
//       )
//     }
    
//     // Ako datum isteka ističe u narednih 30 dana
//     if (expiry <= thirtyDaysFromNow) {
//       return (
//         <Badge className="rounded-full px-3 py-1 bg-amber-500 text-white border-0">
//           {formattedDate}
//         </Badge>
//       )
//     }
    
//     // Ako je datum isteka više od 30 dana u budućnosti
//     return (
//       <Badge className="rounded-full px-3 py-1 bg-green-500 text-white border-0">
//         {formattedDate}
//       </Badge>
//     )
//   }

//   // Filtriranje podataka
//   const filteredCertificates = certificates.filter(cert => {
//     // Pretraga
//     const searchLower = search.toLowerCase()
//     const matchesSearch = search === "" ||
//       cert.staff.first_name.toLowerCase().includes(searchLower) ||
//       cert.staff.last_name.toLowerCase().includes(searchLower) ||
//       cert.staff.employee_number.toLowerCase().includes(searchLower) ||
//       cert.training_certificates_master?.title?.toLowerCase().includes(searchLower) ||
//       cert.training_certificates_master?.code?.toLowerCase().includes(searchLower) ||
//       cert.certificate_number.toLowerCase().includes(searchLower)

//     // Filter po statusu
//     const matchesStatus = filterStatus === "all" || 
//       (filterStatus === "expired" && cert.status === "expired") ||
//       (filterStatus === "warning" && (cert.status === "warning7" || cert.status === "warning30")) ||
//       (filterStatus === "valid" && cert.status === "valid")

//     // Filter po danima
//     const daysRemaining = getDaysRemaining(cert.expiry_date)
//     const matchesDays = filterDays === "all" ? true :
//       filterDays === "7" ? (daysRemaining >= 0 && daysRemaining <= 7) :
//       filterDays === "30" ? (daysRemaining >= 0 && daysRemaining <= 30) :
//       filterDays === "90" ? (daysRemaining >= 0 && daysRemaining <= 90) : true

//     return matchesSearch && matchesStatus && matchesDays
//   })

//   // Funkcija za određivanje CSS klase za red
//   const getRowClass = (status: string, daysRemaining: number) => {
//     if (status === 'expired' || daysRemaining < 0) {
//       return "bg-red-50 hover:bg-red-100"
//     } else if (daysRemaining <= 7) {
//       return "bg-red-100 hover:bg-red-200"
//     } else if (daysRemaining <= 30) {
//       return "bg-red-50 hover:bg-red-100 text-gray-900 font-semibold"
//     }
//     return ""
//   }

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
//         <div>
//           <h1 className="text-3xl font-bold tracking-tight">Istek Obuka</h1>
//           <p className="text-muted-foreground">Praćenje isteka sertifikata zaposlenih</p>
//         </div>
//         <div className="flex flex-wrap gap-2">
//           <Button
//             onClick={handleSendReminders}
//             disabled={sending || filteredCertificates.length === 0}
//             className="gap-2"
//           >
//             {sending ? (
//               <RefreshCw className="h-4 w-4 animate-spin" />
//             ) : (
//               <Send className="h-4 w-4" />
//             )}
//             Pošalji Podsetnike
//           </Button>
//           <Button
//             onClick={handleExportToExcel}
//             variant="outline"
//             className="gap-2"
//             disabled={filteredCertificates.length === 0}
//           >
//             <Download className="h-4 w-4" />
//             Export CSV
//           </Button>
//           <Button
//             onClick={loadData}
//             variant="outline"
//             className="gap-2"
//           >
//             <RefreshCw className="h-4 w-4" />
//             Osveži
//           </Button>
//         </div>
//       </div>

//       {/* Statistike */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
//         <Card className="shadow-sm border-l-4 border-l-blue-500">
//           <CardContent className="pt-6">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm font-medium text-muted-foreground">Ukupno sertifikata</p>
//                 <p className="text-2xl font-bold">{stats.total}</p>
//               </div>
//               <div className="bg-blue-100 p-2 rounded-full">
//                 <FileText className="h-6 w-6 text-blue-600" />
//               </div>
//             </div>
//           </CardContent>
//         </Card>
        
//         <Card className="shadow-sm border-l-4 border-l-orange-500">
//           <CardContent className="pt-6">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm font-medium text-muted-foreground">Ističe danas</p>
//                 <p className="text-2xl font-bold">{stats.today}</p>
//               </div>
//               <div className="bg-orange-100 p-2 rounded-full">
//                 <Clock className="h-6 w-6 text-orange-600" />
//               </div>
//             </div>
//           </CardContent>
//         </Card>
        
//         <Card className="shadow-sm border-l-4 border-l-red-500">
//           <CardContent className="pt-6">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm font-medium text-muted-foreground">Ističe za 7 dana</p>
//                 <p className="text-2xl font-bold">{stats.thisWeek}</p>
//               </div>
//               <div className="bg-red-100 p-2 rounded-full">
//                 <AlertTriangle className="h-6 w-6 text-red-600" />
//               </div>
//             </div>
//           </CardContent>
//         </Card>
        
//         <Card className="shadow-sm border-l-4 border-l-amber-500">
//           <CardContent className="pt-6">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm font-medium text-muted-foreground">Ističe za 30 dana</p>
//                 <p className="text-2xl font-bold">{stats.thisMonth}</p>
//               </div>
//               <div className="bg-amber-100 p-2 rounded-full">
//                 <Calendar className="h-6 w-6 text-amber-600" />
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Dodatne statistike */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//         <Card className="shadow-sm border-l-4 border-l-red-600">
//           <CardContent className="pt-6">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm font-medium text-muted-foreground">Istekli</p>
//                 <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
//               </div>
//               <div className="bg-red-100 p-2 rounded-full">
//                 <AlertTriangle className="h-6 w-6 text-red-600" />
//               </div>
//             </div>
//           </CardContent>
//         </Card>
        
//         <Card className="shadow-sm border-l-4 border-l-amber-600">
//           <CardContent className="pt-6">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm font-medium text-muted-foreground">Ističe za 30 dana</p>
//                 <p className="text-2xl font-bold text-yellow-600">{stats.warning30}</p>
//               </div>
//               <div className="bg-yellow-100 p-2 rounded-full">
//                 <AlertTriangle className="h-6 w-6 text-yellow-600" />
//               </div>
//             </div>
//           </CardContent>
//         </Card>
        
//         <Card className="shadow-sm border-l-4 border-l-green-600">
//           <CardContent className="pt-6">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm font-medium text-muted-foreground">Važeći</p>
//                 <p className="text-2xl font-bold text-green-600">{stats.valid}</p>
//               </div>
//               <div className="bg-green-100 p-2 rounded-full">
//                 <CheckCircle className="h-6 w-6 text-green-600" />
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Filteri i pretraga */}
//       <Card className="shadow-sm">
//         <CardContent className="pt-6">
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//             <div className="space-y-2">
//               <Label htmlFor="search" className="flex items-center gap-2">
//                 <Search className="h-4 w-4" />
//                 Pretraga
//               </Label>
//               <Input
//                 id="search"
//                 placeholder="Ime, prezime, broj zaposlenog, obuka, broj sertifikata..."
//                 value={search}
//                 onChange={(e) => setSearch(e.target.value)}
//               />
//             </div>
            
//             <div className="space-y-2">
//               <Label htmlFor="days-filter" className="flex items-center gap-2">
//                 <Calendar className="h-4 w-4" />
//                 Vremenski period
//               </Label>
//               <select
//                 id="days-filter"
//                 className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
//                 value={filterDays}
//                 onChange={(e) => setFilterDays(e.target.value as any)}
//               >
//                 <option value="7">Ističe za 7 dana</option>
//                 <option value="30">Ističe za 30 dana</option>
//                 <option value="90">Ističe za 90 dana</option>
//                 <option value="all">Svi rokovi</option>
//               </select>
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="status-filter" className="flex items-center gap-2">
//                 <Filter className="h-4 w-4" />
//                 Status
//               </Label>
//               <select
//                 id="status-filter"
//                 className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
//                 value={filterStatus}
//                 onChange={(e) => setFilterStatus(e.target.value as any)}
//               >
//                 <option value="all">Svi statusi</option>
//                 <option value="valid">Važeći</option>
//                 <option value="warning">Upozorenje (7-30 dana)</option>
//                 <option value="expired">Istekli</option>
//               </select>
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Tabela */}
//       <Card className="shadow-sm">
//         <CardHeader className="pb-3">
//           <div className="flex items-center justify-between">
//             <div>
//               <CardTitle className="text-lg">Lista Sertifikata</CardTitle>
//               <CardDescription>
//                 {filteredCertificates.length} sertifikata pronađeno
//                 {filterDays !== "all" && ` (koje ističu za ${filterDays} dana)`}
//               </CardDescription>
//             </div>
//             {filteredCertificates.length > 0 && (
//               <div className="text-sm text-muted-foreground">
//                 Poslednje ažuriranje: {new Date().toLocaleTimeString('sr-RS')}
//               </div>
//             )}
//           </div>
//         </CardHeader>
//         <CardContent>
//           {loading ? (
//             <div className="text-center py-8">
//               <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
//               <p className="mt-2 text-muted-foreground">Učitavanje podataka...</p>
//             </div>
//           ) : filteredCertificates.length === 0 ? (
//             <div className="text-center py-8">
//               <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
//               <h3 className="text-lg font-semibold">
//                 {search || filterStatus !== "all" || filterDays !== "all" 
//                   ? "Nema pronađenih sertifikata" 
//                   : "Nema evidentiranih sertifikata"}
//               </h3>
//               <p className="text-muted-foreground mb-4">
//                 {search || filterStatus !== "all" || filterDays !== "all"
//                   ? "Pokušajte promijeniti filtere ili pretragu"
//                   : "Dodajte prvi sertifikat zaposlenom"}
//               </p>
//               <Link href="/dashboard/certificates/new">
//                 <Button variant="outline" className="gap-2">
//                   <FileText className="h-4 w-4" />
//                   Dodaj sertifikat
//                 </Button>
//               </Link>
//             </div>
//           ) : (
//             <div className="rounded-md border overflow-hidden">
//               <div className="overflow-x-auto">
//                 <Table>
//                   <TableHeader>
//                     <TableRow className="border-b">
//                       <TableHead className="whitespace-nowrap font-semibold">Zaposleni</TableHead>
//                       <TableHead className="whitespace-nowrap font-semibold">Obuka</TableHead>
//                       <TableHead className="whitespace-nowrap text-center font-semibold">Broj sertifikata</TableHead>
//                       <TableHead className="whitespace-nowrap text-center font-semibold">Datum izdavanja</TableHead>
//                       <TableHead className="whitespace-nowrap text-center font-semibold">Datum isteka</TableHead>
//                       <TableHead className="whitespace-nowrap text-center font-semibold">Dana preostalo</TableHead>
//                       <TableHead className="whitespace-nowrap text-center font-semibold">Status</TableHead>
//                       <TableHead className="whitespace-nowrap text-center font-semibold">Akcije</TableHead>
//                     </TableRow>
//                   </TableHeader>
//                   <TableBody>
//                     {filteredCertificates.map((cert) => {
//                       const daysRemaining = getDaysRemaining(cert.expiry_date)
//                       const rowClass = getRowClass(cert.status, daysRemaining)
                      
//                       return (
//                         <TableRow 
//                           key={cert.id}
//                           className={`${rowClass} border-b hover:bg-gray-50`}
//                         >
//                           <TableCell>
//                             <div className="flex items-center gap-2">
//                               <div className="bg-blue-100 p-1.5 rounded-full">
//                                 <User className="h-3.5 w-3.5 text-blue-600" />
//                               </div>
//                               <div>
//                                 <div className="font-medium">
//                                   {cert.staff.first_name} {cert.staff.last_name}
//                                 </div>
//                                 <div className="text-sm text-muted-foreground">
//                                   {cert.staff.employee_number}
//                                 </div>
//                                 {cert.staff.email && (
//                                   <div className="text-xs text-blue-600">
//                                     {cert.staff.email}
//                                   </div>
//                                 )}
//                               </div>
//                             </div>
//                           </TableCell>
//                           <TableCell>
//                             <div className="flex flex-col">
//                               <span className="font-medium">
//                                 {cert.training_certificates_master?.title || 'Opšti sertifikat'}
//                               </span>
//                               <div className="text-sm text-muted-foreground flex items-center gap-2">
//                                 <span className="font-mono">{cert.training_certificates_master?.code || 'GENERAL-CERT'}</span>
//                                 {cert.training_certificates_master?.validity_months && (
//                                   <span className="text-xs px-2 py-1 bg-gray-100 rounded">
//                                     {cert.training_certificates_master.validity_months} mj.
//                                   </span>
//                                 )}
//                               </div>
//                             </div>
//                           </TableCell>
//                           <TableCell className="text-center font-mono">
//                             {cert.certificate_number}
//                           </TableCell>
//                           <TableCell className="text-center">
//                             <div className="flex flex-col items-center">
//                               <Calendar className="h-4 w-4 text-gray-500 mb-1" />
//                               <span>{formatDate(cert.issue_date)}</span>
//                             </div>
//                           </TableCell>
//                           <TableCell className="text-center">
//                             <div className="flex flex-col items-center">
//                               <Clock className={`h-4 w-4 mb-1 ${daysRemaining <= 7 ? "text-red-500" : daysRemaining <= 30 ? "text-yellow-600" : "text-gray-500"}`} />
//                               {getExpiryDateBadge(cert.expiry_date)}
//                             </div>
//                           </TableCell>
//                           <TableCell className="text-center">
//                             <div className={`font-semibold ${daysRemaining <= 7 ? "text-red-600" : daysRemaining <= 30 ? "text-yellow-700 font-bold" : ""}`}>
//                               {daysRemaining > 0 ? `${daysRemaining} dana` : "ISTEKLO"}
//                             </div>
//                           </TableCell>
//                           <TableCell className="text-center">
//                             {getStatusBadge(cert.status, cert.expiry_date)}
//                           </TableCell>
//                           <TableCell className="text-center">
//                             <div className="flex items-center justify-center gap-1">
//                               {cert.staff.email && (
//                                 <Button
//                                   variant="ghost"
//                                   size="sm"
//                                   className="h-8 w-8 p-0"
//                                   onClick={() => window.location.href = `mailto:${cert.staff.email}?subject=Podsetnik: ${cert.training_certificates_master?.title || 'Sertifikat'} ističe za ${daysRemaining} dana&body=Poštovani ${cert.staff.first_name},%0D%0A%0D%0ASertifikat "${cert.training_certificates_master?.title || ''}" ističe ${formatDate(cert.expiry_date)}.%0D%0APreostalo dana: ${daysRemaining}%0D%0ABroj sertifikata: ${cert.certificate_number}%0D%0A%0D%0AMolimo obnovite sertifikat prije isteka roka.%0D%0A%0D%0APoštovanje,%0D%0ATim za obuke`}
//                                   title="Pošalji email"
//                                 >
//                                   <Mail className="h-4 w-4" />
//                                 </Button>
//                               )}
//                               <Link href={`/dashboard/certificates/${cert.id}`}>
//                                 <Button
//                                   variant="ghost"
//                                   size="sm"
//                                   className="h-8 w-8 p-0"
//                                   title="Pogledaj detalje"
//                                 >
//                                   <ExternalLink className="h-4 w-4" />
//                                 </Button>
//                               </Link>
//                               <Link href={`/dashboard/employees/${cert.staff.id}`}>
//                                 <Button
//                                   variant="ghost"
//                                   size="sm"
//                                   className="h-8 w-8 p-0"
//                                   title="Pogledaj profil zaposlenog"
//                                 >
//                                   <User className="h-4 w-4" />
//                                 </Button>
//                               </Link>
//                             </div>
//                           </TableCell>
//                         </TableRow>
//                       )
//                     })}
//                   </TableBody>
//                 </Table>
//               </div>
//             </div>
//           )}
//         </CardContent>
//       </Card>

//       {/* Legenda */}
//       <Card className="shadow-sm">
//         <CardHeader className="pb-3">
//           <CardTitle className="text-lg">Legenda statusa</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//             <div className="flex items-center gap-2">
//               <Badge className="rounded-full px-3 py-1 bg-green-500 text-white border-0">
//                 Zeleni
//               </Badge>
//               <span className="text-sm">Više od 30 dana do isteka</span>
//             </div>
//             <div className="flex items-center gap-2">
//               <Badge className="rounded-full px-3 py-1 bg-amber-500 text-white border-0">
//                 Narandžasti
//               </Badge>
//               <span className="text-sm">Ističe u narednih 30 dana</span>
//             </div>
//             <div className="flex items-center gap-2">
//               <Badge className="rounded-full px-3 py-1 bg-red-500 text-white border-0">
//                 Crveni
//               </Badge>
//               <span className="text-sm">Datum isteka je prošao</span>
//             </div>
//             <div className="flex items-center gap-2">
//               <Badge variant="outline" className="rounded-full px-3 py-1">
//                 Bez isteka
//               </Badge>
//               <span className="text-sm">Nema definisan datum isteka</span>
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Info box za email notifikacije */}
//       <Alert className="shadow-sm">
//         <Send className="h-4 w-4" />
//         <AlertDescription>
//           <strong>Email podsetnici:</strong> Kliknite na email ikonu pored zaposlenog za brzo slanje podsetnika.
//           Sistem šalje automatske podsjetnike za sertifikate koji ističu za 30 dana.
//         </AlertDescription>
//       </Alert>
//     </div>
//   )
// }