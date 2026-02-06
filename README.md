# Secure Healthcare System

[![Next.js](https://img.shields.io/badge/Next.js-15.1.6-black)](https://nextjs.org/) [![React](https://img.shields.io/badge/React-18.3.1-blue)](https://reactjs.org/) [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/) [![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)](https://supabase.com/) [![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A modern, full-stack healthcare management system built with Next.js 15, featuring secure patient management, appointment scheduling, and real-time telemedicine capabilities. The system provides role-based access for patients, doctors, nurses, and administrative staff, with WebRTC-powered video consultations and comprehensive medical record management.

---

## Table of Contents

- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Development](#development)
- [Video Call System](#video-call-system)
- [Database Schema](#database-schema)
- [Security Features](#security-features)
- [Deployment](#deployment)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)
- [Support & Contact](#support--contact)
- [Roadmap](#roadmap)

---

## Key Features

### Patient Management

- Secure patient registration with email verification
- Complete patient profile management
- Medical history tracking
- Emergency contact information
- Patient search and filtering

### Appointment System

- Schedule appointments with healthcare providers
- Real-time appointment notifications
- Appointment reminders
- Reschedule and cancel appointments
- Appointment history tracking

### Telemedicine & Video Consultations

- Real-time WebRTC video calls
- High-quality audio streaming
- Mute/unmute controls
- Video enable/disable
- Incoming call notifications (real-time)
- Call duration tracking
- Secure peer-to-peer connections

### Role-Based Access Control

- **Patients**: Book appointments, start video calls, view medical records
- **Doctors**: Manage patient appointments, accept video calls, prescribe medications
- **Nurses**: Assist with patient care, manage schedules
- **Admin Staff**: System administration, user management

### Medical Records & E-Prescriptions

- Digital medical record storage
- Electronic prescription management
- Secure document handling
- PDF generation for prescriptions
- Organized record history

### Security Features

- Bcrypt password hashing
- Secure HTTP-only session cookies
- Row Level Security (RLS) policies
- HTTPS required for production
- XSS and CSRF protection

---

## Tech Stack

### Frontend

- **Framework**: Next.js 15.1.6 (App Router)
- **UI Library**: React 18.3.1
- **Language**: TypeScript 5.0
- **Styling**: Tailwind CSS 3.4.1
- **Icons**: Lucide React
- **State Management**: React Hooks

### Backend

- **API**: Next.js API Routes
- **Runtime**: Node.js 18+
- **Authentication**: Custom session-based auth with bcrypt

### Database & Real-time

- **Database**: Supabase (PostgreSQL)
- **ORM/Client**: @supabase/supabase-js 2.90.1
- **Real-time**: Supabase Realtime (WebSocket)
- **Migrations**: SQL scripts

### Video & Communication

- **WebRTC**: Native browser WebRTC API
- **Signaling**: Supabase Realtime channels
- **STUN Servers**: Google STUN servers
- **Peer Connection**: Custom PeerConnection wrapper

### Development Tools

- **Linting**: ESLint 8
- **Type Checking**: TypeScript strict mode
- **Build Tool**: Next.js built-in
- **Package Manager**: npm

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v18.0.0 or higher ([Download](https://nodejs.org/))
- **npm**: v9.0.0 or higher (comes with Node.js)
- **Git**: For version control ([Download](https://git-scm.com/))
- **Supabase Account**: Free tier available ([Sign up](https://supabase.com/))
- **Modern Browser**: Chrome, Firefox, Safari, or Edge (latest version)
- **Camera & Microphone**: Required for video consultation features
- **Ollama (AI Chatbot Runtime)**: Required for running the local healthcare chatbot ([Download](https://ollama.com))
  - Minimum RAM: 8 GB recommended (4 GB minimum for small models)
  - Storage: ~3 GB free space for AI models
  - Required Model: `llama3.2:3b` (lightweight and fast, suitable for local use)
  - Ollama Service must be running on default port `11434`

---

## Quick Start

For first-time setup, see **[docs/guides/RUN_THIS_FIRST.md](docs/guides/RUN_THIS_FIRST.md)** for detailed instructions.

**TL;DR:**
```bash
git clone <repository-url>
cd SecureHealthCareSystem
npm install
# Configure .env file with Supabase credentials
npm run setup-db
npm run dev
```

---

## Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/SecureHealthCareSystem.git
cd SecureHealthCareSystem
```

### 2. Install Dependencies
```bash
npm install
```

This will install all required packages including:

- Next.js, React, TypeScript
- Supabase client
- Tailwind CSS
- WebRTC dependencies

### 3. Set Up Environment Variables

Create a `.env.local` file in the root directory:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: TURN Server (for video calls behind restrictive firewalls)
NEXT_PUBLIC_TURN_SERVER=turn:your-turn-server.com:3478
NEXT_PUBLIC_TURN_USERNAME=username
NEXT_PUBLIC_TURN_PASSWORD=password
```

**Getting Supabase Credentials:**

1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Project Settings → API
4. Copy the Project URL and anon/public key

### 4. Set Up the Database

Run the database setup script to create all necessary tables and seed data:
```bash
npm run setup-db
```

### 5. Enable Supabase Realtime

**Critical for video call notifications!**

Via Supabase Dashboard:

1. Go to Database → Replication
2. Enable Realtime for these tables:
   - `video_calls`
   - `video_call_signaling`

Or run this SQL:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE video_calls;
ALTER PUBLICATION supabase_realtime ADD TABLE video_call_signaling;
```

### 6. Start Development Server
```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

### 7. Access the Application

**Test Accounts** (created by seed script):

| Role    | Email               | Password   | Description          |
| ------- | ------------------- | ---------- | -------------------- |
| Patient | patient@example.com | patient123 | Test patient account |
| Doctor  | doctor@example.com  | doctor123  | Test doctor account  |
| Nurse   | nurse@example.com   | nurse123   | Test nurse account   |
| Admin   | admin@example.com   | admin123   | Test admin account   |

**Login Process:**

1. Navigate to [http://localhost:3000](http://localhost:3000)
2. Select user role (Patient, Doctor, Nurse, or Admin)
3. Enter credentials from the table above
4. Click "Sign In"

---

## Project Structure
```
SecureHealthCareSystem/
├── app/                              # Next.js 15 App Router
│   ├── api/                          # API Routes
│   │   └── register/
│   │       └── patient/
│   │           └── route.ts          # Patient registration API
│   │
│   ├── dashboard/                    # Role-based dashboards
│   │   ├── admin/
│   │   │   └── page.tsx              # Admin dashboard
│   │   ├── doctor/
│   │   │   ├── page.tsx              # Doctor dashboard
│   │   │   └── components/
│   │   │       ├── DoctorAppointmentCard.tsx
│   │   │       └── IncomingCallModal.tsx  # Real-time call notifications
│   │   ├── nurse/
│   │   │   └── page.tsx              # Nurse dashboard
│   │   └── patient/
│   │       ├── page.tsx              # Patient dashboard
│   │       └── components/
│   │           └── PatientAppointmentCard.tsx
│   │
│   ├── login/                        # Authentication
│   │   ├── page.tsx                  # Login page
│   │   └── components/
│   │       ├── Header.tsx
│   │       ├── Footer.tsx
│   │       └── InfoBanner.tsx
│   │
│   ├── register/                     # User registration
│   │   ├── page.tsx                  # Registration home
│   │   ├── patient/
│   │   │   └── page.tsx              # Patient registration form
│   │   └── components/
│   │       └── RegisterInfoBanner.tsx
│   │
│   ├── layout.tsx                    # Root layout
│   ├── page.tsx                      # Home page
│   └── globals.css                   # Global styles
│
├── hooks/                            # Custom React Hooks
│   └── useWebRTC.ts                  # WebRTC call management hook
│
├── lib/                              # Core Libraries & Utilities
│   ├── supabase.ts                   # Supabase client configuration
│   ├── database.types.ts             # TypeScript database types
│   ├── auth.ts                       # Authentication utilities
│   ├── logging.ts                    # Logging utilities
│   ├── appointments.ts               # Appointment management
│   ├── webrtc-signaling.ts           # WebRTC signaling via Supabase
│   └── webrtc-peer-connection.ts     # WebRTC peer connection wrapper
│
├── scripts/                          # Database & Setup Scripts
│   ├── setup-database.ts             # Main database setup
│   ├── check-schema.ts               # Schema validation
│   ├── test-database.ts              # Database connection test
│   ├── test-appointments.ts          # Appointment system test
│   ├── migrate-database.ts           # Migration runner
│   └── update-passwords.ts           # Password update utility
│
├── supabase/                         # Database Schemas & Migrations
│   ├── schema.sql                    # Main database schema
│   ├── seed.sql                      # Seed data (test users)
│   ├── webrtc-schema.sql             # Video call tables
│   ├── appointments-schema.sql       # Appointment system
│   ├── fix-rls-policies.sql          # RLS policy fixes
│   ├── migrate-patients.sql          # Patient migration
│   ├── update-passwords.sql          # Password updates
│   └── README.md                     # Database documentation
│
├── docs/                             # Documentation
│   ├── README.md                     # Documentation index
│   ├── SETUP_INSTRUCTIONS.md         # Setup guide
│   ├── DEVELOPMENT.md                # Development guide
│   ├── PROJECT_STRUCTURE.md          # Architecture docs
│   ├── QUICK_REFERENCE.md            # Quick commands
│   ├── API_DOCUMENTATION.md          # API reference
│   ├── DEPLOYMENT_GUIDE.md           # Deployment instructions
│   ├── TELEMEDICINE_IMPLEMENTATION.md # Telemedicine details
│   │
│   ├── guides/                       # User Guides
│   │   ├── RUN_THIS_FIRST.md         # First-time setup
│   │   ├── VIDEO_CALL_SYSTEM.md      # Video system docs
│   │   ├── VIDEO_CALL_TEST_GUIDE.md  # Testing guide
│   │   ├── WEBRTC_GUIDE.md           # WebRTC technical guide
│   │   ├── WEBRTC_QUICKSTART.md      # Quick WebRTC setup
│   │   └── ENABLE_REALTIME.md        # Realtime configuration
│   │
│   ├── deployment/                   # Deployment Documentation
│   └── archives/                     # Historical Documentation
│
├── .env.local                        # Environment variables (create this)
├── .gitignore                        # Git ignore rules
├── next.config.ts                    # Next.js configuration
├── tsconfig.json                     # TypeScript configuration
├── tailwind.config.ts                # Tailwind CSS configuration
├── postcss.config.mjs                # PostCSS configuration
├── package.json                      # Dependencies & scripts
├── package-lock.json                 # Dependency lock file
├── LICENSE                           # License information
└── README.md                         # This file
```

### Key Directories Explained

#### `/app` - Application Code

Next.js 15 App Router structure with file-based routing. Each folder with a `page.tsx` becomes a route.

#### `/hooks` - Custom React Hooks

- **useWebRTC.ts**: Manages entire video call lifecycle, WebRTC connections, signaling, and state

#### `/lib` - Core Business Logic

- **supabase.ts**: Database client singleton
- **auth.ts**: Session management, login/logout
- **webrtc-signaling.ts**: Handles offer/answer/ICE candidate exchange via Supabase Realtime
- **webrtc-peer-connection.ts**: Low-level WebRTC peer connection wrapper
- **appointments.ts**: Appointment CRUD operations

#### `/scripts` - Automation Scripts

Database setup, testing, and migration scripts written in TypeScript.

#### `/supabase` - Database Definitions

SQL files for schema creation, migrations, and seed data.

#### `/docs` - Documentation

Comprehensive guides for setup, development, deployment, and feature usage.

---

## Development

### Available Scripts
```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server (after build)
npm start

# Run ESLint for code quality
npm run lint

# Database setup and testing
npm run setup-db              # Initialize database schema
npm run check-schema          # Validate database schema
npm run test-db               # Test database connection
npm run test-appointments     # Test appointment system
```

### Development Workflow

1. **Create a feature branch**
```bash
   git checkout -b feature/your-feature-name
```

2. **Make your changes**
   - Follow TypeScript best practices
   - Use Tailwind CSS for styling
   - Add proper error handling

3. **Test your changes**
```bash
   npm run lint
   npm run build
```

4. **Commit with descriptive messages**
```bash
   git commit -m "feat: add patient search functionality"
```

5. **Push and create pull request**
```bash
   git push origin feature/your-feature-name
```

### Code Style Guidelines

- **TypeScript**: Strict mode enabled
- **Components**: Functional components with hooks
- **Styling**: Tailwind CSS utility classes
- **File naming**: kebab-case for files, PascalCase for components
- **Imports**: Absolute imports using `@/` prefix

### Environment Variables Reference

| Variable                        | Description                | Required | Example                 |
| ------------------------------- | -------------------------- | -------- | ----------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL       | Yes      | https://xxx.supabase.co |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public anon key   | Yes      | eyJhbGc...              |
| `SUPABASE_SERVICE_ROLE_KEY`     | Supabase service role key  | Yes      | eyJhbGc...              |
| `NEXT_PUBLIC_APP_URL`           | Application base URL       | No       | http://localhost:3000   |
| `NEXT_PUBLIC_TURN_SERVER`       | TURN server URL (optional) | No       | turn:example.com:3478   |
| `NEXT_PUBLIC_TURN_USERNAME`     | TURN server username       | No       | username                |
| `NEXT_PUBLIC_TURN_PASSWORD`     | TURN server password       | No       | password                |

---

## Video Call System

### Architecture Overview

The video consultation feature uses:

- **WebRTC**: Peer-to-peer video/audio streaming
- **Supabase Realtime**: Signaling channel for SDP and ICE candidates
- **STUN Servers**: NAT traversal (Google STUN servers)

### Call Flow

1. **Patient initiates call** → Browser requests camera/mic permissions
2. **Call record created** in database (status: 'calling')
3. **Doctor receives real-time notification** via Supabase Realtime
4. **Doctor accepts call** → Browser requests camera/mic permissions
5. **WebRTC handshake** → SDP offer/answer exchange via database
6. **ICE candidates exchanged** → NAT traversal established
7. **Peer-to-peer connection** → Direct video/audio streams
8. **Call interface** → Both parties see local and remote video

### Key Components

- **useWebRTC Hook**: State management and WebRTC lifecycle
- **PeerConnection Class**: RTCPeerConnection wrapper
- **Signaling Service**: Supabase Realtime communication
- **Call UI Components**: Video display and controls

### Testing Video Calls

See [docs/guides/VIDEO_CALL_TEST_GUIDE.md](docs/guides/VIDEO_CALL_TEST_GUIDE.md) for complete testing instructions.

**Quick Test:**

1. Open two browsers (or incognito + regular)
2. Login as patient in one, doctor in another
3. Patient: Start video call from appointment
4. Doctor: Accept incoming call notification
5. Both should see each other's video

---

## Database Schema

### Core Tables

- **users**: System users (all roles)
- **patients**: Patient-specific information
- **doctors**: Doctor profiles and specializations
- **nurses**: Nursing staff information
- **appointments**: Appointment scheduling
- **medical_records**: Patient medical history
- **prescriptions**: Electronic prescriptions
- **video_calls**: Video consultation records
- **video_call_signaling**: WebRTC signaling messages

### Relationships
```
users (1) ─────→ (1) patients
users (1) ─────→ (1) doctors
users (1) ─────→ (1) nurses

patients (1) ───→ (∞) appointments
doctors (1) ────→ (∞) appointments

appointments (1) → (1) video_calls
video_calls (1) ─→ (∞) video_call_signaling

patients (1) ───→ (∞) medical_records
doctors (1) ────→ (∞) prescriptions
```

---

## Security Features

### Authentication

- Bcrypt password hashing (cost factor: 10)
- HTTP-only session cookies
- Secure session validation

### Database Security

- Row Level Security (RLS) policies enabled
- User-specific data access controls
- Prepared statements prevent SQL injection

### Application Security

- XSS protection via React's built-in escaping
- CSRF protection via SameSite cookies
- Input validation on all forms
- HTTPS required in production (for WebRTC)

### WebRTC Security

- Peer-to-peer encryption (DTLS-SRTP)
- Secure signaling channel via Supabase
- No video data stored on server

---

## Deployment

### Production Deployment Options

1. **Vercel** (Recommended)
   - Automatic SSL
   - Zero configuration
   - Global CDN
   - See [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)

2. **Docker**
   - Self-hosted option
   - Full control
   - Custom infrastructure

3. **AWS / Azure / GCP**
   - Enterprise deployment
   - Scalable infrastructure

### Pre-Deployment Checklist

- [ ] Set all environment variables
- [ ] Run database migrations
- [ ] Enable Supabase Realtime
- [ ] Configure custom domain
- [ ] Set up SSL certificate
- [ ] Test video calls on production URL
- [ ] Configure backup strategy
- [ ] Set up monitoring

See [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) for detailed deployment instructions.

---

## Testing

### Manual Testing

**Patient Flow:**

1. Register new patient account
2. Login as patient
3. View dashboard
4. Book appointment
5. Start video call

**Doctor Flow:**

1. Login as doctor
2. View appointments
3. Receive call notification
4. Accept video call
5. End consultation

### Database Testing
```bash
# Test database connection
npm run test-db

# Test appointment system
npm run test-appointments

# Validate schema
npm run check-schema
```

---

## Troubleshooting

### Common Issues

**Issue: Video call stuck on "Connecting..."**

- Ensure Supabase Realtime is enabled for `video_calls` and `video_call_signaling` tables
- Check browser console for ICE candidate errors
- Verify STUN server connectivity

**Issue: "Permission denied" for camera/microphone**

- Click lock icon in browser address bar
- Allow camera and microphone permissions
- Refresh page and try again

**Issue: Database connection errors**

- Verify Supabase credentials in `.env.local`
- Check Supabase project is active
- Ensure database tables exist

**Issue: Login fails**

- Verify seed data was loaded (`npm run setup-db`)
- Check user exists in database
- Ensure password matches

For more troubleshooting, see [docs/guides/VIDEO_CALL_SYSTEM.md](docs/guides/VIDEO_CALL_SYSTEM.md)

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Contribution Guidelines

- Write clear, descriptive commit messages
- Add tests for new features
- Update documentation as needed
- Follow existing code style
- Ensure all tests pass before submitting

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Authors

- **Your Name** - Initial work

---

## Acknowledgments

- Next.js team for the amazing framework
- Supabase for the backend infrastructure
- WebRTC community for video call technology
- Tailwind CSS for the styling system

---

## Support & Contact

- **Documentation**: Check the [docs](docs/) folder
- **Issues**: Open an issue on GitHub
- **Email**: support@yourdomain.com

---

## Roadmap

### Current Version (v0.1.0)

- Patient registration and management
- Appointment scheduling
- Role-based dashboards
- WebRTC video consultations
- Real-time notifications

### Planned Features

- [ ] Mobile app (React Native)
- [ ] Call recording functionality
- [ ] Screen sharing during calls
- [ ] Group video consultations
- [ ] Advanced medical records management
- [ ] Billing and payment integration
- [ ] Prescription management system
- [ ] Analytics dashboard
- [ ] Multi-language support
- [ ] Dark mode

---

## Project Status

- **Version**: 0.1.0
- **Status**: Active Development
- **Last Updated**: January 2026
- **Node Version**: 18+
- **Next.js Version**: 15.1.6

---

**Built with care using Next.js, TypeScript, and Supabase**
