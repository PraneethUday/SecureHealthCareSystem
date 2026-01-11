"use client";

import Link from "next/link";
import { Activity } from "lucide-react";
import RegisterInfoBanner from "./components/RegisterInfoBanner";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex overflow-hidden">
      {/* Left Side - Information Banner */}
      <RegisterInfoBanner />

      {/* Right Side - Registration Options */}
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 overflow-y-auto h-screen">
        <div className="w-full max-w-md px-6 py-8">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="bg-gradient-to-br from-red-500 to-rose-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                Create Account
              </h2>
              <p className="text-gray-600">
                Join our healthcare system
              </p>
            </div>

            {/* Patient Registration Option */}
            <div className="space-y-4">
              <Link
                href="/register/patient"
                className="block w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl text-center font-semibold"
              >
                Register as Patient
              </Link>

              <div className="text-center text-sm text-gray-600 mt-4">
                <p>Staff registration is handled by administrators</p>
              </div>

              {/* Login Link */}
              <div className="text-center pt-4 border-t mt-6">
                <p className="text-sm text-gray-600">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="text-red-600 font-semibold hover:underline"
                  >
                    Sign In
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
