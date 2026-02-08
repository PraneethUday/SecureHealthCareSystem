"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { X, Heart, User, Activity, AlertCircle, Pill, Phone } from "lucide-react";

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
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="bg-rose-500 p-6 flex justify-between items-center text-white">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-xl">
                            <Heart className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Shared Health Profile</h2>
                            <p className="text-rose-100 text-sm">Patient's self-reported data</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 md:p-8 max-h-[70vh] overflow-y-auto">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="w-10 h-10 border-4 border-rose-500/30 border-t-rose-500 rounded-full animate-spin mb-4" />
                            <p className="text-gray-500">Loading profile data...</p>
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3">
                            <AlertCircle className="w-5 h-5" />
                            <p>{error}</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {/* Basic Info */}
                            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                                <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center">
                                    <User className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white">
                                        {profile.first_name} {profile.last_name}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Blood Group: <span className="font-bold text-rose-600">{profile.blood_group || "Unknown"}</span>
                                    </p>
                                </div>
                            </div>

                            {/* Health Sections */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Section
                                    icon={<AlertCircle className="w-5 h-5 text-amber-500" />}
                                    title="Allergies"
                                    content={profile.allergies || "No known allergies reported."}
                                />
                                <Section
                                    icon={<Phone className="w-5 h-5 text-blue-500" />}
                                    title="Emergency Contact"
                                    content={profile.emergency_contact || "Not provided."}
                                />
                                <Section
                                    icon={<Activity className="w-5 h-5 text-emerald-500" />}
                                    title="Chronic Conditions"
                                    content={profile.health_profile?.chronicConditions || "None reported."}
                                />
                                <Section
                                    icon={<Pill className="w-5 h-5 text-purple-500" />}
                                    title="Current Medications"
                                    content={profile.current_medications || "No medications reported."}
                                />
                            </div>

                            <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                                <Section
                                    icon={<Activity className="w-5 h-5 text-rose-500" />}
                                    title="Current Symptoms & Concerns"
                                    content={profile.health_profile?.symptoms || "No current concerns reported."}
                                    fullWidth
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 bg-gray-50 dark:bg-gray-800/30 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold hover:shadow-lg transition-all active:scale-95"
                    >
                        Close Profile
                    </button>
                </div>
            </div>
        </div>
    );
}

function Section({ icon, title, content, fullWidth = false }: { icon: any, title: string, content: string, fullWidth?: boolean }) {
    return (
        <div className={`${fullWidth ? "col-span-full" : ""}`}>
            <div className="flex items-center gap-2 mb-2">
                {icon}
                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">{title}</h4>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/30 p-3 rounded-xl border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-200">
                <p className="text-sm leading-relaxed">{content}</p>
            </div>
        </div>
    );
}
