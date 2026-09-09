-- Add source column for tracking credit origin (PURCHASE or FREE_TIER)
ALTER TABLE "CreditPurchase" ADD COLUMN IF NOT EXISTS "source" TEXT DEFAULT 'PURCHASE';

-- Make packId nullable for free tier credits (no pack associated)
-- PostgreSQL requires dropping and recreating the column to make it nullable
ALTER TABLE "CreditPurchase" ALTER COLUMN "packId" DROP NOT NULL;
