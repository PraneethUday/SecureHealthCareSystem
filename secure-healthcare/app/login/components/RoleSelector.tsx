import { UserRole, roles, ThemeClasses } from "../constants";

interface RoleSelectorProps {
  selectedRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  themeClasses: ThemeClasses;
}

export default function RoleSelector({
  selectedRole,
  onRoleChange,
  themeClasses,
}: RoleSelectorProps) {
  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-3">
        Select Your Role
      </label>
      <div className="grid grid-cols-3 gap-2 mb-2">
        {(["patient", "doctor", "nurse"] as UserRole[]).map((role) => (
          <button
            key={role}
            onClick={() => onRoleChange(role)}
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
            onClick={() => onRoleChange(role)}
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
  );
}
