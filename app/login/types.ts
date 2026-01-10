export type UserRole = "patient" | "doctor" | "nurse" | "admin" | "staff";

export interface RoleConfig {
  label: string;
  iconName: string;
}

export interface ThemeClasses {
  container: string;
  card: string;
  roleButton: (role: UserRole) => string;
  input: string;
  button: string;
  link: string;
  icon: string;
  logoBg: string;
}
