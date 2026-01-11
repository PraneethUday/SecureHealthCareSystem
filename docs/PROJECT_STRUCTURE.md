# SecureHealthCare System - Project Structure

## Overview

This document provides a comprehensive guide to the project structure and organization.

## Directory Structure

```
SecureHealthCareSystem/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   └── register/
│   │       └── patient/          # Patient registration endpoint
│   │           └── route.ts
│   │
│   ├── dashboard/                # Role-based dashboards
│   │   ├── admin/
│   │   │   └── page.tsx         # Admin dashboard with audit logs
│   │   ├── doctor/
│   │   │   ├── page.tsx         # Doctor appointment management
│   │   │   └── components/
│   │   │       └── DoctorAppointmentCard.tsx
│   │   ├── nurse/
│   │   │   └── page.tsx         # Nurse dashboard
│   │   ├── patient/
│   │   │   ├── page.tsx         # Patient dashboard
│   │   │   └── components/
│   │   │       ├── AppointmentCard.tsx
│   │   │       └── NewAppointmentForm.tsx
│   │   └── staff/
│   │       └── page.tsx         # Staff dashboard
│   │
│   ├── login/                    # Authentication module
│   │   ├── components/
│   │   │   ├── Footer.tsx       # Role-specific footer
│   │   │   ├── Header.tsx       # Login page header
│   │   │   ├── InfoBanner.tsx   # Information banner
│   │   │   ├── LoginForm.tsx    # Dynamic login form
│   │   │   └── RoleSelector.tsx # Role selection UI
│   │   ├── utils/
│   │   │   └── validation.ts    # Input validation helpers
│   │   ├── constants.ts         # Theme and role configurations
│   │   ├── page.tsx             # Login page
│   │   ├── README.md            # Login module documentation
│   │   └── types.ts             # TypeScript type definitions
│   │
│   ├── register/                 # Registration module
│   │   ├── components/
│   │   │   └── RegisterInfoBanner.tsx
│   │   ├── page.tsx             # Registration landing page
│   │   └── patient/
│   │       └── page.tsx         # Patient registration form
│   │
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Home page (redirects to login)
│
├── docs/                         # Documentation
│   ├── PROJECT_STRUCTURE.md     # This file
│   └── SETUP_INSTRUCTIONS.md    # Database setup guide
│
├── lib/                          # Shared libraries and utilities
│   ├── appointments.ts          # Appointment management logic
│   ├── auth.ts                  # Authentication helpers
│   ├── database.types.ts        # TypeScript database interfaces
│   ├── logging.ts               # System logging utilities
│   └── supabase.ts              # Supabase client configuration
│
├── scripts/                      # Utility scripts
│   ├── check-schema.ts          # Validate database schema
│   ├── setup-database.ts        # Automated database setup
│   ├── test-appointments.ts     # Appointment system testing
│   └── test-database.ts         # Database connection testing
│
├── supabase/                     # Database schemas and migrations
│   ├── appointments-schema.sql  # Appointment system schema
│   ├── README.md                # Database documentation
│   ├── schema.sql               # Main database schema
│   └── seed.sql                 # Sample data for testing
│
├── .env.local                    # Environment variables (not in git)
├── .gitignore                   # Git ignore rules
├── LICENSE                      # MIT License
├── next.config.ts               # Next.js configuration
├── next-env.d.ts                # Next.js TypeScript declarations
├── package.json                 # Project dependencies and scripts
├── postcss.config.mjs           # PostCSS configuration
├── README.md                    # Main project documentation
├── tailwind.config.ts           # Tailwind CSS configuration
└── tsconfig.json                # TypeScript configuration
```

## Key Modules

### 1. Authentication (`/app/login`)

**Purpose**: Handles user authentication with role-based login

**Key Files**:

- `page.tsx` - Main login page
- `components/LoginForm.tsx` - Dynamic form (email for patients, ID for staff)
- `components/RoleSelector.tsx` - Role selection interface
- `utils/validation.ts` - Input validation logic

**Features**:

- Role-based authentication (Patient uses email, Staff uses ID)
- Dynamic theming based on role
- Input validation
- Session management

### 2. Registration (`/app/register`)

