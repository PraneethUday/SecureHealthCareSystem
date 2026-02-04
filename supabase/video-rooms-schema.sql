-- ==========================================
-- VIDEO ROOMS SCHEMA
-- Room-based WebRTC video calling system
-- ==========================================

-- 1. Video Rooms - stores room info
CREATE TABLE IF NOT EXISTS video_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true
);

-- 2. Room Participants - tracks who is in each room
CREATE TABLE IF NOT EXISTS room_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES video_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_role TEXT NOT NULL, -- 'patient' or 'doctor'
  audio_enabled BOOLEAN DEFAULT true,
  video_enabled BOOLEAN DEFAULT true,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  left_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(room_id, user_id)
);

-- 3. WebRTC Signals - temporary signaling messages
CREATE TABLE IF NOT EXISTS webrtc_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES video_rooms(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL,
  to_user_id UUID NOT NULL,
  signal_type TEXT NOT NULL, -- 'offer', 'answer', 'ice-candidate'
  signal_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- INDEXES
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_video_rooms_appointment ON video_rooms(appointment_id);
CREATE INDEX IF NOT EXISTS idx_video_rooms_active ON video_rooms(is_active);
CREATE INDEX IF NOT EXISTS idx_room_participants_room ON room_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_room_participants_user ON room_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_room_participants_active ON room_participants(room_id) WHERE left_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_webrtc_signals_room ON webrtc_signals(room_id);
CREATE INDEX IF NOT EXISTS idx_webrtc_signals_to_user ON webrtc_signals(to_user_id);
CREATE INDEX IF NOT EXISTS idx_webrtc_signals_created ON webrtc_signals(created_at DESC);

-- ==========================================
-- ROW LEVEL SECURITY
-- ==========================================

ALTER TABLE video_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE webrtc_signals ENABLE ROW LEVEL SECURITY;

-- Video Rooms policies
DROP POLICY IF EXISTS "Allow all on video_rooms" ON video_rooms;
CREATE POLICY "Allow all on video_rooms" ON video_rooms FOR ALL USING (true);

-- Room Participants policies
DROP POLICY IF EXISTS "Allow all on room_participants" ON room_participants;
CREATE POLICY "Allow all on room_participants" ON room_participants FOR ALL USING (true);

-- WebRTC Signals policies
DROP POLICY IF EXISTS "Allow all on webrtc_signals" ON webrtc_signals;
CREATE POLICY "Allow all on webrtc_signals" ON webrtc_signals FOR ALL USING (true);

-- ==========================================
-- ENABLE REALTIME
-- ==========================================

-- Enable replica identity for realtime
ALTER TABLE video_rooms REPLICA IDENTITY FULL;
ALTER TABLE room_participants REPLICA IDENTITY FULL;
ALTER TABLE webrtc_signals REPLICA IDENTITY FULL;

-- Add tables to realtime publication
-- Note: Run these only if not already added
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'video_rooms'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE video_rooms;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'room_participants'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE room_participants;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'webrtc_signals'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE webrtc_signals;
  END IF;
END $$;

-- ==========================================
-- CLEANUP TRIGGERS
-- ==========================================

-- Auto-cleanup old signals (older than 1 hour)
CREATE OR REPLACE FUNCTION cleanup_old_signals()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM webrtc_signals 
  WHERE created_at < NOW() - INTERVAL '1 hour';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS cleanup_signals_trigger ON webrtc_signals;
CREATE TRIGGER cleanup_signals_trigger
  AFTER INSERT ON webrtc_signals
  FOR EACH STATEMENT
  EXECUTE FUNCTION cleanup_old_signals();

-- ==========================================
-- HELPER FUNCTIONS
-- ==========================================

-- Get active room for an appointment
CREATE OR REPLACE FUNCTION get_active_room_for_appointment(apt_id UUID)
RETURNS UUID AS $$
  SELECT id FROM video_rooms 
  WHERE appointment_id = apt_id AND is_active = true 
  ORDER BY created_at DESC 
  LIMIT 1;
$$ LANGUAGE sql;

-- Get active participants in a room
CREATE OR REPLACE FUNCTION get_active_participants(rm_id UUID)
RETURNS TABLE(user_id UUID, user_role TEXT, audio_enabled BOOLEAN, video_enabled BOOLEAN) AS $$
  SELECT user_id, user_role, audio_enabled, video_enabled
  FROM room_participants 
  WHERE room_id = rm_id AND left_at IS NULL;
$$ LANGUAGE sql;

SELECT 'Video Rooms schema created successfully!' as status;
