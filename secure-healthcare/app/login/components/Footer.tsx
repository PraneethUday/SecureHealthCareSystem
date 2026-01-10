import { UserRole, ThemeClasses } from "../types";

interface FooterProps {
  selectedRole: UserRole;
  themeClasses: ThemeClasses;
}

export default function Footer({ selectedRole, themeClasses }: FooterProps) {
  const isPatient = selectedRole === "patient";

  if (isPatient) {
    return (
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
