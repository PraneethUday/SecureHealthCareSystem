# SecureHealthCare System

A secure, role-based healthcare management system built with Next.js, TypeScript, Supabase, and Tailwind CSS.

## Features

### 🔐 Role-Based Authentication

- **Patient Portal**: Email-based login for patients
- **Healthcare Staff**: ID-based login for doctors, nurses, staff, and administrators
- Dynamic UI theming based on user role
- Secure authentication flow with Supabase

### 📅 Appointment Management

- **Patient Booking**: Multi-step wizard for creating appointments
- **Telemedicine Option**: Video consultation for remote care
- **Doctor Dashboard**: View and manage appointments, mark as complete/no-show
- **Admin Audit Logs**: Comprehensive logging system for all appointment actions
- **Hospital Management**: Support for multiple hospital locations and departments

### 💊 E-Prescription System

- **Digital Prescriptions**: Doctors can prescribe medications during or after appointments
- **Automatic Delivery**: Prescriptions instantly appear on patient dashboard
- **Multi-Medication Support**: Prescribe multiple medications in one session
- **Status Tracking**: Active, completed, and discontinued prescriptions
- **Complete Audit Trail**: All prescriptions logged for admin review

### 🎥 Telemedicine (Video Consultations)

- **Remote Consultations**: Secure video calls for non-emergency situations
- **Integrated Prescriptions**: Doctors can prescribe during video calls
- **Call Tracking**: Duration and quality monitoring
- **Video Call Logs**: Complete history for compliance and audit

### 🎨 Modern UI/UX

- Responsive design with Tailwind CSS
- Smooth animations and transitions
- Role-specific color schemes:
  - Patient: Welcoming teal/blue gradient
  - Staff: Professional gray theme
- Lucide React icons for clean, modern iconography

### 🏗️ Well-Organized Architecture

```
SecureHealthCareSystem/
├── app/
│   ├── api/
│   │   └── register/
│   │       └── patient/        # Patient registration API
│   ├── dashboard/
│   │   ├── patient/            # Patient dashboard with appointments
│   │   ├── doctor/             # Doctor dashboard with appointments
│   │   ├── nurse/              # Nurse dashboard
│   │   ├── staff/              # Staff dashboard
│   │   └── admin/              # Admin dashboard with logs
│   ├── login/                  # Login module
│   │   ├── components/         # UI components
│   │   ├── utils/              # Helper functions
│   │   ├── types.ts            # TypeScript definitions
│   │   ├── constants.ts        # Configuration
│   │   └── page.tsx            # Login page
│   ├── register/               # Registration module
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Home (redirects to login)
│   └── globals.css             # Global styles
├── lib/
│   ├── appointments.ts         # Appointment business logic
│   ├── auth.ts                 # Authentication helpers
│   ├── database.types.ts       # TypeScript database types
│   ├── logging.ts              # Logging utilities
│   └── supabase.ts             # Supabase client
├── scripts/
│   ├── check-schema.ts         # Schema validation
│   ├── setup-database.ts       # Database setup automation
│   ├── test-appointments.ts    # Appointment testing
│   └── test-database.ts        # Database connection testing
├── supabase/
│   ├── schema.sql              # Main database schema
│   ├── seed.sql                # Sample data
│   ├── appointments-schema.sql # Appointments system schema
│   └── README.md               # Database documentation
├── package.json                # Project dependencies
├── tsconfig.json               # TypeScript configuration
├── tailwind.config.ts          # Tailwind CSS configuration
├── next.config.ts              # Next.js configuration
└── README.md                   # Project documentation
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (free tier available)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/SecureHealthCareSystem.git
cd SecureHealthCareSystem
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Set up the database:

- Go to your Supabase Dashboard
- Navigate to SQL Editor
- Run the SQL scripts in order:
  1. `supabase/schema.sql` - Creates main tables
  2. `supabase/seed.sql` - Inserts sample data
  3. `supabase/appointments-schema.sql` - Creates appointment system

For detailed instructions, see [docs/SETUP_INSTRUCTIONS.md](docs/SETUP_INSTRUCTIONS.md)

5. Run the development server:

```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

### Build for Production

```bash
npm run build
npm start
```

## Sample Login Credentials

### Admin
- **ID**: `admin`
- **Password**: `admin123`

### Patients (Login with EMAIL)
- **Email**: `john.doe@email.com` / **Password**: `patient1`
- **Email**: `jane.smith@email.com` / **Password**: `patient2`

