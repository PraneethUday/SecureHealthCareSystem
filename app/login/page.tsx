"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserRole } from "./types";
import { getThemeClasses } from "./constants";
import Header from "./components/Header";
import RoleSelector from "./components/RoleSelector";
import LoginForm from "./components/LoginForm";
import Footer from "./components/Footer";
import InfoBanner from "./components/InfoBanner";
import { login, saveSession } from "@/lib/auth";
import { logAction } from "@/lib/logging";

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<UserRole>("patient");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();


  const themeClasses = getThemeClasses(selectedRole);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await login(identifier, password, selectedRole);

      if (result.success && result.user && result.role) {
        saveSession(result.user, result.role);

        // Login success logging handled in lib/auth.ts

        router.push(`/dashboard/${result.role}`);
      }

      else {
        setError(result.message || "Login failed");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
    setIdentifier(""); // Clear identifier when switching roles
    setError(""); // Clear error
  };

  return (
    <div className="min-h-screen flex overflow-hidden relative bg-[conic-gradient(at_top,_var(--tw-gradient-stops))] from-blue-50 via-indigo-50 to-slate-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950 selection:bg-rose-500 selection:text-white transition-colors duration-500">

      {/* Global Animated Background */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-60 dark:opacity-30">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-300 dark:bg-blue-900/40 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-300 dark:bg-indigo-900/40 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/3 w-96 h-96 bg-pink-300 dark:bg-pink-900/40 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <style jsx global>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>

      {/* Left Side - Information Banner (Only for Patients) */}
      <div
        className={`relative z-10 transition-all duration-700 ease-in-out ${selectedRole === "patient"
          ? "hidden md:block md:w-1/2 opacity-100 p-8 flex items-center justify-center" // Added flex centering
          : "w-0 p-0 opacity-0 overflow-hidden"
          }`}
      >
        <div className="h-full w-full flex items-center justify-center">
          <InfoBanner selectedRole={selectedRole} themeClasses={themeClasses} />
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div
        className={`relative z-10 flex items-center justify-center min-h-screen w-full py-8 transition-all duration-700 ease-in-out ${selectedRole === "patient" ? "md:w-1/2" : ""
          }`}
      >
        <div
          className={`w-full mx-auto ${selectedRole === "patient"
            ? `max-w-md p-8 ${themeClasses.card} rounded-3xl border border-white/50 dark:border-white/10 backdrop-blur-xl` // Updated classes
            : "max-w-xl p-8 backdrop-blur-xl bg-white/60 dark:bg-gray-900/60 border border-white/50 dark:border-white/10 rounded-3xl"
            } transition-all duration-500 ease-in-out shadow-2xl dark:shadow-black/40`}
        >
          <Header themeClasses={themeClasses} selectedRole={selectedRole} />

          <RoleSelector
            selectedRole={selectedRole}
            onRoleChange={handleRoleChange}
            themeClasses={themeClasses}
          />

          <LoginForm
            identifier={identifier}
            password={password}
            selectedRole={selectedRole}
            onIdentifierChange={setIdentifier}
            onPasswordChange={setPassword}
            themeClasses={themeClasses}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            error={error}
          />

          <Footer selectedRole={selectedRole} themeClasses={themeClasses} />
        </div>
      </div>
    </div>
  );
}
