# Login Module

This module handles authentication for the SecureHealthCare System with role-based login functionality.

## Structure

```
login/
├── components/          # Reusable UI components
│   ├── Header.tsx      # Login page header with logo
│   ├── Footer.tsx      # Role-specific footer
│   ├── LoginForm.tsx   # Dynamic login form (email/ID based on role)
│   └── RoleSelector.tsx # Role selection buttons
├── utils/              # Helper functions
│   └── validation.ts   # Input validation utilities
├── constants.ts        # Theme configurations and role definitions
├── types.ts           # TypeScript type definitions
├── page.tsx           # Main login page component
└── README.md          # This file
```

## Features

### Role-Based Login
- **Patient**: Login with email address
- **Doctor/Nurse/Staff/Admin**: Login with Employee/Staff ID

### Dynamic Theming
- Patient role: Teal/Blue gradient theme (welcoming, patient-friendly)
- Staff roles: Professional gray theme

### Components

#### Header
Displays the SecureHealthCare logo and page title.

#### RoleSelector
Grid-based role selection with icons for each user type:
- Patient, Doctor, Nurse (top row)
- Staff, Admin (bottom row)

#### LoginForm
Dynamic form that adapts based on selected role:
- Shows email input for patients
- Shows Staff/Employee ID input for healthcare staff
- Password input for all roles
- "Forgot password?" link
- Themed submit button

#### Footer
Role-specific footer messages:
- Patients: "Create account" link
- Staff: "Contact IT support" message

## Validation

### Email Validation (Patients)
- Standard email format validation
- Required field

### Staff ID Validation (Staff Roles)
- Alphanumeric characters only
- 6-12 characters in length
- Required field

### Password
- Required field
- Secure input (masked)

## Usage

The login page automatically adapts when users select different roles. No additional configuration is needed.

## Future Enhancements
- [ ] Multi-factor authentication
- [ ] Remember me functionality
- [ ] Social login options for patients
- [ ] Password strength indicator
- [ ] Account lockout after failed attempts
- [ ] CAPTCHA for security
