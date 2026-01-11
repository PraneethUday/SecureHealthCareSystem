# Pharmacy Management System - Staff Dashboard

## Overview

The staff dashboard now includes a comprehensive pharmacy management system that allows staff members to act as pharmacy managers within the hospital. This system enables staff to search for prescriptions, view patient medication details, and mark prescriptions as dispensed.

## Features

### 1. Prescription Search

- **Search by Patient ID**: Enter exact patient ID (e.g., P001) to find all prescriptions
- **Search by Patient Name**: Search using patient's first or last name (partial matches supported)
- **Status Filtering**: Filter prescriptions by status:
  - `active` - Currently active prescriptions
  - `completed` - Dispensed/completed prescriptions
  - `discontinued` - Discontinued prescriptions
  - `all` - View all prescriptions regardless of status

### 2. Prescription Display

Each prescription card shows:

- **Basic Information**:

  - Medication name
  - Dosage
  - Frequency
  - Duration
  - Prescribed date
  - Current status (with color-coded badges)

- **Patient Details**:

  - Patient name
  - Patient ID
  - Email
  - Phone number

- **Doctor Information**:

  - Doctor name
  - Specialization

- **Clinical Details** (expandable):
  - Start and end dates
  - Instructions
  - Notes
  - Special considerations

### 3. Dispensing Workflow

For active prescriptions:

1. Click "Mark as Dispensed" button
2. Optionally add dispensing notes
3. Confirm dispensing action
4. Prescription status automatically updates to "completed"
5. Action is logged with staff ID and timestamp

## API Endpoints

### Search Prescriptions

**Endpoint**: `GET /api/prescriptions/search`

**Query Parameters**:

- `patientId` (optional): Patient ID to filter by
- `patientName` (optional): Patient name to search by
- `status` (optional): Filter by prescription status

**Response**:

```json
{
  "prescriptions": [
    {
      "id": "uuid",
      "patient_id": "P001",
      "patient_name": "John Doe",
      "patient_email": "john@example.com",
      "patient_phone": "+1234567890",
      "doctor_name": "Dr. Jane Smith",
      "doctor_specialization": "Cardiology",
      "medication_name": "Lisinopril",
      "dosage": "10mg",
      "frequency": "Once daily",
      "duration": "30 days",
      "instructions": "Take in the morning with water",
      "status": "active",
      "prescribed_date": "2026-01-10",
      "start_date": "2026-01-10",
      "end_date": "2026-02-09"
    }
  ]
}
```

## Functions Added to `lib/prescriptions.ts`

### `searchPrescriptionsForPharmacy(filters)`

Search for prescriptions with various filter options.

**Parameters**:

```typescript
{
  patientId?: string;
  patientName?: string;
  status?: "active" | "completed" | "discontinued" | "all";
}
```

**Returns**: Promise with success status and prescription data array

### `markPrescriptionDispensed(prescriptionId, staffId, notes?)`

Mark a prescription as dispensed and log the action.

**Parameters**:

- `prescriptionId`: UUID of the prescription
- `staffId`: ID of the staff member dispensing
- `notes` (optional): Dispensing notes

**Returns**: Promise with success status

## Components

### PharmacyManager

Main pharmacy management interface component.

**Location**: `/app/dashboard/staff/components/PharmacyManager.tsx`

**Props**:

- `staffId`: ID of the logged-in staff member

**Features**:

- Search interface with toggle between ID and name search
- Status filter dropdown
- Results display with loading states
- Empty state messaging
- Error handling and display

### PrescriptionCard

Individual prescription display card with dispensing capability.

**Location**: `/app/dashboard/staff/components/PrescriptionCard.tsx`

**Props**:

- `prescription`: Prescription object with all details
- `staffId`: ID of the staff member
- `onStatusUpdate`: Callback function after status change

**Features**:

- Expandable/collapsible details
- Color-coded status badges
- Dispense workflow with notes
- Real-time status updates

## Usage

### For Staff Members:

1. **Login** as staff member
2. Navigate to **Pharmacy Management** tab
3. **Search for prescriptions**:

   - Choose search type (Patient ID or Name)
   - Enter search criteria
   - Optionally filter by status
   - Click "Search"

4. **View prescription details**:

   - Click the expand button (chevron) to see full details
   - Review medication information, dosage, instructions

5. **Dispense medication**:
   - For active prescriptions, click "Mark as Dispensed"
   - Add optional notes about the dispensing
   - Confirm the action
   - Status updates to "completed"

## Security & Logging

- All dispensing actions are logged with:

  - Prescription ID
  - Staff member ID
  - Timestamp
  - Action type ("updated" with "dispensed" metadata)
  - Old and new prescription data
  - Dispensing notes

- Logs are stored in `prescription_logs` table
- Only staff members can access pharmacy management features
- Authentication verified on both client and server side

## Database Requirements

The system uses these tables:

- `prescriptions` - Stores prescription data
- `patients` - Patient information for search
- `doctors` - Doctor information for display
- `prescription_logs` - Audit trail of all prescription actions

## Future Enhancements

Potential improvements:

1. Barcode scanning for medication verification
2. Inventory management integration
3. Drug interaction checking
4. Refill request handling
5. Prescription history tracking
6. Print prescription labels
7. Insurance verification
8. Multi-location inventory tracking

## Testing

To test the pharmacy management system:

1. **Create a prescription** (as a doctor):

   - Complete an appointment
   - Add prescription for the patient

2. **Search as staff**:

   - Login as staff member
   - Go to Pharmacy Management
   - Search by patient ID or name

3. **Dispense medication**:

   - Find an active prescription
   - Click "Mark as Dispensed"
   - Add notes and confirm
   - Verify status changes to "completed"

4. **Verify logging**:
   - Check `prescription_logs` table
   - Confirm entry with staff ID and dispensing action
