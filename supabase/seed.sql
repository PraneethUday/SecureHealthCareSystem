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
DELETE FROM doctor_hospitals;
DELETE FROM staff;
DELETE FROM nurses;
DELETE FROM doctors;
DELETE FROM patients;
DELETE FROM admins;

-- ==========================================
-- SEED DATA
-- ==========================================

-- Insert Admin (only one, hardcoded password: admin)
-- Password is hashed using bcrypt with 12 salt rounds (this is a hash of "admin")
-- MFA is disabled for admin for simplified access
INSERT INTO admins (id, password_hash, full_name, email, is_mfa_enabled) 
VALUES ('admin', '$2b$12$lr/yTVCe0K4J6vfD7v9VpOPR7C.od.UWDOArDpDD968iQtbg2a5SG', 'System Administrator', 'admin@securehealthcare.com', false)
ON CONFLICT (id) DO NOTHING;

-- Insert Sample Patients with Indian Names
INSERT INTO patients (patient_id, password, first_name, last_name, email, phone_number, date_of_birth, gender, address, emergency_contact, blood_group, allergies) VALUES
('P001', 'patient1', 'Arun', 'Krishnamurthy', 'arun.k@email.com', '9876543101', '1990-05-15', 'Male', '123 Anna Nagar, Chennai, TN 600040', '9876543111', 'A+', 'None'),
('P002', 'patient2', 'Meera', 'Sundaram', 'meera.s@email.com', '9876543102', '1985-08-22', 'Female', '456 RS Puram, Coimbatore, TN 641002', '9876543112', 'B+', 'Penicillin'),
('P003', 'patient3', 'Venkatesh', 'Raghavan', 'venkatesh.r@email.com', '9876543103', '1978-03-10', 'Male', '789 Thillai Nagar, Trichy, TN 620018', '9876543113', 'O+', 'None')
ON CONFLICT (patient_id) DO NOTHING;

-- Insert Sample Doctors with Tamil/Indian Names (30 doctors for 10 hospitals)
-- Each hospital will have 3-4 doctors

INSERT INTO doctors (id, doctor_id, password, first_name, last_name, email, phone, specialization, license_number, department, years_of_experience) VALUES
-- Apollo Hospitals, Chennai (Hospital 1)
('d1111111-1111-1111-1111-111111111111', 'D001', 'doctor1', 'Rajesh', 'Krishnamoorthy', 'dr.rajesh.k@apollo.com', '9840001001', 'Cardiology', 'TN-LIC-001', 'Cardiology', 18),
('d1111111-1111-1111-1111-111111111112', 'D002', 'doctor2', 'Priya', 'Venkataraman', 'dr.priya.v@apollo.com', '9840001002', 'Neurology', 'TN-LIC-002', 'Neurology', 15),
('d1111111-1111-1111-1111-111111111113', 'D003', 'doctor3', 'Suresh', 'Narayanan', 'dr.suresh.n@apollo.com', '9840001003', 'Oncology', 'TN-LIC-003', 'Oncology', 20),

-- Fortis Malar Hospital, Chennai (Hospital 2)
('d2222222-2222-2222-2222-222222222221', 'D004', 'doctor4', 'Lakshmi', 'Subramanian', 'dr.lakshmi.s@fortis.com', '9840002001', 'Orthopedics', 'TN-LIC-004', 'Orthopedics', 12),
('d2222222-2222-2222-2222-222222222222', 'D005', 'doctor5', 'Karthik', 'Ramamoorthy', 'dr.karthik.r@fortis.com', '9840002002', 'Cardiology', 'TN-LIC-005', 'Cardiology', 14),
('d2222222-2222-2222-2222-222222222223', 'D006', 'doctor6', 'Anitha', 'Shankar', 'dr.anitha.s@fortis.com', '9840002003', 'Pediatrics', 'TN-LIC-006', 'Pediatrics', 10),

-- KMCH Hospital, Coimbatore (Hospital 3)
('d3333333-3333-3333-3333-333333333331', 'D007', 'doctor7', 'Murugan', 'Palaniswamy', 'dr.murugan.p@kmch.com', '9840003001', 'Cardiology', 'TN-LIC-007', 'Cardiology', 22),
('d3333333-3333-3333-3333-333333333332', 'D008', 'doctor8', 'Kavitha', 'Govindaraj', 'dr.kavitha.g@kmch.com', '9840003002', 'Neurology', 'TN-LIC-008', 'Neurology', 16),
('d3333333-3333-3333-3333-333333333333', 'D009', 'doctor9', 'Selvakumar', 'Muthusamy', 'dr.selva.m@kmch.com', '9840003003', 'Emergency', 'TN-LIC-009', 'Emergency', 11),

