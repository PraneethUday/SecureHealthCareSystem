-- ============================================================================
-- SEED: doctors, nurses, lab-technician/support staff across all 10 hospitals
-- ============================================================================
-- The restored database only carries D001-D003 / N001-N003 / S001-S003, all
-- unassigned to any hospital (doctor_hospitals/nurse_hospitals/staff_hospitals
-- were empty new tables added by post-restore-sync.sql). This script:
--   1. Assigns the 3 existing doctors/nurses/staff to Apollo Hospitals
--   2. Adds 3 doctors + 3 nurses + a Lab Technician per remaining hospital
--      (9 hospitals x 3 = 27 new doctors/nurses; +1 lab tech each = 9 staff,
--      plus one more support role per hospital = 18 new staff total)
--   3. Wires every doctor/nurse/staff to their hospital via the junction
--      tables, matched by business key (doctor_id/hospital name), not by
--      hardcoded UUIDs -- safe regardless of what the restore actually
--      generated for `id`.
-- All inserts are ON CONFLICT DO NOTHING -- safe to re-run.
-- ============================================================================

-- Existing sample doctors/nurses/staff -> Apollo Hospitals
INSERT INTO doctor_hospitals (doctor_id, hospital_id, is_primary, consultation_fee, available_days)
SELECT d.id, h.id, true, 1500.00, ARRAY['Monday','Wednesday','Friday']
FROM doctors d, hospitals h
WHERE d.doctor_id IN ('D001','D002','D003') AND h.name = 'Apollo Hospitals'
ON CONFLICT (doctor_id, hospital_id) DO NOTHING;

INSERT INTO nurse_hospitals (nurse_id, hospital_id, is_primary)
SELECT n.id, h.id, true
FROM nurses n, hospitals h
WHERE n.nurse_id IN ('N001','N002','N003') AND h.name = 'Apollo Hospitals'
ON CONFLICT (nurse_id, hospital_id) DO NOTHING;

INSERT INTO staff_hospitals (staff_id, hospital_id, is_primary)
SELECT s.id, h.id, true
FROM staff s, hospitals h
WHERE s.staff_id IN ('S001','S002','S003') AND h.name = 'Apollo Hospitals'
ON CONFLICT (staff_id, hospital_id) DO NOTHING;

-- Apollo Hospitals had no Lab Technician among its existing staff -- add one
INSERT INTO staff (staff_id, password, first_name, last_name, email, phone, role, department) VALUES
('S004', 'staff4', 'Gopal', 'Narasimhan', 'gopal.n@apollo.com', '9876540501', 'Lab Technician', 'Laboratory')
ON CONFLICT (staff_id) DO NOTHING;

INSERT INTO staff_hospitals (staff_id, hospital_id, is_primary)
SELECT s.id, h.id, true FROM staff s, hospitals h
WHERE s.staff_id = 'S004' AND h.name = 'Apollo Hospitals'
ON CONFLICT (staff_id, hospital_id) DO NOTHING;

-- ===== Fortis Malar Hospital (hospital 2) =====
INSERT INTO doctors (doctor_id, password, first_name, last_name, email, phone, specialization, license_number, department, years_of_experience) VALUES
('D004', 'doctor4', 'Karthik', 'Subramaniam', 'dr.karthik.s@fortis.com', '9840000005', 'Cardiology', 'TN-LIC-005', 'Cardiology', 13),
('D005', 'doctor5', 'Divya', 'Ramaswamy', 'dr.divya.r@fortis.com', '9840000006', 'Neurology', 'TN-LIC-006', 'Neurology', 14),
('D006', 'doctor6', 'Senthil', 'Kumar', 'dr.senthil.k@fortis.com', '9840000007', 'Orthopedics', 'TN-LIC-007', 'Orthopedics', 15)
ON CONFLICT (doctor_id) DO NOTHING;

