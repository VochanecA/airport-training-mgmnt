"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Download, FileText, Users, BookOpen } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Badge } from "@/components/ui/badge";

// Type definitions
interface StaffMember {
  id: string;
  first_name: string;
  last_name: string;
  employee_number: string;
  email?: string;
  position_id?: string;
  status: string;
}

interface TrainingCertificateMaster {
  id: string;
  code: string;
  title: string;
  validity_months?: number;
}

interface Instructor {
  id: string;
  staff_id: string;
  instructor_code?: string;
  staff_name?: string;
  status: string;
}

interface TrainingCheckResult {
  all_completed: boolean;
  missing_trainings_count: number;
  missing_trainings: Array<{
    training_type_id: string;
    training_name: string;
    training_code: string;
    is_mandatory: boolean;
  }>;
}

interface EmployeeTrainingInfo {
  totalRequired: number;
  completed: number;
  missing: Array<{
    training_type_id: string;
    training_name: string;
    training_code: string;
    is_mandatory: boolean;
  }>;
}

interface FormData {
  staff_id: string;
  training_master_id: string;
  certificate_number: string;
  issue_date: string;
  expiry_date: string;
  status: "valid" | "expired" | "revoked";
  issued_by: string;
  notes: string;
  grade: string;
  instructor_id: string;
  instructor_name: string;
  training_provider: string;
  completion_date: string;
}

interface CertificateData {
  certificate_number?: string;
  issue_date?: string;
  expiry_date?: string;
  status?: string;
  issued_by?: string;
  notes?: string;
  grade?: string;
  instructor_name?: string;
  training_provider?: string;
}

