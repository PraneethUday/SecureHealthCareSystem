"use client";

import { ShieldCheck, ShieldAlert, ShieldOff, Info } from "lucide-react";
import { useState } from "react";

interface ConsentStatusBadgeProps {
  /** Whether the patient has shared their health profile for this appointment */
  shareHealthProfile: boolean | undefined;
  /** Patient's name for display purposes */
  patientName?: string;
  /** When true, renders an expanded informational block instead of just a badge */
  expanded?: boolean;
}

/**
 * Story 3 – Physician sees patient consent status before accessing records.
 *
 * Renders a clear visual indicator of whether the patient has granted consent
 * (via share_health_profile) for this appointment. The doctor can see at a glance
 * if it is lawful to access and share the patient's health data.
 */
export default function ConsentStatusBadge({
  shareHealthProfile,
  patientName,
  expanded = false,
}: ConsentStatusBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const granted = !!shareHealthProfile;

  if (!expanded) {
    // ── Compact inline badge ──────────────────────────────────────────────────
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${granted
            ? "bg-green-50 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700"
            : "bg-red-50 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700"
          }`}
        title={
          granted
            ? "Patient has consented to share health data for this appointment."
            : "Patient has NOT consented to share health data. Access clinical data with caution."
        }
      >
        {granted ? (
          <ShieldCheck className="w-3.5 h-3.5" />
        ) : (
          <ShieldAlert className="w-3.5 h-3.5" />
        )}
        {granted ? "Consent Granted" : "No Consent"}
      </span>
    );
  }

  // ── Expanded informational block ─────────────────────────────────────────────
  return (
    <div
      className={`relative overflow-hidden rounded-xl border p-5 mb-4 transition-all group ${granted
          ? "bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-900/10 dark:to-emerald-900/10 border-green-200 dark:border-green-800/50"
          : "bg-gradient-to-br from-orange-50/50 to-red-50/50 dark:from-orange-900/10 dark:to-red-900/10 border-orange-200 dark:border-red-800/50"
        }`}
    >
      {/* Soft Glow Background effect */}
      <div
        className={`absolute -top-10 -right-10 w-40 h-40 blur-3xl rounded-full opacity-40 mix-blend-multiply dark:mix-blend-lighten pointer-events-none transition-opacity group-hover:opacity-60 ${granted ? "bg-green-300 dark:bg-green-700" : "bg-orange-300 dark:bg-red-700"
          }`}
      />

      <div className="relative z-10 flex items-start gap-4">
        {/* Sleek Icon container */}
        <div
          className={`flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0 shadow-sm border ${granted
              ? "bg-white dark:bg-green-950 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400"
              : "bg-white dark:bg-red-950 border-orange-200 dark:border-red-800 text-orange-600 dark:text-red-400"
            }`}
        >
          {granted ? (
            <ShieldCheck className="w-5 h-5" aria-hidden />
          ) : (
            <ShieldOff className="w-5 h-5" aria-hidden />
          )}
        </div>

        {/* Content area */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
                Data Sharing Consent
              </h4>
              <button
                type="button"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                onFocus={() => setShowTooltip(true)}
                onBlur={() => setShowTooltip(false)}
                className="relative text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <Info className="w-3.5 h-3.5" />
                {showTooltip && (
                  <div className="absolute left-6 -top-2 z-10 w-64 bg-gray-900 dark:bg-gray-800 text-white text-[11px] rounded-lg p-3 shadow-xl leading-relaxed pointer-events-none border border-gray-700">
                    Consent to share health profile for this session. Required under HIPAA §164.506.
                    <span className="absolute -left-1.5 top-3 w-3 h-3 bg-gray-900 dark:bg-gray-800 border-l border-b border-gray-700 rotate-45" />
                  </div>
                )}
              </button>
            </div>

            {/* Status Badge */}
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium tracking-wide uppercase border ${granted
                  ? "bg-green-100/80 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/60"
                  : "bg-red-100/80 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/60"
                }`}
            >
              {granted ? "Authorised" : "Action Required"}
            </span>
          </div>

          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed max-w-sm mb-3">
            {granted
              ? <>{patientName ? <strong className="font-medium text-gray-900 dark:text-gray-200">{patientName}</strong> : "This patient"} has authorized access to their clinical data.</>
              : <>{patientName ? <strong className="font-medium text-gray-900 dark:text-gray-200">{patientName}</strong> : "This patient"} has <strong>not</strong> authorized data sharing.</>
            }
          </p>

          {!granted && (
            <div className="flex items-start gap-2 bg-gradient-to-r from-orange-50 to-transparent dark:from-red-900/20 dark:to-transparent border-l-2 border-orange-400 dark:border-red-500 py-2 px-3 rounded-r-md">
              <ShieldAlert className="w-3.5 h-3.5 text-orange-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-orange-800 dark:text-red-300 leading-tight">
                <strong>HIPAA Restricted:</strong> Accessing protected health information without consent may violate Privacy Rule §164.508.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