INSERT INTO doctor_hospitals (doctor_id, hospital_id, is_primary, consultation_fee, available_days)
SELECT d.id, h.id, true, 1200.00, ARRAY['Monday','Wednesday','Friday']
FROM doctors d, hospitals h
WHERE d.doctor_id IN ('D004', 'D005', 'D006') AND h.name = 'Fortis Malar Hospital'
ON CONFLICT (doctor_id, hospital_id) DO NOTHING;

INSERT INTO nurses (nurse_id, password, first_name, last_name, email, phone, license_number, department, shift) VALUES
('N004', 'nurse4', 'Revathi', 'Chandran', 'revathi.c@fortis.com', '9876500005', 'TN-NR-005', 'Emergency', 'Day'),
('N005', 'nurse5', 'Suresh', 'Kannan', 'suresh.k@fortis.com', '9876500006', 'TN-NR-006', 'ICU', 'Night'),
('N006', 'nurse6', 'Padma', 'Ravichandran', 'padma.r@fortis.com', '9876500007', 'TN-NR-007', 'Pediatrics', 'Day')
ON CONFLICT (nurse_id) DO NOTHING;

INSERT INTO nurse_hospitals (nurse_id, hospital_id, is_primary)
SELECT n.id, h.id, true
FROM nurses n, hospitals h
WHERE n.nurse_id IN ('N004', 'N005', 'N006') AND h.name = 'Fortis Malar Hospital'
ON CONFLICT (nurse_id, hospital_id) DO NOTHING;

INSERT INTO staff (staff_id, password, first_name, last_name, email, phone, role, department) VALUES
('S005', 'staff5', 'Gopal', 'Narasimhan', 'gopal.n@fortis.com', '9876540006', 'Lab Technician', 'Laboratory'),
('S006', 'staff6', 'Vanaja', 'Ilangovan', 'vanaja.i@fortis.com', '9876540007', 'Receptionist', 'Front Desk')
ON CONFLICT (staff_id) DO NOTHING;

INSERT INTO staff_hospitals (staff_id, hospital_id, is_primary)
SELECT s.id, h.id, true
FROM staff s, hospitals h
WHERE s.staff_id IN ('S005', 'S006') AND h.name = 'Fortis Malar Hospital'
ON CONFLICT (staff_id, hospital_id) DO NOTHING;

-- ===== KMCH Hospital (hospital 3) =====
INSERT INTO doctors (doctor_id, password, first_name, last_name, email, phone, specialization, license_number, department, years_of_experience) VALUES
('D007', 'doctor7', 'Anitha', 'Krishnan', 'dr.anitha.k@kmch.com', '9840000008', 'Pediatrics', 'TN-LIC-008', 'Pediatrics', 16),
('D008', 'doctor8', 'Vignesh', 'Rajendran', 'dr.vignesh.r@kmch.com', '9840000009', 'General Medicine', 'TN-LIC-009', 'General Medicine', 17),
('D009', 'doctor9', 'Priyanka', 'Iyer', 'dr.priyanka.i@kmch.com', '9840000010', 'Oncology', 'TN-LIC-010', 'Oncology', 18)
ON CONFLICT (doctor_id) DO NOTHING;

INSERT INTO doctor_hospitals (doctor_id, hospital_id, is_primary, consultation_fee, available_days)
SELECT d.id, h.id, true, 1200.00, ARRAY['Monday','Wednesday','Friday']
FROM doctors d, hospitals h
WHERE d.doctor_id IN ('D007', 'D008', 'D009') AND h.name = 'KMCH Hospital'
ON CONFLICT (doctor_id, hospital_id) DO NOTHING;

INSERT INTO nurses (nurse_id, password, first_name, last_name, email, phone, license_number, department, shift) VALUES
('N007', 'nurse7', 'Anand', 'Murugesan', 'anand.m@kmch.com', '9876500008', 'TN-NR-008', 'Cardiology', 'Day'),
('N008', 'nurse8', 'Shanthi', 'Balakrishnan', 'shanthi.b@kmch.com', '9876500009', 'TN-NR-009', 'General', 'Night'),
('N009', 'nurse9', 'Vasanth', 'Rajagopal', 'vasanth.r@kmch.com', '9876500010', 'TN-NR-010', 'Orthopedics', 'Day')
ON CONFLICT (nurse_id) DO NOTHING;

