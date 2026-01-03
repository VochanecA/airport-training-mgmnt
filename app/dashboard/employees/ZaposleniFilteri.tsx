"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Filter, X, Building, UserCheck,Calendar  } from "lucide-react";
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface ZaposleniFilter {
  pretraga: string;
  status: "svi" | "active" | "inactive" | "on_leave";
  aerodrom: string;
  odjeljenje: string;
  samoInstruktori: boolean;
  samoBezCertifikata: boolean;
  certifikatIsticeUskoro: boolean;
}

interface ZaposleniFilteriProps {
  aerodromi: string[];
  pozicije: string[];
  initialFilter?: Partial<ZaposleniFilter>;
  onFilterChange?: (filter: ZaposleniFilter) => void;
}

export default function ZaposleniFilteri({
  aerodromi,
  pozicije,
  initialFilter,
  onFilterChange,
}: ZaposleniFilteriProps) {
  const [filter, setFilter] = useState<ZaposleniFilter>({
    pretraga: "",
    status: "svi",
    aerodrom: "svi",
    odjeljenje: "svi",
    samoInstruktori: false,
    samoBezCertifikata: false,
    certifikatIsticeUskoro: false,
    ...initialFilter,
  });

  // Debounced filter change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onFilterChange) {
        onFilterChange(filter);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [filter, onFilterChange]);

  const handleReset = () => {
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
                  <SelectItem value="svi">Svi aerodromi</SelectItem>
                  {aerodromi.map((aerodrom) => (
                    <SelectItem key={aerodrom} value={aerodrom}>
                      {aerodrom}
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
                  <SelectItem value="svi">Sva odjeljenja</SelectItem>
                  {pozicije.map((pozicija) => (
                    <SelectItem key={pozicija} value={pozicija}>
                      {pozicija}
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
                onClick={handleReset}
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
                <Calendar className="h-4 w-4 text-amber-600" />
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
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 ml-1"
                      onClick={() => setFilter({ ...filter, pretraga: "" })}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
                {filter.status !== "svi" && (
                  <Badge variant="secondary" className="gap-1">
                    Status: {filter.status === "active" ? "Aktivni" : "Neaktivni"}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 ml-1"
                      onClick={() => setFilter({ ...filter, status: "svi" })}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
                {filter.aerodrom !== "svi" && (
                  <Badge variant="secondary" className="gap-1">
                    Aerodrom: {filter.aerodrom}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 ml-1"
                      onClick={() => setFilter({ ...filter, aerodrom: "svi" })}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
                {filter.odjeljenje !== "svi" && (
                  <Badge variant="secondary" className="gap-1">
                    Odjeljenje: {filter.odjeljenje}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 ml-1"
                      onClick={() => setFilter({ ...filter, odjeljenje: "svi" })}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
                {filter.samoInstruktori && (
                  <Badge variant="secondary" className="gap-1">
                    Samo instruktori
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 ml-1"
                      onClick={() => handleCheckboxChange("samoInstruktori")}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
                {filter.samoBezCertifikata && (
                  <Badge variant="secondary" className="gap-1">
                    Samo bez certifikata
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 ml-1"
                      onClick={() => handleCheckboxChange("samoBezCertifikata")}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
                {filter.certifikatIsticeUskoro && (
                  <Badge variant="secondary" className="gap-1">
                    Certifikati ističu
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 ml-1"
                      onClick={() => handleCheckboxChange("certifikatIsticeUskoro")}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}