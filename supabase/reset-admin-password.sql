-- Reset Admin Password to "admin123"
-- Run this in Supabase SQL Editor to update the admin password

UPDATE admins 
SET password_hash = '$2b$12$kWTFDWY/hL4KFLVF0HvAkulZQw.cKU9JQBkEC3zEDxrmdWUcs3pkq'
WHERE id = 'admin';

-- Verify the update
SELECT id, full_name, email, is_mfa_enabled FROM admins WHERE id = 'admin';
