"use client";

import { useState } from "react";
import { Lock, ArrowLeft } from "lucide-react";

interface OTPFormProps {
  onSubmit: (e: React.FormEvent, otp: string) => void;
  isLoading: boolean;
  error: string;
  email: string;
  themeClasses: any;
  onBackClick: () => void;
  attemptsRemaining: number;
}

export default function OTPForm({
  onSubmit,
  isLoading,
  error,
  email,
  themeClasses,
  onBackClick,
  attemptsRemaining,
}: OTPFormProps) {
  const [otp, setOtp] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, "").slice(0, 6);
    setOtp(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    if (otp.length !== 6) {
      return;
    }
    onSubmit(e, otp);
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={onBackClick}
        className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Login
      </button>

      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Verify Your Identity</h2>
        <p className="text-gray-600 text-sm">
          We sent a verification code to <br />
          <span className="font-semibold">{email}</span>
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className={`p-4 rounded-lg border-l-4 ${themeClasses.errorBg}`}>
          <p className={`text-sm font-medium ${themeClasses.errorText}`}>{error}</p>
          {attemptsRemaining > 0 && (
            <p className="text-xs text-gray-600 mt-1">
              {attemptsRemaining} attempt{attemptsRemaining !== 1 ? "s" : ""} remaining
            </p>
          )}
        </div>
      )}

      {/* OTP Input Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* OTP Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Verification Code
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={otp}
              onChange={handleChange}
              placeholder="000000"
              maxLength={6}
              className="w-full pl-10 pr-4 py-3 text-center text-2xl font-bold tracking-widest border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
              disabled={isLoading}
              autoComplete="off"
              autoFocus
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Enter the 6-digit code from your email
          </p>
        </div>

        {/* Security Info */}
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-800">
            🔒 <span className="font-semibold">Your code is valid for 10 minutes</span>
          </p>
          <p className="text-xs text-blue-700 mt-1">Never share this code with anyone</p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || otp.length !== 6 || attemptsRemaining <= 0}
          className={`w-full py-3 rounded-lg font-semibold transition-all duration-200 ${
            otp.length === 6 && attemptsRemaining > 0 && !isLoading
              ? `${themeClasses.button} hover:shadow-lg transform hover:scale-105`
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Verifying...
            </div>
          ) : (
            "Verify Code"
          )}
        </button>
      </form>

      {/* Help Text */}
      <div className="text-center text-xs text-gray-600 space-y-2">
        <p>Didn't receive the code?</p>
        <button
          type="button"
          disabled={isLoading}
          onClick={onBackClick}
          className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
        >
          Try a different email
        </button>
      </div>
    </div>
  );
}