INSERT INTO nurse_hospitals (nurse_id, hospital_id, is_primary)
SELECT n.id, h.id, true
FROM nurses n, hospitals h
WHERE n.nurse_id IN ('N007', 'N008', 'N009') AND h.name = 'KMCH Hospital'
ON CONFLICT (nurse_id, hospital_id) DO NOTHING;

INSERT INTO staff (staff_id, password, first_name, last_name, email, phone, role, department) VALUES
('S007', 'staff7', 'Rajkumar', 'Sethupathi', 'rajkumar.s@kmch.com', '9876540008', 'Lab Technician', 'Laboratory'),
('S008', 'staff8', 'Kamala', 'Duraisamy', 'kamala.d@kmch.com', '9876540009', 'Billing Specialist', 'Finance')
ON CONFLICT (staff_id) DO NOTHING;

INSERT INTO staff_hospitals (staff_id, hospital_id, is_primary)
SELECT s.id, h.id, true
FROM staff s, hospitals h
WHERE s.staff_id IN ('S007', 'S008') AND h.name = 'KMCH Hospital'
ON CONFLICT (staff_id, hospital_id) DO NOTHING;

-- ===== PSG Hospitals (hospital 4) =====
INSERT INTO doctors (doctor_id, password, first_name, last_name, email, phone, specialization, license_number, department, years_of_experience) VALUES
('D010', 'doctor10', 'Mohan', 'Balasubramanian', 'dr.mohan.b@psg.com', '9840000011', 'Surgery', 'TN-LIC-011', 'Surgery', 19),
('D011', 'doctor11', 'Kavya', 'Natarajan', 'dr.kavya.n@psg.com', '9840000012', 'Emergency', 'TN-LIC-012', 'Emergency', 20),
('D012', 'doctor12', 'Arjun', 'Chandrasekhar', 'dr.arjun.c@psg.com', '9840000013', 'Gastroenterology', 'TN-LIC-013', 'Gastroenterology', 21)
ON CONFLICT (doctor_id) DO NOTHING;

INSERT INTO doctor_hospitals (doctor_id, hospital_id, is_primary, consultation_fee, available_days)
SELECT d.id, h.id, true, 1200.00, ARRAY['Monday','Wednesday','Friday']
FROM doctors d, hospitals h
WHERE d.doctor_id IN ('D010', 'D011', 'D012') AND h.name = 'PSG Hospitals'
ON CONFLICT (doctor_id, hospital_id) DO NOTHING;

INSERT INTO nurses (nurse_id, password, first_name, last_name, email, phone, license_number, department, shift) VALUES
('N010', 'nurse10', 'Geetha', 'Subramanian', 'geetha.s@psg.com', '9876500011', 'TN-NR-011', 'Neurology', 'Day'),
('N011', 'nurse11', 'Mani', 'Krishnamurthy', 'mani.k@psg.com', '9876500012', 'TN-NR-012', 'Emergency', 'Night'),
('N012', 'nurse12', 'Latha', 'Venkataraman', 'latha.v@psg.com', '9876500013', 'TN-NR-013', 'ICU', 'Day')
ON CONFLICT (nurse_id) DO NOTHING;

INSERT INTO nurse_hospitals (nurse_id, hospital_id, is_primary)
SELECT n.id, h.id, true
FROM nurses n, hospitals h
WHERE n.nurse_id IN ('N010', 'N011', 'N012') AND h.name = 'PSG Hospitals'
ON CONFLICT (nurse_id, hospital_id) DO NOTHING;