-- PSG Hospitals, Coimbatore (Hospital 4)
('d4444444-4444-4444-4444-444444444441', 'D010', 'doctor10', 'Ramya', 'Krishnan', 'dr.ramya.k@psg.com', '9840004001', 'General Medicine', 'TN-LIC-010', 'General Medicine', 13),
('d4444444-4444-4444-4444-444444444442', 'D011', 'doctor11', 'Balaji', 'Sundaresan', 'dr.balaji.s@psg.com', '9840004002', 'Pediatrics', 'TN-LIC-011', 'Pediatrics', 9),
('d4444444-4444-4444-4444-444444444443', 'D012', 'doctor12', 'Deepa', 'Natarajan', 'dr.deepa.n@psg.com', '9840004003', 'Surgery', 'TN-LIC-012', 'Surgery', 17),

-- Kauvery Hospital, Trichy (Hospital 5)
('d5555555-5555-5555-5555-555555555551', 'D013', 'doctor13', 'Senthil', 'Arumugam', 'dr.senthil.a@kauvery.com', '9840005001', 'Cardiology', 'TN-LIC-013', 'Cardiology', 19),
('d5555555-5555-5555-5555-555555555552', 'D014', 'doctor14', 'Geetha', 'Ranganathan', 'dr.geetha.r@kauvery.com', '9840005002', 'Oncology', 'TN-LIC-014', 'Oncology', 14),
('d5555555-5555-5555-5555-555555555553', 'D015', 'doctor15', 'Vignesh', 'Chandrasekaran', 'dr.vignesh.c@kauvery.com', '9840005003', 'Neurology', 'TN-LIC-015', 'Neurology', 12),

-- Velammal Hospital, Madurai (Hospital 6)
('d6666666-6666-6666-6666-666666666661', 'D016', 'doctor16', 'Thirumurthy', 'Kalyanasundaram', 'dr.thiru.k@velammal.com', '9840006001', 'General Medicine', 'TN-LIC-016', 'General Medicine', 21),
('d6666666-6666-6666-6666-666666666662', 'D017', 'doctor17', 'Saraswathi', 'Iyer', 'dr.saras.i@velammal.com', '9840006002', 'Pediatrics', 'TN-LIC-017', 'Pediatrics', 11),
('d6666666-6666-6666-6666-666666666663', 'D018', 'doctor18', 'Aravind', 'Muralidharan', 'dr.arvind.m@velammal.com', '9840006003', 'Surgery', 'TN-LIC-018', 'Surgery', 15),

-- Vijaya Hospital, Chennai (Hospital 7)
('d7777777-7777-7777-7777-777777777771', 'D019', 'doctor19', 'Padmini', 'Vasudevan', 'dr.padmini.v@vijaya.com', '9840007001', 'Cardiology', 'TN-LIC-019', 'Cardiology', 16),
('d7777777-7777-7777-7777-777777777772', 'D020', 'doctor20', 'Mohan', 'Raghunath', 'dr.mohan.r@vijaya.com', '9840007002', 'Orthopedics', 'TN-LIC-020', 'Orthopedics', 18),
('d7777777-7777-7777-7777-777777777773', 'D021', 'doctor21', 'Revathi', 'Srinivasan', 'dr.revathi.s@vijaya.com', '9840007003', 'Neurology', 'TN-LIC-021', 'Neurology', 13),

-- GEM Hospital, Coimbatore (Hospital 8)
('d8888888-8888-8888-8888-888888888881', 'D022', 'doctor22', 'Manikandan', 'Thevar', 'dr.mani.t@gem.com', '9840008001', 'General Medicine', 'TN-LIC-022', 'General Medicine', 14),
('d8888888-8888-8888-8888-888888888882', 'D023', 'doctor23', 'Janaki', 'Anandakrishnan', 'dr.janaki.a@gem.com', '9840008002', 'Surgery', 'TN-LIC-023', 'Surgery', 20),
('d8888888-8888-8888-8888-888888888883', 'D024', 'doctor24', 'Prakash', 'Kuppusamy', 'dr.prakash.k@gem.com', '9840008003', 'Oncology', 'TN-LIC-024', 'Oncology', 17),

