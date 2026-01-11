-- Update passwords to simple ones (no hashing)

-- Update Admin password
UPDATE admins 
SET password = 'admin123' 
WHERE id = 'admin';

-- Update Patient passwords
UPDATE patients SET password = 'patient1' WHERE patient_id = 'P001';
UPDATE patients SET password = 'patient2' WHERE patient_id = 'P002';
UPDATE patients SET password = 'patient3' WHERE patient_id = 'P003';

-- Update Doctor passwords
UPDATE doctors SET password = 'doctor1' WHERE doctor_id = 'D001';
UPDATE doctors SET password = 'doctor2' WHERE doctor_id = 'D002';
UPDATE doctors SET password = 'doctor3' WHERE doctor_id = 'D003';

-- Update Nurse passwords
UPDATE nurses SET password = 'nurse1' WHERE nurse_id = 'N001';
UPDATE nurses SET password = 'nurse2' WHERE nurse_id = 'N002';
UPDATE nurses SET password = 'nurse3' WHERE nurse_id = 'N003';

-- Update Staff passwords
UPDATE staff SET password = 'staff1' WHERE staff_id = 'S001';
UPDATE staff SET password = 'staff2' WHERE staff_id = 'S002';
UPDATE staff SET password = 'staff3' WHERE staff_id = 'S003';
