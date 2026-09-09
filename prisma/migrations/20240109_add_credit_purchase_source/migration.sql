-- Add source column for tracking credit origin (PURCHASE or FREE_TIER)
ALTER TABLE "CreditPurchase" ADD COLUMN IF NOT EXISTS "source" TEXT DEFAULT 'PURCHASE';

-- Make packId nullable for free tier credits (no pack associated)
-- This might fail if the column is already nullable or has constraints
-- We'll use a safer approach with PostgreSQL
DO $$
BEGIN
    -- Try to make packId nullable
    BEGIN
        ALTER TABLE "CreditPurchase" ALTER COLUMN "packId" DROP NOT NULL;
    EXCEPTION
        WHEN undefined_column THEN
            RAISE NOTICE 'Column packId does not exist or is already nullable';
        WHEN other THEN
            RAISE NOTICE 'Error making packId nullable: %', SQLERRM;
    END;
END $$;
