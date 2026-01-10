import { UserRole, RoleConfig, ThemeClasses } from "./types";

export const roles: Record<UserRole, RoleConfig> = {
  patient: { label: "Patient", iconName: "User" },
  doctor: { label: "Doctor", iconName: "Stethoscope" },
  nurse: { label: "Nurse", iconName: "Activity" },
  staff: { label: "Staff", iconName: "UserCog" },
  admin: { label: "Admin", iconName: "Shield" },
};

export const getThemeClasses = (selectedRole: UserRole): ThemeClasses => {
  const isPatient = selectedRole === "patient";

  return {
    container: isPatient
      ? "bg-gradient-to-br from-red-50 via-rose-50 to-pink-50"
      : "bg-gradient-to-br from-gray-50 to-gray-100",
    card: isPatient
      ? "bg-white shadow-lg shadow-red-100/50"
      : "bg-white shadow-lg shadow-gray-200/50",
    roleButton: (role: UserRole) =>
      role === selectedRole
        ? isPatient && selectedRole === "patient"
          ? "bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-md"
          : "bg-gray-800 text-white shadow-md"
        : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200",
    input: isPatient
      ? "border-red-200 focus:border-rose-400 focus:ring-rose-200"
      : "border-gray-300 focus:border-gray-500 focus:ring-gray-200",
    button: isPatient
      ? "bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white shadow-lg shadow-red-500/30"
      : "bg-gray-800 hover:bg-gray-900 text-white shadow-lg",
    link: isPatient
      ? "text-red-600 hover:text-red-700"
      : "text-gray-600 hover:text-gray-800",
    icon: isPatient ? "text-red-500" : "text-gray-500",
    logoBg: isPatient
      ? "bg-gradient-to-br from-red-500 to-rose-500"
      : "bg-gray-800",
  };
};
