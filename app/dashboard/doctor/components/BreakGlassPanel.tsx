"use client";

import { useEffect, useState } from "react";
import { Siren, ShieldAlert, Clock, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import MedicalHistoryViewer from "./MedicalHistoryViewer";
import VitalsViewer from "./VitalsViewer";

interface ActiveGrant {
  grantId: string;
  patientId: string;
  patientCode: string;
  expiresAt: string;
}

const MIN_REASON = 20;

function useCountdown(until: string | null) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!until) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [until]);
  if (!until) return null;
  const ms = Math.max(0, new Date(until).getTime() - now);
  return { ms, label: `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, "0")}` };
}

export default function BreakGlassPanel() {
  const [patientCode, setPatientCode] = useState("");
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [grant, setGrant] = useState<ActiveGrant | null>(null);
  const countdown = useCountdown(grant?.expiresAt ?? null);
  const expired = countdown?.ms === 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    const { data, error } = await supabase.rpc("request_break_glass", {
      p_patient_code: patientCode.trim().toUpperCase(),
      p_reason: reason,
    });
    setBusy(false);
    if (error || !data?.[0]) {
      setError(error?.message ?? "Emergency access was not granted.");
      return;
    }
    setGrant({
      grantId: data[0].grant_id,
      patientId: data[0].patient_id,
      patientCode: patientCode.trim().toUpperCase(),
      expiresAt: data[0].expires_at,
    });
  };

  const reset = () => {
    setGrant(null);
    setPatientCode("");
    setReason("");
    setConfirmed(false);
  };

  if (grant) {
    return (
      <div className="space-y-4">
        <div
          className={`flex flex-wrap items-center justify-between gap-3 p-4 rounded-lg border ${
            expired
              ? "border-slate-300 bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
              : "border-red-300 bg-red-50 dark:bg-red-950/40 dark:border-red-900"
          }`}
        >
          <div className="flex items-center gap-3">
            <Siren className={`w-5 h-5 ${expired ? "text-slate-500" : "text-red-600"}`} />
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {expired ? "Emergency access expired" : `Emergency access to ${grant.patientCode}`}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Every view is recorded and will be reviewed by the security team.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!expired && (
              <span className="inline-flex items-center gap-1 text-sm font-mono text-red-700 dark:text-red-300">
                <Clock className="w-4 h-4" /> {countdown?.label}
              </span>
            )}
            <button
              onClick={reset}
              className="px-3 py-1.5 text-sm rounded-md border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700"
            >
              Close record
            </button>
          </div>
        </div>
        {!expired && (
          <>
            <VitalsViewer patientId={grant.patientId} />
            <MedicalHistoryViewer patientId={grant.patientId} patientName={grant.patientCode} />
          </>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="max-w-xl space-y-4">
      <div className="flex gap-3 p-4 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-900 dark:text-amber-200 space-y-1">
          <p className="font-semibold">Break-glass access is for emergencies only.</p>
          <p>
            It opens a patient who is not assigned to you for 60 minutes. Your reason, every record you
            view, and the time of access are logged and sent to the security team for review.
          </p>
        </div>
      </div>

      <div>
        <label htmlFor="bg-patient" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Patient ID
        </label>
        <input
          id="bg-patient"
          value={patientCode}
          onChange={(e) => setPatientCode(e.target.value)}
          placeholder="e.g. P003"
          required
          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100"
        />
      </div>

      <div>
        <label htmlFor="bg-reason" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Clinical reason
        </label>
        <textarea
          id="bg-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          required
          placeholder="e.g. Unconscious in ED, need allergy and medication history"
          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100"
        />
        <p className="text-xs text-slate-500 mt-1">
          {reason.trim().length < MIN_REASON
            ? `${MIN_REASON - reason.trim().length} more characters needed`
            : "Reason recorded with the grant"}
        </p>
      </div>

      <label className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
        <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-1" />
        I confirm this is a genuine clinical emergency and understand this access is audited.
      </label>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={busy || !confirmed || reason.trim().length < MIN_REASON || !patientCode.trim()}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-semibold"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Siren className="w-4 h-4" />}
        Open emergency access
      </button>
    </form>
  );
}
