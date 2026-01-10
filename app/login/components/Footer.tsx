import Link from "next/link";
import { UserRole, ThemeClasses } from "../types";

interface FooterProps {
  selectedRole: UserRole;
  themeClasses: ThemeClasses;
}

export default function Footer({ selectedRole, themeClasses }: FooterProps) {
  const isPatient = selectedRole === "patient";

  if (isPatient) {
    return (
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-600">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className={`${themeClasses.link} font-semibold transition-colors duration-200`}
          >
            Create account
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 text-center">
      <p className="text-xs text-gray-500">
        Staff access only. Contact IT support for assistance.
      </p>
    </div>
  );
}
