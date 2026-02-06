-- Migration to make password column nullable
-- This allows supporting the transition to password_hash without breaking inserts that don't provide a plaintext password

ALTER TABLE patients ALTER COLUMN password DROP NOT NULL;
ALTER TABLE doctors ALTER COLUMN password DROP NOT NULL;
ALTER TABLE nurses ALTER COLUMN password DROP NOT NULL;
ALTER TABLE staff ALTER COLUMN password DROP NOT NULL;
ALTER TABLE admins ALTER COLUMN password DROP NOT NULL;
