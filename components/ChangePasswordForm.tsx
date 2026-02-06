"use client";

import { useState, useEffect } from "react";
import { Lock, Check, X, ShieldCheck, AlertCircle } from "lucide-react";
import { UserRole } from "@/app/login/types";
import { getThemeClasses } from "@/app/login/constants";
import { updatePassword } from "@/app/actions/auth-actions";

interface ChangePasswordFormProps {
    identifier: string;
    role: UserRole;
    onSuccess?: () => void;
    isForced?: boolean;
}

export default function ChangePasswordForm({
    identifier,
    role,
    onSuccess,
    isForced = false,
}: ChangePasswordFormProps) {
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const themeClasses = getThemeClasses(role);

    // Complexity states
    const [checks, setChecks] = useState({
        length: false,
        upper: false,
        lower: false,
        number: false,
        special: false,
    });

    useEffect(() => {
        setChecks({
            length: newPassword.length >= 12,
            upper: /[A-Z]/.test(newPassword),
            lower: /[a-z]/.test(newPassword),
            number: /[0-9]/.test(newPassword),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
        });
    }, [newPassword]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (newPassword !== confirmPassword) {
            setError("New passwords do not match");
            return;
        }

        const allChecked = Object.values(checks).every(Boolean);
        if (!allChecked) {
            setError("Please meet all password requirements");
            return;
        }

        setIsLoading(true);
        try {
            const result = await updatePassword(identifier, oldPassword, newPassword, role);
            if (result.success) {
                setSuccess("Password updated successfully!");
                setOldPassword("");
                setNewPassword("");
                setConfirmPassword("");
                if (onSuccess) {
                    setTimeout(onSuccess, 2000);
                }
            } else {
                setError(result.message);
            }
        } catch (err) {
            setError("An unexpected error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const Requirement = ({ label, met }: { label: string; met: boolean }) => (
        <div className={`flex items-center gap-2 text-xs transition-colors duration-200 ${met ? "text-emerald-500" : "text-gray-400"}`}>
            {met ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
            <span>{label}</span>
        </div>
    );

    return (
        <div className={`w-full max-w-md mx-auto p-8 rounded-3xl backdrop-blur-xl border border-white/50 dark:border-white/10 ${themeClasses.card} shadow-2xl`}>
            <div className="flex flex-col items-center mb-8">
                <div className={`p-4 rounded-2xl bg-gradient-to-br ${role === 'patient' ? 'from-rose-500 to-pink-600' : 'from-blue-500 to-indigo-600'} text-white shadow-lg mb-4`}>
                    <ShieldCheck className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                    {isForced ? "Update Password" : "Change Password"}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2">
                    {isForced
                        ? "Your password has expired or needs updating for security."
                        : "Keep your account secure with a strong password."}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm animate-shake">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {success && (
                    <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm">
                        <Check className="w-4 h-4 flex-shrink-0" />
                        <span>{success}</span>
                    </div>
                )}

                <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1">Current Password</label>
                    <div className="relative">
                        <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${themeClasses.icon}`} />
                        <input
                            type="password"
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                            className={`w-full pl-10 pr-4 py-3 bg-white/50 dark:bg-gray-800/50 border ${themeClasses.input} rounded-xl focus:ring-2 focus:outline-none transition-all`}
                            placeholder="••••••••"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1">New Password</label>
                        <div className="relative">
                            <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${themeClasses.icon}`} />
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className={`w-full pl-10 pr-4 py-3 bg-white/50 dark:bg-gray-800/50 border ${themeClasses.input} rounded-xl focus:ring-2 focus:outline-none transition-all`}
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-y-2 bg-gray-50/50 dark:bg-gray-900/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                        <Requirement label="Min 12 characters" met={checks.length} />
                        <Requirement label="One Uppercase" met={checks.upper} />
                        <Requirement label="One Lowercase" met={checks.lower} />
                        <Requirement label="One Number" met={checks.number} />
                        <Requirement label="One Symbol" met={checks.special} />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1">Confirm New Password</label>
                    <div className="relative">
                        <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${themeClasses.icon}`} />
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className={`w-full pl-10 pr-4 py-3 bg-white/50 dark:bg-gray-800/50 border ${themeClasses.input} rounded-xl focus:ring-2 focus:outline-none transition-all`}
                            placeholder="••••••••"
                            required
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full py-4 ${themeClasses.button} rounded-xl font-bold shadow-lg transform transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none`}
                >
                    {isLoading ? "Updating..." : "Secure My Account"}
                </button>
            </form>
        </div>
    );
}
