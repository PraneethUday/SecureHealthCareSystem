import "server-only";
import { keystore } from "@/lib/crypto/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { fromBytea, openFields } from "@/lib/crypto/envelope";
import type { CurrentUser } from "@/lib/supabase/server";
import { chat, CHAT_MODEL, embed, toVector } from "./ollama";
import {
  buildMessages,
  detectInjection,
  neutralizeInjection,
  NO_RECORDS_REPLY,
  redactPHI,
  validateAnswer,
  type PromptRecord,
} from "./guardrails";

export interface Citation {
  ref: string;
  sourceTable: string;
  sourceId: string;
}

export interface AssistantReply {
  reply: string;
  citations: Citation[];
  outcome: "answered" | "no_records" | "rejected_uncited" | "blocked" | "error";
}

const MATCH_COUNT = 6;
const MIN_SIMILARITY = 0.45;

/**
 * Patients whose first or last name appears in the question, or null if the
 * question names nobody. Stops the model from answering "what is X's
 * diagnosis" with a record that belongs to someone else.
 */
async function patientsNamedIn(question: string): Promise<Set<string> | null> {
  const tokens = [...new Set(question.match(/\b[A-Z][a-z]{2,}\b/g) ?? [])];
  if (!tokens.length) return null;
  const list = tokens.map((t) => `"${t}"`).join(",");
  const { data } = await supabaseAdmin
    .from("patients")
    .select("id, first_name, last_name")
    .or(`first_name.in.(${list}),last_name.in.(${list})`);
  if (!data?.length) return null;
  // Full-name mentions win over single first-name matches.
  const full = data.filter((p) => tokens.includes(p.first_name) && tokens.includes(p.last_name));
  return new Set((full.length ? full : data).map((p) => p.id));
}

/**
 * Permission-aware RAG:
 *   1. embed the question locally
 *   2. retrieve with the *user's* session: match_records is SECURITY
 *      INVOKER, so RLS removes every chunk the user may not open
 *   3. decrypt on the server, neutralize injected instructions, redact
 *      identifiers, wrap each chunk in <record> delimiters
 *   4. answer with the local model; reject anything without valid citations
 *   5. log the (redacted) question and what was retrieved
 */
export async function answerQuestion(user: CurrentUser, question: string): Promise<AssistantReply> {
  const started = Date.now();
  const redactedQuestion = redactPHI(question).text;
  const questionInjection = detectInjection(question).length;

  let chunkIds: string[] = [];
  let recordIds: string[] = [];
  let injectionFlags = questionInjection;
  let result: AssistantReply;

  try {
    const [vector] = await embed([redactedQuestion], "query");
    const { data: matches, error } = await user.supabase.rpc("match_records", {
      query_embedding: toVector(vector),
      match_count: MATCH_COUNT,
      min_similarity: MIN_SIMILARITY,
    });
    if (error) throw error;

    // Which patients does the question name? (Service-role lookup; the
    // answer is never shown, it only narrows what may be used.)
    const mentioned = await patientsNamedIn(question);
    const scoped = (matches ?? []).filter(
      (m: any) => mentioned === null || mentioned.has(m.patient_id),
    );

    if (!scoped.length) {
      result = { reply: NO_RECORDS_REPLY, citations: [], outcome: "no_records" };
    } else {
      const records: PromptRecord[] = [];
      const citations: Citation[] = [];
      const { data: names } = await user.supabase
        .from("patients")
        .select("id, first_name, last_name")
        .in("id", [...new Set(scoped.map((m: any) => m.patient_id))]);
      const nameOf = new Map((names ?? []).map((n) => [n.id, `${n.first_name} ${n.last_name}`]));

      for (const [i, m] of scoped.entries()) {
        const { text } = openFields<{ text: string }>(
          {
            phi_ciphertext: fromBytea(m.phi_ciphertext),
            phi_iv: fromBytea(m.phi_iv),
            phi_auth_tag: fromBytea(m.phi_auth_tag),
            encrypted_dek: fromBytea(m.encrypted_dek),
            key_version: m.key_version,
          },
          await keystore.kek(m.key_version),
          "record_chunks",
          m.id,
        );
        const neutral = neutralizeInjection(text);
        injectionFlags += neutral.flagged;
        const ref = `R${i + 1}`;
        records.push({
          ref,
          patientName: nameOf.get(m.patient_id) ?? "Unknown patient",
          sourceTable: m.source_table,
          sourceId: m.source_id,
          text: redactPHI(neutral.text).text,
        });
        citations.push({ ref, sourceTable: m.source_table, sourceId: m.source_id });
      }
      chunkIds = scoped.map((m: any) => m.id);
      recordIds = [...new Set(scoped.map((m: any) => `${m.source_table}:${m.source_id}`))] as string[];

      const raw = await chat(buildMessages(redactedQuestion, records));
      const checked = validateAnswer(raw, records.map((r) => r.ref));

      if (checked.ok) {
        result = {
          reply: checked.text,
          citations: citations.filter((c) => checked.citedRefs.includes(c.ref)),
          outcome: "answered",
        };
      } else if (checked.reason === "no_records_reply") {
        result = { reply: NO_RECORDS_REPLY, citations: [], outcome: "no_records" };
      } else {
        result = { reply: checked.text, citations: [], outcome: "rejected_uncited" };
      }

      // Retrieval is data access: record it on each patient's audit trail.
      const patients = [...new Set(scoped.map((m: any) => m.patient_id))];
      await Promise.all(
        patients.map((pid) =>
          supabaseAdmin.rpc("append_audit_as", {
            p_actor_id: user.profileId,
            p_actor_role: user.role,
            p_action: "ai_query",
            p_target_table: "record_chunks",
            p_target_id: null,
            p_patient_id: pid,
            p_details: { chunks: chunkIds.length, outcome: result.outcome },
          }),
        ),
      );
    }
  } catch (e) {
    console.error("Assistant error:", (e as Error).message);
    result = {
      reply: "The records assistant is unavailable right now. Please try again later.",
      citations: [],
      outcome: "error",
    };
  }

  await supabaseAdmin.from("ai_query_log").insert({
    user_id: user.businessId,
    user_role: user.role,
    query_redacted: redactedQuestion.slice(0, 2000),
    retrieved_chunk_ids: chunkIds,
    retrieved_record_ids: recordIds,
    injection_flags: injectionFlags,
    outcome: result.outcome,
    model: CHAT_MODEL,
    latency_ms: Date.now() - started,
  });

  if (injectionFlags > 0) {
    await supabaseAdmin.from("security_alerts").insert({
      alert_type: "prompt_injection",
      severity: "medium",
      title: "Prompt-injection pattern neutralized",
      message: `${injectionFlags} injection pattern(s) removed from an assistant request by ${user.role} ${user.businessId}.`,
      actor_id: user.profileId,
      metadata: { record_ids: recordIds, in_question: questionInjection },
    });
  }

  return result;
}
