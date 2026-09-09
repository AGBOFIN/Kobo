-- Add source column for tracking credit origin (PURCHASE or FREE_TIER)
ALTER TABLE "CreditPurchase" ADD COLUMN IF NOT EXISTS "source" TEXT DEFAULT 'PURCHASE';

-- Make packId nullable for free tier credits (no pack associated)
-- PostgreSQL: First ensure there's no NOT NULL constraint, then alter
ALTER TABLE "CreditPurchase" ALTER COLUMN "packId" DROP DEFAULT IF EXISTS;
ALTER TABLE "CreditPurchase" ALTER COLUMN "packId" DROP NOT NULL;
