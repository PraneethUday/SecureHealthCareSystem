"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  X,
  Heart,
  User,
  Activity,
  AlertCircle,
  Pill,
  Phone,
  Droplets,
} from "lucide-react";
import Portal from "@/components/ui/Portal";

interface PatientProfileModalProps {
  patientId: string;
  onClose: () => void;
}

export default function PatientProfileModal({
  patientId,
  onClose,
}: PatientProfileModalProps) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data, error } = await supabase
          .from("patients")
          .select("*")
          .eq("id", patientId)
          .single();

        if (error) throw error;
        setProfile(data);
      } catch (err: any) {
        console.error("Error loading patient profile:", err);
        setError("Could not load patient profile.");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [patientId]);

  return (
    <Portal>
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-50 dark:bg-rose-900/30 rounded-xl">
                <Heart className="w-5 h-5 text-rose-500 dark:text-rose-400" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  Shared Health Profile
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Patient&apos;s self-reported data
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              aria-label="Close profile modal"
            >
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>

          <div className="p-5 max-h-[70vh] overflow-y-auto space-y-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-7 h-7 border-2 border-rose-400 border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-sm text-slate-500">Loading profile data...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-4 rounded-xl flex items-center gap-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            ) : (
              <>
                {/* Patient identity strip */}
                <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="w-10 h-10 bg-rose-100 dark:bg-rose-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-rose-500 dark:text-rose-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      {profile.first_name} {profile.last_name}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                        <Droplets className="w-3 h-3" />
                        Blood Group:{" "}
                        <span className="font-semibold text-rose-600 dark:text-rose-400">
                          {profile.blood_group || "Unknown"}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Health sections grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Section
                    icon={<AlertCircle className="w-4 h-4 text-amber-500" />}
                    title="Allergies"
                    content={profile.allergies || "None"}
                    accent="amber"
                  />
                  <Section
                    icon={<Phone className="w-4 h-4 text-blue-500" />}
                    title="Emergency Contact"
                    content={profile.emergency_contact || "Not provided"}
                    accent="blue"
                  />
                  <Section
                    icon={<Activity className="w-4 h-4 text-emerald-500" />}
                    title="Chronic Conditions"
                    content={
                      profile.health_profile?.chronicConditions || "None"
                    }
                    accent="emerald"
                  />
                  <Section
                    icon={<Pill className="w-4 h-4 text-purple-500" />}
                    title="Current Medications"
                    content={profile.current_medications || "None"}
                    accent="purple"
                  />
                </div>

                {/* Symptoms - full width */}
                <Section
                  icon={<Activity className="w-4 h-4 text-rose-500" />}
                  title="Current Symptoms & Concerns"
                  content={
                    profile.health_profile?.symptoms || "No current concerns reported"
                  }
                  accent="rose"
                  fullWidth
                />
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-sm font-semibold hover:bg-slate-700 dark:hover:bg-slate-100 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}

function Section({
  icon,
  title,
  content,
  accent = "slate",
  fullWidth = false,
}: {
  icon: any;
  title: string;
  content: string;
  accent?: string;
  fullWidth?: boolean;
}) {
  const accentMap: Record<string, string> = {
    amber: "border-amber-100 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/10",
    blue: "border-blue-100 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-900/10",
    emerald: "border-emerald-100 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-900/10",
    purple: "border-purple-100 dark:border-purple-800/50 bg-purple-50 dark:bg-purple-900/10",
    rose: "border-rose-100 dark:border-rose-800/50 bg-rose-50 dark:bg-rose-900/10",
    slate: "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50",
  };

  return (
    <div className={fullWidth ? "col-span-full" : ""}>
      <div className="flex items-center gap-1.5 mb-1.5">
        {icon}
        <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
          {title}
        </h4>
      </div>
      <div
        className={`px-3 py-2.5 rounded-xl border text-sm text-slate-800 dark:text-slate-200 ${
          accentMap[accent] ?? accentMap.slate
        }`}
      >
        {content}
      </div>
    </div>
  );
}
