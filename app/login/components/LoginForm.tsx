import { Mail, Lock, IdCard } from "lucide-react";
import { ThemeClasses, UserRole } from "../types";

interface LoginFormProps {
  identifier: string;
  password: string;
  selectedRole: UserRole;
  onIdentifierChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  themeClasses: ThemeClasses;
  onSubmit: (e: React.FormEvent) => void;
}

export default function LoginForm({
  identifier,
  password,
  selectedRole,
  onIdentifierChange,
  onPasswordChange,
  themeClasses,
  onSubmit,
}: LoginFormProps) {
  const isPatient = selectedRole === "patient";
  const inputLabel = isPatient ? "Email Address" : "Staff/Employee ID";
  const inputPlaceholder = isPatient ? "you@example.com" : "Enter your ID";
  const inputType = isPatient ? "email" : "text";
  const InputIcon = isPatient ? Mail : IdCard;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Email/ID Input */}
      <div>
        <label
          htmlFor="identifier"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          {inputLabel}
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <InputIcon
              className={`w-5 h-5 ${themeClasses.icon} transition-colors duration-300`}
            />
          </div>
          <input
            id="identifier"
            type={inputType}
            value={identifier}
            onChange={(e) => onIdentifierChange(e.target.value)}
            placeholder={inputPlaceholder}
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
            onChange={(e) => onPasswordChange(e.target.value)}
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
  );
}
