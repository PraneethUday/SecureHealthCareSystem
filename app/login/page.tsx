"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserRole } from "./types";
import { getThemeClasses } from "./constants";
import Header from "./components/Header";
import RoleSelector from "./components/RoleSelector";
import LoginForm from "./components/LoginForm";
import OTPForm from "./components/OTPForm";
import Footer from "./components/Footer";
import InfoBanner from "./components/InfoBanner";
import { saveSession } from "@/lib/auth";
import { login, verifyMFAOTP } from "@/app/actions/auth-actions";

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<UserRole>("patient");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [requiresMFA, setRequiresMFA] = useState(false);
  const [mfaToken, setMFAToken] = useState("");
  const [otpAttempts, setOtpAttempts] = useState(0);
  const router = useRouter();

  const themeClasses = getThemeClasses(selectedRole);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await login(identifier, password, selectedRole);

      if (result.requiresMFA && result.mfaToken) {
        // MFA required - show OTP form
        setMFAToken(result.mfaToken);
        setRequiresMFA(true);
        setOtpAttempts(0);
      } else if (result.success && result.user && result.role) {
        // No MFA required - login successful
        saveSession(result.user, result.role);
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

  const handleOTPSubmit = async (e: React.FormEvent, otp: string) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Use Server Action instead of API route
      const result = await verifyMFAOTP(mfaToken, otp, selectedRole);

      if (result.success && result.user && result.role) {
        // OTP verified successfully
        saveSession(result.user, result.role);
        router.push(`/dashboard/${result.role}`);
      } else {
        const newAttempts = otpAttempts + 1;
        setOtpAttempts(newAttempts);

        if (newAttempts >= 5) {
          setError("Maximum OTP attempts exceeded. Please try logging in again.");
          setRequiresMFA(false);
          setMFAToken("");
        } else {
          setError(result.message || `Invalid OTP. ${5 - newAttempts} attempts remaining.`);
        }
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
    setIdentifier("");
    setPassword("");
    setError("");
    setRequiresMFA(false);
    setMFAToken("");
    setOtpAttempts(0);
  };

  const handleBackToLogin = () => {
    setRequiresMFA(false);
    setMFAToken("");
    setOtpAttempts(0);
    setError("");
  };

  return (
    <div className="min-h-screen flex overflow-hidden">
      {/* Left Side - Information Banner (Only for Patients) */}
      <div
        className={`transition-all duration-700 ease-in-out ${selectedRole === "patient"
          ? "w-1/2 opacity-100"
          : "w-0 opacity-0 overflow-hidden"
          }`}
      >
        <InfoBanner selectedRole={selectedRole} themeClasses={themeClasses} />
      </div>

      {/* Right Side - Login Form */}
      <div
        className={`flex ${selectedRole === "patient" ? "items-center" : "items-start"
          } justify-center min-h-screen py-8 ${themeClasses.container
          } transition-all duration-700 ease-in-out ${selectedRole === "patient" ? "flex-1" : "flex-1 w-full"
          }`}
      >
        <div
          className={`w-full ${selectedRole === "patient"
            ? `max-w-md p-6 ${themeClasses.card} rounded-2xl`
            : "max-w-xl"
            } transition-all duration-500 ease-in-out`}
        >
          <Header themeClasses={themeClasses} selectedRole={selectedRole} />

          {!requiresMFA && (
            <RoleSelector
              selectedRole={selectedRole}
              onRoleChange={handleRoleChange}
              themeClasses={themeClasses}
            />
          )}

          {requiresMFA ? (
            <OTPForm
              onSubmit={handleOTPSubmit}
              isLoading={isLoading}
              error={error}
              email={identifier}
              themeClasses={themeClasses}
              onBackClick={handleBackToLogin}
              attemptsRemaining={5 - otpAttempts}
            />
          ) : (
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
          )}

          {!requiresMFA && (
            <Footer selectedRole={selectedRole} themeClasses={themeClasses} />
          )}
        </div>
      </div>
    </div>
  );
}
