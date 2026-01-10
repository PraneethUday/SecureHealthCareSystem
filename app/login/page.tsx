"use client";

import { useState } from "react";
import { UserRole } from "./types";
import { getThemeClasses } from "./constants";
import Header from "./components/Header";
import RoleSelector from "./components/RoleSelector";
import LoginForm from "./components/LoginForm";
import Footer from "./components/Footer";
import InfoBanner from "./components/InfoBanner";

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<UserRole>("patient");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  const themeClasses = getThemeClasses(selectedRole);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle login logic here
    console.log("Login submitted:", { selectedRole, identifier, password });
  };

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
    setIdentifier(""); // Clear identifier when switching roles
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
          />

          <Footer selectedRole={selectedRole} themeClasses={themeClasses} />
        </div>
      </div>
    </div>
  );
}
