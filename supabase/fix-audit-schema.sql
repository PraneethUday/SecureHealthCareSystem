-- Add missing columns to access_logs for the centralized audit logger
ALTER TABLE access_logs 
ADD COLUMN IF NOT EXISTS details TEXT,
ADD COLUMN IF NOT EXISTS status TEXT,
ADD COLUMN IF NOT EXISTS blockchain_verified BOOLEAN DEFAULT FALSE;
