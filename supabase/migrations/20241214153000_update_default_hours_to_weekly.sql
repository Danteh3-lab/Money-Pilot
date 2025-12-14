-- Migration: Update default_hours from daily (8.0) to weekly (40.0) format
-- Date: 2024-12-14
-- Description: Updates existing default_hours values and changes the column type to support weekly hours

-- Update the column type to support larger numbers (weekly hours can be up to 168)
DO $$
BEGIN
    -- Change column type if needed
    ALTER TABLE user_settings
    ALTER COLUMN default_hours TYPE DECIMAL(5, 2);

    RAISE NOTICE 'Updated default_hours column type to DECIMAL(5,2)';
END $$;

-- Update existing records that have daily hours (8.0 or less than 24) to weekly hours
DO $$
BEGIN
    -- Convert daily hours to weekly hours (multiply by 5 workdays)
    -- Assuming any value <= 24 is daily hours
    UPDATE user_settings
    SET default_hours = default_hours * 5
    WHERE default_hours IS NOT NULL
    AND default_hours <= 24;

    -- Set NULL or 0 values to default 40 hours per week
    UPDATE user_settings
    SET default_hours = 40.0
    WHERE default_hours IS NULL OR default_hours = 0;

    RAISE NOTICE 'Updated existing default_hours values from daily to weekly format';
END $$;

-- Update the default value for new records
ALTER TABLE user_settings
ALTER COLUMN default_hours SET DEFAULT 40.0;

-- Add comment to clarify the column now represents weekly hours
COMMENT ON COLUMN user_settings.default_hours IS 'Default working hours per week (e.g., 40.0 for full-time, 5 days × 8 hours)';
