"use client";

import { useState } from "react";
import {
  Mail,
  Lock,
  User,
  Stethoscope,
  UserCog,
  Shield,
  Activity,
} from "lucide-react";

type UserRole = "patient" | "doctor" | "nurse" | "admin" | "staff";

interface RoleConfig {
  label: string;
  icon: React.ReactNode;
}

const roles: Record<UserRole, RoleConfig> = {
  patient: { label: "Patient", icon: <User className="w-5 h-5" /> },
  doctor: { label: "Doctor", icon: <Stethoscope className="w-5 h-5" /> },
  nurse: { label: "Nurse", icon: <Activity className="w-5 h-5" /> },
  staff: { label: "Staff", icon: <UserCog className="w-5 h-5" /> },
  admin: { label: "Admin", icon: <Shield className="w-5 h-5" /> },
};

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<UserRole>("patient");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const isPatient = selectedRole === "patient";

  // Theme classes based on role
  const themeClasses = {
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
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 ${themeClasses.container} transition-colors duration-300`}
    >
      <div
        className={`w-full max-w-md ${themeClasses.card} rounded-2xl p-8 transition-all duration-300`}
      >
        {/* Logo Placeholder */}
        <div className="flex justify-center mb-6">
          <div
            className={`${
              isPatient
                ? "bg-gradient-to-br from-teal-500 to-blue-500"
                : "bg-gray-800"
            } rounded-full p-4 transition-colors duration-300`}
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

        {/* Role Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Your Role
          </label>
          <div className="grid grid-cols-3 gap-2 mb-2">
            {(["patient", "doctor", "nurse"] as UserRole[]).map((role) => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`${themeClasses.roleButton(
                  role
                )} p-3 rounded-lg font-medium text-sm transition-all duration-200 flex flex-col items-center gap-1`}
              >
                {roles[role].icon}
                <span className="text-xs">{roles[role].label}</span>
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(["staff", "admin"] as UserRole[]).map((role) => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`${themeClasses.roleButton(
                  role
                )} p-3 rounded-lg font-medium text-sm transition-all duration-200 flex flex-col items-center gap-1`}
              >
                {roles[role].icon}
                <span className="text-xs">{roles[role].label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
          {/* Email Input */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail
                  className={`w-5 h-5 ${themeClasses.icon} transition-colors duration-300`}
                />
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={`w-full pl-10 pr-4 py-3 border ${themeClasses.input} rounded-lg focus:outline-none focus:ring-2 transition-all duration-200`}
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock
                  className={`w-5 h-5 ${themeClasses.icon} transition-colors duration-300`}
                />
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full pl-10 pr-4 py-3 border ${themeClasses.input} rounded-lg focus:outline-none focus:ring-2 transition-all duration-200`}
                required
              />
            </div>
          </div>

          {/* Forgot Password */}
          <div className="flex justify-end">
            <a
              href="#"
              className={`text-sm ${themeClasses.link} font-medium transition-colors duration-200`}
            >
              Forgot password?
            </a>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            className={`w-full ${themeClasses.button} py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]`}
          >
            Sign In
          </button>
        </form>

        {/* Create Account Link - Only for Patients */}
        {isPatient && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don&apos;t have an account?{" "}
              <a
                href="#"
                className={`${themeClasses.link} font-semibold transition-colors duration-200`}
              >
                Create account
              </a>
            </p>
          </div>
        )}

        {/* Additional Info for Non-Patients */}
        {!isPatient && (
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Staff access only. Contact IT support for assistance.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
