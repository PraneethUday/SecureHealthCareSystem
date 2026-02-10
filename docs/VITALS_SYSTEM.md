# Patient Vitals Tracking System

## Overview
The Patient Vitals Tracking System allows patients to update their health metrics and enables doctors to view comprehensive vital signs with automatic alert generation for abnormal readings.

## Features

### For Patients
- **Multi-Section Vitals Form**: Easy-to-use interface organized into:
  - **Basic Vitals**: Height, Weight, BMI (auto-calculated), Temperature
  - **Cardiovascular**: Blood Pressure, Heart Rate, Respiratory Rate, Oxygen Saturation
  - **Metabolic**: Blood Sugar, Cholesterol (Total, LDL, HDL), Triglycerides
  - **Lifestyle**: Sleep Hours, Water Intake, Exercise Minutes, Stress Level

- **Auto-fill from Previous**: Form pre-fills with latest vitals for easy updates
- **BMI Auto-calculation**: Automatically calculates BMI from height and weight
- **Symptoms & Notes**: Add current symptoms and health notes

### For Doctors
- **Comprehensive Vitals View**: See all patient vitals in an organized grid
- **Automatic Alerts**: System generates alerts for abnormal readings:
  - High/Low Blood Pressure
  - Low Oxygen Saturation
  - High Blood Sugar
  - Abnormal Heart Rate
  - Fever
  - And more...

- **Alert Severity Levels**: Critical, High, Medium, Low
- **Historical Tracking**: View past vitals records with timestamps
- **Visual Indicators**: Color-coded cards with alert icons for abnormal values

## Database Schema

### Tables Created
1. **patient_vitals**: Stores all vital measurements
   - Basic vitals (height, weight, BMI)
   - Cardiovascular metrics
   - Metabolic markers
   - Lifestyle data
   - Auto-calculated BMI using PostgreSQL generated column

2. **vitals_alerts**: Automatic alerts for abnormal readings
   - Alert type and severity
   - Acknowledgment tracking
   - Timestamp and patient linkage

### Automatic Features
- **BMI Calculation**: Automatically calculated and stored
- **Alert Generation**: Triggers automatically check thresholds and create alerts
- **Timestamp Tracking**: Auto-updates `updated_at` on changes
- **Row Level Security**: Policies ensure data privacy

## Setup Instructions

### 1. Run the Database Schema
```bash
# In Supabase SQL Editor, run:
supabase/vitals-schema.sql
```

This will create:
- ✅ `patient_vitals` table with all health metrics
- ✅ `vitals_alerts` table for abnormal readings
- ✅ Automatic triggers for alert generation
- ✅ BMI auto-calculation
- ✅ Row Level Security policies

### 2. Components Created

#### Patient Components
- `app/dashboard/patient/components/VitalsForm.tsx`
  - Multi-section form with tabbed interface
  - Auto-fills from latest vitals
  - Real-time BMI calculation
  - Stress level slider
  - Symptoms and notes fields

#### Doctor Components
- `app/dashboard/doctor/components/VitalsViewer.tsx`
  - Comprehensive vitals display
  - Active alerts section
  - Historical vitals tracking
  - Color-coded vital cards
  - Alert acknowledgment

### 3. Integration Points

#### Patient Dashboard
- Vitals button in Quick Actions section
- Opens modal with VitalsForm
- Accessible from main dashboard

#### Doctor Dashboard
- "View Vitals" button in appointment cards (when health profile is shared)
- Opens modal with VitalsViewer
- Shows patient vitals and alerts

## Usage

### As a Patient
1. Click the **"Vitals"** button on your dashboard
2. Navigate through the sections:
   - Basic: Enter height, weight, temperature
   - Cardio: Blood pressure, heart rate, oxygen levels
   - Metabolic: Blood sugar, cholesterol levels
   - Lifestyle: Sleep, exercise, water intake, stress
3. Add any current symptoms or notes
4. Click **"Save Vitals"**

### As a Doctor
1. In an appointment card, click **"View Vitals"** (when patient has shared health profile)
2. Review:
   - Active alerts (if any abnormal readings)
   - Latest vitals in organized grid
   - Historical vitals records
3. Acknowledge alerts as needed
4. Use vitals data to inform treatment decisions

## Alert Thresholds

The system automatically generates alerts for:

| Vital | Threshold | Severity |
|-------|-----------|----------|
| Blood Pressure | ≥180/120 mmHg | Critical |
| Blood Pressure | ≥160/100 mmHg | High |
| Blood Pressure | ≥140/90 mmHg | Medium |
| Blood Pressure | <90/60 mmHg | Medium |
| Oxygen Saturation | <90% | Critical |
| Oxygen Saturation | <92% | High |
| Oxygen Saturation | <95% | Medium |
| Blood Sugar (Fasting) | ≥200 mg/dL | High |
| Blood Sugar (Fasting) | ≥126 mg/dL | Medium |
| Heart Rate | >120 bpm | High |
| Heart Rate | >100 bpm | Medium |
| Heart Rate | <40 bpm | High |
| Heart Rate | <60 bpm | Medium |
| Temperature | ≥39.5°C | High |
| Temperature | ≥38.0°C | Medium |

## Technical Details

### BMI Calculation
BMI is automatically calculated using PostgreSQL's generated column feature:
```sql
bmi DECIMAL(4,2) GENERATED ALWAYS AS (
  CASE 
    WHEN height_cm > 0 THEN weight_kg / ((height_cm / 100) * (height_cm / 100))
    ELSE NULL
  END
) STORED
```

### Alert Trigger
Alerts are automatically generated after each vitals insert using a PostgreSQL trigger:
```sql
CREATE TRIGGER trigger_check_vital_thresholds
  AFTER INSERT ON patient_vitals
  FOR EACH ROW
  EXECUTE FUNCTION check_vital_thresholds();
```

### Data Privacy
- Row Level Security (RLS) enabled on both tables
- Patients can view and insert their own vitals
- Medical staff can view all vitals
- Only medical staff can acknowledge alerts

## Future Enhancements

Potential improvements:
- [ ] Vitals trend charts and graphs
- [ ] Export vitals history to PDF
- [ ] Nurse vitals entry interface
- [ ] Customizable alert thresholds
- [ ] Integration with wearable devices
- [ ] Medication correlation tracking
- [ ] Predictive health analytics

## Troubleshooting

### Vitals not saving
- Ensure database schema is properly installed
- Check browser console for errors
- Verify patient ID is valid UUID

### Alerts not generating
- Confirm trigger is installed: `SELECT * FROM pg_trigger WHERE tgname = 'trigger_check_vital_thresholds';`
- Check if vitals values exceed thresholds
- Review PostgreSQL logs for errors

### BMI not calculating
- Ensure both height and weight are provided
- Check that height_cm > 0
- Verify generated column is properly created

## Support

For issues or questions:
1. Check browser console for errors
2. Review Supabase logs
3. Verify all schema components are installed
4. Ensure RLS policies are active

---

**System Status**: ✅ Fully Functional
**Last Updated**: February 2026
**Version**: 1.0.0