### Doctors (Login with ID)
- **ID**: `D001` / **Password**: `doctor1`
- **ID**: `D002` / **Password**: `doctor2`

### Nurses
- **ID**: `N001` / **Password**: `nurse1`

### Staff
- **ID**: `S001` / **Password**: `staff1`

## User Roles

| Role        | Login Method | Description                        | Features                                    |
| ----------- | ------------ | ---------------------------------- | ------------------------------------------- |
| **Patient** | Email        | General public access for patients | Book appointments, view medical records     |
| **Doctor**  | Staff ID     | Medical practitioners              | Manage appointments, view patient records   |
| **Nurse**   | Staff ID     | Nursing staff                      | View schedules, patient care management     |
| **Staff**   | Staff ID     | Administrative and support staff   | Scheduling, billing, administrative tasks   |
| **Admin**   | Staff ID     | System administrators              | Full system access, audit logs, user management |

## Login Credentials Format

### Patients

- **Email**: Standard email format (e.g., patient@example.com)
- **Password**: Secure password

### Healthcare Staff (Doctor/Nurse/Staff/Admin)

- **Staff ID**: 6-12 alphanumeric characters (e.g., DOC123456)
- **Password**: Secure password

## Technology Stack

- **Framework**: [Next.js 15](https://nextjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Runtime**: React 18+

## Database Schema

### Core Tables
- **patients** - Patient profiles and information
- **doctors** - Doctor profiles with specializations
- **nurses** - Nurse profiles
- **staff** - Administrative staff
- **admins** - System administrators

### Healthcare System
- **hospitals** - Hospital locations and departments
- **appointments** - Patient appointments with status tracking
- **appointment_logs** - Audit trail for appointment actions
- **medical_records** - Patient medical history
- **access_logs** - System access and security logs

For detailed database documentation, see [supabase/README.md](supabase/README.md)

## Project Structure

### `/app/login`

The authentication module with role-based login functionality.

**Components:**

- `Header.tsx` - Logo and title
- `RoleSelector.tsx` - Interactive role selection
- `LoginForm.tsx` - Dynamic login form
- `Footer.tsx` - Role-specific footer

**Utilities:**

- `validation.ts` - Input validation helpers

**Configuration:**

- `types.ts` - TypeScript type definitions
- `constants.ts` - Theme and role configurations

## Development Guidelines

### Code Style

- Use TypeScript for type safety
- Follow React/Next.js best practices
- Keep components small and focused
- Use Tailwind CSS utility classes

### Component Structure

- Separate concerns (UI, logic, types)
- Make components reusable
- Use proper TypeScript types
- Document complex logic

## Security Features

- ✅ Role-based access control (RBAC)
- ✅ Secure authentication with Supabase
- ✅ Input validation
- ✅ Secure password handling (bcrypt hashing)
- ✅ Audit logging for all critical actions
- ✅ Session-based authentication
- 🔄 Multi-factor authentication (planned)
- 🔄 Rate limiting (planned)

## Key Features

### For Patients
- Self-registration with email verification
- Book appointments with preferred doctors
- View appointment history
- Access medical records
- Manage personal information

### For Doctors
- View daily schedule
- Manage appointments (complete/no-show)
- Access patient information
- Track appointment history

### For Administrators
- System-wide oversight
- Comprehensive audit logs
- User management
- Appointment monitoring
- Access logs review

## Roadmap

- [x] Role-based authentication system
- [x] Patient registration
- [x] Appointment booking system
- [x] Doctor appointment management
- [x] Admin audit logging
- [ ] Patient medical records management
- [ ] Prescription management
- [ ] Billing and insurance
- [ ] Reports and analytics
- [ ] Email notifications
- [ ] Mobile responsive improvements
- [ ] Multi-language support
- [ ] Accessibility enhancements (WCAG 2.1)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for detailed development guidelines.

## Documentation

- **[README.md](README.md)** - Main project overview (this file)
- **[docs/SETUP_INSTRUCTIONS.md](docs/SETUP_INSTRUCTIONS.md)** - Database setup guide
- **[docs/PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md)** - Complete project structure documentation
- **[docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)** - Development guidelines and best practices
- **[app/login/README.md](app/login/README.md)** - Login module documentation
- **[supabase/README.md](supabase/README.md)** - Database schema documentation

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions, please contact the IT support team or create an issue in the repository.

## Acknowledgments

- Next.js team for the amazing framework
- Tailwind CSS for the utility-first CSS framework
- Lucide for the beautiful icon set
