import {
  User,
  Stethoscope,
  UserCog,
  Shield,
  Activity,
  LucideIcon,
} from "lucide-react";
import { UserRole, ThemeClasses } from "../types";
import { roles } from "../constants";

interface RoleSelectorProps {
  selectedRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  themeClasses: ThemeClasses;
}

// Icon mapping
const iconMap: Record<string, LucideIcon> = {
  User,
  Stethoscope,
  Activity,
  UserCog,
  Shield,
};

export default function RoleSelector({
  selectedRole,
  onRoleChange,
  themeClasses,
}: RoleSelectorProps) {
  const renderRoleButton = (role: UserRole) => {
    const roleConfig = roles[role];
    const Icon = iconMap[roleConfig.iconName];

    return (
      <button
        key={role}
        onClick={() => onRoleChange(role)}
        className={`${themeClasses.roleButton(
          role
        )} p-3 rounded-lg font-medium text-sm transition-all duration-200 flex flex-col items-center gap-1`}
      >
        <Icon className="w-5 h-5" />
        <span className="text-xs">{roleConfig.label}</span>
      </button>
    );
  };

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-3">
        Select Your Role
      </label>
      <div className="grid grid-cols-3 gap-2 mb-2">
        {(["patient", "doctor", "nurse"] as UserRole[]).map(renderRoleButton)}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {(["staff", "admin"] as UserRole[]).map(renderRoleButton)}
      </div>
    </div>
  );
}
