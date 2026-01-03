"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Edit,
  AlertTriangle,
  Calendar,
  UserCheck,
  Building,
  Search,
  Filter,
  X,
  User,
  Phone,
  Mail,
} from "lucide-react";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Definisanje tipova (prilagođeno kao u server komponenti)
interface RadnaPozicija {
  title: string;
  code: string;
  department: string;
}

interface MasterCertifikata {
  title: string;
  code: string;
}

interface Certifikat {
  id: string;
  certificate_number: string;
  expiry_date: string | null;
  status: string;
  training_certificates_master: MasterCertifikata[] | null;
}

interface Instruktor {
  id: string;
  staff_id: string;
  status: string;
}

interface Zaposleni {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  employee_number: string;
  status: string;
  hire_date: string | null;
  termination_date: string | null;
  position_id: string | null;
  working_positions: RadnaPozicija | null; // Promenjeno iz niza u objekat
  training_certificates: Certifikat[];
  instructor_info: Instruktor[] | null;
}

interface ZaposleniFilter {
  pretraga: string;
  status: "svi" | "active" | "inactive" | "on_leave";
  aerodrom: string;
  odjeljenje: string;
  samoInstruktori: boolean;
  samoBezCertifikata: boolean;
  certifikatIsticeUskoro: boolean;
}

interface ClientZaposleniPageProps {
  initialZaposleni: Zaposleni[];
}

