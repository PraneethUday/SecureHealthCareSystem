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
        // Save session
        saveSession(result.user, result.role);

        // Redirect to appropriate dashboard
        router.push(`/dashboard/${result.role}`);
      } else {
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
    <div className="min-h-screen flex overflow-hidden">
      {/* Left Side - Information Banner (Only for Patients) */}
      <div
        className={`transition-all duration-700 ease-in-out ${
          selectedRole === "patient"
            ? "w-1/2 opacity-100"
            : "w-0 opacity-0 overflow-hidden"
        }`}
      >
        <InfoBanner selectedRole={selectedRole} themeClasses={themeClasses} />
      </div>

      {/* Right Side - Login Form */}
      <div
        className={`flex ${
          selectedRole === "patient" ? "items-center" : "items-start"
        } justify-center min-h-screen py-8 ${
          themeClasses.container
        } transition-all duration-700 ease-in-out ${
          selectedRole === "patient" ? "flex-1" : "flex-1 w-full"
        }`}
      >
        <div
          className={`w-full ${
            selectedRole === "patient"
              ? `max-w-md p-6 ${themeClasses.card} rounded-2xl`
              : "max-w-xl"
          } transition-all duration-500 ease-in-out`}
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
