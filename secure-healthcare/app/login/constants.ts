import { User, Stethoscope, UserCog, Shield, Activity } from "lucide-react";

export type UserRole = "patient" | "doctor" | "nurse" | "admin" | "staff";

export interface RoleConfig {
  label: string;
  icon: React.ReactNode;
}

export const roles: Record<UserRole, RoleConfig> = {
  patient: { label: "Patient", icon: <User className="w-5 h-5" /> },
  doctor: { label: "Doctor", icon: <Stethoscope className="w-5 h-5" /> },
  nurse: { label: "Nurse", icon: <Activity className="w-5 h-5" /> },
  staff: { label: "Staff", icon: <UserCog className="w-5 h-5" /> },
  admin: { label: "Admin", icon: <Shield className="w-5 h-5" /> },
};

export interface ThemeClasses {
  container: string;
  card: string;
  roleButton: (role: UserRole) => string;
  input: string;
  button: string;
  link: string;
  icon: string;
  logoBg: string;
}

export const getThemeClasses = (selectedRole: UserRole): ThemeClasses => {
  const isPatient = selectedRole === "patient";

  return {
    container: isPatient
      ? "bg-gradient-to-br from-blue-50 via-teal-50 to-green-50"
      : "bg-gradient-to-br from-gray-50 to-gray-100",
    card: isPatient
      ? "bg-white shadow-lg shadow-blue-100/50"
      : "bg-white shadow-lg shadow-gray-200/50",
    roleButton: (role: UserRole) =>
      role === selectedRole
        ? isPatient && selectedRole === "patient"
          ? "bg-gradient-to-r from-teal-500 to-blue-500 text-white shadow-md"
          : "bg-gray-800 text-white shadow-md"
        : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200",
    input: isPatient
      ? "border-blue-200 focus:border-teal-400 focus:ring-teal-200"
      : "border-gray-300 focus:border-gray-500 focus:ring-gray-200",
    button: isPatient
      ? "bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white shadow-lg shadow-teal-500/30"
      : "bg-gray-800 hover:bg-gray-900 text-white shadow-lg",
    link: isPatient
      ? "text-teal-600 hover:text-teal-700"
      : "text-gray-600 hover:text-gray-800",
    icon: isPatient ? "text-teal-500" : "text-gray-500",
    logoBg: isPatient
      ? "bg-gradient-to-br from-teal-500 to-blue-500"
      : "bg-gray-800",
  };
};
