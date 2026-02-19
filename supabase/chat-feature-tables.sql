-- ========================================================================================================
-- CHAT FEATURE - DATABASE MIGRATION
-- Run this in Supabase SQL Editor to add chat functionality
-- This ONLY creates new tables - does NOT modify any existing tables or data
-- ========================================================================================================
-- Version: 1.0
-- Last Updated: 2026-02-19
-- ========================================================================================================

-- Enable required extensions (safe to run if already enabled)
CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- ######################################################################################################
-- SECTION 1: CHAT TABLES
-- ######################################################################################################

-- Chat Conversations table
-- Links a chat session to an appointment between a patient and doctor
CREATE TABLE IF NOT EXISTS chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  CONSTRAINT unique_appointment_conversation UNIQUE (appointment_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_conversations_appointment ON chat_conversations(appointment_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_patient ON chat_conversations(patient_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_doctor ON chat_conversations(doctor_id);


-- Chat Messages table
-- Stores individual messages within a conversation
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('patient', 'doctor')),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_unread ON chat_messages(conversation_id, is_read) WHERE is_read = FALSE;


-- Chat Attachments table
-- Stores file attachments linked to messages (max 10MB per file)
CREATE TABLE IF NOT EXISTS chat_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  CONSTRAINT valid_attachment_size CHECK (file_size > 0 AND file_size <= 10485760)
);

CREATE INDEX IF NOT EXISTS idx_chat_attachments_message ON chat_attachments(message_id);


-- ######################################################################################################
-- SECTION 2: ROW LEVEL SECURITY (RLS)
-- ######################################################################################################

ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_attachments ENABLE ROW LEVEL SECURITY;

-- Permissive policies (app handles authorization via service role key)
DROP POLICY IF EXISTS "Allow all chat conversation operations" ON chat_conversations;
CREATE POLICY "Allow all chat conversation operations" ON chat_conversations FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all chat message operations" ON chat_messages;
CREATE POLICY "Allow all chat message operations" ON chat_messages FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all chat attachment operations" ON chat_attachments;
CREATE POLICY "Allow all chat attachment operations" ON chat_attachments FOR ALL USING (true) WITH CHECK (true);


-- ######################################################################################################
-- SECTION 3: HELPER FUNCTIONS & TRIGGERS
-- ######################################################################################################

-- Function: Update conversation timestamp on any update
CREATE OR REPLACE FUNCTION update_chat_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_chat_conversations_timestamp ON chat_conversations;
CREATE TRIGGER update_chat_conversations_timestamp
  BEFORE UPDATE ON chat_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_conversation_timestamp();


-- Function: Update conversation's updated_at when a new message is sent
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chat_conversations SET updated_at = NOW() WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_conversation_on_new_message ON chat_messages;
CREATE TRIGGER update_conversation_on_new_message
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_on_message();


-- Function: Get unread message count for a user in a conversation
CREATE OR REPLACE FUNCTION get_unread_message_count(conv_id UUID, user_id TEXT)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM chat_messages
    WHERE conversation_id = conv_id
      AND sender_id != user_id
      AND is_read = FALSE
  );
END;
$$ LANGUAGE plpgsql;


-- ######################################################################################################
-- SECTION 4: ENABLE REALTIME (for instant message delivery)
-- ######################################################################################################

DO $$
BEGIN
  EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages';
EXCEPTION WHEN OTHERS THEN
  -- Table may already be in the publication, ignore error
  NULL;
END $$;

DO $$
BEGIN
  EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE chat_conversations';
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;


-- ========================================================================================================
-- DONE! Chat feature tables are ready.
-- 
-- Tables created:
--   1. chat_conversations  - Links chat to appointment/patient/doctor
--   2. chat_messages       - Stores encrypted messages with read status
--   3. chat_attachments    - Stores file attachment metadata
--
-- No existing tables were modified.
-- ========================================================================================================
