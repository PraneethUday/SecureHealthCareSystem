import { Activity } from "lucide-react";
import { ThemeClasses } from "../types";

interface HeaderProps {
  themeClasses: ThemeClasses;
}

export default function Header({ themeClasses }: HeaderProps) {
  return (
    <>
      {/* Logo Placeholder */}
      <div className="flex justify-center mb-6">
        <div
          className={`${themeClasses.logoBg} rounded-full p-4 transition-colors duration-300`}
        >
          <Activity className="w-10 h-10 text-white" />
        </div>
      </div>

      {/* Title */}
      <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">
        SecureHealthCare System
      </h1>
      <p className="text-center text-gray-500 mb-6 text-sm">
        Sign in to access your account
      </p>
    </>
  );
}
