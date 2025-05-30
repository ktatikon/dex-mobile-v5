-- Add slippage_tolerance column to existing wallet_settings table
-- This migration ensures backward compatibility for existing users

-- Add the slippage_tolerance column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'wallet_settings' 
        AND column_name = 'slippage_tolerance'
    ) THEN
        ALTER TABLE wallet_settings 
        ADD COLUMN slippage_tolerance DECIMAL(5,2) DEFAULT 0.50 
        CHECK (slippage_tolerance >= 0.01 AND slippage_tolerance <= 50.00);
        
        -- Update existing records to have the default slippage tolerance
        UPDATE wallet_settings 
        SET slippage_tolerance = 0.50 
        WHERE slippage_tolerance IS NULL;
        
        -- Add comment for documentation
        COMMENT ON COLUMN wallet_settings.slippage_tolerance IS 'Slippage tolerance percentage (0.01% - 50%) for trading transactions';
    END IF;
END $$;

-- Ensure the constraint is properly applied
ALTER TABLE wallet_settings 
DROP CONSTRAINT IF EXISTS wallet_settings_slippage_tolerance_check;

ALTER TABLE wallet_settings 
ADD CONSTRAINT wallet_settings_slippage_tolerance_check 
CHECK (slippage_tolerance >= 0.01 AND slippage_tolerance <= 50.00);

-- Create index for performance if needed
CREATE INDEX IF NOT EXISTS idx_wallet_settings_slippage_tolerance 
ON wallet_settings(slippage_tolerance) 
WHERE slippage_tolerance IS NOT NULL;

-- Update the trigger function to handle the new column
CREATE OR REPLACE FUNCTION update_wallet_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure RLS policies cover the new column
-- (The existing policies should already cover all columns, but this is for safety)

-- Add helpful function to validate slippage tolerance
CREATE OR REPLACE FUNCTION validate_slippage_tolerance(tolerance DECIMAL)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN tolerance >= 0.01 AND tolerance <= 50.00;
END;
$$ LANGUAGE plpgsql;

-- Add comment for the function
COMMENT ON FUNCTION validate_slippage_tolerance(DECIMAL) IS 'Validates slippage tolerance value is within acceptable range (0.01% - 50%)';