export default function NewCertificatePage() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState("");
  const [employees, setEmployees] = useState<StaffMember[]>([]);
  const [trainings, setTrainings] = useState<TrainingCertificateMaster[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [employeeTrainingInfo, setEmployeeTrainingInfo] =
    useState<EmployeeTrainingInfo | null>(null);

  const [formData, setFormData] = useState<FormData>({
    staff_id: "",
    training_master_id: "",
    certificate_number: "",
    issue_date: new Date().toISOString().split("T")[0] || "",
    expiry_date: "",
    status: "valid",
    issued_by: "",
    notes: "",
    grade: "",
    instructor_id: "",
    instructor_name: "",
    training_provider: "",
    completion_date: new Date().toISOString().split("T")[0] || "",
  });

  useEffect(() => {
    async function loadData() {
      try {
        setLoadingData(true);

        // Load employees
        const { data: staffData, error: staffError } = await supabase
          .from("staff")
          .select(
            `
            id,
            first_name,
            last_name,
            employee_number,
            email,
            position_id,
            status
          `
          )
          .eq("status", "active")
          .order("last_name", { ascending: true });

        if (staffError) {
          console.error("Greška pri učitavanju zaposlenih:", staffError);
          throw new Error(
            `Greška pri učitavanju zaposlenih: ${staffError.message || "Nepoznata greška"}`
          );
        }

        // Load trainings
        const { data: trainingsData, error: trainingsError } = await supabase
          .from("training_certificates_master")
          .select("id, code, title, validity_months")
          .eq("is_active", true)
          .order("title");

        if (trainingsError) {
          console.error("Greška pri učitavanju obuka:", trainingsError);
          // Nastavi bez obuka
        }

        // Load instructors with staff names
        const { data: instructorsData, error: instructorsError } = await supabase
          .from("instructors")
          .select(`
            id,
            staff_id,
            instructor_code,
            status,
            staff!inner(first_name, last_name)
          `)
          .eq("status", "active")
          .order("staff(last_name)", { ascending: true });

        if (instructorsError) {
          console.error("Greška pri učitavanju instruktora:", instructorsError);
          // Nastavi bez instruktora
        } else {
          // Formatiraj instruktore sa imenima
          const formattedInstructors = (instructorsData || []).map(instructor => ({
            ...instructor,
            staff_name: `${instructor.staff.first_name} ${instructor.staff.last_name}`
          }));
          setInstructors(formattedInstructors);
        }

        setEmployees(staffData || []);
        setTrainings(trainingsData || []);

        if (!staffData || staffData.length === 0) {
          toast({
            title: "Nema zaposlenih",
            description:
              "Nema aktivnih zaposlenih u sistemu. Molimo prvo dodajte zaposlene.",
            variant: "destructive",
          });
        }
      } catch (err: unknown) {
        console.error("Kritična greška pri učitavanju podataka:", err);
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Došlo je do nepoznate greške pri učitavanju podataka";
        setError(errorMessage);

        toast({
          title: "Greška pri učitavanju",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setLoadingData(false);
      }
    }
    loadData();
  }, [supabase, toast]);

  // Load employee training info when staff is selected
  useEffect(() => {
    const loadEmployeeTrainingInfo = async (staffId: string) => {
      try {
        const { data: employee } = await supabase
          .from("staff")
          .select("position_id")
          .eq("id", staffId)
          .single();

        if (!employee?.position_id) {
          setEmployeeTrainingInfo(null);
          return;
        }

        // Check training completeness using RPC function
        const { data, error } = await supabase.rpc(
          "check_required_trainings_completed",
          {
            p_staff_id: staffId,
            p_position_id: employee.position_id,
          }
        );

        if (error) {
          console.error("Greška pri proveri završenosti obuka:", error);
          setEmployeeTrainingInfo(null);
          return;
        }

        const result = data?.[0] as TrainingCheckResult | undefined;

        if (result) {
          const totalRequired =
            result.missing_trainings_count +
            (result.all_completed ? 0 : result.missing_trainings?.length || 0);

          setEmployeeTrainingInfo({
            totalRequired,
            completed: totalRequired - result.missing_trainings_count,
            missing: result.missing_trainings || [],
          });
        }
      } catch (err) {
        console.error("Greška pri učitavanju informacija o obukama zaposlenog:", err);
        setEmployeeTrainingInfo(null);
      }
    };

    if (formData.staff_id) {
      loadEmployeeTrainingInfo(formData.staff_id);
    } else {
      setEmployeeTrainingInfo(null);
    }
  }, [formData.staff_id, supabase]);

  const calculateExpiryDate = (issueDate: string, validityMonths = 12): string => {
    if (!issueDate) return "";
    const date = new Date(issueDate);
    date.setMonth(date.getMonth() + validityMonths);
    return date.toISOString().split("T")[0] || "";
  };

  // Handle training change
  const handleTrainingChange = (trainingId: string) => {
    const selectedTraining = trainings.find((t) => t.id === trainingId);
    if (selectedTraining && formData.issue_date) {
      const expiryDate = calculateExpiryDate(
        formData.issue_date,
        selectedTraining.validity_months || 12
      );
      setFormData((prev) => ({
        ...prev,
        training_master_id: trainingId,
        expiry_date: expiryDate,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        training_master_id: trainingId,
      }));
    }
  };

  // Handle instructor change
  const handleInstructorChange = (instructorId: string) => {
    const selectedInstructor = instructors.find((i) => i.id === instructorId);
    setFormData((prev) => ({
      ...prev,
      instructor_id: instructorId,
      instructor_name: selectedInstructor?.staff_name || "",
    }));
  };

  // Handle issue date change
  const handleIssueDateChange = (date: string) => {
    const selectedTraining = trainings.find(
      (t) => t.id === formData.training_master_id
    );
    if (selectedTraining) {
      const expiryDate = calculateExpiryDate(
        date,
        selectedTraining.validity_months || 12
      );
      setFormData((prev) => ({
        ...prev,
        issue_date: date,
        expiry_date: expiryDate,
        completion_date: date,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        issue_date: date,
        completion_date: date,
      }));
    }
  };

  // Check if employee has completed all required trainings
  const checkEmployeeTrainingCompleteness = async (
    staffId: string
  ): Promise<{
    canIssue: boolean;
    message: string;
    missingTrainings?: Array<{
      training_type_id: string;
      training_name: string;
      training_code: string;
      is_mandatory: boolean;
    }>;
  }> => {
    try {
      const { data: employee } = await supabase
        .from("staff")
        .select("position_id")
        .eq("id", staffId)
        .single();

      if (!employee?.position_id) {
        return {
          canIssue: false,
          message: "Zaposleni nema definisanu poziciju",
        };
      }

      // Call RPC function to check training completeness
      const { data, error } = await supabase.rpc(
        "check_required_trainings_completed",
        {
          p_staff_id: staffId,
          p_position_id: employee.position_id,
        }
      );

      if (error) throw error;

      const result = data?.[0] as TrainingCheckResult | undefined;

      if (!result) {
        return {
          canIssue: false,
          message: "Nije moguće provjeriti status završenosti obuka",
        };
      }

      if (result.all_completed) {
        return {
          canIssue: true,
          message: "Zaposleni je završio sve obavezne obuke",
        };
      } else {
        return {
          canIssue: false,
          message: `Zaposleni nije završio sve obavezne obuke. Nedostaje ${result.missing_trainings_count} obuka.`,
          missingTrainings: result.missing_trainings,
        };
      }
    } catch (err: unknown) {
      console.error("Greška pri proveri završenosti obuka:", err);
      return {
        canIssue: false,
        message: `Greška pri proveri završenosti obuka: ${
          err instanceof Error ? err.message : "Nepoznata greška"
        }`,
      };
    }
  };

  // Generate PDF certificate
  const generatePDF = (
    certificateData: CertificateData,
    employee: StaffMember | undefined,
    training: TrainingCertificateMaster | undefined
  ) => {
    const doc = new jsPDF();

    // Logo and header
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text("POTVRDA", 105, 30, { align: "center" });

    doc.setFontSize(14);
    doc.setTextColor(100, 100, 100);
    doc.text("POTVRDA O ZAVRŠENOJ OBUCI", 105, 40, { align: "center" });

    // Line under title
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 45, 190, 45);

    // Employee data
    const employeeName = employee
      ? `${employee.first_name} ${employee.last_name}`
      : "N/A";
    const employeeNumber = employee?.employee_number || "N/A";
    const employeeEmail = employee?.email || "N/A";

    // Certificate data
    const trainingName =
      training?.title || certificateData.notes || "Opšta potvrda";
    const trainingCode = training?.code || "GENERAL-CERT";

    // Data table
    autoTable(doc, {
      startY: 60,
      head: [["Podatak", "Vrijednost"]],
      body: [
        ["Broj potvrde", certificateData.certificate_number || "N/A"],
        ["Ime i prezime", employeeName],
        ["Broj zaposlenog", employeeNumber],
        ["Email", employeeEmail],
        ["Naziv obuke", trainingName],
        ["Šifra obuke", trainingCode],
        [
          "Datum izdavanja",
          certificateData.issue_date
            ? new Date(certificateData.issue_date).toLocaleDateString("sr-RS")
            : "N/A",
        ],
        [
          "Datum isteka",
          certificateData.expiry_date
            ? new Date(certificateData.expiry_date).toLocaleDateString("sr-RS")
            : "N/A",
        ],
        ["Ocjena", certificateData.grade || "N/A"],
        ["Instruktor", certificateData.instructor_name || "N/A"],
        ["Izdao", certificateData.issued_by || "N/A"],
        ["Status", certificateData.status === "valid" ? "Važeći" : "Nevažeći"],
      ],
      theme: "striped",
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      styles: { fontSize: 10, cellPadding: 5 },
    });

    // Notes
    if (certificateData.notes) {
      doc.setFontSize(11);
      doc.setTextColor(60, 60, 60);
      doc.text("Napomene:", 20, doc.internal.pageSize.height - 60);
      doc.setFontSize(10);
      const splitNotes = doc.splitTextToSize(certificateData.notes, 170);
      doc.text(splitNotes, 20, doc.internal.pageSize.height - 50);
    }

    // Signature
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Potpis i pečat:", 20, doc.internal.pageSize.height - 20);
    doc.line(
      60,
      doc.internal.pageSize.height - 20,
      120,
      doc.internal.pageSize.height - 20
    );

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      "Dokument generisan u sistemu za upravljanje obukama",
      105,
      doc.internal.pageSize.height - 10,
      { align: "center" }
    );
    doc.text(
      new Date().toLocaleDateString("sr-RS"),
      105,
      doc.internal.pageSize.height - 5,
      { align: "center" }
    );

    // Save PDF
    const fileName = `potvrda_${
      certificateData.certificate_number || "nova"
    }_${employeeNumber}.pdf`;
    doc.save(fileName);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Validation
      if (!formData.staff_id) {
        throw new Error("Molimo odaberite zaposlenog");
      }
      if (!formData.certificate_number) {
        throw new Error("Molimo unesite broj potvrde");
      }
      if (!formData.issue_date) {
        throw new Error("Molimo unesite datum izdavanja");
      }

      // CHECK: Has employee completed all required trainings?
      const trainingCheck = await checkEmployeeTrainingCompleteness(
        formData.staff_id
      );

      if (!trainingCheck.canIssue) {
        // Ask for confirmation to continue
        const shouldContinue = window.confirm(
          `${trainingCheck.message}\n\nDa li želite da nastavite sa izdavanjem potvrde?`
        );

        if (!shouldContinue) {
          setLoading(false);
          return;
        }

        // Optionally: Save this information in notes
        if (trainingCheck.missingTrainings) {
          const missingList = trainingCheck.missingTrainings
            .map(
              (t) => `- ${t.training_name} (${t.training_code})`
            )
            .join("\n");

          formData.notes =
            `UPOZORENJE: Zaposleni nije završio sve obavezne obuke.\nNedostajuće obuke:\n${missingList}\n\n${
              formData.notes || ""
            }`;
        }
      }

      // If no training selected, use general certificate
      let training_master_id = formData.training_master_id;

      if (!training_master_id) {
        // Create general certificate if no specific training selected
        const { data: generalTraining, error: trainingError } = await supabase
          .from("training_certificates_master")
          .select("id")
          .eq("code", "GENERAL-CERT")
          .single();

        if (trainingError || !generalTraining) {
          // Create general certificate type if it doesn't exist
          const { data: newTraining, error: createError } = await supabase
            .from("training_certificates_master")
            .insert({
              code: "GENERAL-CERT",
              title: "Opšta potvrda",
              description: "Opšta potvrda bez specifične obuke",
              validity_months: 12,
              is_active: true,
              is_mandatory: false,
            })
            .select()
            .single();

          if (createError) {
            throw new Error(
              `Greška pri kreiranju opšte potvrde: ${createError.message}`
            );
          }
          training_master_id = newTraining.id;
        } else {
          training_master_id = generalTraining.id;
        }
      }

      // Create certificate record
      const recordData = {
        staff_id: formData.staff_id,
        training_master_id: training_master_id,
        certificate_number: formData.certificate_number.trim(),
        issue_date: formData.issue_date,
        expiry_date: formData.expiry_date || null,
        completion_date: formData.completion_date || formData.issue_date,
        status: formData.status,
        issued_by: formData.issued_by.trim() || null,
        notes: formData.notes.trim() || null,
        grade: formData.grade.trim() || null,
        instructor_name: formData.instructor_name.trim() || null,
        training_provider: formData.training_provider.trim() || null,
      };

      console.log("Podaci za čuvanje potvrde:", recordData);

      const { error: insertError, data: insertedData } = await supabase
        .from("training_certificate_records")
        .insert(recordData)
        .select();

      if (insertError) {
        console.error("Greška pri čuvanju potvrde:", insertError);
        if (insertError.code === "23505") {
          throw new Error("Potvrda sa ovim brojem već postoji");
        }
        throw new Error(
          `Greška pri čuvanju: ${insertError.message || "Nepoznata greška"}`
        );
      }

      // Get data for PDF
      const selectedEmployee = employees.find((e) => e.id === formData.staff_id);
      const selectedTraining = trainings.find(
        (t) => t.id === formData.training_master_id
      );

      // Generate PDF
      if (insertedData && insertedData[0]) {
        generatePDF(
          insertedData[0],
          selectedEmployee,
          selectedTraining
        );
      }

      // Show success message
      toast({
        title: "Potvrda uspješno kreirana",
        description: "Potvrda je sačuvana i PDF je preuzet",
      });

      // Return to certificates list
      setTimeout(() => {
        router.push("/dashboard/certificates");
        router.refresh();
      }, 1500);
    } catch (err: unknown) {
      console.error("Greška pri čuvanju potvrde:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Došlo je do greške pri čuvanju potvrde";
      setError(errorMessage);

      toast({
        title: "Greška",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Get selected employee and training
  const selectedEmployee = employees.find((e) => e.id === formData.staff_id);
  const selectedTraining = trainings.find(
    (t) => t.id === formData.training_master_id
  );
  const selectedInstructor = instructors.find(
    (i) => i.id === formData.instructor_id
  );

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
          <p className="mt-2 text-muted-foreground">Učitavanje podataka...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/certificates">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nova Potvrda</h1>
          <p className="text-muted-foreground">
            Izdajte novu potvrdu zaposlenom
          </p>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main form card */}
      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Kreiraj Novu Potvrdu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Left column */}
              <div className="space-y-4">
                {/* Employee selection */}
                <div className="space-y-2">
                  <Label htmlFor="staff_id">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Zaposleni <span className="text-red-500">*</span>
                    </div>
                    <span className="text-xs text-muted-foreground block mt-1">
                      Ukupno dostupnih zaposlenih: {employees.length}
                    </span>
                  </Label>
                  <Select
                    value={formData.staff_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, staff_id: value })
                    }
                    required
                    disabled={loading || employees.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          employees.length === 0
                            ? "Nema dostupnih zaposlenih"
                            : "Odaberite zaposlenog"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground">
                          Nema aktivnih zaposlenih. Molimo prvo dodajte zaposlene.
                        </div>
                      ) : (
                        employees.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            <div className="flex flex-col">
                              <span>
                                {emp.first_name} {emp.last_name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {emp.employee_number} •{" "}
                                {emp.email || "Nema email"}
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {employees.length === 0 && (
                    <p className="text-sm text-red-500">
                      Nema aktivnih zaposlenih. Molimo dodajte zaposlene kroz stranicu "Zaposleni".
                    </p>
                  )}
                </div>

                {/* Employee training status */}
                {employeeTrainingInfo && (
                  <div
                    className={`p-3 rounded-lg border ${
                      employeeTrainingInfo.completed ===
                      employeeTrainingInfo.totalRequired
                        ? "bg-green-50 border-green-200"
                        : "bg-yellow-50 border-yellow-200"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Status obuka za poziciju:</span>
                      <Badge
                        variant={
                          employeeTrainingInfo.completed ===
                          employeeTrainingInfo.totalRequired
                            ? "default"
                            : "destructive"
                        }
                      >
                        {employeeTrainingInfo.completed}/
                        {employeeTrainingInfo.totalRequired} obuka
                      </Badge>
                    </div>

                    {employeeTrainingInfo.completed ===
                    employeeTrainingInfo.totalRequired ? (
                      <p className="text-sm text-green-700">
                        ✅ Zaposleni je završio sve obavezne obuke za svoju poziciju.
                      </p>
                    ) : (
                      <div className="text-sm text-yellow-800">
                        <p className="font-semibold mb-2">
                          ⚠️ Zaposleni nije završio sve obavezne obuke:
                        </p>
                        <ul className="list-disc pl-5 space-y-1">
                          {employeeTrainingInfo.missing.map(
                            (training, index) => (
                              <li key={index}>
                                {training.training_name} ({training.training_code}
                                )
                              </li>
                            )
                          )}
                        </ul>
                        <p className="mt-2 text-sm">
                          Preporučuje se izdavanje potvrde tek nakon završetka svih obaveznih obuka.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Certificate number */}
                <div className="space-y-2">
                  <Label htmlFor="certificate_number">
                    Broj Potvrde <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="certificate_number"
                    value={formData.certificate_number}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        certificate_number: e.target.value,
                      })
                    }
                    required
                    disabled={loading}
                    placeholder="npr., POTVRDA-2024-001"
                  />
                </div>

                {/* Training selection */}
                <div className="space-y-2">
                  <Label htmlFor="training_master_id">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Obuka (opcionalno)
                    </div>
                  </Label>
                  <Select
                    value={formData.training_master_id}
                    onValueChange={handleTrainingChange}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Odaberite obuku (opcionalno)" />
                    </SelectTrigger>
                    <SelectContent>
                      {trainings.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground">
                          Nema definisanih obuka. Koristiće se opšta potvrda.
                        </div>
                      ) : (
                        trainings.map((training) => (
                          <SelectItem key={training.id} value={training.id}>
                            <div className="flex flex-col">
                              <span>{training.title}</span>
                              <span className="text-xs text-muted-foreground">
                                {training.code} •{" "}
                                {training.validity_months || 12} mjeseci
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {trainings.length === 0
                      ? "Nema definisanih obuka. Kreiraće se opšta potvrda."
                      : "Ako ne odaberete obuku, kreiraće se opšta potvrda"}
                  </p>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="issue_date">
                      Datum Izdavanja <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="issue_date"
                      type="date"
                      value={formData.issue_date}
                      onChange={(e) => handleIssueDateChange(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expiry_date">Datum Isteka</Label>
                    <Input
                      id="expiry_date"
                      type="date"
                      value={formData.expiry_date}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          expiry_date: e.target.value,
                        })
                      }
                      disabled={loading}
                      readOnly={!!formData.training_master_id}
                      className={
                        formData.training_master_id ? "bg-gray-50" : ""
                      }
                    />
                    {formData.training_master_id && (
                      <p className="text-xs text-muted-foreground">
                        Automatski izračunato na osnovu obuke
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Right column */}
              <div className="space-y-4">
                {/* Grade and status */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="grade">Ocjena</Label>
                    <Input
                      id="grade"
                      value={formData.grade}
                      onChange={(e) =>
                        setFormData({ ...formData, grade: e.target.value })
                      }
                      disabled={loading}
                      placeholder="npr., Odličan, 95%"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: "valid" | "expired" | "revoked") =>
                        setFormData({ ...formData, status: value })
                      }
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="valid">Važeći</SelectItem>
                        <SelectItem value="expired">Istekao</SelectItem>
                        <SelectItem value="revoked">Opozvan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Issuer and instructor */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="issued_by">Izdao</Label>
                    <Input
                      id="issued_by"
                      value={formData.issued_by}
                      onChange={(e) =>
                        setFormData({ ...formData, issued_by: e.target.value })
                      }
                      disabled={loading}
                      placeholder="Ime i prezime"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="instructor_id">Instruktor</Label>
                    <Select
                      value={formData.instructor_id}
                      onValueChange={handleInstructorChange}
                      disabled={loading || instructors.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue 
                          placeholder={
                            instructors.length === 0
                              ? "Nema dostupnih instruktora"
                              : "Odaberite instruktora"
                          } 
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {instructors.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground">
                            Nema aktivnih instruktora u sistemu.
                          </div>
                        ) : (
                          instructors.map((instructor) => (
                            <SelectItem key={instructor.id} value={instructor.id}>
                              <div className="flex flex-col">
                                <span>{instructor.staff_name}</span>
                                {instructor.instructor_code && (
                                  <span className="text-xs text-muted-foreground">
                                    Šifra: {instructor.instructor_code}
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Training provider */}
                <div className="space-y-2">
                  <Label htmlFor="training_provider">
                    Organizacija / Provajder
                  </Label>
                  <Input
                    id="training_provider"
                    value={formData.training_provider}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        training_provider: e.target.value,
                      })
                    }
                    disabled={loading}
                    placeholder="npr., Kompanija ABC"
                  />
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Napomene</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    rows={3}
                    disabled={loading}
                    placeholder="Dodatne informacije o potvrdi..."
                  />
                </div>
              </div>
            </div>

            {/* Preview section */}
            {(formData.staff_id ||
              formData.training_master_id ||
              formData.certificate_number) && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-3">
                  Pregled potvrde:
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {selectedEmployee && (
                    <>
                      <div>
                        <span className="text-muted-foreground">Zaposleni:</span>
                        <p className="font-medium">
                          {selectedEmployee.first_name}{" "}
                          {selectedEmployee.last_name}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Broj zaposlenog:
                        </span>
                        <p className="font-mono">
                          {selectedEmployee.employee_number}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Email:</span>
                        <p>{selectedEmployee.email || "N/A"}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Status:</span>
                        <Badge
                          variant={
                            selectedEmployee.status === "active"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {selectedEmployee.status === "active"
                            ? "Aktivan"
                            : "Neaktivan"}
                        </Badge>
                      </div>
                    </>
                  )}
                  {formData.certificate_number && (
                    <div>
                      <span className="text-muted-foreground">
                        Broj potvrde:
                      </span>
                      <p className="font-mono font-medium">
                        {formData.certificate_number}
                      </p>
                    </div>
                  )}
                  {selectedTraining && (
                    <div>
                      <span className="text-muted-foreground">Obuka:</span>
                      <p className="font-medium">{selectedTraining.title}</p>
                    </div>
                  )}
                  {selectedInstructor && (
                    <div>
                      <span className="text-muted-foreground">Instruktor:</span>
                      <p className="font-medium">{selectedInstructor.staff_name}</p>
                    </div>
                  )}
                  {formData.issue_date && (
                    <div>
                      <span className="text-muted-foreground">Datum izdavanja:</span>
                      <p>
                        {new Date(formData.issue_date).toLocaleDateString(
                          "sr-RS"
                        )}
                      </p>
                    </div>
                  )}
                  {formData.expiry_date && (
                    <div>
                      <span className="text-muted-foreground">Datum isteka:</span>
                      <p className="font-semibold">
                        {new Date(formData.expiry_date).toLocaleDateString(
                          "sr-RS"
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={
                  loading ||
                  employees.length === 0 ||
                  !formData.certificate_number ||
                  !formData.issue_date
                }
                className="gap-2"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Čuvanje i generisanje PDF-a...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Kreiraj i Preuzmi PDF
                  </>
                )}
              </Button>
              <Link href="/dashboard/certificates">
                <Button type="button" variant="outline" disabled={loading}>
                  Otkaži
                </Button>
              </Link>
              {employees.length === 0 && (
                <Link href="/dashboard/employees">
                  <Button type="button" variant="outline" className="gap-2">
                    <Users className="h-4 w-4" />
                    Dodaj Zaposlene
                  </Button>
                </Link>
              )}
              {trainings.length === 0 && (
                <Link href="/dashboard/training-types">
                  <Button type="button" variant="outline" className="gap-2">
                    <BookOpen className="h-4 w-4" />
                    Dodaj Obuke
                  </Button>
                </Link>
              )}
            </div>

            {/* Info section */}
            <div className="text-xs text-muted-foreground pt-4 border-t">
              <p>
                <strong>Napomena:</strong> Potvrda će biti sačuvana u tabeli{" "}
                <code>training_certificate_records</code> i automatski će biti generisan PDF dokument.
              </p>
              <p className="mt-1">
                <strong>Dostupno zaposlenih:</strong> {employees.length} |{" "}
                <strong>Dostupnih obuka:</strong> {trainings.length}
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}