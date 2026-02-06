import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const patientId = formData.get("patientId") as string;
    const reportType = formData.get("reportType") as string;
    const reportName = formData.get("reportName") as string;
    const description = formData.get("description") as string;
    const reportDate = formData.get("reportDate") as string;
    const notes = formData.get("notes") as string;
    const uploadedByUserId = formData.get("uploadedByUserId") as string;
    const uploadedByRole = formData.get("uploadedByRole") as string;
    const file = formData.get("file") as File;

    console.log("📤 [Upload Report] Request received:", {
      patientId,
      reportType,
      reportName,
      fileSize: file?.size,
    });

    // Validation
    if (
      !patientId ||
      !reportType ||
      !reportName ||
      !uploadedByUserId ||
      !uploadedByRole ||
      !file
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get patient UUID from patient_id
    const { data: patientData, error: patientError } = await supabase
      .from("patients")
      .select("id")
      .eq("patient_id", patientId)
      .single();

    if (patientError || !patientData) {
      console.error("❌ [Upload Report] Patient not found:", patientId);
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    const patientUUID = patientData.id;

    // Check file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size exceeds 50MB limit" },
        { status: 400 }
      );
    }

    // Upload file to Supabase Storage
    const fileName = `${patientId}/${Date.now()}_${file.name}`;
    const fileBuffer = await file.arrayBuffer();

    console.log("☁️  [Upload Report] Uploading to storage:", fileName);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("medical-reports")
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("❌ [Upload Report] Storage error:", uploadError);
      return NextResponse.json(
        { error: `Failed to upload file: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("medical-reports")
      .getPublicUrl(fileName);

    console.log("✅ [Upload Report] File uploaded successfully");

    // Create database record
    const { data: reportData, error: dbError } = await supabase
      .from("medical_reports")
      .insert([
        {
          patient_id: patientUUID,
          uploaded_by_user_id: uploadedByUserId,
          uploaded_by_role: uploadedByRole,
          report_type: reportType,
          report_name: reportName,
          description: description || null,
          file_url: urlData.publicUrl,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          report_date: reportDate || new Date().toISOString().split("T")[0],
          notes: notes || null,
        },
      ])
      .select()
      .single();

    if (dbError) {
      console.error("❌ [Upload Report] Database error:", dbError);
      // Try to delete the uploaded file
      await supabase.storage.from("medical-reports").remove([fileName]);
      return NextResponse.json(
        { error: `Failed to save report: ${dbError.message}` },
        { status: 500 }
      );
    }

    console.log("✅ [Upload Report] Report saved to database:", reportData.id);

    return NextResponse.json({
      success: true,
      report: reportData,
    });
  } catch (error: any) {
    console.error("❌ [Upload Report] Exception:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const patientId = searchParams.get("patientId");
    const reportType = searchParams.get("reportType");

    console.log("🔍 [Get Reports] Params:", { patientId, reportType });

    let query = supabase
      .from("medical_reports")
      .select(
        `
        *,
        patients!inner (
          patient_id,
          first_name,
          last_name,
          email
        )
      `
      )
      .order("report_date", { ascending: false });

    if (patientId) {
      // Get patient UUID
      const { data: patientData, error: patientError } = await supabase
        .from("patients")
        .select("id")
        .eq("patient_id", patientId)
        .single();

      if (patientError || !patientData) {
        console.log("⚠️ [Get Reports] Patient not found:", patientId);
        return NextResponse.json({ reports: [] });
      }

      query = query.eq("patient_id", patientData.id);
    }

    if (reportType && reportType !== "all") {
      query = query.eq("report_type", reportType);
    }

    const { data, error } = await query;

    if (error) {
      console.error("❌ [Get Reports] Error:", error);
      return NextResponse.json(
        { error: `Failed to fetch reports: ${error.message}` },
        { status: 500 }
      );
    }

    console.log("✅ [Get Reports] Found:", data?.length || 0, "reports");

    // Transform data and generate signed URLs for file access
    const reportsWithSignedUrls = await Promise.all(
      (data || []).map(async (report: any) => {
        let signedUrl = report.file_url;

        try {
          // Extract the file path from the storage URL
          const urlParts = report.file_url.split("/medical-reports/");
          const filePath = urlParts[1] || report.file_name;

          // Generate signed URL (valid for 1 hour)
          const { data: signedUrlData, error: urlError } =
            await supabase.storage
              .from("medical-reports")
              .createSignedUrl(filePath, 3600);

          if (signedUrlData?.signedUrl && !urlError) {
            signedUrl = signedUrlData.signedUrl;
          } else {
            console.warn(
              "⚠️ Could not generate signed URL for:",
              filePath,
              urlError
            );
          }
        } catch (err) {
          console.error("Error generating signed URL:", err);
        }

        return {
          ...report,
          file_url: signedUrl,
          patient_id: report.patients?.patient_id || "",
          patient_name: report.patients
            ? `${report.patients.first_name} ${report.patients.last_name}`
            : "Unknown Patient",
          patient_email: report.patients?.email || "",
        };
      })
    );

    return NextResponse.json({ reports: reportsWithSignedUrls });
  } catch (error: any) {
    console.error("❌ [Get Reports] Exception:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
