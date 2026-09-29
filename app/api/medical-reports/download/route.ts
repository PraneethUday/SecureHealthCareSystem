import { NextRequest, NextResponse } from "next/server";
import { guard } from "@/lib/supabase/server";
import { reportObjectPath, signReportUrl } from "@/lib/medical-report-storage";

export async function GET(request: NextRequest) {
  const auth = await guard();
  if (auth instanceof Response) return auth;

  const reportId = request.nextUrl.searchParams.get("reportId");
  if (!reportId) {
    return NextResponse.json({ error: "Report ID is required" }, { status: 400 });
  }

  // Only a report visible under RLS can be signed; arbitrary paths cannot.
  const { data: report } = await auth.supabase
    .from("medical_reports")
    .select("file_name, file_url")
    .eq("id", reportId)
    .maybeSingle();
  if (!report) {
    return NextResponse.json(
      { error: "Report not found or access denied", accessDenied: true },
      { status: 404 },
    );
  }

  const path = reportObjectPath(report.file_url, report.file_name);
  const downloadUrl = await signReportUrl(path, 300);
  if (!downloadUrl) {
    return NextResponse.json({ error: "Failed to generate download link" }, { status: 500 });
  }
  return NextResponse.json({ downloadUrl, fileName: report.file_name });
}
