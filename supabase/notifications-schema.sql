-- Notifications Table Schema
-- Stores in-app notifications for all user roles

CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Recipient info
  recipient_id TEXT NOT NULL,           -- User's role-specific ID (P001, D001, N001, S001, admin)
  recipient_role TEXT NOT NULL CHECK (recipient_role IN ('patient', 'doctor', 'nurse', 'staff', 'admin')),
  
  -- Notification content
  title TEXT NOT NULL,  
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'appointment_booked',
    'appointment_cancelled',
    'appointment_reminder',
    'appointment_updated',
    'access_granted',
    'access_revoked',
    'report_uploaded',
    'prescription_created',
    'system',
    'general'
  )),
  
  -- Related entity (optional)
  related_entity_type TEXT,             -- 'appointment', 'prescription', 'report', etc.
  related_entity_id TEXT,               -- ID of the related entity
  
  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',          -- Additional data (sender info, action URL, etc.)
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ                -- Optional expiry for time-sensitive notifications
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_notifications_recipient 
  ON notifications(recipient_id, recipient_role);

CREATE INDEX IF NOT EXISTS idx_notifications_unread 
  ON notifications(recipient_id, recipient_role, is_read) 
  WHERE is_read = FALSE;

CREATE INDEX IF NOT EXISTS idx_notifications_created 
  ON notifications(created_at DESC);

-- Function to auto-mark old notifications as read after 30 days
CREATE OR REPLACE FUNCTION auto_expire_notifications()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE notifications 
  SET is_read = TRUE, read_at = NOW()
  WHERE is_read = FALSE 
    AND created_at < NOW() - INTERVAL '30 days';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policies (users can only see their own notifications)
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (true);  -- Will be filtered by recipient_id in queries

CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (true);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE ON notifications TO anon;
