"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  AlertTriangle,
  Search,
  Filter,
  Download,
  Edit,
  Trash2,
  User,
  FileText,
  Calendar,
  Clock,
} from "lucide-react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Definisanje tipova
interface Certifikat {
  id: string;
  certificate_number: string;
  issue_date: string;
  expiry_date: string | null;
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
    employee_number: string;
    email: string | null;
    working_positions?: {
      department: string | null;
    } | null;
  };
  training_certificates_master: {
    id: string;
    title: string;
    code: string;
    validity_months: number | null;
  } | null;
}

export default function CertifikatiStranica() {
  const { toast } = useToast();
  const supabase = getSupabaseBrowserClient();

  const [certifikati, setCertifikati] = useState<Certifikat[]>([]);
  const [filtriraniCertifikati, setFiltriraniCertifikati] = useState<Certifikat[]>(
    []
  );
  const [učitavanje, setUčitavanje] = useState(true);
  const [terminPretrage, setTerminPretrage] = useState("");
  const [filterStatusa, setFilterStatusa] = useState<string>("svi");
  const [filterOdseka, setFilterOdseka] = useState<string>("svi");
  const [dijalogBrisanjaOtvoren, setDijalogBrisanjaOtvoren] = useState(false);
  const [certifikatZaBrisanje, setCertifikatZaBrisanje] = useState<string | null>(
    null
  );

  // Učitaj sertifikate
  useEffect(() => {
    async function učitajCertifikate() {
      try {
        setUčitavanje(true);

        const { data, error } = await supabase
          .from("training_certificate_records")
          .select(
            `
            *,
            staff:staff_id (
              id,
              first_name,
              last_name,
              employee_number,
              email,
              working_positions:position_id (
                department
              )
            ),
            training_certificates_master:training_master_id (
              id,
              title,
              code,
              validity_months
            )
          `
          )
          .order("issue_date", { ascending: false });

        if (error) throw error;

        console.log("Učitano certifikata:", data?.length || 0);
        setCertifikati(data || []);
        setFiltriraniCertifikati(data || []);
      } catch (error: any) {
        console.error("Greška pri učitavanju certifikata:", error);
        toast({
          title: "Greška",
          description: "Došlo je do greške pri učitavanju certifikata",
          variant: "destructive",
        });
      } finally {
        setUčitavanje(false);
      }
    }

    učitajCertifikate();
  }, [supabase, toast]);

  // Filtriraj sertifikate
  useEffect(() => {
    let filtrirano = [...certifikati];

    // Pretraga
    if (terminPretrage) {
      const termin = terminPretrage.toLowerCase();
      filtrirano = filtrirano.filter(
        (cert) =>
          cert.certificate_number.toLowerCase().includes(termin) ||
          cert.staff.first_name.toLowerCase().includes(termin) ||
          cert.staff.last_name.toLowerCase().includes(termin) ||
          cert.staff.employee_number.toLowerCase().includes(termin) ||
          cert.training_certificates_master?.title.toLowerCase().includes(termin) ||
          cert.training_certificates_master?.code.toLowerCase().includes(termin)
      );
    }

    // Filter po statusu
    if (filterStatusa !== "svi") {
      filtrirano = filtrirano.filter((cert) => cert.status === filterStatusa);
    }

    // Filter po odseku
    if (filterOdseka !== "svi") {
      filtrirano = filtrirano.filter(
        (cert) => cert.staff.working_positions?.department === filterOdseka
      );
    }

    setFiltriraniCertifikati(filtrirano);
  }, [certifikati, terminPretrage, filterStatusa, filterOdseka]);

  // Funkcija za brisanje certifikata
  const rukujBrisanjeCertifikata = async (id: string) => {
    try {
      const { error } = await supabase
        .from("training_certificate_records")
        .delete()
        .eq("id", id);

      if (error) throw error;

      // Ukloni iz stanja
      setCertifikati((prethodni) => prethodni.filter((cert) => cert.id !== id));

      toast({
        title: "Uspešno",
        description: "Certifikat je uspešno obrisan",
      });
    } catch (error: any) {
      console.error("Greška pri brisanju certifikata:", error);
      toast({
        title: "Greška",
        description: "Došlo je do greške pri brisanju certifikata",
        variant: "destructive",
      });
    } finally {
      setDijalogBrisanjaOtvoren(false);
      setCertifikatZaBrisanje(null);
    }
  };

  // Funkcija za preuzimanje certifikata kao CSV
  const rukujIzveziCSV = () => {
    const zaglavlja = [
      "Broj certifikata",
      "Zaposleni",
      "Broj zaposlenog",
      "Email",
      "Trening",
      "Šifra treninga",
      "Datum izdavanja",
      "Datum isteka",
      "Status",
      "Ocena",
      "Instruktor",
      "Izdato od",
      "Odsek",
    ];

    const csvPodaci = filtriraniCertifikati.map((cert) => [
      cert.certificate_number,
      `${cert.staff.first_name} ${cert.staff.last_name}`,
      cert.staff.employee_number,
      cert.staff.email || "",
      cert.training_certificates_master?.title || "Opšti certifikat",
      cert.training_certificates_master?.code || "OPŠTI-CERT",
      new Date(cert.issue_date).toLocaleDateString("sr-RS"),
      cert.expiry_date
        ? new Date(cert.expiry_date).toLocaleDateString("sr-RS")
        : "Bez isteka",
      cert.status === "valid"
        ? "Važeći"
        : cert.status === "expired"
        ? "Istekao"
        : "Opozvan",
      cert.grade || "",
      cert.instructor_name || "",
      cert.issued_by || "",
      cert.staff.working_positions?.department || "",
    ]);

    const csvSadržaj = [
      zaglavlja.join(","),
      ...csvPodaci.map((red) => red.map((ćelija) => `"${ćelija}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvSadržaj], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `certifikati_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper funkcije
  const dobijOznakuStatusa = (status: string) => {
    const mapaStatusa: Record<
      string,
      { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
    > = {
      valid: { label: "Važeći", variant: "default" },
      expired: { label: "Istekao", variant: "secondary" },
      revoked: { label: "Opozvan", variant: "destructive" },
    };

    const konfiguracija = mapaStatusa[status] || { label: status, variant: "outline" };
    return <Badge variant={konfiguracija.variant}>{konfiguracija.label}</Badge>;
  };

  const ističeUskoro = (datumIsteka: string | null): boolean => {
    if (!datumIsteka) return false;
    const istek = new Date(datumIsteka);
    const tridesetDanaOdSad = new Date();
    tridesetDanaOdSad.setDate(tridesetDanaOdSad.getDate() + 30);
    return istek <= tridesetDanaOdSad && istek > new Date();
  };

  const jeIstekao = (datumIsteka: string | null): boolean => {
    if (!datumIsteka) return false;
    return new Date(datumIsteka) < new Date();
  };

  // Funkcija za određivanje boje za datum isteka
  const dobijBojeDatumaIsteka = (datumIsteka: string | null) => {
    if (!datumIsteka) {
      return "bg-gray-100 text-gray-800"; // Neutralna za bez datuma isteka
    }

    const datum = new Date(datumIsteka);
    const danas = new Date();
    const razlikaUDanima = Math.floor(
      (datum.getTime() - danas.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (razlikaUDanima < 0) {
      // Istekao
      return "bg-red-100 text-red-800 border border-red-200";
    } else if (razlikaUDanima <= 30) {
      // Ističe u narednih 30 dana
      return "bg-amber-100 text-amber-800 border border-amber-200";
    } else {
      // Više od 30 dana
      return "bg-green-100 text-green-800 border border-green-200";
    }
  };

  // Grupiši sertifikate za tabove
  const važećiCertifikati = certifikati.filter((c) => c.status === "valid");
  const ističućeCertifikate = važećiCertifikati.filter((c) =>
    ističeUskoro(c.expiry_date)
  );
  const istekliCertifikati = certifikati.filter(
    (c) => c.status === "expired" || (c.status === "valid" && jeIstekao(c.expiry_date))
  );
  const sviCertifikati = certifikati;

  // Dobij jedinstvene odseke za filter
  const odseci = Array.from(
    new Set(
      certifikati
        .map((cert) => cert.staff.working_positions?.department)
        .filter(Boolean) as string[]
    )
  ).sort();

  if (učitavanje) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-2 text-muted-foreground">Učitavanje certifikata...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Certifikati</h1>
          <p className="text-muted-foreground">Upravljajte certifikatima zaposlenih</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={rukujIzveziCSV}>
            <Download className="mr-2 h-4 w-4" />
            Izvezi CSV
          </Button>
          <Link href="/dashboard/certificates/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novi Certifikat
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter sekcija */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pretraži certifikate..."
                value={terminPretrage}
                onChange={(e) => setTerminPretrage(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={filterStatusa} onValueChange={setFilterStatusa}>
              <SelectTrigger>
                <SelectValue placeholder="Filter po statusu" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="svi">Svi statusi</SelectItem>
                <SelectItem value="valid">Važeći</SelectItem>
                <SelectItem value="expired">Istekli</SelectItem>
                <SelectItem value="revoked">Opozvani</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterOdseka} onValueChange={setFilterOdseka}>
              <SelectTrigger>
                <SelectValue placeholder="Filter po odseku" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="svi">Svi odseci</SelectItem>
                {odseci.map((odsek) => (
                  <SelectItem key={odsek} value={odsek}>
                    {odsek}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setTerminPretrage("");
                setFilterStatusa("svi");
                setFilterOdseka("svi");
              }}
            >
              <Filter className="mr-2 h-4 w-4" />
              Resetuj filtere
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="svi" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="svi">Svi ({sviCertifikati.length})</TabsTrigger>
          <TabsTrigger value="valid">Važeći ({važećiCertifikati.length})</TabsTrigger>
          <TabsTrigger value="istice" className="gap-2">
            {ističućeCertifikate.length > 0 && (
              <AlertTriangle className="h-3 w-3 text-amber-500" />
            )}
            Ističu ({ističućeCertifikate.length})
          </TabsTrigger>
          <TabsTrigger value="expired">Istekli ({istekliCertifikati.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="svi">
          <CertifikatiTabela
            certifikati={filtriraniCertifikati}
            onDeleteClick={(id) => {
              setCertifikatZaBrisanje(id);
              setDijalogBrisanjaOtvoren(true);
            }}
            dobijBojeDatumaIsteka={dobijBojeDatumaIsteka}
          />
        </TabsContent>

        <TabsContent value="valid">
          <CertifikatiTabela
            certifikati={filtriraniCertifikati.filter((c) => c.status === "valid")}
            onDeleteClick={(id) => {
              setCertifikatZaBrisanje(id);
              setDijalogBrisanjaOtvoren(true);
            }}
            dobijBojeDatumaIsteka={dobijBojeDatumaIsteka}
          />
        </TabsContent>

        <TabsContent value="istice">
          <CertifikatiTabela
            certifikati={filtriraniCertifikati.filter(
              (c) => c.status === "valid" && ističeUskoro(c.expiry_date)
            )}
            onDeleteClick={(id) => {
              setCertifikatZaBrisanje(id);
              setDijalogBrisanjaOtvoren(true);
            }}
            dobijBojeDatumaIsteka={dobijBojeDatumaIsteka}
          />
        </TabsContent>

        <TabsContent value="expired">
          <CertifikatiTabela
            certifikati={filtriraniCertifikati.filter(
              (c) =>
                c.status === "expired" ||
                (c.status === "valid" && jeIstekao(c.expiry_date))
            )}
            onDeleteClick={(id) => {
              setCertifikatZaBrisanje(id);
              setDijalogBrisanjaOtvoren(true);
            }}
            dobijBojeDatumaIsteka={dobijBojeDatumaIsteka}
          />
        </TabsContent>
      </Tabs>

      {/* Statistika */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Ukupno certifikata
                </p>
                <p className="text-2xl font-bold">{sviCertifikati.length}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Važeći certifikati
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {važećiCertifikati.length}
                </p>
              </div>
              <User className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Certifikata ističe
                </p>
                <p className="text-2xl font-bold text-amber-600">
                  {ističućeCertifikate.length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Istekli certifikati
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {istekliCertifikati.length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Legenda za datume isteka */}
      <Card className="bg-gray-50">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="font-medium text-gray-700">Legenda datuma isteka:</span>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 bg-green-100 text-green-800 border border-green-200 text-xs">
                Više od 30 dana
              </span>
              <span className="text-gray-600">→ Više od 30 dana do isteka</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 bg-amber-100 text-amber-800 border border-amber-200 text-xs">
                Ističe uskoro
              </span>
              <span className="text-gray-600">→ Ističe u narednih 30 dana</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 bg-red-100 text-red-800 border border-red-200 text-xs">
                Istekao
              </span>
              <span className="text-gray-600">→ Datum je prošao</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dijalog za potvrdu brisanja */}
      <Dialog open={dijalogBrisanjaOtvoren} onOpenChange={setDijalogBrisanjaOtvoren}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Brisanje certifikata</DialogTitle>
            <DialogDescription>
              Da li ste sigurni da želite da obrišete ovaj certifikat? Ova akcija se ne
              može poništiti.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDijalogBrisanjaOtvoren(false);
                setCertifikatZaBrisanje(null);
              }}
            >
              Otkaži
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (certifikatZaBrisanje) {
                  rukujBrisanjeCertifikata(certifikatZaBrisanje);
                }
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Obriši
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CertifikatiTabela({
  certifikati,
  onDeleteClick,
  dobijBojeDatumaIsteka,
}: {
  certifikati: Certifikat[];
  onDeleteClick: (id: string) => void;
  dobijBojeDatumaIsteka: (datumIsteka: string | null) => string;
}) {
  const jeIstičeUskoro = (datumIsteka: string | null): boolean => {
    if (!datumIsteka) return false;
    const istek = new Date(datumIsteka);
    const tridesetDanaOdSad = new Date();
    tridesetDanaOdSad.setDate(tridesetDanaOdSad.getDate() + 30);
    return istek <= tridesetDanaOdSad && istek > new Date();
  };

  const jeIstekao = (datumIsteka: string | null): boolean => {
    if (!datumIsteka) return false;
    return new Date(datumIsteka) < new Date();
  };

  const dobijOznakuStatusa = (status: string) => {
    const mapaStatusa: Record<
      string,
      { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
    > = {
      valid: { label: "Važeći", variant: "default" },
      expired: { label: "Istekao", variant: "secondary" },
      revoked: { label: "Opozvan", variant: "destructive" },
    };

    const konfiguracija = mapaStatusa[status] || { label: status, variant: "outline" };
    return <Badge variant={konfiguracija.variant}>{konfiguracija.label}</Badge>;
  };

  const formatirajDatum = (datum: string | null) => {
    if (!datum) return "Bez isteka";
    return new Date(datum).toLocaleDateString("sr-RS");
  };

  if (certifikati.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="text-muted-foreground">Nema certifikata</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Pregled Certifikata</CardTitle>
        <p className="text-sm text-muted-foreground">
          Prikazano {certifikati.length} certifikat(a)
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="font-semibold text-gray-700">
                  Broj Certifikata
                </TableHead>
                <TableHead className="font-semibold text-gray-700">Zaposleni</TableHead>
                <TableHead className="font-semibold text-gray-700">Trening</TableHead>
                <TableHead className="font-semibold text-gray-700">Odsek</TableHead>
                <TableHead className="font-semibold text-gray-700">
                  Datum izdavanja
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  Datum isteka
                </TableHead>
                <TableHead className="font-semibold text-gray-700">Status</TableHead>
                <TableHead className="font-semibold text-gray-700 text-right">
                  Akcije
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {certifikati.map((certifikat) => (
                <TableRow
                  key={certifikat.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-mono text-sm">
                        {certifikat.certificate_number}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {certifikat.staff.first_name} {certifikat.staff.last_name}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {certifikat.staff.employee_number}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {certifikat.training_certificates_master?.title ||
                          "Opšti certifikat"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {certifikat.training_certificates_master?.code || "OPŠTI-CERT"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                      {certifikat.staff.working_positions?.department || "N/A"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-gray-400" />
                      {formatirajDatum(certifikat.issue_date)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {certifikat.expiry_date ? (
                        <>
                          {jeIstičeUskoro(certifikat.expiry_date) && (
                            <AlertTriangle className="h-3 w-3 text-amber-500 animate-pulse" />
                          )}
                          {jeIstekao(certifikat.expiry_date) && (
                            <AlertTriangle className="h-3 w-3 text-red-500" />
                          )}
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${dobijBojeDatumaIsteka(
                              certifikat.expiry_date
                            )}`}
                          >
                            {formatirajDatum(certifikat.expiry_date)}
                          </span>
                        </>
                      ) : (
                        <span className="text-muted-foreground text-sm">Bez isteka</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{dobijOznakuStatusa(certifikat.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Link href={`/dashboard/certificates/${certifikat.id}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-blue-50"
                        >
                          <span className="sr-only">Detalji</span>
                          <FileText className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/dashboard/certificates/${certifikat.id}/edit`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-blue-50"
                        >
                          <span className="sr-only">Izmeni</span>
                          <Edit className="h-4 w-4 text-blue-600" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-red-50"
                        onClick={() => onDeleteClick(certifikat.id)}
                      >
                        <span className="sr-only">Obriši</span>
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}