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
    container: "bg-transparent", // Handled by global page background now
    card: isPatient
      ? "bg-white/70 dark:bg-gray-900/60 shadow-2xl shadow-red-500/10 dark:shadow-red-900/20 backdrop-blur-xl border border-white/60 dark:border-white/10"
      : "bg-white/70 dark:bg-gray-900/60 shadow-2xl shadow-gray-500/10 dark:shadow-black/20 backdrop-blur-xl border border-white/60 dark:border-white/10",
    roleButton: (role: UserRole) =>
      role === selectedRole
        ? isPatient && selectedRole === "patient"
          ? "bg-gradient-to-r from-red-500 to-rose-500 dark:from-red-600 dark:to-rose-600 text-white shadow-lg shadow-rose-500/30 dark:shadow-rose-900/30 transform scale-105"
          : "bg-gray-800 dark:bg-gray-700 text-white shadow-lg shadow-gray-500/30 dark:shadow-black/30 transform scale-105"
        : "bg-white/50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-md backdrop-blur-sm",
    input: isPatient
      ? "bg-white/50 dark:bg-gray-800/50 border-red-100 dark:border-red-900/30 focus:border-rose-400 dark:focus:border-rose-400 focus:ring-rose-200 dark:focus:ring-rose-900/50 focus:bg-white dark:focus:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-500 transition-all"
      : "bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:border-gray-500 dark:focus:border-gray-400 focus:ring-gray-200 dark:focus:ring-gray-700 focus:bg-white dark:focus:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-500 transition-all",
    button: isPatient
      ? "bg-gradient-to-r from-red-500 to-rose-500 dark:from-red-600 dark:to-rose-600 hover:from-red-600 hover:to-rose-600 dark:hover:from-red-500 dark:hover:to-rose-500 text-white shadow-lg shadow-red-500/30 dark:shadow-red-900/30 hover:scale-[1.02] active:scale-95 transition-all duration-200"
      : "bg-gray-800 dark:bg-gray-700 hover:bg-gray-900 dark:hover:bg-gray-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all duration-200",
    link: isPatient
      ? "text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium hover:underline decoration-red-200 dark:decoration-red-900"
      : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium hover:underline decoration-gray-200 dark:decoration-gray-700",
    icon: isPatient ? "text-red-500 dark:text-red-400" : "text-gray-500 dark:text-gray-400",
    logoBg: isPatient
      ? "bg-gradient-to-br from-red-500 to-rose-500 dark:from-red-600 dark:to-rose-600 shadow-lg shadow-rose-500/30 dark:shadow-rose-900/30"
      : "bg-gray-800 dark:bg-gray-700 shadow-lg shadow-gray-500/30 dark:shadow-black/30",
  };
};
