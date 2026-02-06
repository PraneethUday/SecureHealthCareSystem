"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSession } from "@/lib/auth";
import ChangePasswordForm from "@/components/ChangePasswordForm";
import { UserRole } from "@/app/login/types";

function ChangePasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [session, setSession] = useState<{ user: any; role: UserRole } | null>(null);
    const isForced = searchParams.get("forced") === "true";

    useEffect(() => {
        const currentSession = getSession();
        if (!currentSession) {
            router.push("/login");
            return;
        }
        setSession(currentSession);
    }, [router]);

    if (!session) return null;

    return (
        <div className="min-h-screen bg-[conic-gradient(at_top,_var(--tw-gradient-stops))] from-blue-50 via-indigo-50 to-slate-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <ChangePasswordForm
                    identifier={
                        session.role === 'patient' ? session.user.patient_id :
                            session.role === 'doctor' ? session.user.doctor_id :
                                session.role === 'nurse' ? session.user.nurse_id :
                                    session.role === 'staff' ? session.user.staff_id :
                                        session.user.id
                    }
                    role={session.role}
                    isForced={isForced}
                    onSuccess={() => {
                        router.push(`/dashboard/${session.role}`);
                    }}
                />
            </div>
        </div>
    );
}

export default function ChangePasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[conic-gradient(at_top,_var(--tw-gradient-stops))] from-blue-50 via-indigo-50 to-slate-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950 flex items-center justify-center p-4">
                <div className="animate-pulse text-indigo-600 dark:text-indigo-400 font-medium">Loading security settings...</div>
            </div>
        }>
            <ChangePasswordContent />
        </Suspense>
    );
}