INSERT INTO staff (staff_id, password, first_name, last_name, email, phone, role, department) VALUES
('S009', 'staff9', 'Selvaraj', 'Manoharan', 'selvaraj.m@psg.com', '9876540010', 'Lab Technician', 'Laboratory'),
('S010', 'staff10', 'Bhuvana', 'Krishnasamy', 'bhuvana.k@psg.com', '9876540011', 'Medical Records Clerk', 'Records')
ON CONFLICT (staff_id) DO NOTHING;

INSERT INTO staff_hospitals (staff_id, hospital_id, is_primary)
SELECT s.id, h.id, true
FROM staff s, hospitals h
WHERE s.staff_id IN ('S009', 'S010') AND h.name = 'PSG Hospitals'
ON CONFLICT (staff_id, hospital_id) DO NOTHING;

-- ===== Kauvery Hospital (hospital 5) =====
INSERT INTO doctors (doctor_id, password, first_name, last_name, email, phone, specialization, license_number, department, years_of_experience) VALUES
('D013', 'doctor13', 'Sowmya', 'Venkataraman', 'dr.sowmya.v@kauvery.com', '9840000014', 'Dermatology', 'TN-LIC-014', 'Dermatology', 22),
('D014', 'doctor14', 'Ramesh', 'Gopalakrishnan', 'dr.ramesh.g@kauvery.com', '9840000015', 'Cardiology', 'TN-LIC-015', 'Cardiology', 8),
('D015', 'doctor15', 'Deepika', 'Muralidharan', 'dr.deepika.m@kauvery.com', '9840000016', 'Neurology', 'TN-LIC-016', 'Neurology', 9)
ON CONFLICT (doctor_id) DO NOTHING;

INSERT INTO doctor_hospitals (doctor_id, hospital_id, is_primary, consultation_fee, available_days)
SELECT d.id, h.id, true, 1200.00, ARRAY['Monday','Wednesday','Friday']
FROM doctors d, hospitals h
WHERE d.doctor_id IN ('D013', 'D014', 'D015') AND h.name = 'Kauvery Hospital'
ON CONFLICT (doctor_id, hospital_id) DO NOTHING;

INSERT INTO nurses (nurse_id, password, first_name, last_name, email, phone, license_number, department, shift) VALUES
('N013', 'nurse13', 'Ravi', 'Natesan', 'ravi.n@kauvery.com', '9876500014', 'TN-NR-014', 'Pediatrics', 'Day'),
('N014', 'nurse14', 'Sarala', 'Ramaiah', 'sarala.r@kauvery.com', '9876500015', 'TN-NR-015', 'Cardiology', 'Night'),
('N015', 'nurse15', 'Kumar', 'Elangovan', 'kumar.e@kauvery.com', '9876500016', 'TN-NR-016', 'General', 'Day')
ON CONFLICT (nurse_id) DO NOTHING;

INSERT INTO nurse_hospitals (nurse_id, hospital_id, is_primary)
SELECT n.id, h.id, true
FROM nurses n, hospitals h
WHERE n.nurse_id IN ('N013', 'N014', 'N015') AND h.name = 'Kauvery Hospital'
ON CONFLICT (nurse_id, hospital_id) DO NOTHING;

INSERT INTO staff (staff_id, password, first_name, last_name, email, phone, role, department) VALUES
('S011', 'staff11', 'Elango', 'Vetrivel', 'elango.v@kauvery.com', '9876540012', 'Lab Technician', 'Laboratory'),
('S012', 'staff12', 'Yamuna', 'Sivasubramanian', 'yamuna.s@kauvery.com', '9876540013', 'Receptionist', 'Front Desk')
ON CONFLICT (staff_id) DO NOTHING;

INSERT INTO staff_hospitals (staff_id, hospital_id, is_primary)
SELECT s.id, h.id, true
FROM staff s, hospitals h
WHERE s.staff_id IN ('S011', 'S012') AND h.name = 'Kauvery Hospital'
ON CONFLICT (staff_id, hospital_id) DO NOTHING;

