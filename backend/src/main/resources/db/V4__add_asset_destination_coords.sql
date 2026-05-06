-- ============================================================================
-- V4: Asset navigation targets (planner / simulation sync)
-- ============================================================================

ALTER TABLE assets ADD COLUMN IF NOT EXISTS destination_lat DOUBLE PRECISION;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS destination_lng DOUBLE PRECISION;

COMMENT ON COLUMN assets.destination_lat IS 'Current mission/RTB target latitude (WGS84), set on deploy';
COMMENT ON COLUMN assets.destination_lng IS 'Current mission/RTB target longitude (WGS84), set on deploy';
