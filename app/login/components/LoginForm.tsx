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
  isLoading?: boolean;
  error?: string;
}

export default function LoginForm({
  identifier,
  password,
  selectedRole,
  onIdentifierChange,
  onPasswordChange,
  themeClasses,
  onSubmit,
  isLoading = false,
  error = "",
}: LoginFormProps) {
  const isPatient = selectedRole === "patient";
  const inputLabel = isPatient ? "Email Address" : "Staff/Employee ID";
  const inputPlaceholder = isPatient ? "you@example.com" : "Enter your ID";
  const inputType = isPatient ? "email" : "text";
  const InputIcon = isPatient ? Mail : IdCard;

  return (
    <form onSubmit={onSubmit} className={isPatient ? "space-y-3" : "space-y-5"}>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div>
        <label
          htmlFor="identifier"
          className={`block ${
            isPatient ? "text-xs" : "text-sm"
          } font-medium text-gray-700 ${isPatient ? "mb-1" : "mb-2"}`}
        >
          {inputLabel}
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <InputIcon
              className={`${isPatient ? "w-4 h-4" : "w-5 h-5"} ${
                themeClasses.icon
              } transition-colors duration-300`}
            />
          </div>
          <input
            id="identifier"
            type={inputType}
            value={identifier}
            onChange={(e) => onIdentifierChange(e.target.value)}
            placeholder={inputPlaceholder}
            className={`w-full ${
              isPatient ? "pl-9 pr-3 py-2" : "pl-10 pr-4 py-3"
            } text-sm border ${
              themeClasses.input
            } rounded-lg focus:outline-none focus:ring-2 transition-all duration-200`}
            required
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="password"
          className={`block ${
            isPatient ? "text-xs" : "text-sm"
          } font-medium text-gray-700 ${isPatient ? "mb-1" : "mb-2"}`}
        >
          Password
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock
              className={`${isPatient ? "w-4 h-4" : "w-5 h-5"} ${
                themeClasses.icon
              } transition-colors duration-300`}
            />
          </div>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            placeholder="••••••••"
            className={`w-full ${
              isPatient ? "pl-9 pr-3 py-2" : "pl-10 pr-4 py-3"
            } text-sm border ${
              themeClasses.input
            } rounded-lg focus:outline-none focus:ring-2 transition-all duration-200`}
            required
          />
        </div>
      </div>

      <div className="flex justify-end">
        <a
          href="#"
          className={`text-xs ${themeClasses.link} font-medium transition-colors duration-200`}
        >
          Forgot password?
        </a>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className={`w-full ${themeClasses.button} ${
          isPatient ? "py-2.5" : "py-3"
        } rounded-lg font-semibold text-sm transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
      >
        {isLoading ? "Signing In..." : "Sign In"}
      </button>
    </form>
  );
}