-- Rela Hospital, Chennai (Hospital 9)
('d9999999-9999-9999-9999-999999999991', 'D025', 'doctor25', 'Ashwin', 'Balachandran', 'dr.ashwin.b@rela.com', '9840009001', 'Cardiology', 'TN-LIC-025', 'Cardiology', 15),
('d9999999-9999-9999-9999-999999999992', 'D026', 'doctor26', 'Nithya', 'Parthasarathy', 'dr.nithya.p@rela.com', '9840009002', 'Neurology', 'TN-LIC-026', 'Neurology', 11),
('d9999999-9999-9999-9999-999999999993', 'D027', 'doctor27', 'Hariharan', 'Seshadri', 'dr.hari.s@rela.com', '9840009003', 'Oncology', 'TN-LIC-027', 'Oncology', 19),

-- MIOT International, Chennai (Hospital 10)
('daaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'D028', 'doctor28', 'Gomathi', 'Ramachandran', 'dr.gomathi.r@miot.com', '9840010001', 'Orthopedics', 'TN-LIC-028', 'Orthopedics', 22),
('daaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab', 'D029', 'doctor29', 'Vijayakumar', 'Thirunavukarasu', 'dr.vijay.t@miot.com', '9840010002', 'Cardiology', 'TN-LIC-029', 'Cardiology', 16),
('daaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaac', 'D030', 'doctor30', 'Shanthi', 'Veeraraghavan', 'dr.shanthi.v@miot.com', '9840010003', 'Pediatrics', 'TN-LIC-030', 'Pediatrics', 13)
ON CONFLICT (doctor_id) DO NOTHING;

-- Insert Doctor-Hospital associations
INSERT INTO doctor_hospitals (doctor_id, hospital_id, is_primary, consultation_fee, available_days) VALUES
-- Apollo Hospitals doctors
('d1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', true, 1500.00, ARRAY['Monday', 'Tuesday', 'Wednesday', 'Friday']),
('d1111111-1111-1111-1111-111111111112', '11111111-1111-1111-1111-111111111111', true, 1500.00, ARRAY['Monday', 'Wednesday', 'Thursday', 'Saturday']),
('d1111111-1111-1111-1111-111111111113', '11111111-1111-1111-1111-111111111111', true, 2000.00, ARRAY['Tuesday', 'Thursday', 'Friday', 'Saturday']),

-- Fortis Malar doctors
('d2222222-2222-2222-2222-222222222221', '22222222-2222-2222-2222-222222222222', true, 1200.00, ARRAY['Monday', 'Tuesday', 'Thursday', 'Friday']),
('d2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', true, 1400.00, ARRAY['Monday', 'Wednesday', 'Friday', 'Saturday']),
('d2222222-2222-2222-2222-222222222223', '22222222-2222-2222-2222-222222222222', true, 1000.00, ARRAY['Tuesday', 'Wednesday', 'Thursday', 'Saturday']),

-- KMCH doctors
('d3333333-3333-3333-3333-333333333331', '33333333-3333-3333-3333-333333333333', true, 1300.00, ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday']),
('d3333333-3333-3333-3333-333333333332', '33333333-3333-3333-3333-333333333333', true, 1300.00, ARRAY['Monday', 'Wednesday', 'Friday', 'Saturday']),
('d3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', true, 1100.00, ARRAY['Tuesday', 'Thursday', 'Friday', 'Saturday']),

-- PSG doctors
('d4444444-4444-4444-4444-444444444441', '44444444-4444-4444-4444-444444444444', true, 1000.00, ARRAY['Monday', 'Tuesday', 'Thursday', 'Friday']),
('d4444444-4444-4444-4444-444444444442', '44444444-4444-4444-4444-444444444444', true, 900.00, ARRAY['Monday', 'Wednesday', 'Friday', 'Saturday']),
('d4444444-4444-4444-4444-444444444443', '44444444-4444-4444-4444-444444444444', true, 1200.00, ARRAY['Tuesday', 'Wednesday', 'Thursday', 'Saturday']),

-- Kauvery doctors
('d5555555-5555-5555-5555-555555555551', '55555555-5555-5555-5555-555555555555', true, 1400.00, ARRAY['Monday', 'Tuesday', 'Wednesday', 'Friday']),
('d5555555-5555-5555-5555-555555555552', '55555555-5555-5555-5555-555555555555', true, 1600.00, ARRAY['Monday', 'Wednesday', 'Thursday', 'Saturday']),
('d5555555-5555-5555-5555-555555555553', '55555555-5555-5555-5555-555555555555', true, 1200.00, ARRAY['Tuesday', 'Thursday', 'Friday', 'Saturday']),

-- Velammal doctors
('d6666666-6666-6666-6666-666666666661', '66666666-6666-6666-6666-666666666666', true, 800.00, ARRAY['Monday', 'Tuesday', 'Thursday', 'Friday']),
('d6666666-6666-6666-6666-666666666662', '66666666-6666-6666-6666-666666666666', true, 700.00, ARRAY['Monday', 'Wednesday', 'Friday', 'Saturday']),
('d6666666-6666-6666-6666-666666666663', '66666666-6666-6666-6666-666666666666', true, 900.00, ARRAY['Tuesday', 'Wednesday', 'Thursday', 'Saturday']),

-- Vijaya doctors
('d7777777-7777-7777-7777-777777777771', '77777777-7777-7777-7777-777777777777', true, 1200.00, ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday']),
('d7777777-7777-7777-7777-777777777772', '77777777-7777-7777-7777-777777777777', true, 1100.00, ARRAY['Monday', 'Wednesday', 'Friday', 'Saturday']),
('d7777777-7777-7777-7777-777777777773', '77777777-7777-7777-7777-777777777777', true, 1000.00, ARRAY['Tuesday', 'Thursday', 'Friday', 'Saturday']),

-- GEM doctors
('d8888888-8888-8888-8888-888888888881', '88888888-8888-8888-8888-888888888888', true, 900.00, ARRAY['Monday', 'Tuesday', 'Thursday', 'Friday']),
('d8888888-8888-8888-8888-888888888882', '88888888-8888-8888-8888-888888888888', true, 1300.00, ARRAY['Monday', 'Wednesday', 'Friday', 'Saturday']),
('d8888888-8888-8888-8888-888888888883', '88888888-8888-8888-8888-888888888888', true, 1500.00, ARRAY['Tuesday', 'Wednesday', 'Thursday', 'Saturday']),

-- Rela doctors
('d9999999-9999-9999-9999-999999999991', '99999999-9999-9999-9999-999999999999', true, 1400.00, ARRAY['Monday', 'Tuesday', 'Wednesday', 'Friday']),
('d9999999-9999-9999-9999-999999999992', '99999999-9999-9999-9999-999999999999', true, 1300.00, ARRAY['Monday', 'Wednesday', 'Thursday', 'Saturday']),
('d9999999-9999-9999-9999-999999999993', '99999999-9999-9999-9999-999999999999', true, 1600.00, ARRAY['Tuesday', 'Thursday', 'Friday', 'Saturday']),

-- MIOT doctors
('daaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', true, 1800.00, ARRAY['Monday', 'Tuesday', 'Thursday', 'Friday']),
('daaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', true, 1600.00, ARRAY['Monday', 'Wednesday', 'Friday', 'Saturday']),
('daaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaac', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', true, 1200.00, ARRAY['Tuesday', 'Wednesday', 'Thursday', 'Saturday'])
ON CONFLICT (doctor_id, hospital_id) DO NOTHING;

-- Insert Sample Nurses with Indian Names
INSERT INTO nurses (nurse_id, password, first_name, last_name, email, phone, license_number, department, shift) VALUES
('N001', 'nurse1', 'Malathi', 'Venkatesh', 'malathi.v@hospital.com', '9876540301', 'TN-NR-001', 'Emergency', 'Day'),
('N002', 'nurse2', 'Sudha', 'Ramasamy', 'sudha.r@hospital.com', '9876540302', 'TN-NR-002', 'ICU', 'Night'),
('N003', 'nurse3', 'Kanchana', 'Murugesan', 'kanchana.m@hospital.com', '9876540303', 'TN-NR-003', 'Pediatrics', 'Day')
ON CONFLICT (nurse_id) DO NOTHING;

-- Insert Sample Staff with Indian Names
INSERT INTO staff (staff_id, password, first_name, last_name, email, phone, role, department) VALUES
('S001', 'staff1', 'Kumaran', 'Swaminathan', 'kumaran.s@hospital.com', '9876540401', 'Receptionist', 'Front Desk'),
('S002', 'staff2', 'Jayalakshmi', 'Balasubramanian', 'jayalakshmi.b@hospital.com', '9876540402', 'Medical Records Clerk', 'Records'),
('S003', 'staff3', 'Ravi', 'Pandian', 'ravi.p@hospital.com', '9876540403', 'Billing Specialist', 'Finance')
ON CONFLICT (staff_id) DO NOTHING;

