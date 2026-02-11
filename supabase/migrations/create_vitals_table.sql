-- ============================================================================
-- VITALS TABLE SCHEMA
-- Stores patient vital signs and health measurements
-- ============================================================================

-- Create vitals table
CREATE TABLE IF NOT EXISTS public.vitals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    
    -- Vital Signs
    blood_pressure_systolic INTEGER,
    blood_pressure_diastolic INTEGER,
    heart_rate INTEGER,
    temperature DECIMAL(4, 1),
    oxygen_saturation INTEGER,
    respiratory_rate INTEGER,
    
    -- Body Measurements
    weight DECIMAL(5, 2),
    height DECIMAL(5, 2),
    bmi DECIMAL(4, 2),
    
    -- Additional Measurements
    blood_glucose DECIMAL(5, 1),
    cholesterol_total INTEGER,
    cholesterol_hdl INTEGER,
    cholesterol_ldl INTEGER,
    
    -- Metadata
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    recorded_by UUID REFERENCES public.users(id),
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Index for faster patient lookups
CREATE INDEX IF NOT EXISTS idx_vitals_patient_id 
ON public.vitals(patient_id);

-- Index for date-based queries
CREATE INDEX IF NOT EXISTS idx_vitals_recorded_at 
ON public.vitals(recorded_at DESC);

-- Composite index for patient + date queries
CREATE INDEX IF NOT EXISTS idx_vitals_patient_recorded 
ON public.vitals(patient_id, recorded_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE public.vitals ENABLE ROW LEVEL SECURITY;

-- Policy: Patients can view their own vitals
CREATE POLICY "Patients can view own vitals"
ON public.vitals
FOR SELECT
USING (
    patient_id IN (
        SELECT id FROM public.patients 
        WHERE user_id = auth.uid()
    )
);

-- Policy: Doctors can view vitals of their patients
CREATE POLICY "Doctors can view patient vitals"
ON public.vitals
FOR SELECT
USING (
    patient_id IN (
        SELECT DISTINCT a.patient_id 
        FROM public.appointments a
        JOIN public.doctors d ON d.doctor_id = a.doctor_id
        WHERE d.user_id = auth.uid()
    )
);

-- Policy: Nurses and staff can view all vitals
CREATE POLICY "Nurses and staff can view all vitals"
ON public.vitals
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role IN ('nurse', 'staff', 'admin')
    )
);

-- Policy: Doctors, nurses, and staff can insert vitals
CREATE POLICY "Medical staff can insert vitals"
ON public.vitals
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role IN ('doctor', 'nurse', 'staff', 'admin')
    )
);

-- Policy: Doctors, nurses, and staff can update vitals
CREATE POLICY "Medical staff can update vitals"
ON public.vitals
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role IN ('doctor', 'nurse', 'staff', 'admin')
    )
);

-- Policy: Only admins can delete vitals
CREATE POLICY "Only admins can delete vitals"
ON public.vitals
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role = 'admin'
    )
);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_vitals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_vitals_updated_at
    BEFORE UPDATE ON public.vitals
    FOR EACH ROW
    EXECUTE FUNCTION update_vitals_updated_at();

-- Trigger to calculate BMI automatically
CREATE OR REPLACE FUNCTION calculate_bmi()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.weight IS NOT NULL AND NEW.height IS NOT NULL AND NEW.height > 0 THEN
        -- BMI = weight (kg) / (height (m))^2
        -- Height is stored in cm, so convert to meters
        NEW.bmi = ROUND((NEW.weight / POWER(NEW.height / 100.0, 2))::NUMERIC, 2);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_bmi
    BEFORE INSERT OR UPDATE ON public.vitals
    FOR EACH ROW
    EXECUTE FUNCTION calculate_bmi();

-- ============================================================================
-- CONSTRAINTS
-- ============================================================================

-- Add check constraints for valid ranges
ALTER TABLE public.vitals
ADD CONSTRAINT check_blood_pressure_systolic 
CHECK (blood_pressure_systolic IS NULL OR (blood_pressure_systolic >= 50 AND blood_pressure_systolic <= 250));

ALTER TABLE public.vitals
ADD CONSTRAINT check_blood_pressure_diastolic 
CHECK (blood_pressure_diastolic IS NULL OR (blood_pressure_diastolic >= 30 AND blood_pressure_diastolic <= 150));

ALTER TABLE public.vitals
ADD CONSTRAINT check_heart_rate 
CHECK (heart_rate IS NULL OR (heart_rate >= 30 AND heart_rate <= 250));

ALTER TABLE public.vitals
ADD CONSTRAINT check_temperature 
CHECK (temperature IS NULL OR (temperature >= 90.0 AND temperature <= 110.0));

ALTER TABLE public.vitals
ADD CONSTRAINT check_oxygen_saturation 
CHECK (oxygen_saturation IS NULL OR (oxygen_saturation >= 50 AND oxygen_saturation <= 100));

ALTER TABLE public.vitals
ADD CONSTRAINT check_weight 
CHECK (weight IS NULL OR (weight >= 1.0 AND weight <= 500.0));

ALTER TABLE public.vitals
ADD CONSTRAINT check_height 
CHECK (height IS NULL OR (height >= 30.0 AND height <= 300.0));

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.vitals IS 'Stores patient vital signs and health measurements';
COMMENT ON COLUMN public.vitals.blood_pressure_systolic IS 'Systolic blood pressure in mmHg';
COMMENT ON COLUMN public.vitals.blood_pressure_diastolic IS 'Diastolic blood pressure in mmHg';
COMMENT ON COLUMN public.vitals.heart_rate IS 'Heart rate in beats per minute';
COMMENT ON COLUMN public.vitals.temperature IS 'Body temperature in Fahrenheit';
COMMENT ON COLUMN public.vitals.oxygen_saturation IS 'Blood oxygen saturation percentage (SpO2)';
COMMENT ON COLUMN public.vitals.weight IS 'Body weight in kilograms';
COMMENT ON COLUMN public.vitals.height IS 'Body height in centimeters';
COMMENT ON COLUMN public.vitals.bmi IS 'Body Mass Index (calculated automatically)';

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant appropriate permissions
GRANT SELECT ON public.vitals TO authenticated;
GRANT INSERT ON public.vitals TO authenticated;
GRANT UPDATE ON public.vitals TO authenticated;
GRANT DELETE ON public.vitals TO authenticated;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Vitals table created successfully!';
    RAISE NOTICE '✅ Indexes created';
    RAISE NOTICE '✅ RLS policies enabled';
    RAISE NOTICE '✅ Triggers configured';
    RAISE NOTICE '✅ Constraints added';
    RAISE NOTICE '';
    RAISE NOTICE '🎉 Vitals system is ready to use!';
END $$;
