"use client";

import { useEffect, useState } from "react";
import { getSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import {
  ShieldCheck,
  Eye,
  FileText,
  Clock,
  User,
  AlertTriangle,
  Search,
  Download,
  Edit3,
  Activity,
  Siren,
} from "lucide-react";
import { useRouter } from "next/navigation";

// One row of public.my_record_access_log(): who touched this patient's
// data, resolved from the hash-chained audit_log.
interface AccessEntry {
  ts: string;
  actor_name: string;
  actor_role: string;
  action: string;
  target_table: string | null;
  break_glass: boolean;
}

const TABLE_LABELS: Record<string, string> = {
  medical_records: "medical records",
  prescriptions: "prescriptions",
  patient_vitals: "vitals",
  medical_reports: "reports",
  record_chunks: "records (via AI assistant)",
};

export default function AccessHistoryPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<AccessEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const session = await getSession();
      if (!session || session.role !== "patient") {
        router.push("/login");
        return;
      }
      loadLogs();
    };
    init();
  }, [router]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      // Scoped to the signed-in patient inside the function.
      const { data, error } = await supabase.rpc("my_record_access_log");
      if (error) throw error;
      setLogs((data ?? []) as AccessEntry[]);
    } catch (err: any) {
      console.error("Failed to load logs:", err);
      setError("Failed to load access history. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const getActionConfig = (action: string, table: string | null) => {
    if (action.startsWith("break_glass"))
      return {
        icon: Siren,
        color: "text-red-600",
        bg: "bg-red-100",
        label: "Emergency access",
      };
    if (action === "read" || action === "ai_query")
      return {
        icon: table === "patient_vitals" ? Activity : Eye,
        color: table === "patient_vitals" ? "text-purple-500" : "text-blue-500",
        bg: table === "patient_vitals" ? "bg-purple-100" : "bg-blue-100",
        label: `Viewed ${TABLE_LABELS[table ?? ""] ?? "record"}`,
      };
    if (action.includes("vitals"))
      return {
        icon: Activity,
        color: "text-purple-500",
        bg: "bg-purple-100",
        label: "Viewed Vitals",
      };
    if (action.includes("profile"))
      return {
        icon: User,
        color: "text-rose-500",
        bg: "bg-rose-100",
        label: "Viewed Profile",
      };
    if (action.includes("view"))
      return {
        icon: Eye,
        color: "text-blue-500",
        bg: "bg-blue-100",
        label: "Viewed Record",
      };
    if (action.includes("update"))
      return {
        icon: Edit3,
        color: "text-amber-500",
        bg: "bg-amber-100",
        label: "Updated Record",
      };
    if (action.includes("upload"))
      return {
        icon: FileText,
        color: "text-emerald-500",
        bg: "bg-emerald-100",
        label: "Uploaded File",
      };
    if (action.includes("download"))
      return {
        icon: Download,
        color: "text-purple-500",
        bg: "bg-purple-100",
        label: "Downloaded File",
      };
    return {
      icon: ShieldCheck,
      color: "text-gray-500",
      bg: "bg-gray-100",
      label: "System Action",
    };
  };

  return (
    <div className="min-h-screen bg-[conic-gradient(at_top,_var(--tw-gradient-stops))] from-blue-50 via-indigo-50 to-slate-50 pb-20">
      {/* Header */}
      <header className="bg-white/70 backdrop-blur-md sticky top-0 z-50 border-b border-white/50 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
            >
              ← Back
            </button>
            <div className="flex items-center gap-3">
              <div className="bg-emerald-500 text-white p-2 rounded-lg shadow-lg shadow-emerald-500/20">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">
                  Access History
                </h1>
                <p className="text-xs text-gray-500">
                  Tamper-evident, hash-chained audit log
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-500 font-medium">Loading access history…</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-12 text-center shadow-xl border border-white/50">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700">
              No History Found
            </h3>
            <p className="text-gray-500 max-w-sm mx-auto mt-2">
              Nobody has accessed your records yet.
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* Vertical Timeline Line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-emerald-500 via-blue-400 to-transparent opacity-30"></div>

            <div className="space-y-8">
              {logs.map((log, index) => {
                const config = getActionConfig(log.action, log.target_table);
                const Icon = config.icon;

                return (
                  <div
                    key={`${log.ts}-${index}`}
                    className="relative flex items-start gap-6 group"
                    style={{
                      animation: `fadeIn 0.5s ease-out forwards ${index * 0.1}s`,
                      opacity: 0,
                    }}
                  >
                    {/* Timeline Dot */}
                    <div
                      className={`relative z-10 flex-shrink-0 w-16 h-16 rounded-2xl ${config.bg} flex items-center justify-center shadow-lg border-4 border-white group-hover:scale-110 transition-transform duration-300`}
                    >
                      <Icon className={`w-7 h-7 ${config.color}`} />
                    </div>

                    {/* Card Content */}
                    <div className="flex-1 bg-white/70 backdrop-blur-md rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all duration-300 border border-white/60 group-hover:-translate-y-1">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                            {config.label}
                          </h3>
                          <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
                            <Clock className="w-3 h-3" />
                            {new Date(log.ts).toLocaleString()}
                          </p>
                        </div>
                        <div
                          className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide
                                                    ${
                                                      log.actor_role === "doctor"
                                                        ? "bg-blue-100 text-blue-700"
                                                        : log.actor_role ===
                                                            "nurse"
                                                          ? "bg-pink-100 text-pink-700"
                                                          : "bg-gray-100 text-gray-700"
                                                    }`}
                        >
                          {log.actor_role}
                        </div>
                      </div>

                      <div className="bg-white/50 rounded-xl p-3 flex items-center gap-3 border border-dashed border-gray-200">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-sm">
                          {log.actor_name.replace(/^Dr\. /, "").slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-700">
                            {log.actor_name}
                          </p>
                          {log.break_glass && (
                            <p className="text-xs font-semibold text-red-600">
                              Emergency access. Flagged for review by the security team.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
