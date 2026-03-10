"use client";

import { useState, useEffect, useCallback } from "react";
import { User, Check, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Nurse {
  id: string;
  nurse_id: string;
  first_name: string;
  last_name: string;
  department: string;
  license_number: string;
  shift: string;
  phone: string;
}

interface NurseAssignmentProps {
  appointmentId: string;
  currentNurseId?: string;
  currentNurseName?: string;
  department: string;
  hospitalId?: string;
  onUpdate: () => void;
}

export function NurseAssignment({
  appointmentId,
  currentNurseId,
  currentNurseName,
  department,
  hospitalId,
  onUpdate,
}: NurseAssignmentProps) {
  const [nurses, setNurses] = useState<Nurse[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  const fetchNurses = useCallback(async () => {
    setIsLoading(true);
    try {
      // First try to get nurses from the same hospital
      if (hospitalId) {
        const { data: hospitalNurses, error: hnError } = await supabase
          .from("nurse_hospitals")
          .select(
            `
            nurses (
              id, nurse_id, first_name, last_name, department, license_number, shift, phone
            )
          `,
          )
          .eq("hospital_id", hospitalId);

        if (!hnError && hospitalNurses && hospitalNurses.length > 0) {
          const nursesFromHospital = hospitalNurses
            .filter((hn: any) => hn.nurses)
            .map((hn: any) => hn.nurses);

          if (nursesFromHospital.length > 0) {
            setNurses(nursesFromHospital);
            setIsLoading(false);
            return;
          }
        }
      }

      // Fallback: fetch all nurses
      const { data: allNurses, error: allError } = await supabase
        .from("nurses")
        .select(
          "id, nurse_id, first_name, last_name, department, license_number, shift, phone",
        )
        .order("first_name");

      if (!allError) {
        setNurses(allNurses || []);
      }
    } catch (error) {
      console.error("Error fetching nurses:", error);
    } finally {
      setIsLoading(false);
    }
  }, [hospitalId]);

  // Fetch nurses when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchNurses();
    }
  }, [isOpen, fetchNurses]);

  const handleAssignNurse = async (nurseId: string) => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ nurse_id: nurseId })
        .eq("id", appointmentId);

      if (error) {
        console.error("Error assigning nurse:", error);
        alert("Failed to assign nurse");
      } else {
        setIsOpen(false);
        onUpdate();
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to assign nurse");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2 text-sm">
        <User className="w-4 h-4 text-slate-400" />
        <span className="text-slate-600 dark:text-slate-400">Nurse:</span>
        <button
          id={`nurse-assign-${appointmentId}`}
          onClick={() => setIsOpen(!isOpen)}
          className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:underline"
        >
          {currentNurseName || "Assign"}
        </button>
      </div>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute left-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                  Select Nurse
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {nurses.length} available
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isLoading ? (
              <div className="p-8 flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
              </div>
            ) : nurses.length === 0 ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                No nurses available
              </div>
            ) : (
              <div className="max-h-[280px] overflow-y-auto">
                {nurses.map((nurse) => (
                  <button
                    key={nurse.id}
                    onClick={() => handleAssignNurse(nurse.id)}
                    disabled={updating}
                    className={`w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-between border-b border-slate-100 dark:border-slate-800 last:border-0 ${
                      nurse.id === currentNurseId
                        ? "bg-blue-50 dark:bg-blue-900/20"
                        : ""
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-800 dark:text-white text-sm truncate">
                          {nurse.first_name} {nurse.last_name}
                        </p>
                        <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded font-mono">
                          {nurse.nurse_id}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {nurse.department} • {nurse.shift}
                      </p>
                    </div>
                    {nurse.id === currentNurseId && (
                      <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 ml-2" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
