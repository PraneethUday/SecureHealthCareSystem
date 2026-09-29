import "server-only";
import { supabaseAdmin } from "@/lib/supabase-admin";

// Private bucket. Objects are only ever reached through short-lived signed
// URLs, issued after the caller's RLS-scoped query has returned the report.
export const REPORTS_BUCKET = "medical-reports";

/** file_url holds the object path (older rows hold a full public URL). */
export function reportObjectPath(fileUrl: string, fileName: string): string {
  const [, afterBucket] = fileUrl.split(`/${REPORTS_BUCKET}/`);
  return afterBucket ?? (fileUrl.includes("://") ? fileName : fileUrl);
}

export async function signReportUrl(path: string, seconds: number): Promise<string | null> {
  const { data, error } = await supabaseAdmin.storage
    .from(REPORTS_BUCKET)
    .createSignedUrl(path, seconds);
  return error ? null : data.signedUrl;
}
