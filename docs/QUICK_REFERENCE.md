# Quick Reference Guide

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env.local  # Add your Supabase credentials

# Setup database
npm run setup-db

# Start development
npm run dev
```

Visit: http://localhost:3000

## 📋 Essential Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run code linter |
| `npm run setup-db` | Setup database |
| `npm run check-schema` | Validate database schema |
| `npm run test-db` | Test database connection |
| `npm run test-appointments` | Test appointment system |

## 🔑 Test Credentials

### Admin
- ID: `admin` | Password: `admin123`

### Patients (use EMAIL)
- Email: `john.doe@email.com` | Password: `patient1`
- Email: `jane.smith@email.com` | Password: `patient2`

### Doctors (use ID)
- ID: `D001` | Password: `doctor1`
- ID: `D002` | Password: `doctor2`

### Nurses
- ID: `N001` | Password: `nurse1`

### Staff
- ID: `S001` | Password: `staff1`

## 📁 Project Structure

```
SecureHealthCareSystem/
├── app/                # Next.js app
│   ├── api/           # API routes
│   ├── dashboard/     # Dashboards (patient, doctor, admin, etc.)
│   ├── login/         # Login module
│   └── register/      # Registration
├── docs/              # Documentation
├── lib/               # Shared code (auth, appointments, etc.)
├── scripts/           # Utility scripts
└── supabase/          # Database schemas
```

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| [README.md](../README.md) | Project overview & setup |
| [SETUP_INSTRUCTIONS.md](SETUP_INSTRUCTIONS.md) | Database setup |
| [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) | Complete structure guide |
| [DEVELOPMENT.md](DEVELOPMENT.md) | Development guidelines |
| [CLEANUP_SUMMARY.md](CLEANUP_SUMMARY.md) | What was cleaned up |

## 🗄️ Database Setup

1. **Go to Supabase Dashboard**
   - URL: https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click "SQL Editor" in sidebar

3. **Run Scripts (in order)**
   ```
   1. supabase/schema.sql          (main tables)
   2. supabase/seed.sql            (sample data)
   3. supabase/appointments-schema.sql (appointments)
   ```

4. **Verify**
   - Check "Table Editor" for tables
   - Run: `npm run check-schema`

## 🎯 Common Tasks

### Adding a New Dashboard
1. Create `app/dashboard/[role]/page.tsx`
2. Add authentication check
3. Implement role-specific UI
4. Test with role credentials

### Adding an API Endpoint
1. Create `app/api/[endpoint]/route.ts`
2. Implement GET/POST/etc handlers
3. Add error handling
4. Test with Postman/curl

### Modifying Database
1. Edit SQL in `supabase/schema.sql`
2. Run in Supabase SQL Editor
3. Update types in `lib/database.types.ts`
4. Run: `npm run check-schema`

## 🔧 Development Workflow

```bash
# 1. Create feature branch
git checkout -b feature/my-feature

# 2. Make changes
# Edit code...

# 3. Test
npm run dev
npm run test-db
npm run test-appointments

# 4. Commit and push
git add .
git commit -m "feat: add my feature"
git push origin feature/my-feature

# 5. Create pull request
```

## 🐛 Debugging

### Check Logs
- Browser Console (F12)
- Supabase Dashboard > Logs
- Terminal output

### Common Issues

**"Invalid credentials"**
- Verify user exists in correct table
- Check password matches
- Use email for patients, ID for staff

**"Database error"**
- Check Supabase connection
- Verify environment variables
- Check SQL syntax in queries

**"Page not loading"**
- Check session storage has user data
- Verify user has correct role
- Check browser console for errors

## 📱 User Roles & Features

| Role | Login | Features |
|------|-------|----------|
| **Patient** | Email | Book appointments, view records |
| **Doctor** | ID | Manage appointments, view patients |
| **Nurse** | ID | View schedules, patient care |
| **Staff** | ID | Scheduling, admin tasks |
| **Admin** | ID | Full access, audit logs |

## 🔐 Environment Variables

Required in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Get these from: Supabase Dashboard > Settings > API

## 🎨 UI Components

### Colors by Role
- **Patient**: Teal/Blue gradient
- **Staff**: Professional gray
- **Admin**: Dark theme

### Icons
Using Lucide React: https://lucide.dev/icons

### Styling
Tailwind CSS utility classes

## 📊 Key Tables

| Table | Purpose |
|-------|---------|
| `patients` | Patient profiles |
| `doctors` | Doctor profiles |
| `appointments` | Appointment records |
| `appointment_logs` | Audit trail |
| `hospitals` | Hospital locations |
| `access_logs` | System access logs |

## 🔗 Useful Links

- **Supabase Dashboard**: https://supabase.com/dashboard
- **Next.js Docs**: https://nextjs.org/docs
- **Tailwind Docs**: https://tailwindcss.com/docs
- **TypeScript Handbook**: https://typescriptlang.org/docs

## 💡 Tips

- Use TypeScript for type safety
- Test with multiple user roles
- Check responsive design (mobile/tablet)
- Keep components small and focused
- Document complex logic
- Handle errors gracefully
- Log important actions

## 🆘 Getting Help

1. Check documentation in `/docs`
2. Review existing code patterns
3. Check Supabase dashboard for errors
4. Create an issue with details
5. Ask in team chat

## ✅ Pre-commit Checklist

- [ ] Code follows style guide
- [ ] TypeScript types defined
- [ ] Error handling added
- [ ] Tested all user roles
- [ ] Responsive design verified
- [ ] No console errors
- [ ] Comments added
- [ ] Commit message is clear

---

**Need more details?** See the full documentation in `/docs` folder.
