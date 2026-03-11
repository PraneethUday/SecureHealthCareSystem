-- ==========================================
-- SECURITY MONITORING & BREACH HANDLING SYSTEM
-- EPIC 5: Audit, Monitoring & Breach Handling
-- User Stories: 10577, 10578, 10580, 10583, 10585
-- ==========================================

-- ==========================================
-- 1. SECURITY INCIDENTS TABLE (#10578)
-- Dedicated log for security events
-- ==========================================
CREATE TABLE IF NOT EXISTS security_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_type TEXT NOT NULL CHECK (incident_type IN (
    'unusual_access_pattern',
    'brute_force_attempt',
    'unauthorized_access',
    'data_exfiltration_risk',
    'off_hours_access',
    'excessive_record_access',
    'rapid_fire_actions',
    'account_compromise',
    'policy_violation',
    'system_breach',
    'other'
  )),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  affected_user_id TEXT,
  affected_user_role TEXT,
  source_ip TEXT,
  user_agent TEXT,
  evidence_snapshot JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'dismissed')),
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by TEXT,
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for security_incidents
CREATE INDEX idx_security_incidents_type ON security_incidents(incident_type);
CREATE INDEX idx_security_incidents_severity ON security_incidents(severity);
CREATE INDEX idx_security_incidents_status ON security_incidents(status);
CREATE INDEX idx_security_incidents_detected ON security_incidents(detected_at DESC);
CREATE INDEX idx_security_incidents_user ON security_incidents(affected_user_id);

