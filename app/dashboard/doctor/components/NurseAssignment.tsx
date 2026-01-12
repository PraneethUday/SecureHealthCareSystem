"use client";

import { useState, useEffect } from "react";
import { User, Check } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
);

interface Nurse {
  id: string;
  nurse_id: string;
  first_name: string;
  last_name: string;
  department: string;
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

  useEffect(() => {
    if (isOpen && nurses.length === 0) {
      fetchNurses();
    }
  }, [isOpen]);

  const fetchNurses = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("nurses")
        .select("id, nurse_id, first_name, last_name, department")
        .eq("department", department)
        .order("first_name");

      if (!error && data) {
        setNurses(data);
      }
    } catch (error) {
      console.error("Error fetching nurses:", error);
    } finally {
      setIsLoading(false);
    }
  };

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
          <div className="absolute left-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-80 overflow-auto">
            <div className="p-3 border-b border-gray-200">
              <h4 className="font-semibold text-gray-800">Select Nurse</h4>
              <p className="text-xs text-gray-500 mt-1">
                {department} Department
              </p>
            </div>

            {isLoading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              </div>
            ) : nurses.length === 0 ? (
              <div className="p-6 text-center text-gray-500 text-sm">
                No nurses available in {department}
              </div>
            ) : (
              <div className="py-2">
                {nurses.map((nurse) => (
                  <button
                    key={nurse.id}
                    onClick={() => handleAssignNurse(nurse.id)}
                    disabled={updating}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between ${
                      nurse.id === currentNurseId ? "bg-blue-50" : ""
                    }`}
                  >
                    <div>
                      <p className="font-medium text-gray-800">
                        {nurse.first_name} {nurse.last_name}
                      </p>
                      <p className="text-xs text-gray-500">{nurse.nurse_id}</p>
                    </div>
                    {nurse.id === currentNurseId && (
                      <Check className="w-5 h-5 text-blue-600" />
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