-- ===== Velammal Medical College Hospital (hospital 6) =====
INSERT INTO doctors (doctor_id, password, first_name, last_name, email, phone, specialization, license_number, department, years_of_experience) VALUES
('D016', 'doctor16', 'Suresh', 'Anandan', 'dr.suresh.a@velammal.com', '9840000017', 'Orthopedics', 'TN-LIC-017', 'Orthopedics', 10),
('D017', 'doctor17', 'Nithya', 'Parthasarathy', 'dr.nithya.p@velammal.com', '9840000018', 'Pediatrics', 'TN-LIC-018', 'Pediatrics', 11),
('D018', 'doctor18', 'Vijay', 'Shanmugam', 'dr.vijay.s@velammal.com', '9840000019', 'General Medicine', 'TN-LIC-019', 'General Medicine', 12)
ON CONFLICT (doctor_id) DO NOTHING;

INSERT INTO doctor_hospitals (doctor_id, hospital_id, is_primary, consultation_fee, available_days)
SELECT d.id, h.id, true, 1200.00, ARRAY['Monday','Wednesday','Friday']
FROM doctors d, hospitals h
WHERE d.doctor_id IN ('D016', 'D017', 'D018') AND h.name = 'Velammal Medical College Hospital'
ON CONFLICT (doctor_id, hospital_id) DO NOTHING;

INSERT INTO nurses (nurse_id, password, first_name, last_name, email, phone, license_number, department, shift) VALUES
('N016', 'nurse16', 'Vidya', 'Sampath', 'vidya.s@velammal.com', '9876500017', 'TN-NR-017', 'Orthopedics', 'Day'),
('N017', 'nurse17', 'Selvam', 'Muthu', 'selvam.m@velammal.com', '9876500018', 'TN-NR-018', 'Neurology', 'Night'),
('N018', 'nurse18', 'Rani', 'Govindan', 'rani.g@velammal.com', '9876500019', 'TN-NR-019', 'Emergency', 'Day')
ON CONFLICT (nurse_id) DO NOTHING;

INSERT INTO nurse_hospitals (nurse_id, hospital_id, is_primary)
SELECT n.id, h.id, true
FROM nurses n, hospitals h
WHERE n.nurse_id IN ('N016', 'N017', 'N018') AND h.name = 'Velammal Medical College Hospital'
ON CONFLICT (nurse_id, hospital_id) DO NOTHING;

INSERT INTO staff (staff_id, password, first_name, last_name, email, phone, role, department) VALUES
('S013', 'staff13', 'Chandran', 'Alagappan', 'chandran.a@velammal.com', '9876540014', 'Lab Technician', 'Laboratory'),
('S014', 'staff14', 'Poornima', 'Rajaraman', 'poornima.r@velammal.com', '9876540015', 'Billing Specialist', 'Finance')
ON CONFLICT (staff_id) DO NOTHING;

INSERT INTO staff_hospitals (staff_id, hospital_id, is_primary)
SELECT s.id, h.id, true
FROM staff s, hospitals h
WHERE s.staff_id IN ('S013', 'S014') AND h.name = 'Velammal Medical College Hospital'
ON CONFLICT (staff_id, hospital_id) DO NOTHING;

-- ===== Vijaya Hospital (hospital 7) =====
INSERT INTO doctors (doctor_id, password, first_name, last_name, email, phone, specialization, license_number, department, years_of_experience) VALUES
('D019', 'doctor19', 'Meena', 'Raghunathan', 'dr.meena.r@vijaya.com', '9840000020', 'Oncology', 'TN-LIC-020', 'Oncology', 13),
('D020', 'doctor20', 'Ashok', 'Palaniappan', 'dr.ashok.p@vijaya.com', '9840000021', 'Surgery', 'TN-LIC-021', 'Surgery', 14),
('D021', 'doctor21', 'Swathi', 'Sundaresan', 'dr.swathi.s@vijaya.com', '9840000022', 'Emergency', 'TN-LIC-022', 'Emergency', 15)
ON CONFLICT (doctor_id) DO NOTHING;

