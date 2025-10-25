-- Add exception_dates column to availability table
-- This stores dates where recurring events should not appear (exceptions)

ALTER TABLE availability 
ADD COLUMN IF NOT EXISTS exception_dates jsonb DEFAULT '[]'::jsonb;

-- Add comment
COMMENT ON COLUMN availability.exception_dates IS 'Array of ISO date strings where this recurring event should not appear';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_availability_exception_dates ON availability USING gin(exception_dates);
