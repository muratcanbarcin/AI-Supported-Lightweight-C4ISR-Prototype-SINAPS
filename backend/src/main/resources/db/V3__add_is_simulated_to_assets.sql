-- ============================================================================
-- V3: Add is_simulated flag to assets table
-- Distinguishes simulated TSK units from live physical hardware prototypes
-- ============================================================================

ALTER TABLE assets ADD COLUMN IF NOT EXISTS is_simulated BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN assets.is_simulated IS 'TRUE = simulated TSK wargame unit, FALSE = live physical hardware (drone/OBD/smartwatch)';
