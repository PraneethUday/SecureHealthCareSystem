import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  console.log("📥 [Download Report] API called");

  try {
    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get("reportId");
    const fileName = searchParams.get("fileName");
    const doctorId = searchParams.get("doctorId");

    if (!reportId && !fileName) {
      return NextResponse.json(
        { error: "Report ID or file name is required" },
        { status: 400 },
      );
    }

    let filePath = fileName;
    let patientUUID: string | null = null;

    // If reportId is provided, fetch the file name and patient info from database
    if (reportId) {
      const { data: report, error } = await supabase
        .from("medical_reports")
        .select("file_name, file_url, patient_id")
        .eq("id", reportId)
        .single();

      if (error || !report) {
        console.error("❌ [Download Report] Report not found:", reportId);
        return NextResponse.json(
          { error: "Report not found" },
          { status: 404 },
        );
      }

      patientUUID = report.patient_id;

      // Extract file path from URL
      const urlParts = report.file_url.split("/medical-reports/");
      filePath = urlParts[1] || report.file_name;
    }

    // If doctorId is provided, verify the doctor has an appointment with the patient
    if (doctorId && patientUUID) {
      // Get doctor UUID from doctor_id
      const { data: doctorData, error: doctorError } = await supabase
        .from("doctors")
        .select("id")
        .eq("doctor_id", doctorId)
        .single();

      if (doctorError || !doctorData) {
        console.log("⚠️ [Download Report] Doctor not found:", doctorId);
        return NextResponse.json(
          { error: "Doctor not found" },
          { status: 404 },
        );
      }

      // Check if the doctor has any appointment with this patient
      const { data: appointmentData, error: appointmentError } = await supabase
        .from("appointments")
        .select("id")
        .eq("doctor_id", doctorData.id)
        .eq("patient_id", patientUUID)
        .limit(1);

      if (appointmentError) {
        console.error(
          "❌ [Download Report] Error checking appointments:",
          appointmentError,
        );
        return NextResponse.json(
          { error: "Failed to verify appointment" },
          { status: 500 },
        );
      }

      if (!appointmentData || appointmentData.length === 0) {
        console.log(
          "🚫 [Download Report] No appointment found between doctor and patient",
        );
        return NextResponse.json(
          {
            error:
              "Access denied. You can only download reports for patients who have booked an appointment with you.",
            accessDenied: true,
          },
          { status: 403 },
        );
      }

      console.log(
        "✅ [Download Report] Appointment verified, doctor can download report",
      );
    }

    console.log("📄 [Download Report] Generating signed URL for:", filePath);

    // Generate signed URL (valid for 5 minutes - short for downloads)
    const { data: signedUrlData, error: urlError } = await supabase.storage
      .from("medical-reports")
      .createSignedUrl(filePath!, 300);

    if (urlError || !signedUrlData?.signedUrl) {
      console.error(
        "❌ [Download Report] Error generating signed URL:",
        urlError,
      );
      return NextResponse.json(
        { error: "Failed to generate download link" },
        { status: 500 },
      );
    }

    console.log("✅ [Download Report] Signed URL generated");

    return NextResponse.json({
      downloadUrl: signedUrlData.signedUrl,
      fileName: filePath,
    });
  } catch (error: any) {
    console.error("❌ [Download Report] Exception:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
