import type { SupabaseClient } from "@supabase/supabase-js";
import { decryptRow, Keystore, type EncryptedTable } from "@/lib/crypto/clinical";
import { sealFields, toBytea } from "@/lib/crypto/envelope";
import { detectInjection } from "@/lib/ai/guardrails";
import { embed, toVector } from "@/lib/ai/ollama";

// Drains public.embedding_jobs (filled by triggers on medical_records and
// prescriptions): decrypts the source row, chunks it, embeds each chunk
// locally, and stores the chunk text envelope-encrypted next to its
// embedding. Runs with the service role; nothing here is user-facing.

const CHUNK_CHARS = 900;
const CHUNK_OVERLAP = 150;
const MAX_ATTEMPTS = 5;

function recordText(table: EncryptedTable, r: Record<string, any>): string {
  if (table === "medical_records") {
    return [
      `Medical record dated ${r.record_date}.`,
      r.chief_complaint && `Chief complaint: ${r.chief_complaint}.`,
      r.diagnosis && `Diagnosis: ${r.diagnosis}.`,
      r.symptoms && `Symptoms: ${r.symptoms}.`,
      r.examination_findings && `Examination findings: ${r.examination_findings}.`,
      r.treatment_plan && `Treatment plan: ${r.treatment_plan}.`,
      r.recommendations && `Recommendations: ${r.recommendations}.`,
      r.follow_up_instructions && `Follow-up: ${r.follow_up_instructions}.`,
      r.notes && `Notes: ${r.notes}`,
    ].filter(Boolean).join("\n");
  }
  return [
    `Prescription dated ${r.prescribed_date} (status: ${r.status}).`,
    `Medication: ${r.medication_name}, ${r.dosage}, ${r.frequency}, for ${r.duration}.`,
    r.instructions && `Instructions: ${r.instructions}.`,
    r.notes && `Notes: ${r.notes}`,
  ].filter(Boolean).join("\n");
}

export function chunk(text: string): string[] {
  if (text.length <= CHUNK_CHARS) return [text];
  const out: string[] = [];
  for (let start = 0; start < text.length; start += CHUNK_CHARS - CHUNK_OVERLAP) {
    out.push(text.slice(start, start + CHUNK_CHARS));
    if (start + CHUNK_CHARS >= text.length) break;
  }
  return out;
}

async function indexSource(
  admin: SupabaseClient,
  keystore: Keystore,
  table: EncryptedTable,
  sourceId: string,
) {
  const { data: row } = await admin.from(table).select("*").eq("id", sourceId).maybeSingle();
  if (!row) {
    await admin.from("record_chunks").delete().eq("source_table", table).eq("source_id", sourceId);
    return;
  }
  const plain = await decryptRow(keystore, table, row);
  if (plain.decryption_failed) throw new Error("source row could not be decrypted");

  const pieces = chunk(recordText(table, plain));
  const vectors = await embed(pieces, "document");
  const version = await keystore.currentVersion();
  const kek = await keystore.kek(version);

  const rows = pieces.map((text, i) => {
    const id = crypto.randomUUID();
    const env = sealFields({ text }, kek, version, "record_chunks", id);
    return {
      id,
      patient_id: row.patient_id,
      source_table: table,
      source_id: sourceId,
      chunk_index: i,
      phi_ciphertext: toBytea(env.phi_ciphertext),
      phi_iv: toBytea(env.phi_iv),
      phi_auth_tag: toBytea(env.phi_auth_tag),
      encrypted_dek: toBytea(env.encrypted_dek),
      key_version: env.key_version,
      embedding: toVector(vectors[i]),
      // Flag at index time too, so admins can find poisoned records.
      flagged_injection: detectInjection(text).length > 0,
    };
  });

  await admin.from("record_chunks").delete().eq("source_table", table).eq("source_id", sourceId);
  const { error } = await admin.from("record_chunks").insert(rows);
  if (error) throw error;
}

export async function processEmbeddingJobs(
  admin: SupabaseClient,
  keystore: Keystore,
  limit = 50,
): Promise<{ indexed: number; failed: number }> {
  const { data: jobs } = await admin
    .from("embedding_jobs")
    .select("source_table, source_id, attempts")
    .lt("attempts", MAX_ATTEMPTS)
    .order("enqueued_at")
    .limit(limit);

  let indexed = 0;
  let failed = 0;
  for (const job of jobs ?? []) {
    try {
      await indexSource(admin, keystore, job.source_table as EncryptedTable, job.source_id);
      await admin
        .from("embedding_jobs")
        .delete()
        .eq("source_table", job.source_table)
        .eq("source_id", job.source_id);
      indexed++;
    } catch (e) {
      failed++;
      await admin
        .from("embedding_jobs")
        .update({ attempts: job.attempts + 1, last_error: String((e as Error).message).slice(0, 500) })
        .eq("source_table", job.source_table)
        .eq("source_id", job.source_id);
    }
  }
  return { indexed, failed };
}