export default function ClientZaposleniPage({ initialZaposleni }: ClientZaposleniPageProps) {
  const [zaposleni] = useState<Zaposleni[]>(initialZaposleni);
  const [filter, setFilter] = useState<ZaposleniFilter>({
    pretraga: "",
    status: "svi",
    aerodrom: "svi",
    odjeljenje: "svi",
    samoInstruktori: false,
    samoBezCertifikata: false,
    certifikatIsticeUskoro: false,
  });

  // Funkcija za dobijanje radne pozicije (prilagođena kao u server komponenti)
  const dobijRadnuPoziciju = (pozicija: RadnaPozicija | null): RadnaPozicija | null => {
    if (!pozicija) {
      return null;
    }
    return pozicija;
  };

  // Funkcija za određivanje najranijeg datuma isteka certifikata
  const pronadjiNajranijiIstek = (certifikati: Certifikat[]): {
    najranijiDatum: string | null;
    brojCertifikata: number;
    brojIsticeUskoro: number;
    imaIsteklih: boolean;
  } => {
    if (!certifikati || certifikati.length === 0) {
      return {
        najranijiDatum: null,
        brojCertifikata: 0,
        brojIsticeUskoro: 0,
        imaIsteklih: false,
      };
    }

    const validniCertifikati = certifikati.filter((cert) => cert.expiry_date && cert.status === "valid");

    if (validniCertifikati.length === 0) {
      const imaIsteklih = certifikati.some((cert) => {
        if (!cert.expiry_date) return false;
        const datum = new Date(cert.expiry_date);
        return datum < new Date();
      });

      return {
        najranijiDatum: null,
        brojCertifikata: certifikati.length,
        brojIsticeUskoro: 0,
        imaIsteklih,
      };
    }

    // Pronađi najraniji datum isteka
    const datumiIsteka = validniCertifikati
      .map((cert) => cert.expiry_date)
      .filter((datum): datum is string => datum !== null)
      .sort();

    const najranijiDatum = datumiIsteka[0];

    // Izračunaj koliko certifikata ističe u narednih 30 dana
    const danas = new Date();
    const tridesetDanaOdSada = new Date();
    tridesetDanaOdSada.setDate(danas.getDate() + 30);

    const brojIsticeUskoro = validniCertifikati.filter((cert) => {
      if (!cert.expiry_date) return false;
      const datumIsteka = new Date(cert.expiry_date);
      return datumIsteka <= tridesetDanaOdSada && datumIsteka >= danas;
    }).length;

    // Proveri da li ima isteklih certifikata
    const imaIsteklih = certifikati.some((cert) => {
      if (!cert.expiry_date) return false;
      const datum = new Date(cert.expiry_date);
      return datum < danas && cert.status === "valid";
    });

    return {
      najranijiDatum,
      brojCertifikata: validniCertifikati.length,
      brojIsticeUskoro,
      imaIsteklih,
    };
  };

  // Funkcija za određivanje CSS klase za datum isteka
  const dobijKlaseZaDatumIsteka = (
    datum: string | null,
    imaIsteklih: boolean = false
  ): string => {
    if (!datum) {
      return imaIsteklih
        ? "bg-red-100 text-red-800 border border-red-200"
        : "bg-gray-100 text-gray-800";
    }

    const datumIsteka = new Date(datum);
    const danas = new Date();
    const razlikaUDanima = Math.floor((datumIsteka.getTime() - danas.getTime()) / (1000 * 60 * 60 * 24));

    if (razlikaUDanima < 0) {
      // Istekao
      return "bg-red-100 text-red-800 border border-red-200";
    } else if (razlikaUDanima <= 7) {
      // Ističe za 7 dana
      return "bg-red-100 text-red-800 border border-red-200 animate-pulse";
    } else if (razlikaUDanima <= 30) {
      // Ističe za 30 dana
      return "bg-amber-100 text-amber-800 border border-amber-200";
    } else {
      // Više od 30 dana
      return "bg-green-100 text-green-800 border border-green-200";
    }
  };

  // Funkcija za formatiranje datuma
  const formatirajDatum = (datum: string | null): string => {
    if (!datum) return "Bez isteka";
    return new Date(datum).toLocaleDateString("sr-RS");
  };

  // Funkcija za dobijanje jedinstvenih aerodroma
  const jedinstveniAerodromi = useMemo(() => {
    const aerodromi = new Set<string>(["svi"]);
    zaposleni.forEach((zaposlen) => {
      const odjeljenje = dobijRadnuPoziciju(zaposlen.working_positions)?.department;
      if (odjeljenje) {
        aerodromi.add(odjeljenje);
      }
    });
    return Array.from(aerodromi).sort();
  }, [zaposleni]);

  // Funkcija za dobijanje jedinstvenih odjeljenja/pozicija
  const jedinstvenePozicije = useMemo(() => {
    const pozicije = new Set<string>(["svi"]);
    zaposleni.forEach((zaposlen) => {
      const radnaPozicija = dobijRadnuPoziciju(zaposlen.working_positions)?.title;
      if (radnaPozicija) {
        pozicije.add(radnaPozicija);
      }
    });
    return Array.from(pozicije).sort();
  }, [zaposleni]);

  // Filtriranje zaposlenih
  const filtriraniZaposleni = useMemo(() => {
    return zaposleni.filter((zaposlen) => {
      // Filter pretrage
      if (filter.pretraga) {
        const pretraga = filter.pretraga.toLowerCase();
        const imePrezime = `${zaposlen.first_name} ${zaposlen.last_name}`.toLowerCase();
        const brojZaposlenog = zaposlen.employee_number.toLowerCase();
        const email = zaposlen.email?.toLowerCase() || "";
        const telefon = zaposlen.phone?.toLowerCase() || "";
        const odjeljenje = dobijRadnuPoziciju(zaposlen.working_positions)?.department?.toLowerCase() || "";

        if (
          !imePrezime.includes(pretraga) &&
          !brojZaposlenog.includes(pretraga) &&
          !email.includes(pretraga) &&
          !telefon.includes(pretraga) &&
          !odjeljenje.includes(pretraga)
        ) {
          return false;
        }
      }

      // Filter statusa
      if (filter.status !== "svi" && zaposlen.status !== filter.status) {
        return false;
      }

      // Filter aerodroma
      if (filter.aerodrom !== "svi") {
        const odjeljenje = dobijRadnuPoziciju(zaposlen.working_positions)?.department;
        if (odjeljenje !== filter.aerodrom) {
          return false;
        }
      }

      // Filter odjeljenja
      if (filter.odjeljenje !== "svi") {
        const radnaPozicija = dobijRadnuPoziciju(zaposlen.working_positions)?.title;
        if (radnaPozicija !== filter.odjeljenje) {
          return false;
        }
      }

      // Filter samo instruktori
      if (filter.samoInstruktori && (!zaposlen.instructor_info || zaposlen.instructor_info.length === 0)) {
        return false;
      }

      // Filter samo bez certifikata
      if (filter.samoBezCertifikata && zaposlen.training_certificates.length > 0) {
        return false;
      }

      // Filter certifikati koji ističu uskoro
      if (filter.certifikatIsticeUskoro) {
        const infoOisteku = pronadjiNajranijiIstek(zaposlen.training_certificates);
        if (infoOisteku.brojIsticeUskoro === 0 && !infoOisteku.imaIsteklih) {
          return false;
        }
      }

      return true;
    });
  }, [zaposleni, filter]);

  const handleResetFiltera = () => {
    setFilter({
      pretraga: "",
      status: "svi",
      aerodrom: "svi",
      odjeljenje: "svi",
      samoInstruktori: false,
      samoBezCertifikata: false,
      certifikatIsticeUskoro: false,
    });
  };

  const handleCheckboxChange = (field: keyof ZaposleniFilter) => {
    setFilter((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  return (
    <>
      {/* Filter sekcija */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-6">
            {/* Pretraga */}
            <div className="space-y-2">
              <Label htmlFor="pretraga" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Pretraga
              </Label>
              <Input
                id="pretraga"
                placeholder="Ime, prezime, broj zaposlenog, email, telefon..."
                value={filter.pretraga}
                onChange={(e) => setFilter({ ...filter, pretraga: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">Status zaposlenog</Label>
                <Select
                  value={filter.status}
                  onValueChange={(value: ZaposleniFilter["status"]) =>
                    setFilter({ ...filter, status: value })
                  }
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="svi">Svi statusi</SelectItem>
                    <SelectItem value="active">Aktivni</SelectItem>
                    <SelectItem value="inactive">Neaktivni</SelectItem>
                    <SelectItem value="on_leave">Na odsustvu</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Aerodrom */}
              <div className="space-y-2">
                <Label htmlFor="aerodrom" className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Aerodrom / Lokacija
                </Label>
                <Select
                  value={filter.aerodrom}
                  onValueChange={(value) => setFilter({ ...filter, aerodrom: value })}
                >
                  <SelectTrigger id="aerodrom">
                    <SelectValue placeholder="Svi aerodromi" />
                  </SelectTrigger>
                  <SelectContent>
                    {jedinstveniAerodromi.map((aerodrom) => (
                      <SelectItem key={aerodrom} value={aerodrom}>
                        {aerodrom === "svi" ? "Svi aerodromi" : aerodrom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Odjeljenje */}
              <div className="space-y-2">
                <Label htmlFor="odjeljenje">Odjeljenje / Pozicija</Label>
                <Select
                  value={filter.odjeljenje}
                  onValueChange={(value) => setFilter({ ...filter, odjeljenje: value })}
                >
                  <SelectTrigger id="odjeljenje">
                    <SelectValue placeholder="Sva odjeljenja" />
                  </SelectTrigger>
                  <SelectContent>
                    {jedinstvenePozicije.map((pozicija) => (
                      <SelectItem key={pozicija} value={pozicija}>
                        {pozicija === "svi" ? "Sva odjeljenja" : pozicija}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Reset dugme */}
              <div className="space-y-2">
                <Label className="opacity-0">Akcije</Label>
                <Button
                  variant="outline"
                  onClick={handleResetFiltera}
                  className="w-full gap-2"
                >
                  <X className="h-4 w-4" />
                  Resetuj filtere
                </Button>
              </div>
            </div>

            {/* Dodatni filteri */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="samo-instruktori"
                  checked={filter.samoInstruktori}
                  onCheckedChange={() => handleCheckboxChange("samoInstruktori")}
                />
                <Label
                  htmlFor="samo-instruktori"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2 cursor-pointer"
                >
                  <UserCheck className="h-4 w-4 text-purple-600" />
                  Samo instruktori
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="samo-bez-certifikata"
                  checked={filter.samoBezCertifikata}
                  onCheckedChange={() => handleCheckboxChange("samoBezCertifikata")}
                />
                <Label
                  htmlFor="samo-bez-certifikata"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Samo bez certifikata
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="certifikat-istice-uskoro"
                  checked={filter.certifikatIsticeUskoro}
                  onCheckedChange={() => handleCheckboxChange("certifikatIsticeUskoro")}
                />
                <Label
                  htmlFor="certifikat-istice-uskoro"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2 cursor-pointer"
                >
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  Certifikati ističu uskoro
                </Label>
              </div>
            </div>

            {/* Aktivni filteri */}
            {(filter.pretraga ||
              filter.status !== "svi" ||
              filter.aerodrom !== "svi" ||
              filter.odjeljenje !== "svi" ||
              filter.samoInstruktori ||
              filter.samoBezCertifikata ||
              filter.certifikatIsticeUskoro) && (
              <div className="pt-4 border-t">
                <div className="flex items-center gap-2 mb-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Aktivni filteri:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {filter.pretraga && (
                    <Badge variant="secondary" className="gap-1">
                      Pretraga: {filter.pretraga}
                      <button
                        onClick={() => setFilter({ ...filter, pretraga: "" })}
                        className="h-4 w-4 p-0 ml-1 bg-transparent border-none cursor-pointer hover:bg-transparent"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {filter.status !== "svi" && (
                    <Badge variant="secondary" className="gap-1">
                      Status: {filter.status === "active" ? "Aktivni" : "Neaktivni"}
                      <button
                        onClick={() => setFilter({ ...filter, status: "svi" })}
                        className="h-4 w-4 p-0 ml-1 bg-transparent border-none cursor-pointer hover:bg-transparent"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {filter.aerodrom !== "svi" && (
                    <Badge variant="secondary" className="gap-1">
                      Aerodrom: {filter.aerodrom}
                      <button
                        onClick={() => setFilter({ ...filter, aerodrom: "svi" })}
                        className="h-4 w-4 p-0 ml-1 bg-transparent border-none cursor-pointer hover:bg-transparent"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {filter.odjeljenje !== "svi" && (
                    <Badge variant="secondary" className="gap-1">
                      Odjeljenje: {filter.odjeljenje}
                      <button
                        onClick={() => setFilter({ ...filter, odjeljenje: "svi" })}
                        className="h-4 w-4 p-0 ml-1 bg-transparent border-none cursor-pointer hover:bg-transparent"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {filter.samoInstruktori && (
                    <Badge variant="secondary" className="gap-1">
                      Samo instruktori
                      <button
                        onClick={() => handleCheckboxChange("samoInstruktori")}
                        className="h-4 w-4 p-0 ml-1 bg-transparent border-none cursor-pointer hover:bg-transparent"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {filter.samoBezCertifikata && (
                    <Badge variant="secondary" className="gap-1">
                      Samo bez certifikata
                      <button
                        onClick={() => handleCheckboxChange("samoBezCertifikata")}
                        className="h-4 w-4 p-0 ml-1 bg-transparent border-none cursor-pointer hover:bg-transparent"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {filter.certifikatIsticeUskoro && (
                    <Badge variant="secondary" className="gap-1">
                      Certifikati ističu
                      <button
                        onClick={() => handleCheckboxChange("certifikatIsticeUskoro")}
                        className="h-4 w-4 p-0 ml-1 bg-transparent border-none cursor-pointer hover:bg-transparent"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle>
            Svi Zaposleni ({filtriraniZaposleni.length} od {zaposleni.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filtriraniZaposleni.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">Nema zaposlenih koji odgovaraju filterima</p>
              <Button variant="outline" onClick={handleResetFiltera}>
                Poništi filtere
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">Ime i prezime</TableHead>
                    <TableHead className="font-semibold">Kontakt</TableHead>
                    <TableHead className="font-semibold">Radna pozicija</TableHead>
                    <TableHead className="font-semibold">Odsjek / Aerodrom</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Najraniji istek certifikata</TableHead>
                    <TableHead className="font-semibold text-right">Akcije</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtriraniZaposleni.map((zaposlen) => {
                    const radnaPozicija = dobijRadnuPoziciju(zaposlen.working_positions);
                    const infoOisteku = pronadjiNajranijiIstek(zaposlen.training_certificates);
                    const jeInstruktor = zaposlen.instructor_info && zaposlen.instructor_info.length > 0;

                    return (
                      <TableRow key={zaposlen.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span>
                                {zaposlen.first_name} {zaposlen.last_name}
                              </span>
                              {jeInstruktor && (
                                <Badge className="bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-100">
                                  <UserCheck className="h-3 w-3 mr-1" />
                                  Instruktor
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground font-mono">
                              {zaposlen.employee_number}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {zaposlen.email && (
                              <a
                                href={`mailto:${zaposlen.email}`}
                                className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                              >
                                <Mail className="h-3 w-3" />
                                {zaposlen.email}
                              </a>
                            )}
                            {zaposlen.phone && (
                              <div className="text-sm text-muted-foreground flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {zaposlen.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{radnaPozicija?.title || "Nepoznato"}</span>
                            {radnaPozicija?.code && (
                              <div className="text-xs text-muted-foreground">
                                Šifra: {radnaPozicija.code}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{radnaPozicija?.department || "N/A"}</span>
                            {zaposlen.hire_date && (
                              <div className="text-xs text-muted-foreground">
                                Zaposlen: {new Date(zaposlen.hire_date).toLocaleDateString("sr-RS")}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge variant={zaposlen.status === "active" ? "default" : "secondary"}>
                              {zaposlen.status === "active" ? "Aktivan" : "Neaktivan"}
                            </Badge>
                            {zaposlen.termination_date && (
                              <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                                Do: {new Date(zaposlen.termination_date).toLocaleDateString("sr-RS")}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <div
                              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs ${dobijKlaseZaDatumIsteka(
                                infoOisteku.najranijiDatum,
                                infoOisteku.imaIsteklih
                              )}`}
                            >
                              <Calendar className="h-3 w-3" />
                              <span>{formatirajDatum(infoOisteku.najranijiDatum)}</span>
                              {(infoOisteku.brojIsticeUskoro > 0 || infoOisteku.imaIsteklih) && (
                                <AlertTriangle className="h-3 w-3 ml-1" />
                              )}
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>{infoOisteku.brojCertifikata} cert.</span>
                              {infoOisteku.brojIsticeUskoro > 0 && (
                                <span className="text-amber-600 font-semibold">
                                  {infoOisteku.brojIsticeUskoro} ističe
                                </span>
                              )}
                              {infoOisteku.imaIsteklih && (
                                <span className="text-red-600 font-semibold">Istekao</span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Link href={`/dashboard/employees/${zaposlen.id}`}>
                              <Button variant="ghost" size="sm">
                                Detalji
                              </Button>
                            </Link>
                            <Link href={`/dashboard/employees/${zaposlen.id}/edit`}>
                              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Link href={`/dashboard/employees/${zaposlen.id}/certificates`}>
                              <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700">
                                <Calendar className="h-4 w-4" />
                              </Button>
                            </Link>
                            {jeInstruktor && (
                              <Link href={`/dashboard/instructors?staff_id=${zaposlen.id}`}>
                                <Button variant="ghost" size="sm" className="text-purple-600 hover:text-purple-700">
                                  <UserCheck className="h-4 w-4" />
                                </Button>
                              </Link>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}