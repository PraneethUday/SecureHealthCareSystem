#!/bin/bash

# Appointment System - Quick Deployment Script
# This script helps verify the setup is ready

echo "======================================"
echo "Appointment System - Setup Check"
echo "======================================"
echo ""

# Check if server is running
echo "1. Checking if Next.js server is running..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Server is running on http://localhost:3000"
else
    echo "❌ Server is NOT running"
    echo "   Please run: npm run dev"
    exit 1
fi
echo ""

# Check environment variables
echo "2. Checking environment variables..."
if [ -f .env.local ]; then
    echo "✅ .env.local file exists"
    if grep -q "NEXT_PUBLIC_SUPABASE_URL" .env.local && grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY" .env.local; then
        echo "✅ Supabase keys are configured"
    else
        echo "⚠️  Supabase keys might be missing"
    fi
else
    echo "❌ .env.local file not found"
    exit 1
fi
echo ""

# Check if schema file exists
echo "3. Checking schema files..."
if [ -f "supabase/appointments-schema.sql" ]; then
    echo "✅ appointments-schema.sql exists"
    echo "   Lines: $(wc -l < supabase/appointments-schema.sql)"
else
    echo "❌ Schema file not found"
    exit 1
fi
echo ""

# Check TypeScript files
echo "4. Checking TypeScript files..."
FILES=(
    "lib/appointments.ts"
    "lib/database.types.ts"
    "app/dashboard/patient/components/NewAppointmentForm.tsx"
    "app/dashboard/patient/components/AppointmentCard.tsx"
    "app/dashboard/doctor/components/DoctorAppointmentCard.tsx"
)

ALL_EXIST=true
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "   ✅ $file"
    else
        echo "   ❌ $file - MISSING"
        ALL_EXIST=false
    fi
done

if [ "$ALL_EXIST" = false ]; then
    echo ""
    echo "❌ Some files are missing"
    exit 1
fi
echo ""

echo "======================================"
echo "Setup Check Complete!"
echo "======================================"
echo ""
echo "Next Steps:"
echo ""
echo "1. Deploy Database Schema:"
echo "   → Open Supabase Dashboard"
echo "   → Go to SQL Editor"
echo "   → Copy contents of: supabase/appointments-schema.sql"
echo "   → Paste and run"
echo ""
echo "2. Test the System:"
echo "   Patient: http://localhost:3000/login"
echo "   - Email: praneethudayakumar227@gmail.com"
echo "   - Password: password123"
echo ""
echo "   Doctor: http://localhost:3000/login"
echo "   - Email: john.doe@hospital.com"
echo "   - Password: password123"
echo ""
echo "   Admin: http://localhost:3000/login"
echo "   - Email: admin@hospital.com"
echo "   - Password: admin123"
echo ""
echo "3. Read the Guide:"
echo "   See: APPOINTMENT_SYSTEM_GUIDE.md"
echo ""
echo "======================================"
