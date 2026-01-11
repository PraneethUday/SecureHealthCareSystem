# Supabase Database Setup

## Tables Created

1. **admins** - System administrators (only one allowed)
2. **patients** - Patient records
3. **doctors** - Doctor profiles
4. **nurses** - Nurse profiles
5. **staff** - Administrative staff
6. **medical_records** - Patient medical records
7. **access_logs** - Audit logs for security

## Setup Instructions

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project: https://lkgzfyrrkkchmlivrdec.supabase.co
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `schema.sql`
4. Click **Run** to create all tables
5. Copy and paste the contents of `seed.sql`
6. Click **Run** to insert sample data

### Option 2: Using the Setup Script

Run the automated setup script:

```bash
npm run setup-db
```

Or directly:

```bash
npx ts-node scripts/setup-database.ts
```

## Sample Login Credentials

### Admin

- **ID:** admin
- **Password:** admin123

### Patients (Login with EMAIL)

- **john.doe@email.com** / password: **patient1** - John Doe
- **jane.smith@email.com** / password: **patient2** - Jane Smith
- **michael.j@email.com** / password: **patient3** - Michael Johnson

### Doctors

- **D001** / password: **doctor1** - Dr. Sarah Williams (Cardiology)
- **D002** / password: **doctor2** - Dr. Robert Brown (Pediatrics)
- **D003** / password: **doctor3** - Dr. Emily Davis (Neurology)

### Nurses

- **N001** / password: **nurse1** - Lisa Martinez (Emergency, Day Shift)
- **N002** / password: **nurse2** - David Garcia (ICU, Night Shift)
- **N003** / password: **nurse3** - Amanda Wilson (Pediatrics, Day Shift)

### Staff

- **S001** / password: **staff1** - Thomas Anderson (Receptionist)
- **S002** / password: **staff2** - Jennifer Taylor (Medical Records Clerk)
- **S003** / password: **staff3** - Christopher Moore (Billing Specialist)

## Database Schema

### Admin Table

```sql
admins (
  id TEXT PRIMARY KEY (must be 'admin'),
  password TEXT,
  full_name TEXT,
  email TEXT UNIQUE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

### Patients Table

```sql
patients (
  id UUID PRIMARY KEY,
  patient_id TEXT UNIQUE,
  password TEXT,
  first_name TEXT,
  last_name TEXT,
  email TEXT UNIQUE,
  phone TEXT,
  date_of_birth DATE,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  medical_history TEXT,
  allergies TEXT,
  current_medications TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

### Doctors Table

```sql
doctors (
  id UUID PRIMARY KEY,
  doctor_id TEXT UNIQUE,
  password TEXT,
  first_name TEXT,
  last_name TEXT,
  email TEXT UNIQUE,
  phone TEXT,
  specialization TEXT,
  license_number TEXT UNIQUE,
  department TEXT,
  years_of_experience INTEGER,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

### Nurses Table

```sql
nurses (
  id UUID PRIMARY KEY,
  nurse_id TEXT UNIQUE,
  password TEXT,
  first_name TEXT,
  last_name TEXT,
  email TEXT UNIQUE,
  phone TEXT,
  license_number TEXT UNIQUE,
  department TEXT,
  shift TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

### Staff Table

```sql
staff (
  id UUID PRIMARY KEY,
  staff_id TEXT UNIQUE,
  password TEXT,
  first_name TEXT,
  last_name TEXT,
  email TEXT UNIQUE,
  phone TEXT,
  role TEXT,
  department TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

## Security Notes

- All passwords are hashed using bcrypt
- Admin ID is restricted to 'admin' only (enforced by CHECK constraint)
- Unique constraints on emails and IDs prevent duplicates
- Access logs track all user actions for audit purposes
