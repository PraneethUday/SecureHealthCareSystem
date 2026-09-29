import { NextRequest, NextResponse } from "next/server";
import { guard } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { REPORTS_BUCKET, reportObjectPath, signReportUrl } from "@/lib/medical-report-storage";

const MAX_SIZE = 50 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const auth = await guard("nurse", "doctor", "patient");
  if (auth instanceof Response) return auth;

  try {
    const formData = await request.formData();
    const patientId = formData.get("patientId") as string;
    const reportType = formData.get("reportType") as string;
    const reportName = formData.get("reportName") as string;
    const description = formData.get("description") as string;
    const reportDate = formData.get("reportDate") as string;
    const notes = formData.get("notes") as string;
    const file = formData.get("file") as File;

    if (!patientId || !reportType || !reportName || !file) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File size exceeds 50MB limit" }, { status: 400 });
    }

    // RLS decides whether this caller may see (and so upload for) the patient.
    const { data: patient } = await auth.supabase
      .from("patients")
      .select("id")
      .eq("patient_id", patientId)
      .maybeSingle();
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    const safeName = file.name.replace(/[^\w.-]/g, "_");
    const objectPath = `${patient.id}/${Date.now()}_${safeName}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(REPORTS_BUCKET)
      .upload(objectPath, await file.arrayBuffer(), { contentType: file.type, upsert: false });
    if (uploadError) {
      console.error("[Upload Report] Storage error:", uploadError.message);
      return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
    }

    // The insert runs as the caller, so the insert policy is checked too.
    const { data: report, error: dbError } = await auth.supabase
      .from("medical_reports")
      .insert({
        patient_id: patient.id,
        uploaded_by_user_id: auth.profileId,
        uploaded_by_role: auth.role,
        report_type: reportType,
        report_name: reportName,
        description: description || null,
        file_url: objectPath,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        report_date: reportDate || new Date().toISOString().split("T")[0],
        notes: notes || null,
      })
      .select()
      .single();

    if (dbError) {
      console.error("[Upload Report] Database error:", dbError.message);
      await supabaseAdmin.storage.from(REPORTS_BUCKET).remove([objectPath]);
      return NextResponse.json({ error: "Failed to save report" }, { status: 403 });
    }

    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error("[Upload Report] Exception:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const auth = await guard();
  if (auth instanceof Response) return auth;

  try {
    const searchParams = request.nextUrl.searchParams;
    const patientId = searchParams.get("patientId");
    const reportType = searchParams.get("reportType");

    let query = auth.supabase
      .from("medical_reports")
      .select("*, patients!inner (patient_id, first_name, last_name, email)")
      .order("report_date", { ascending: false });

    if (patientId) {
      const { data: patient } = await auth.supabase
        .from("patients")
        .select("id")
        .eq("patient_id", patientId)
        .maybeSingle();
      if (!patient) {
        return NextResponse.json(
          {
            error: "Access denied. You can only view reports for patients in your care.",
            accessDenied: true,
          },
          { status: 403 },
        );
      }
      query = query.eq("patient_id", patient.id);
    }
    if (reportType && reportType !== "all") {
      query = query.eq("report_type", reportType);
    }

    // RLS limits this to reports the caller is allowed to see.
    const { data, error } = await query;
    if (error) {
      console.error("[Get Reports] Error:", error.message);
      return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
    }

    const reports = await Promise.all(
      (data ?? []).map(async (report: any) => ({
        ...report,
        file_url: await signReportUrl(reportObjectPath(report.file_url, report.file_name), 3600),
        patient_id: report.patients?.patient_id || "",
        patient_name: report.patients
          ? `${report.patients.first_name} ${report.patients.last_name}`
          : "Unknown Patient",
        patient_email: report.patients?.email || "",
      })),
    );

    return NextResponse.json({ reports });
  } catch (error) {
    console.error("[Get Reports] Exception:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
