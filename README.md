# SecureHealthCare System

A secure, role-based healthcare management system built with Next.js, TypeScript, and Tailwind CSS.

## Features

### 🔐 Role-Based Authentication

- **Patient Portal**: Email-based login for patients
- **Healthcare Staff**: ID-based login for doctors, nurses, staff, and administrators
- Dynamic UI theming based on user role
- Secure authentication flow

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
│   ├── login/              # Login module
│   │   ├── components/     # UI components
│   │   ├── utils/          # Helper functions
│   │   ├── types.ts        # TypeScript definitions
│   │   ├── constants.ts    # Configuration
│   │   └── page.tsx        # Login page
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home (redirects to login)
│   └── globals.css         # Global styles
├── node_modules/           # Dependencies
├── .next/                  # Next.js build output
├── package.json            # Project dependencies
├── tsconfig.json           # TypeScript configuration
├── tailwind.config.ts      # Tailwind CSS configuration
├── next.config.ts          # Next.js configuration
├── .gitignore              # Git ignore rules
└── README.md               # Project documentation
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

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

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Build for Production

```bash
npm run build
npm start
```

## User Roles

| Role        | Login Method | Description                        |
| ----------- | ------------ | ---------------------------------- |
| **Patient** | Email        | General public access for patients |
| **Doctor**  | Staff ID     | Medical practitioners              |
| **Nurse**   | Staff ID     | Nursing staff                      |
| **Staff**   | Staff ID     | Administrative and support staff   |
| **Admin**   | Staff ID     | System administrators              |

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
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Runtime**: React 18+

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

- ✅ Role-based access control
- ✅ Input validation
- ✅ Secure password handling (masked input)
- 🔄 Multi-factor authentication (planned)
- 🔄 Session management (planned)
- 🔄 Rate limiting (planned)

## Roadmap

- [ ] Complete authentication backend integration
- [ ] Dashboard for each user role
- [ ] Patient records management
- [ ] Appointment scheduling
- [ ] Prescription management
- [ ] Billing and insurance
- [ ] Reports and analytics
- [ ] Mobile responsive improvements
- [ ] Multi-language support
- [ ] Accessibility enhancements (WCAG 2.1)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions, please contact the IT support team or create an issue in the repository.

## Acknowledgments

- Next.js team for the amazing framework
- Tailwind CSS for the utility-first CSS framework
- Lucide for the beautiful icon set
