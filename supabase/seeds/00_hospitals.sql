-- Hospitals (from appointments-schema.sql)
INSERT INTO hospitals (id, name, address, city, state, phone, departments) VALUES
('11111111-1111-1111-1111-111111111111', 'Apollo Hospitals', '21 Greams Lane', 'Chennai', 'Tamil Nadu', '044-2829-3333', ARRAY['Cardiology', 'Neurology', 'Oncology', 'Emergency']),
('22222222-2222-2222-2222-222222222222', 'Fortis Malar Hospital', '52 Gandhi Nagar', 'Chennai', 'Tamil Nadu', '044-4289-2222', ARRAY['Orthopedics', 'Cardiology', 'Pediatrics', 'Surgery']),
('33333333-3333-3333-3333-333333333333', 'KMCH Hospital', 'Avanashi Road', 'Coimbatore', 'Tamil Nadu', '0422-4344-444', ARRAY['Cardiology', 'Neurology', 'Emergency', 'ICU']),
('44444444-4444-4444-4444-444444444444', 'PSG Hospitals', 'Peelamedu', 'Coimbatore', 'Tamil Nadu', '0422-2570-170', ARRAY['General Medicine', 'Pediatrics', 'Orthopedics', 'Surgery']),
('55555555-5555-5555-5555-555555555555', 'Kauvery Hospital', 'Trichy Road', 'Tiruchirappalli', 'Tamil Nadu', '0431-4077-777', ARRAY['Cardiology', 'Oncology', 'Neurology', 'Emergency']),
('66666666-6666-6666-6666-666666666666', 'Velammal Medical College Hospital', 'Anuppanadi', 'Madurai', 'Tamil Nadu', '0452-2989-878', ARRAY['General Medicine', 'Pediatrics', 'Surgery', 'ICU']),
('77777777-7777-7777-7777-777777777777', 'Vijaya Hospital', 'Vadapalani', 'Chennai', 'Tamil Nadu', '044-2361-2364', ARRAY['Cardiology', 'Orthopedics', 'Neurology', 'Emergency']),
('88888888-8888-8888-8888-888888888888', 'GEM Hospital', 'Ramanathapuram', 'Coimbatore', 'Tamil Nadu', '0422-2324-105', ARRAY['General Medicine', 'Surgery', 'Oncology', 'ICU']),
('99999999-9999-9999-9999-999999999999', 'Rela Hospital', 'Chromepet', 'Chennai', 'Tamil Nadu', '044-4510-2020', ARRAY['Cardiology', 'Neurology', 'Oncology', 'Surgery']),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'MIOT International', 'Manapakkam', 'Chennai', 'Tamil Nadu', '044-4200-2020', ARRAY['Orthopedics', 'Cardiology', 'Pediatrics', 'Emergency'])
ON CONFLICT (id) DO NOTHING;