INSERT INTO doctor_hospitals (doctor_id, hospital_id, is_primary, consultation_fee, available_days)
SELECT d.id, h.id, true, 1200.00, ARRAY['Monday','Wednesday','Friday']
FROM doctors d, hospitals h
WHERE d.doctor_id IN ('D019', 'D020', 'D021') AND h.name = 'Vijaya Hospital'
ON CONFLICT (doctor_id, hospital_id) DO NOTHING;

INSERT INTO nurses (nurse_id, password, first_name, last_name, email, phone, license_number, department, shift) VALUES
('N019', 'nurse19', 'Bala', 'Sekaran', 'bala.s@vijaya.com', '9876500020', 'TN-NR-020', 'ICU', 'Day'),
('N020', 'nurse20', 'Malini', 'Prabhakaran', 'malini.p@vijaya.com', '9876500021', 'TN-NR-021', 'Pediatrics', 'Night'),
('N021', 'nurse21', 'Ezhil', 'Manickam', 'ezhil.m@vijaya.com', '9876500022', 'TN-NR-022', 'Cardiology', 'Day')
ON CONFLICT (nurse_id) DO NOTHING;

INSERT INTO nurse_hospitals (nurse_id, hospital_id, is_primary)
SELECT n.id, h.id, true
FROM nurses n, hospitals h
WHERE n.nurse_id IN ('N019', 'N020', 'N021') AND h.name = 'Vijaya Hospital'
ON CONFLICT (nurse_id, hospital_id) DO NOTHING;

INSERT INTO staff (staff_id, password, first_name, last_name, email, phone, role, department) VALUES
('S015', 'staff15', 'Sekar', 'Gunasekaran', 'sekar.g@vijaya.com', '9876540016', 'Lab Technician', 'Laboratory'),
('S016', 'staff16', 'Amudhini', 'Balaguru', 'amudhini.b@vijaya.com', '9876540017', 'Medical Records Clerk', 'Records')
ON CONFLICT (staff_id) DO NOTHING;

INSERT INTO staff_hospitals (staff_id, hospital_id, is_primary)
SELECT s.id, h.id, true
FROM staff s, hospitals h
WHERE s.staff_id IN ('S015', 'S016') AND h.name = 'Vijaya Hospital'
ON CONFLICT (staff_id, hospital_id) DO NOTHING;

-- ===== GEM Hospital (hospital 8) =====
INSERT INTO doctors (doctor_id, password, first_name, last_name, email, phone, specialization, license_number, department, years_of_experience) VALUES
('D022', 'doctor22', 'Ganesh', 'Thiagarajan', 'dr.ganesh.t@gem.com', '9840000023', 'Gastroenterology', 'TN-LIC-023', 'Gastroenterology', 16),
('D023', 'doctor23', 'Lavanya', 'Ramachandran', 'dr.lavanya.r@gem.com', '9840000024', 'Dermatology', 'TN-LIC-024', 'Dermatology', 17),
('D024', 'doctor24', 'Prakash', 'Elumalai', 'dr.prakash.e@gem.com', '9840000025', 'Cardiology', 'TN-LIC-025', 'Cardiology', 18)
ON CONFLICT (doctor_id) DO NOTHING;

INSERT INTO doctor_hospitals (doctor_id, hospital_id, is_primary, consultation_fee, available_days)
SELECT d.id, h.id, true, 1200.00, ARRAY['Monday','Wednesday','Friday']
FROM doctors d, hospitals h
WHERE d.doctor_id IN ('D022', 'D023', 'D024') AND h.name = 'GEM Hospital'
ON CONFLICT (doctor_id, hospital_id) DO NOTHING;

