import { Activity } from "lucide-react";
import { ThemeClasses, UserRole } from "../types";

interface HeaderProps {
  themeClasses: ThemeClasses;
  selectedRole: UserRole;
}

export default function Header({ themeClasses, selectedRole }: HeaderProps) {
  const isPatient = selectedRole === "patient";

  return (
    <>
      {/* Logo Placeholder */}
      <div className={`flex justify-center ${isPatient ? "mb-3" : "mb-4"}`}>
        <div
          className={`${themeClasses.logoBg} rounded-full ${isPatient ? "p-3" : "p-4"
            } transition-colors duration-300`}
        >
          <Activity
            className={`${isPatient ? "w-8 h-8" : "w-10 h-10"} text-white`}
          />
        </div>
      </div>

      {/* Title */}
      <h1
        className={`${isPatient ? "text-xl" : "text-2xl"
          } font-bold text-center text-gray-900 dark:text-white mb-1`}
      >
        SecureHealthCare System
      </h1>
      <p
        className={`text-center text-gray-600 dark:text-gray-300 ${isPatient ? "mb-3" : "mb-4"
          } text-sm`}
      >
        Sign in to access your account
      </p>
    </>
  );
}
