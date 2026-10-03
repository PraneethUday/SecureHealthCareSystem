"use client";

import { useCallback, useEffect, useState } from "react";
import { Link2, ShieldCheck, ShieldX, Siren, Bot, Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface ChainResult {
  ok: boolean;
  rows_checked: number;
  first_broken_seq: number | null;
  reason: string | null;
}

interface Grant {
  id: string;
  reason: string;
  created_at: string;
  expires_at: string;
  reviewed_at: string | null;
  doctors: { doctor_id: string; first_name: string; last_name: string } | null;
  patients: { patient_id: string } | null;
}

interface AiQuery {
  id: number;
  user_id: string;
  user_role: string;
  query_redacted: string;
  retrieved_record_ids: string[];
  injection_flags: number;
  outcome: string;
  latency_ms: number | null;
  created_at: string;
}

const card =
  "bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5";

// Everything here is read with the admin's own session: RLS (admin + aal2)
// decides what is visible, and review/verify go through audited RPCs.
export default function AuditAccessPanel() {
  const [chain, setChain] = useState<ChainResult | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [grants, setGrants] = useState<Grant[]>([]);
  const [queries, setQueries] = useState<AiQuery[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const [g, q] = await Promise.all([
      supabase
        .from("break_glass_grants")
        .select("id, reason, created_at, expires_at, reviewed_at, doctors(doctor_id, first_name, last_name), patients(patient_id)")
        .order("created_at", { ascending: false })
        .limit(20),
      supabase.from("ai_query_log").select("*").order("created_at", { ascending: false }).limit(20),
    ]);
    setGrants((g.data as unknown as Grant[]) ?? []);
    setQueries((q.data as AiQuery[]) ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const verify = async () => {
    setVerifying(true);
    const { data } = await supabase.rpc("verify_audit_chain");
    setChain((data?.[0] as ChainResult) ?? null);
    setVerifying(false);
  };

  const review = async (id: string) => {
    await supabase.rpc("review_break_glass", { p_grant_id: id, p_note: notes[id] ?? "" });
    load();
  };

  return (
    <div className="space-y-4">
      {/* Audit chain integrity */}
      <div className={card}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link2 className="w-5 h-5 text-slate-500" />
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Audit chain integrity</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Recomputes every SHA-256 link and reports the first row that doesn&apos;t match.
              </p>
            </div>
          </div>
          <button
            onClick={verify}
            disabled={verifying}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-medium disabled:opacity-50"
          >
            {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Verify chain
          </button>
        </div>
        {chain && (
          <div
            className={`mt-4 flex items-center gap-2 text-sm rounded-lg p-3 ${
              chain.ok
                ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                : "bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300"
            }`}
          >
            {chain.ok ? <ShieldCheck className="w-4 h-4" /> : <ShieldX className="w-4 h-4" />}
            {chain.ok
              ? `Intact: ${chain.rows_checked} entries verified.`
              : `Broken at entry #${chain.first_broken_seq}: ${chain.reason}.`}
          </div>
        )}
      </div>

      {/* Break-glass review */}
      <div className={card}>
        <div className="flex items-center gap-3 mb-4">
          <Siren className="w-5 h-5 text-red-500" />
          <h3 className="font-semibold text-slate-900 dark:text-white">Emergency access review</h3>
        </div>
        {grants.length === 0 ? (
          <p className="text-sm text-slate-500">No break-glass access has been used.</p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {grants.map((g) => (
              <li key={g.id} className="py-3 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="font-medium text-slate-900 dark:text-white">
                    Dr. {g.doctors?.first_name} {g.doctors?.last_name} ({g.doctors?.doctor_id}) opened{" "}
                    {g.patients?.patient_id}
                  </span>
                  <span className="text-xs text-slate-500">{new Date(g.created_at).toLocaleString()}</span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300">&ldquo;{g.reason}&rdquo;</p>
                {g.reviewed_at ? (
                  <p className="text-xs text-emerald-700 dark:text-emerald-400">
                    Reviewed {new Date(g.reviewed_at).toLocaleString()}
                  </p>
                ) : (
                  <div className="flex gap-2">
                    <input
                      value={notes[g.id] ?? ""}
                      onChange={(e) => setNotes((n) => ({ ...n, [g.id]: e.target.value }))}
                      placeholder="Review note (justified / escalate)"
                      className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                    <button
                      onClick={() => review(g.id)}
                      className="px-3 py-1.5 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Mark reviewed
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* AI query log */}
      <div className={card}>
        <div className="flex items-center gap-3 mb-4">
          <Bot className="w-5 h-5 text-emerald-600" />
          <h3 className="font-semibold text-slate-900 dark:text-white">Records assistant log</h3>
          <span className="text-xs text-slate-500">questions are stored with identifiers redacted</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-slate-100 dark:border-slate-800">
                <th className="py-2 pr-3 font-medium">When</th>
                <th className="py-2 pr-3 font-medium">User</th>
                <th className="py-2 pr-3 font-medium">Question</th>
                <th className="py-2 pr-3 font-medium">Records</th>
                <th className="py-2 pr-3 font-medium">Outcome</th>
              </tr>
            </thead>
            <tbody>
              {queries.map((q) => (
                <tr key={q.id} className="border-b border-slate-50 dark:border-slate-800/50 align-top">
                  <td className="py-2 pr-3 whitespace-nowrap text-slate-500">{new Date(q.created_at).toLocaleTimeString()}</td>
                  <td className="py-2 pr-3 whitespace-nowrap text-slate-700 dark:text-slate-300">
                    {q.user_role} {q.user_id}
                  </td>
                  <td className="py-2 pr-3 text-slate-700 dark:text-slate-300 max-w-xs">{q.query_redacted}</td>
                  <td className="py-2 pr-3 text-slate-500 tabular-nums">{q.retrieved_record_ids.length}</td>
                  <td className="py-2 pr-3 whitespace-nowrap">
                    <span className="text-slate-700 dark:text-slate-300">{q.outcome.replace(/_/g, " ")}</span>
                    {q.injection_flags > 0 && (
                      <span className="ml-2 px-1.5 py-0.5 rounded text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                        {q.injection_flags} injection
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
