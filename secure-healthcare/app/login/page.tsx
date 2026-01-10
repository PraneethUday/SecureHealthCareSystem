"use client";

import { useState } from "react";
import { UserRole } from "./types";
import { getThemeClasses } from "./constants";
import Header from "./components/Header";
import RoleSelector from "./components/RoleSelector";
import LoginForm from "./components/LoginForm";
import Footer from "./components/Footer";

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
    <div
      className={`min-h-screen flex items-center justify-center p-4 ${themeClasses.container} transition-colors duration-300`}
    >
      <div
        className={`w-full max-w-md ${themeClasses.card} rounded-2xl p-8 transition-all duration-300`}
      >
        <Header themeClasses={themeClasses} />

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
  );
}
