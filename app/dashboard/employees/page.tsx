import { getSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, AlertTriangle, Calendar, UserCheck, User, Building } from "lucide-react";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ClientZaposleniPage from "./ClientZaposleniPage";

// Definisanje tipova - prilagođeno kao u klijentskoj komponenti
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

async function ucitajZaposlene(): Promise<Zaposleni[]> {
  const supabase = await getSupabaseServerClient();

  try {
    // Učitaj osnovne podatke o zaposlenima sa radnom pozicijom
    const { data: osnovniPodaci, error: osnovnaGreska } = await supabase
      .from("staff")
      .select(`
        id,
        first_name,
        last_name,
        email,
        phone,
        employee_number,
        status,
        hire_date,
        termination_date,
        position_id,
        working_positions:position_id (
          title,
          code,
          department
        )
      `)
      .order("last_name", { ascending: true });

    if (osnovnaGreska) {
      console.error("Greška pri učitavanju osnovnih podataka:", osnovnaGreska);
      return [];
    }

    if (!osnovniPodaci) {
      return [];
    }

    // Učitaj sve instruktore odjednom
    const { data: sviInstruktori, error: greskaInstruktori } = await supabase
      .from("instructors")
      .select("id, staff_id, status")
      .eq("status", "active");

    if (greskaInstruktori) {
      console.error("Greška pri učitavanju instruktora:", greskaInstruktori);
    }

    const mapaInstruktora = new Map<string, Instruktor[]>();
    if (sviInstruktori) {
      sviInstruktori.forEach((instruktor) => {
        const trenutni = mapaInstruktora.get(instruktor.staff_id) || [];
        mapaInstruktora.set(instruktor.staff_id, [...trenutni, instruktor]);
      });
    }

    // Za svakog zaposlenog učitaj certifikate paralelno
    const zaposleniSaCertifikatima = await Promise.all(
      osnovniPodaci.map(async (zaposleni) => {
        // Učitaj certifikate
        const { data: podaciCertifikata, error: greskaCertifikata } = await supabase
          .from("training_certificate_records")
          .select(`
            id,
            certificate_number,
            expiry_date,
            status,
            training_certificates_master:training_master_id (
              title,
              code
            )
          `)
          .eq("staff_id", zaposleni.id)
          .eq("status", "valid")
          .order("expiry_date", { ascending: true });

        if (greskaCertifikata) {
          console.error(`Greška pri učitavanju certifikata za ${zaposleni.employee_number}:`, greskaCertifikata);
        }

        return {
          ...zaposleni,
          working_positions: zaposleni.working_positions as unknown as RadnaPozicija | null, // Promenjeno iz niza u objekat
          training_certificates: (podaciCertifikata || []) as Certifikat[],
          instructor_info: mapaInstruktora.get(zaposleni.id) || null,
        };
      })
    );

    return zaposleniSaCertifikatima;
  } catch (error) {
    console.error("Greška pri učitavanju podataka:", error);
    return [];
  }
}

export default async function StranicaZaposlenih() {
  const zaposleni = await ucitajZaposlene();

  // Izračunaj ukupne statistike
  const ukupnoZaposlenih = zaposleni.length;
  const zaposleniSaCertifikatima = zaposleni.filter((z) => z.training_certificates.length > 0).length;
  const instruktori = zaposleni.filter((z) => z.instructor_info && z.instructor_info.length > 0).length;
  const certifikataIsticeUskoro = zaposleni.reduce((total, zaposlen) => {
    const danas = new Date();
    const tridesetDanaOdSada = new Date();
    tridesetDanaOdSada.setDate(danas.getDate() + 30);

    const certifikatiIsticeUskoro = zaposlen.training_certificates.filter((cert) => {
      if (!cert.expiry_date) return false;
      const datumIsteka = new Date(cert.expiry_date);
      return datumIsteka <= tridesetDanaOdSada && datumIsteka >= danas && cert.status === "valid";
    }).length;

    return total + certifikatiIsticeUskoro;
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Zaposleni</h1>
          <p className="text-muted-foreground">Upravljajte bazom zaposlenih i prate njihove certifikate</p>
        </div>
        <Link href="/dashboard/employees/new">
          <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
            <Plus className="mr-2 h-4 w-4" />
            Novi Zaposleni
          </button>
        </Link>
      </div>

      {/* Statistika */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ukupno zaposlenih</p>
                <p className="text-2xl font-bold">{ukupnoZaposlenih}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sa certifikatima</p>
                <p className="text-2xl font-bold text-green-600">{zaposleniSaCertifikatima}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Instruktori</p>
                <p className="text-2xl font-bold text-purple-600">{instruktori}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                <UserCheck className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cert. ističe uskoro</p>
                <p className="text-2xl font-bold text-amber-600">{certifikataIsticeUskoro}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Client komponenta za prikaz i filtere */}
      <ClientZaposleniPage initialZaposleni={zaposleni} />
    </div>
  );
}