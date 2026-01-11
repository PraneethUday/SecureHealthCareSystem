# Development Guide

## Quick Start for Developers

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Git
- Supabase account (free tier)
- Code editor (VS Code recommended)

### Initial Setup

1. **Clone and Install**

   ```bash
   git clone <repository-url>
   cd SecureHealthCareSystem
   npm install
   ```

2. **Environment Configuration**

   Create `.env.local` in the root directory:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

3. **Database Setup**

   See [SETUP_INSTRUCTIONS.md](SETUP_INSTRUCTIONS.md) for detailed database configuration.

4. **Start Development Server**
   ```bash
   npm run dev
   ```
   Visit http://localhost:3000

## Project Commands

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
npm run setup-db     # Setup database (automated)
npm run check-schema # Validate database schema
npm run test-db      # Test database connection

# Testing
npm run test-appointments  # Test appointment system
```

## Development Workflow

### Adding a New Feature

1. **Create Feature Branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Database Changes (if needed)**

   - Add SQL to appropriate file in `/supabase`
   - Update TypeScript types in `lib/database.types.ts`
   - Test with `npm run check-schema`

3. **Implement Feature**

   - Add business logic in `/lib`
   - Create UI components in `/app`
   - Follow existing patterns

4. **Test Thoroughly**

   - Test all user roles
   - Verify database operations
   - Check responsive design
   - Test error cases

5. **Commit and Push**
   ```bash
   git add .
   git commit -m "feat: description of your feature"
   git push origin feature/your-feature-name
   ```

### Code Style Guidelines

#### TypeScript

```typescript
// Use explicit types
interface User {
  id: string;
  name: string;
  role: "patient" | "doctor" | "nurse" | "staff" | "admin";
}

// Use async/await
async function fetchUser(id: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
}
```

#### React Components

```typescript
// Use functional components with TypeScript
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary";
}

export default function Button({
  label,
  onClick,
  variant = "primary",
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded ${
        variant === "primary" ? "bg-blue-600" : "bg-gray-600"
      }`}
    >
      {label}
    </button>
  );
}
```

#### Tailwind CSS

```typescript
// Use consistent spacing and colors
// Prefer utility classes over custom CSS
<div className="flex flex-col gap-4 p-6 bg-white rounded-lg shadow-md">
  <h2 className="text-xl font-semibold text-gray-800">Title</h2>
  <p className="text-gray-600">Content</p>
</div>
```

## Common Development Tasks

### Adding a New Dashboard Page

1. Create page in `/app/dashboard/[role]/page.tsx`
2. Add authentication check
3. Implement role-specific UI
4. Update navigation

Example:

```typescript
// app/dashboard/pharmacist/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function PharmacistDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = sessionStorage.getItem("user");
    if (!userData) {
      router.push("/login");
      return;
    }

    const parsed = JSON.parse(userData);
    if (parsed.role !== "pharmacist") {
      router.push("/login");
      return;
    }

    setUser(parsed);
  }, [router]);

  if (!user) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <h1 className="text-2xl font-bold">Pharmacist Dashboard</h1>
      {/* Your dashboard content */}
    </div>
  );
}
```

### Adding a New API Endpoint

1. Create route in `/app/api/[endpoint]/route.ts`
2. Implement handler functions
3. Add error handling
4. Add TypeScript types

Example:

```typescript
// app/api/prescriptions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const patientId = request.nextUrl.searchParams.get("patientId");

    if (!patientId) {
      return NextResponse.json(
        { error: "Patient ID is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("prescriptions")
      .select("*")
      .eq("patient_id", patientId);

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching prescriptions:", error);
    return NextResponse.json(
      { error: "Failed to fetch prescriptions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const { patient_id, doctor_id, medication, dosage } = body;
    if (!patient_id || !doctor_id || !medication) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("prescriptions")
      .insert([body])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Error creating prescription:", error);
    return NextResponse.json(
      { error: "Failed to create prescription" },
      { status: 500 }
    );
  }
}
```

### Adding Database Tables

1. Create SQL in `/supabase/schema.sql` or new file
2. Run in Supabase Dashboard SQL Editor
3. Update TypeScript types
4. Add seed data if needed

Example:

```sql
-- Add to schema.sql or create new migration file
CREATE TABLE prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id),
  doctor_id UUID NOT NULL REFERENCES doctors(id),
  medication TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for better query performance
CREATE INDEX idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX idx_prescriptions_doctor ON prescriptions(doctor_id);
```

Then update `lib/database.types.ts`:

```typescript
export interface Prescription {
  id: string;
  patient_id: string;
  doctor_id: string;
  medication: string;
  dosage: string;
  frequency: string;
  start_date: string;
  end_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}
```

## Debugging Tips

### Frontend Issues

- Check browser console for errors
- Use React DevTools
- Verify session storage data
- Check network tab for API calls

### Backend/Database Issues

- Check Supabase logs in dashboard
- Verify environment variables
- Test queries in SQL Editor
- Check RLS policies

### Common Errors and Solutions

**Error: "Invalid login credentials"**

- Verify user exists in database
- Check password matches
- Ensure correct role table

**Error: "Row level security policy"**

- Check RLS is disabled for testing
- Or add appropriate policies
- Verify user has correct permissions

**Error: "Cannot read property of undefined"**

- Check session storage has user data
- Verify data structure matches types
- Add null checks

## Performance Optimization

### Database Queries

- Use specific column selection instead of `*`
- Add indexes for frequently queried columns
- Limit results when appropriate
- Use pagination for large datasets

### Frontend

- Lazy load components when possible
- Optimize images
- Minimize re-renders
- Use React.memo for expensive components

### Caching

- Consider implementing SWR or React Query
- Cache API responses when appropriate
- Use Next.js static generation where possible

## Testing Checklist

Before submitting a pull request:

- [ ] Code follows style guidelines
- [ ] All TypeScript types are defined
- [ ] Error handling is implemented
- [ ] Tested with all user roles
- [ ] Responsive design verified
- [ ] Console has no errors
- [ ] Database queries are optimized
- [ ] Comments added for complex logic
- [ ] No sensitive data in logs
- [ ] Commit messages are clear

## Resources

### Documentation

- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Tools

- [VS Code](https://code.visualstudio.com/)
- [React DevTools](https://react.dev/learn/react-developer-tools)
- [Supabase Studio](https://supabase.com/docs/guides/platform/studio)

## Getting Help

If you encounter issues:

1. Check the documentation in `/docs`
2. Review existing code for patterns
3. Check Supabase dashboard for errors
4. Create an issue with details
5. Ask in team chat/Slack

## Contributing

See main [README.md](../README.md) for contribution guidelines.