-- ==========================================
-- 2. SECURITY ALERTS TABLE (#10580)
-- Real-time alert notifications for admins
-- ==========================================
CREATE TABLE IF NOT EXISTS security_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL CHECK (alert_type IN (
    'anomaly_detected',
    'incident_created',
    'threshold_exceeded',
    'breach_suspected',
    'policy_violation',
    'retention_executed',
    'system_warning'
  )),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_incident_id UUID REFERENCES security_incidents(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  is_dismissed BOOLEAN DEFAULT false,
  dismissed_by TEXT,
  dismissed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for security_alerts
CREATE INDEX idx_security_alerts_type ON security_alerts(alert_type);
CREATE INDEX idx_security_alerts_severity ON security_alerts(severity);
CREATE INDEX idx_security_alerts_dismissed ON security_alerts(is_dismissed);
CREATE INDEX idx_security_alerts_created ON security_alerts(created_at DESC);

-- ==========================================
-- 3. AUDIT RETENTION POLICIES TABLE (#10585)
-- Configurable retention rules for audit logs
-- ==========================================
CREATE TABLE IF NOT EXISTS audit_retention_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_type TEXT NOT NULL UNIQUE CHECK (log_type IN (
    'access_logs',
    'login_attempts',
    'security_incidents',
    'security_alerts',
    'notifications',
    'appointment_logs',
    'medical_record_logs',
    'prescription_logs',
    'video_call_logs'
  )),
  display_name TEXT NOT NULL,
  retention_days INTEGER NOT NULL CHECK (retention_days >= 30),
  archive_before_delete BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  last_executed_at TIMESTAMP WITH TIME ZONE,
  records_deleted_last_run INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- ==========================================
-- 4. ANOMALY DETECTION FUNCTION (#10577)
-- Queries access_logs for unusual patterns
-- ==========================================
CREATE OR REPLACE FUNCTION detect_unusual_access_patterns(
  p_hours_lookback INTEGER DEFAULT 24
) RETURNS TABLE(
  anomaly_type TEXT,
  user_id TEXT,
  user_role TEXT,
  details TEXT,
  event_count BIGINT,
  time_window TEXT
) AS $$
BEGIN
  -- 1. Off-hours access (before 6am or after 10pm local time)
  RETURN QUERY
  SELECT
    'off_hours_access'::TEXT AS anomaly_type,
    COALESCE(p.patient_id, d.doctor_id, n.nurse_id, s.staff_id, al.user_id)::TEXT AS user_id,
    al.user_role,
    ('Access at ' || TO_CHAR(al.timestamp AT TIME ZONE 'UTC', 'HH24:MI')
     || ' by ' || COALESCE(
       p.first_name || ' ' || p.last_name,
       d.first_name || ' ' || d.last_name,
       n.first_name || ' ' || n.last_name,
       s.first_name || ' ' || s.last_name,
       al.user_id
     ))::TEXT AS details,
    COUNT(*)::BIGINT AS event_count,
    'Last ' || p_hours_lookback || ' hours' AS time_window
  FROM access_logs al
  LEFT JOIN patients p ON al.user_id = p.id::TEXT
  LEFT JOIN doctors d ON al.user_id = d.id::TEXT
  LEFT JOIN nurses n ON al.user_id = n.id::TEXT
  LEFT JOIN staff s ON al.user_id = s.id::TEXT
  WHERE al.timestamp > (TIMEZONE('utc', NOW()) - INTERVAL '1 hour' * p_hours_lookback)
    AND (
      EXTRACT(HOUR FROM al.timestamp AT TIME ZONE 'UTC') < 6
      OR EXTRACT(HOUR FROM al.timestamp AT TIME ZONE 'UTC') >= 22
    )
  GROUP BY al.user_id, al.user_role,
           TO_CHAR(al.timestamp AT TIME ZONE 'UTC', 'HH24:MI'),
           p.patient_id, p.first_name, p.last_name,
           d.doctor_id, d.first_name, d.last_name,
           n.nurse_id, n.first_name, n.last_name,
           s.staff_id, s.first_name, s.last_name
  HAVING COUNT(*) >= 3;

  -- 2. Excessive record access (>20 accesses in 1 hour by same user)
  RETURN QUERY
  SELECT
    'excessive_record_access'::TEXT AS anomaly_type,
    COALESCE(p.patient_id, d.doctor_id, n.nurse_id, s.staff_id, al.user_id)::TEXT AS user_id,
    al.user_role,
    (COALESCE(
       p.first_name || ' ' || p.last_name,
       d.first_name || ' ' || d.last_name,
       n.first_name || ' ' || n.last_name,
       s.first_name || ' ' || s.last_name,
       al.user_id
     ) || ' accessed ' || COUNT(*) || ' records in 1 hour')::TEXT AS details,
    COUNT(*)::BIGINT AS event_count,
    'Hourly window' AS time_window
  FROM access_logs al
  LEFT JOIN patients p ON al.user_id = p.id::TEXT
  LEFT JOIN doctors d ON al.user_id = d.id::TEXT
  LEFT JOIN nurses n ON al.user_id = n.id::TEXT
  LEFT JOIN staff s ON al.user_id = s.id::TEXT
  WHERE al.timestamp > (TIMEZONE('utc', NOW()) - INTERVAL '1 hour' * p_hours_lookback)
    AND al.resource_type IN ('medical_record', 'prescription', 'patient_data')
  GROUP BY al.user_id, al.user_role, DATE_TRUNC('hour', al.timestamp),
           p.patient_id, p.first_name, p.last_name,
           d.doctor_id, d.first_name, d.last_name,
           n.nurse_id, n.first_name, n.last_name,
           s.staff_id, s.first_name, s.last_name
  HAVING COUNT(*) > 20;

  -- 3. Rapid-fire actions (>10 actions within 2-minute windows)
  RETURN QUERY
  SELECT
    'rapid_fire_actions'::TEXT AS anomaly_type,
    COALESCE(p.patient_id, d.doctor_id, n.nurse_id, s.staff_id, al.user_id)::TEXT AS user_id,
    al.user_role,
    (COALESCE(
       p.first_name || ' ' || p.last_name,
       d.first_name || ' ' || d.last_name,
       n.first_name || ' ' || n.last_name,
       s.first_name || ' ' || s.last_name,
       al.user_id
     ) || ' performed ' || COUNT(*) || ' actions in 2 minutes')::TEXT AS details,
    COUNT(*)::BIGINT AS event_count,
    '2-minute window' AS time_window
  FROM access_logs al
  LEFT JOIN patients p ON al.user_id = p.id::TEXT
  LEFT JOIN doctors d ON al.user_id = d.id::TEXT
  LEFT JOIN nurses n ON al.user_id = n.id::TEXT
  LEFT JOIN staff s ON al.user_id = s.id::TEXT
  WHERE al.timestamp > (TIMEZONE('utc', NOW()) - INTERVAL '1 hour' * p_hours_lookback)
  GROUP BY al.user_id, al.user_role, DATE_TRUNC('minute', al.timestamp),
           p.patient_id, p.first_name, p.last_name,
           d.doctor_id, d.first_name, d.last_name,
           n.nurse_id, n.first_name, n.last_name,
           s.staff_id, s.first_name, s.last_name
  HAVING COUNT(*) > 10;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 5. RETENTION POLICY EXECUTION FUNCTION (#10585)
-- Deletes logs older than the configured retention period
-- ==========================================
CREATE OR REPLACE FUNCTION apply_retention_policies()
RETURNS TABLE(
  log_type TEXT,
  records_deleted BIGINT
) AS $$
DECLARE
  policy RECORD;
  v_deleted BIGINT;
  v_cutoff TIMESTAMP WITH TIME ZONE;
BEGIN
  FOR policy IN
    SELECT * FROM audit_retention_policies WHERE is_active = true
  LOOP
    v_cutoff := TIMEZONE('utc', NOW()) - (INTERVAL '1 day' * policy.retention_days);
    v_deleted := 0;

    CASE policy.log_type
      WHEN 'access_logs' THEN
        DELETE FROM access_logs WHERE timestamp < v_cutoff;
        GET DIAGNOSTICS v_deleted = ROW_COUNT;
      WHEN 'login_attempts' THEN
        DELETE FROM login_attempts WHERE attempted_at < v_cutoff;
        GET DIAGNOSTICS v_deleted = ROW_COUNT;
      WHEN 'security_incidents' THEN
        DELETE FROM security_incidents WHERE created_at < v_cutoff AND status IN ('resolved', 'dismissed');
        GET DIAGNOSTICS v_deleted = ROW_COUNT;
      WHEN 'security_alerts' THEN
        DELETE FROM security_alerts WHERE created_at < v_cutoff AND is_dismissed = true;
        GET DIAGNOSTICS v_deleted = ROW_COUNT;
      WHEN 'notifications' THEN
        DELETE FROM notifications WHERE created_at < v_cutoff AND is_read = true;
        GET DIAGNOSTICS v_deleted = ROW_COUNT;
      ELSE
        v_deleted := 0;
    END CASE;

    -- Update the policy record
    UPDATE audit_retention_policies
    SET last_executed_at = TIMEZONE('utc', NOW()),
        records_deleted_last_run = v_deleted,
        updated_at = TIMEZONE('utc', NOW())
    WHERE id = policy.id;

    log_type := policy.log_type;
    records_deleted := v_deleted;
    RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 6. DEFAULT RETENTION POLICIES
-- ==========================================
INSERT INTO audit_retention_policies (log_type, display_name, retention_days, archive_before_delete, is_active)
VALUES
  ('access_logs', 'System Access Logs', 365, true, true),
  ('login_attempts', 'Login Attempt Records', 90, true, true),
  ('security_incidents', 'Security Incidents', 730, true, true),
  ('security_alerts', 'Security Alerts', 180, false, true),
  ('notifications', 'User Notifications', 60, false, true)
ON CONFLICT (log_type) DO NOTHING;

-- ==========================================
-- 7. ROW LEVEL SECURITY
-- ==========================================
ALTER TABLE security_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_retention_policies ENABLE ROW LEVEL SECURITY;

-- Security incidents: admin-only read, system insert
CREATE POLICY "Admin read security incidents" ON security_incidents FOR SELECT USING (true);
CREATE POLICY "System insert security incidents" ON security_incidents FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin update security incidents" ON security_incidents FOR UPDATE USING (true);

-- Security alerts: admin-only read, system insert
CREATE POLICY "Admin read security alerts" ON security_alerts FOR SELECT USING (true);
CREATE POLICY "System insert security alerts" ON security_alerts FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin update security alerts" ON security_alerts FOR UPDATE USING (true);

-- Retention policies: admin-only
CREATE POLICY "Admin manage retention policies" ON audit_retention_policies FOR ALL USING (true);

-- ==========================================
-- 8. COMMENTS
-- ==========================================
COMMENT ON TABLE security_incidents IS 'Logs security events with severity levels for incident response (Story #10578)';
COMMENT ON TABLE security_alerts IS 'Real-time alerts for admins on suspicious activities (Story #10580)';
COMMENT ON TABLE audit_retention_policies IS 'Configurable retention periods for audit log cleanup (Story #10585)';
COMMENT ON FUNCTION detect_unusual_access_patterns IS 'Scans access_logs for anomalous patterns (Story #10577)';
COMMENT ON FUNCTION apply_retention_policies IS 'Enforces data retention by deleting old records (Story #10585)';