INSERT INTO nurses (nurse_id, password, first_name, last_name, email, phone, license_number, department, shift) VALUES
('N022', 'nurse22', 'Sangeetha', 'Rajan', 'sangeetha.r@gem.com', '9876500023', 'TN-NR-023', 'General', 'Day'),
('N023', 'nurse23', 'Murali', 'Karuppiah', 'murali.k@gem.com', '9876500024', 'TN-NR-024', 'Orthopedics', 'Night'),
('N024', 'nurse24', 'Indira', 'Loganathan', 'indira.l@gem.com', '9876500025', 'TN-NR-025', 'Neurology', 'Day')
ON CONFLICT (nurse_id) DO NOTHING;

INSERT INTO nurse_hospitals (nurse_id, hospital_id, is_primary)
SELECT n.id, h.id, true
FROM nurses n, hospitals h
WHERE n.nurse_id IN ('N022', 'N023', 'N024') AND h.name = 'GEM Hospital'
ON CONFLICT (nurse_id, hospital_id) DO NOTHING;

INSERT INTO staff (staff_id, password, first_name, last_name, email, phone, role, department) VALUES
('S017', 'staff17', 'Rajesh', 'Ponnusamy', 'rajesh.p@gem.com', '9876540018', 'Lab Technician', 'Laboratory'),
('S018', 'staff18', 'Vidhya', 'Chinnaiah', 'vidhya.c@gem.com', '9876540019', 'Receptionist', 'Front Desk')
ON CONFLICT (staff_id) DO NOTHING;

INSERT INTO staff_hospitals (staff_id, hospital_id, is_primary)
SELECT s.id, h.id, true
FROM staff s, hospitals h
WHERE s.staff_id IN ('S017', 'S018') AND h.name = 'GEM Hospital'
ON CONFLICT (staff_id, hospital_id) DO NOTHING;

-- ===== Rela Hospital (hospital 9) =====
INSERT INTO doctors (doctor_id, password, first_name, last_name, email, phone, specialization, license_number, department, years_of_experience) VALUES
('D025', 'doctor25', 'Radha', 'Kandasamy', 'dr.radha.k@rela.com', '9840000026', 'Neurology', 'TN-LIC-026', 'Neurology', 19),
('D026', 'doctor26', 'Kiran', 'Mahalingam', 'dr.kiran.m@rela.com', '9840000027', 'Orthopedics', 'TN-LIC-027', 'Orthopedics', 20),
('D027', 'doctor27', 'Bhavani', 'Sivakumar', 'dr.bhavani.s@rela.com', '9840000028', 'Pediatrics', 'TN-LIC-028', 'Pediatrics', 21)
ON CONFLICT (doctor_id) DO NOTHING;

INSERT INTO doctor_hospitals (doctor_id, hospital_id, is_primary, consultation_fee, available_days)
SELECT d.id, h.id, true, 1200.00, ARRAY['Monday','Wednesday','Friday']
FROM doctors d, hospitals h
WHERE d.doctor_id IN ('D025', 'D026', 'D027') AND h.name = 'Rela Hospital'
ON CONFLICT (doctor_id, hospital_id) DO NOTHING;

INSERT INTO nurses (nurse_id, password, first_name, last_name, email, phone, license_number, department, shift) VALUES
('N025', 'nurse25', 'Saravanan', 'Pillai', 'saravanan.p@rela.com', '9876500026', 'TN-NR-026', 'Emergency', 'Day'),
('N026', 'nurse26', 'Pushpa', 'Ayyappan', 'pushpa.a@rela.com', '9876500027', 'TN-NR-027', 'ICU', 'Night'),
('N027', 'nurse27', 'Karuna', 'Veerasamy', 'karuna.v@rela.com', '9876500028', 'TN-NR-028', 'Pediatrics', 'Day')
ON CONFLICT (nurse_id) DO NOTHING;

INSERT INTO nurse_hospitals (nurse_id, hospital_id, is_primary)
SELECT n.id, h.id, true
FROM nurses n, hospitals h
WHERE n.nurse_id IN ('N025', 'N026', 'N027') AND h.name = 'Rela Hospital'
ON CONFLICT (nurse_id, hospital_id) DO NOTHING;

