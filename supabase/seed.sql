-- ==========================================
-- CLEANUP: DELETE ALL EXISTING DATA
-- ==========================================

-- Delete in reverse order of dependencies
DELETE FROM prescription_logs;
DELETE FROM prescriptions;
DELETE FROM access_logs;
DELETE FROM medical_records;
DELETE FROM appointment_logs;
DELETE FROM appointments;
DELETE FROM video_calls;
DELETE FROM staff;
DELETE FROM nurses;
DELETE FROM doctors;
DELETE FROM patients;
DELETE FROM admins;

-- ==========================================
-- SEED DATA
-- ==========================================

-- Insert Admin (only one, hardcoded password: admin)
-- Password is hashed using bcrypt (this is a hash of "admin")
INSERT INTO admins (id, password, full_name, email) 
VALUES ('admin', '$2a$10$YQs8qF4V7lZ5K8wZ1qGXxO7KJXhM5YX8qF4V7lZ5K8wZ1qGXxO7KJ', 'System Administrator', 'admin@securehealthcare.com')
ON CONFLICT (id) DO NOTHING;

-- Insert Sample Patients
INSERT INTO patients (patient_id, password, first_name, last_name, email, phone_number, date_of_birth, gender, address, emergency_contact, blood_group, allergies) VALUES
('P001', 'patient1', 'John', 'Doe', 'john.doe@email.com', '555-0101', '1990-05-15', 'Male', '123 Main St, New York, NY 10001', '555-0111', 'A+', 'None'),
('P002', 'patient2', 'Jane', 'Smith', 'jane.smith@email.com', '555-0102', '1985-08-22', 'Female', '456 Oak Ave, Los Angeles, CA 90001', '555-0112', 'B+', 'Penicillin'),
('P003', 'patient3', 'Michael', 'Johnson', 'michael.j@email.com', '555-0103', '1978-03-10', 'Male', '789 Pine Rd, Chicago, IL 60601', '555-0113', 'O+', 'None')
ON CONFLICT (patient_id) DO NOTHING;

-- Insert Sample Doctors - Tamil Names
INSERT INTO doctors (doctor_id, password, first_name, last_name, email, phone, specialization, license_number, department, years_of_experience) VALUES
('D001', 'doctor1', 'Rajesh', 'Kumar', 'dr.rajesh@hospital.com', '555-0201', 'Cardiology', 'LIC-DR-001', 'Cardiology', 15),
('D002', 'doctor2', 'Priya', 'Selvam', 'dr.priya@hospital.com', '555-0202', 'Pediatrics', 'LIC-DR-002', 'Pediatrics', 10),
('D003', 'doctor3', 'Lakshmi', 'Narayanan', 'dr.lakshmi@hospital.com', '555-0203', 'Neurology', 'LIC-DR-003', 'Neurology', 12)
ON CONFLICT (doctor_id) DO NOTHING;

-- Insert Sample Nurses
INSERT INTO nurses (nurse_id, password, first_name, last_name, email, phone, license_number, department, shift) VALUES
('N001', 'nurse1', 'Lisa', 'Martinez', 'nurse.martinez@hospital.com', '555-0301', 'LIC-NR-001', 'Emergency', 'Day'),
('N002', 'nurse2', 'David', 'Garcia', 'nurse.garcia@hospital.com', '555-0302', 'LIC-NR-002', 'ICU', 'Night'),
('N003', 'nurse3', 'Amanda', 'Wilson', 'nurse.wilson@hospital.com', '555-0303', 'LIC-NR-003', 'Pediatrics', 'Day')
ON CONFLICT (nurse_id) DO NOTHING;

-- Insert Sample Staff
INSERT INTO staff (staff_id, password, first_name, last_name, email, phone, role, department) VALUES
('S001', 'staff1', 'Thomas', 'Anderson', 'thomas.a@hospital.com', '555-0401', 'Receptionist', 'Front Desk'),
('S002', 'staff2', 'Jennifer', 'Taylor', 'jennifer.t@hospital.com', '555-0402', 'Medical Records Clerk', 'Records'),
('S003', 'staff3', 'Christopher', 'Moore', 'chris.m@hospital.com', '555-0403', 'Billing Specialist', 'Finance')
ON CONFLICT (staff_id) DO NOTHING;
