# Secure Healthcare System

A comprehensive healthcare management system built with Next.js, featuring secure patient management, appointment scheduling, and telemedicine capabilities with real-time video consultations.

## Features

- **Patient Management**: Secure patient registration and profile management
- **Appointment Scheduling**: Book and manage appointments with healthcare providers
- **Role-Based Access**: Separate dashboards for patients, doctors, nurses, and administrative staff
- **Video Consultations**: Real-time WebRTC-powered video calls between patients and doctors
- **Medical Records**: Secure storage and management of patient medical records
- **E-Prescriptions**: Digital prescription management system
- **Real-time Notifications**: Instant notifications for appointment updates and incoming calls

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Real-time**: Supabase Realtime
- **Video**: WebRTC with STUN servers
- **Authentication**: Custom session-based auth

## Quick Start

See [docs/guides/RUN_THIS_FIRST.md](docs/guides/RUN_THIS_FIRST.md) for initial setup instructions.

## Documentation

Full documentation is available in the [docs](docs/) folder:

- 📖 [Documentation Index](docs/README.md) - Complete documentation overview
- 🚀 [Setup Instructions](docs/SETUP_INSTRUCTIONS.md) - Initial setup and configuration
- 💻 [Development Guide](docs/DEVELOPMENT.md) - Development workflow
- 📋 [Quick Reference](docs/QUICK_REFERENCE.md) - Common tasks and commands
- 🎥 [Video Call Guide](docs/guides/VIDEO_CALL_TEST_GUIDE.md) - Testing video calls
- 🏗️ [Project Structure](docs/PROJECT_STRUCTURE.md) - Codebase organization

## Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd SecureHealthCareSystem
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Copy `.env.example` to `.env`
   - Add your Supabase credentials

4. **Run database migrations**
   ```bash
   npm run setup:db
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open in browser**
   - Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
SecureHealthCareSystem/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── dashboard/         # Role-specific dashboards
│   ├── login/             # Authentication pages
│   └── register/          # Registration pages
├── docs/                   # Documentation
│   ├── guides/            # User guides
│   ├── deployment/        # Deployment docs
│   └── archives/          # Historical docs
├── hooks/                  # Custom React hooks
├── lib/                    # Utility libraries
├── scripts/                # Database and setup scripts
└── supabase/              # Database schemas and migrations
```

## Development

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## License

See [LICENSE](LICENSE) file for details.

## Support

For detailed documentation, check the [docs](docs/) folder or refer to the [Documentation Index](docs/README.md).
