import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  console.log("📥 [Download Report] API called");

  try {
    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get("reportId");
    const fileName = searchParams.get("fileName");

    if (!reportId && !fileName) {
      return NextResponse.json(
        { error: "Report ID or file name is required" },
        { status: 400 }
      );
    }

    let filePath = fileName;

    // If reportId is provided, fetch the file name from database
    if (reportId && !fileName) {
      const { data: report, error } = await supabase
        .from("medical_reports")
        .select("file_name, file_url")
        .eq("id", reportId)
        .single();

      if (error || !report) {
        console.error("❌ [Download Report] Report not found:", reportId);
        return NextResponse.json(
          { error: "Report not found" },
          { status: 404 }
        );
      }

      // Extract file path from URL
      const urlParts = report.file_url.split("/medical-reports/");
      filePath = urlParts[1] || report.file_name;
    }

    console.log("📄 [Download Report] Generating signed URL for:", filePath);

    // Generate signed URL (valid for 5 minutes - short for downloads)
    const { data: signedUrlData, error: urlError } = await supabase.storage
      .from("medical-reports")
      .createSignedUrl(filePath!, 300);

    if (urlError || !signedUrlData?.signedUrl) {
      console.error(
        "❌ [Download Report] Error generating signed URL:",
        urlError
      );
      return NextResponse.json(
        { error: "Failed to generate download link" },
        { status: 500 }
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
      { status: 500 }
    );
  }
}
