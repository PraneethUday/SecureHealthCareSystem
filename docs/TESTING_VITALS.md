# 🧪 Testing Scripts - Quick Guide

## ✅ Yes! You Can Test Vitals Alone!

---

## 🎯 **Available Test Scripts:**

### 1. **Test Everything** 🌟
```bash
npx tsx scripts/test-all-apis.ts
```
Tests: Zoom + Email + Vitals + Environment + Server

---

### 2. **Test Vitals Only** ❤️
```bash
npx tsx scripts/test-vitals.ts
```

**What it tests:**
- ✅ Database connection
- ✅ Get patient from database
- ✅ **Create** vitals record (INSERT)
- ✅ **Read** vitals records (SELECT)
- ✅ **Update** vitals record (UPDATE)
- ✅ **Delete** vitals record (DELETE)
- ✅ Data validation (rejects invalid data)
- ✅ Statistics calculation (averages, trends)

**Perfect for:**
- Testing vitals CRUD operations
- Verifying database schema
- Checking data validation
- Demonstrating vitals functionality for viva

---

### 3. **Test Email Only** 📧
```bash
npx tsx scripts/test-email-praneeth.ts
```
Sends test email to praneethp227@gmail.com

---

### 4. **Test Zoom Only** 🎥
```bash
npx tsx scripts/test-zoom.ts
```
Creates test Zoom meeting

---

## 🚀 **Quick Start - Test Vitals:**

```bash
# Just run this command:
npx tsx scripts/test-vitals.ts
```

**No server needed!** This test connects directly to Supabase database.

---

## 📊 **What You'll See:**

```
═══════════════════════════════════════════════════════════════════════════════
  ❤️  VITALS API COMPREHENSIVE TESTING SUITE
═══════════════════════════════════════════════════════════════════════════════

Configuration:
  ℹ️  Supabase URL: https://lkgzfyrrkkchmlivrdec.supabase.co
  ℹ️  Service Role Key: ✅ Set

───────────────────────────────────────────────────────────────────────────────
  🔌 DATABASE CONNECTION TEST
───────────────────────────────────────────────────────────────────────────────
  ✅ Database connection successful

───────────────────────────────────────────────────────────────────────────────
  👤 GET PATIENT TEST
───────────────────────────────────────────────────────────────────────────────
  ℹ️  Fetching first patient from database...
  ✅ Patient fetched successfully
  📊 Patient: {
       "id": "...",
       "name": "Praneeth",
       "email": "praneethp227@gmail.com"
     }

───────────────────────────────────────────────────────────────────────────────
  ➕ CREATE VITALS TEST
───────────────────────────────────────────────────────────────────────────────
  ℹ️  Creating test vitals record...
  📊 Test Data: {
       "patient_id": "...",
       "blood_pressure_systolic": 120,
       "blood_pressure_diastolic": 80,
       "heart_rate": 72,
       "temperature": 98.6,
       "oxygen_saturation": 98,
       "weight": 70.5,
       "height": 175
     }
  ✅ Vitals created successfully

───────────────────────────────────────────────────────────────────────────────
  📊 GET VITALS TEST
───────────────────────────────────────────────────────────────────────────────
  ℹ️  Fetching vitals for patient: ...
  ✅ Found 1 vitals record(s)
  📊 Latest Vitals: { ... }

───────────────────────────────────────────────────────────────────────────────
  ✏️  UPDATE VITALS TEST
───────────────────────────────────────────────────────────────────────────────
  ℹ️  Updating vitals record: ...
  📊 Updates: { "heart_rate": 75, "temperature": 98.8 }
  ✅ Vitals updated successfully

───────────────────────────────────────────────────────────────────────────────
  📈 VITALS STATISTICS TEST
───────────────────────────────────────────────────────────────────────────────
  ℹ️  Calculating vitals statistics...
  ✅ Statistics calculated successfully
  📊 Statistics: {
       "totalRecords": 1,
       "avgHeartRate": "72.0",
       "avgSystolic": "120.0",
       "avgDiastolic": "80.0",
       "avgTemperature": "98.6"
     }

───────────────────────────────────────────────────────────────────────────────
  🗑️  DELETE VITALS TEST
───────────────────────────────────────────────────────────────────────────────
  ℹ️  Deleting vitals record: ...
  ✅ Vitals deleted successfully

───────────────────────────────────────────────────────────────────────────────
  ✔️  VITALS VALIDATION TEST
───────────────────────────────────────────────────────────────────────────────
  ℹ️  Testing with invalid data...
  ✅ Validation working: Invalid data rejected

───────────────────────────────────────────────────────────────────────────────
  📊 TEST SUMMARY
───────────────────────────────────────────────────────────────────────────────

Results:
  ✅ Passed:  8
  ❌ Failed:  0
  📊 Total:   8

Success Rate: 100.0%

🎉 All vitals tests passed! Your vitals system is working correctly!

───────────────────────────────────────────────────────────────────────────────
  💡 RECOMMENDATIONS
───────────────────────────────────────────────────────────────────────────────
  ✅ Vitals system is fully functional
  ℹ️  You can now:
     - Record patient vitals from the dashboard
     - View vitals history
     - Track health trends
     - Generate health reports

═══════════════════════════════════════════════════════════════════════════════
  Vitals Testing Complete!
═══════════════════════════════════════════════════════════════════════════════
```

---

## 🎓 **For Viva/Exams:**

**Q: How do you test your vitals system?**

**A:** "We have a comprehensive testing script that tests all CRUD operations on patient vitals. It connects directly to our Supabase database and performs 8 different tests including creating vitals records, reading patient history, updating measurements, deleting records, validating data integrity, and calculating health statistics. The test provides detailed colored output showing each operation's success or failure, making it easy to verify the system is working correctly."

**Key Points:**
- ✅ Tests all CRUD operations (Create, Read, Update, Delete)
- ✅ Validates data integrity
- ✅ Calculates statistics
- ✅ Direct database testing
- ✅ Beautiful colored output
- ✅ Comprehensive error reporting

---

## 📝 **Test Coverage:**

| Operation | Tested | Status |
|-----------|--------|--------|
| Database Connection | ✅ | Working |
| Get Patient | ✅ | Working |
| Create Vitals | ✅ | Working |
| Read Vitals | ✅ | Working |
| Update Vitals | ✅ | Working |
| Delete Vitals | ✅ | Working |
| Data Validation | ✅ | Working |
| Statistics | ✅ | Working |

---

## 💡 **Pro Tips:**

1. **No server needed** - Vitals test connects directly to database
2. **Safe to run** - Creates and deletes test data automatically
3. **Run anytime** - Perfect for quick verification
4. **Beautiful output** - Easy to screenshot for documentation
5. **Comprehensive** - Tests everything in one command

---

## 🎯 **Summary:**

**Yes, you can test vitals alone!** Just run:

```bash
npx tsx scripts/test-vitals.ts
```

This will test your entire vitals system independently with beautiful colored output! 🎉

---

**Happy Testing!** ❤️
