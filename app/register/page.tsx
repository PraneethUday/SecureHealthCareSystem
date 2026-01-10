"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Activity,
  Mail,
  Lock,
  User,
  Phone,
  Calendar,
  MapPin,
} from "lucide-react";
import RegisterInfoBanner from "./components/RegisterInfoBanner";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle registration logic here
    console.log("Registration submitted:", formData);
  };

  return (
    <div className="min-h-screen flex overflow-hidden">
      {/* Left Side - Information Banner */}
      <RegisterInfoBanner />

      {/* Right Side - Registration Form */}
      <div className="flex-1 flex items-start justify-center bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 overflow-y-auto h-screen">
        <div className="w-full max-w-xl bg-white shadow-lg shadow-red-100/50 rounded-2xl p-6 my-8">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-br from-red-500 to-rose-500 rounded-full p-3">
              <Activity className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-xl font-bold text-center text-gray-800 mb-1">
            Create Patient Account
          </h1>
          <p className="text-center text-gray-500 mb-4 text-sm">
            Join SecureHealthCare System today
          </p>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-xs font-medium text-gray-700 mb-1"
                >
                  First Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="w-4 h-4 text-red-500" />
                  </div>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="John"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:border-rose-400 focus:ring-rose-200"
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="lastName"
                  className="block text-xs font-medium text-gray-700 mb-1"
                >
                  Last Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="w-4 h-4 text-red-500" />
                  </div>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Doe"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:border-rose-400 focus:ring-rose-200"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium text-gray-700 mb-1"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="w-4 h-4 text-red-500" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:border-rose-400 focus:ring-rose-200"
                  required
                />
              </div>
            </div>

            {/* Phone and Date of Birth */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="phone"
                  className="block text-xs font-medium text-gray-700 mb-1"
                >
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="w-4 h-4 text-red-500" />
                  </div>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="(555) 123-4567"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:border-rose-400 focus:ring-rose-200"
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="dateOfBirth"
                  className="block text-xs font-medium text-gray-700 mb-1"
                >
                  Date of Birth
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="w-4 h-4 text-red-500" />
                  </div>
                  <input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:border-rose-400 focus:ring-rose-200"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <label
                htmlFor="address"
                className="block text-xs font-medium text-gray-700 mb-1"
              >
                Street Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="w-4 h-4 text-red-500" />
                </div>
                <input
                  id="address"
                  name="address"
                  type="text"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="123 Main Street"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:border-rose-400 focus:ring-rose-200"
                  required
                />
              </div>
            </div>

            {/* City, State, Zip */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label
                  htmlFor="city"
                  className="block text-xs font-medium text-gray-700 mb-1"
                >
                  City
                </label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="New York"
                  className="w-full px-3 py-2 text-sm border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:border-rose-400 focus:ring-rose-200"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="state"
                  className="block text-xs font-medium text-gray-700 mb-1"
                >
                  State
                </label>
                <input
                  id="state"
                  name="state"
                  type="text"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="NY"
                  className="w-full px-3 py-2 text-sm border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:border-rose-400 focus:ring-rose-200"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="zipCode"
                  className="block text-xs font-medium text-gray-700 mb-1"
                >
                  Zip Code
                </label>
                <input
                  id="zipCode"
                  name="zipCode"
                  type="text"
                  value={formData.zipCode}
                  onChange={handleChange}
                  placeholder="10001"
                  className="w-full px-3 py-2 text-sm border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:border-rose-400 focus:ring-rose-200"
                  required
                />
              </div>
            </div>

            {/* Password Fields */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-medium text-gray-700 mb-1"
                >
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="w-4 h-4 text-red-500" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:border-rose-400 focus:ring-rose-200"
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-xs font-medium text-gray-700 mb-1"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="w-4 h-4 text-red-500" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:border-rose-400 focus:ring-rose-200"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                className="mt-1 h-4 w-4 text-red-600 focus:ring-rose-500 border-gray-300 rounded"
                required
              />
              <label
                htmlFor="terms"
                className="ml-2 block text-xs text-gray-700"
              >
                I agree to the{" "}
                <a
                  href="#"
                  className="text-red-600 hover:text-red-700 font-medium"
                >
                  Terms and Conditions
                </a>{" "}
                and{" "}
                <a
                  href="#"
                  className="text-red-600 hover:text-red-700 font-medium"
                >
                  Privacy Policy
                </a>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white py-2.5 rounded-lg font-semibold text-sm shadow-lg shadow-red-500/30 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Create Account
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-red-600 hover:text-red-700 font-semibold transition-colors duration-200"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
