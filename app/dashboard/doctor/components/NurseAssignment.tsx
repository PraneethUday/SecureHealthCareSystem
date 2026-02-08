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
  onUpdate: () => void;
}

export function NurseAssignment({
  appointmentId,
  currentNurseId,
  currentNurseName,
  department,
  onUpdate,
}: NurseAssignmentProps) {
  const [nurses, setNurses] = useState<Nurse[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [isShowingAll, setIsShowingAll] = useState(false);



  const fetchNurses = useCallback(async () => {
    setIsLoading(true);
    try {
      // First try to fetch by department
      const { data, error } = await supabase
        .from("nurses")
        .select("id, nurse_id, first_name, last_name, department, license_number, shift, phone")
        .eq("department", department)
        .order("first_name");

      if (error) throw error;

      if (!data || data.length === 0) {
        // If no nurses in department, fetch all
        const { data: allData, error: allError } = await supabase
          .from("nurses")
          .select("id, nurse_id, first_name, last_name, department, license_number, shift, phone")
          .order("first_name");

        if (allError) throw allError;
        setNurses(allData || []);
        setIsShowingAll(true);
      } else {
        setNurses(data);
        setIsShowingAll(false);
      }
    } catch (error) {
      console.error("Error fetching nurses:", error);
    } finally {
      setIsLoading(false);
    }
  }, [department]);

  useEffect(() => {
    if (isOpen && nurses.length === 0) {
      fetchNurses();
    }
  }, [isOpen, nurses.length, fetchNurses]);

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
        <User className="w-4 h-4 text-gray-400" />
        <span className="text-gray-600">Assigned Nurse:</span>
        <button
          id={`nurse-assign-${appointmentId}`}
          onClick={() => setIsOpen(!isOpen)}
          className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
        >
          {currentNurseName || "Not assigned"}
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
          <div className="absolute left-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Select Nurse</h3>
                <p className="text-[10px] text-gray-500">
                  {isShowingAll ? "Showing all available" : `${department} Dept`}
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : nurses.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">
                No nurses registered in the system.
              </div>
            ) : (
              <div className="max-h-[300px] overflow-y-auto pt-2 pb-1">
                {isShowingAll && (
                  <div className="mx-4 mb-2 px-3 py-2 bg-amber-50 text-[10px] text-amber-700 font-medium border border-amber-100 rounded-lg">
                    No nurses found in {department}. Showing all departments instead.
                  </div>
                )}
                {nurses.map((nurse) => (
                  <button
                    key={nurse.id}
                    onClick={() => handleAssignNurse(nurse.id)}
                    disabled={updating}
                    className={`w-full px-4 py-4 text-left hover:bg-gray-50 transition-colors flex items-center justify-between border-b border-gray-100 last:border-0 ${nurse.id === currentNurseId ? "bg-blue-50/50" : ""
                      }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-gray-800 text-sm">
                          {nurse.first_name} {nurse.last_name}
                        </p>
                        <span className="text-[10px] uppercase tracking-wider bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">
                          {nurse.nurse_id}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                          <Check className="w-3 h-3 text-emerald-500" />
                          <span>Lic: {nurse.license_number}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                          <Check className="w-3 h-3 text-blue-500" />
                          <span>Shift: {nurse.shift}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-500 col-span-2">
                          <Check className="w-3 h-3 text-orange-500" />
                          <span>Contact: {nurse.phone || "No phone listed"}</span>
                        </div>
                      </div>
                    </div>
                    {nurse.id === currentNurseId && (
                      <Check className="w-5 h-5 text-blue-600 flex-shrink-0 ml-2" />
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
