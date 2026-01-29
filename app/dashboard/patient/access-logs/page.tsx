"use client";

import { useEffect, useState } from "react";
import { getSession } from "@/lib/auth";
import { getPatientAccessLogs } from "@/lib/logging";
import { AccessLog } from "@/lib/database.types";
import {
    ShieldCheck,
    Eye,
    FileText,
    Clock,
    User,
    AlertTriangle,
    CheckCircle,
    Activity,
    Search
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AccessHistoryPage() {
    const router = useRouter();
    const [logs, setLogs] = useState<AccessLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [patientId, setPatientId] = useState<string | null>(null);

    useEffect(() => {
        const init = async () => {
            const session = await getSession();
            if (!session || session.role !== "patient") {
                router.push("/login");
                return;
            }

            // Use the correct ID field for patient (from auth.ts logic)
            setPatientId(session.user.patient_id || session.user.id);
            loadLogs(session.user.patient_id || session.user.id);
        };
        init();
    }, [router]);

    const loadLogs = async (id: string) => {
        try {
            setLoading(true);
            const data = await getPatientAccessLogs(id);
            setLogs(data);
        } catch (err: any) {
            console.error("Failed to load logs:", err);
            setError("Failed to load access history. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    const getActionIcon = (action: string) => {
        if (action.includes("view")) return <Eye className="w-4 h-4" />;
        if (action.includes("update")) return <FileText className="w-4 h-4" />;
        return <Activity className="w-4 h-4" />;
    };

    const getActionColor = (action: string) => {
        if (action.includes("view")) return "text-blue-600 bg-blue-50 border-blue-200";
        if (action.includes("update")) return "text-amber-600 bg-amber-50 border-amber-200";
        return "text-gray-600 bg-gray-50 border-gray-200";
    };

    const formatActionName = (action: string) => {
        return action.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            {/* Header */}
            <div className="bg-white shadow-sm border-b mb-8">
                <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-4">
                        <div className="bg-emerald-100 p-3 rounded-full">
                            <ShieldCheck className="w-8 h-8 text-emerald-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Access History</h1>
                            <p className="text-sm text-gray-500">
                                Transparent, blockchain-verified log of who accessed your records.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Info Card */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-6 mb-8 text-white">
                    <div className="flex items-start gap-4">
                        <div className="bg-white/20 p-2 rounded-lg">
                            <ShieldCheck className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold mb-1">Access History</h2>
                            <p className="text-blue-100 text-sm opacity-90">
                                A secure log of every time your medical records are accessed.
                            </p>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-gray-500 font-medium">Loading history...</p>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                        <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-red-900 mb-1">Error Loading Logs</h3>
                        <p className="text-red-600 mb-4">{error}</p>
                        <button
                            onClick={() => patientId && loadLogs(patientId)}
                            className="px-4 py-2 bg-white border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition"
                        >
                            Retry
                        </button>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                        <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Access Records Found</h3>
                        <p className="text-gray-500 max-w-md mx-auto">
                            We haven't recorded any access to your medical records yet. When a doctor or staff member views your data, it will appear here.
                        </p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date & Time</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Resource</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2 text-sm text-gray-900">
                                                    <Clock className="w-4 h-4 text-gray-400" />
                                                    {log.timestamp ? new Date(log.timestamp).toLocaleString() : "Unknown"}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                                                        <User className="w-4 h-4" />
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {log.user_id}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize 
                          ${log.user_role === 'doctor' ? 'bg-blue-100 text-blue-800' :
                                                        log.user_role === 'admin' ? 'bg-purple-100 text-purple-800' :
                                                            'bg-gray-100 text-gray-800'}`}>
                                                    {log.user_role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${getActionColor(log.action)}`}>
                                                    {getActionIcon(log.action)}
                                                    {formatActionName(log.action)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {log.resource_type ? (
                                                    <span className="capitalize">{log.resource_type.replace(/_/g, " ")}</span>
                                                ) : "-"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
