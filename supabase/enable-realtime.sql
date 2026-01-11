-- Enable Realtime for video_calls table
-- This allows the doctor dashboard to receive real-time notifications when patients initiate calls

-- Enable realtime on video_calls table
ALTER TABLE video_calls REPLICA IDENTITY FULL;

-- Enable publication for realtime
ALTER PUBLICATION supabase_realtime ADD TABLE video_calls;

-- Also enable realtime for video_call_signaling table (for WebRTC signaling)
ALTER TABLE video_call_signaling REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE video_call_signaling;

-- Verify realtime is enabled
SELECT 
    schemaname,
    tablename
FROM 
    pg_publication_tables
WHERE 
    pubname = 'supabase_realtime'
    AND tablename IN ('video_calls', 'video_call_signaling');