INSERT INTO staff (staff_id, password, first_name, last_name, email, phone, role, department) VALUES
('S019', 'staff19', 'Karthikeyan', 'Marimuthu', 'karthikeyan.m@rela.com', '9876540020', 'Lab Technician', 'Laboratory'),
('S020', 'staff20', 'Malar', 'Selvakumar', 'malar.s@rela.com', '9876540021', 'Billing Specialist', 'Finance')
ON CONFLICT (staff_id) DO NOTHING;

INSERT INTO staff_hospitals (staff_id, hospital_id, is_primary)
SELECT s.id, h.id, true
FROM staff s, hospitals h
WHERE s.staff_id IN ('S019', 'S020') AND h.name = 'Rela Hospital'
ON CONFLICT (staff_id, hospital_id) DO NOTHING;

-- ===== MIOT International (hospital 10) =====
INSERT INTO doctors (doctor_id, password, first_name, last_name, email, phone, specialization, license_number, department, years_of_experience) VALUES
('D028', 'doctor28', 'Naveen', 'Rangarajan', 'dr.naveen.r@miot.com', '9840000029', 'General Medicine', 'TN-LIC-029', 'General Medicine', 22),
('D029', 'doctor29', 'Uma', 'Venkatesan', 'dr.uma.v@miot.com', '9840000030', 'Oncology', 'TN-LIC-030', 'Oncology', 8),
('D030', 'doctor30', 'Dinesh', 'Chellappan', 'dr.dinesh.c@miot.com', '9840000031', 'Surgery', 'TN-LIC-031', 'Surgery', 9)
ON CONFLICT (doctor_id) DO NOTHING;

INSERT INTO doctor_hospitals (doctor_id, hospital_id, is_primary, consultation_fee, available_days)
SELECT d.id, h.id, true, 1200.00, ARRAY['Monday','Wednesday','Friday']
FROM doctors d, hospitals h
WHERE d.doctor_id IN ('D028', 'D029', 'D030') AND h.name = 'MIOT International'
ON CONFLICT (doctor_id, hospital_id) DO NOTHING;

INSERT INTO nurses (nurse_id, password, first_name, last_name, email, phone, license_number, department, shift) VALUES
('N028', 'nurse28', 'Manoj', 'Dhanapal', 'manoj.d@miot.com', '9876500029', 'TN-NR-029', 'Cardiology', 'Day'),
('N029', 'nurse29', 'Rekha', 'Chidambaram', 'rekha.c@miot.com', '9876500030', 'TN-NR-030', 'General', 'Night'),
('N030', 'nurse30', 'Sathish', 'Perumal', 'sathish.p@miot.com', '9876500031', 'TN-NR-031', 'Orthopedics', 'Day')
ON CONFLICT (nurse_id) DO NOTHING;

INSERT INTO nurse_hospitals (nurse_id, hospital_id, is_primary)
SELECT n.id, h.id, true
FROM nurses n, hospitals h
WHERE n.nurse_id IN ('N028', 'N029', 'N030') AND h.name = 'MIOT International'
ON CONFLICT (nurse_id, hospital_id) DO NOTHING;

INSERT INTO staff (staff_id, password, first_name, last_name, email, phone, role, department) VALUES
('S021', 'staff21', 'Anbu', 'Rathinam', 'anbu.r@miot.com', '9876540022', 'Lab Technician', 'Laboratory'),
('S022', 'staff22', 'Shobana', 'Vellaisamy', 'shobana.v@miot.com', '9876540023', 'Medical Records Clerk', 'Records')
ON CONFLICT (staff_id) DO NOTHING;

INSERT INTO staff_hospitals (staff_id, hospital_id, is_primary)
SELECT s.id, h.id, true
FROM staff s, hospitals h
WHERE s.staff_id IN ('S021', 'S022') AND h.name = 'MIOT International'
ON CONFLICT (staff_id, hospital_id) DO NOTHING;