**Purpose**: Patient self-registration

**Key Files**:

- `patient/page.tsx` - Registration form
- `/api/register/patient/route.ts` - Registration API endpoint

**Features**:

- Multi-field patient registration
- Email validation
- Password strength checking
- Automatic profile creation

### 3. Dashboards (`/app/dashboard`)

**Purpose**: Role-specific user interfaces

#### Patient Dashboard

- View upcoming and past appointments
- Book new appointments (4-step wizard)
- Access medical information
- Cancel appointments

#### Doctor Dashboard

- View daily schedule
- Manage appointments (complete/no-show)
- Access patient information
- Track appointment history

#### Admin Dashboard

- System-wide oversight
- Audit logs (system and appointments)
- User management
- Access control monitoring

### 4. Business Logic (`/lib`)

**Purpose**: Reusable business logic and utilities

**Key Files**:

- `appointments.ts` - All appointment CRUD operations
- `auth.ts` - Authentication helpers
- `logging.ts` - System and action logging
- `supabase.ts` - Database client configuration
- `database.types.ts` - TypeScript interfaces for all tables

**Functions**:

- `getHospitals()` - Fetch hospital list
- `getDoctorsByHospital()` - Get doctors by hospital
- `createAppointment()` - Book appointment
- `cancelAppointment()` - Cancel appointment
- `completeAppointment()` - Mark appointment complete
- `getAppointmentLogs()` - Fetch audit logs

### 5. Database (`/supabase`)

**Purpose**: Database schema and seed data

**Key Files**:

- `schema.sql` - Core tables (users, patients, doctors, etc.)
- `appointments-schema.sql` - Appointment system tables
- `seed.sql` - Sample data for testing

**Tables**:

- `patients`, `doctors`, `nurses`, `staff`, `admins` - User profiles
- `hospitals` - Hospital locations
- `appointments` - Appointment records
- `appointment_logs` - Audit trail
- `medical_records` - Patient records
- `access_logs` - System access logs

## API Routes

### `/api/register/patient`

- **Method**: POST
- **Purpose**: Patient registration
- **Body**: Patient information (name, email, password, phone, etc.)
- **Response**: Success/error with user data

## Utility Scripts

### `npm run setup-db`

- Automated database setup
- Creates all tables
- Inserts sample data

### `npm run check-schema`

- Validates database schema
- Checks for missing tables/columns

### `npm run test-db`

- Tests database connection
- Verifies table structure

### `npm run test-appointments`

- Tests appointment system
- Validates CRUD operations

## Configuration Files

### `next.config.ts`

- Next.js configuration
- Build settings
- Environment variables

### `tailwind.config.ts`

- Tailwind CSS customization
- Theme colors
- Custom utilities

### `tsconfig.json`

- TypeScript compiler options
- Path aliases
- Type checking rules

## Environment Variables

Required in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Development Workflow

1. **Start Development Server**

   ```bash
   npm run dev
   ```

2. **Access Application**

   - URL: http://localhost:3000
   - Redirects to login page

3. **Testing**

   - Use sample credentials from README.md
   - Test different user roles
   - Verify appointment workflows

4. **Database Changes**
   - Edit SQL files in `/supabase`
   - Run scripts manually in Supabase Dashboard
   - Update TypeScript types in `lib/database.types.ts`

## Code Organization Best Practices

### Components

- Keep components small and focused
- Use TypeScript for type safety
- Separate UI from business logic
- Document complex components

### Styling

- Use Tailwind CSS utility classes
- Follow consistent spacing (4px grid)
- Maintain responsive design
- Use role-specific themes

### State Management

- Use React hooks for local state
- Session storage for user data
- Supabase for persistent data

### Error Handling

- Try-catch blocks for async operations
- User-friendly error messages
- Console logging for debugging
- Audit logging for critical actions

## Security Considerations

- ✅ Input validation on all forms
- ✅ Password hashing with bcrypt
- ✅ Role-based access control
- ✅ Audit logging for critical actions
- ✅ Session-based authentication
- ✅ Secure environment variables

## Next Steps

- Add email notifications
- Implement prescription management
- Add medical records upload
- Create reporting dashboard
- Mobile app development
- Multi-language support
