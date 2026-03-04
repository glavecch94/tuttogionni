-- Add GAMBE to the enum and remove ADDOMINALI
ALTER TYPE muscle_group ADD VALUE 'GAMBE';

-- Note: PostgreSQL doesn't allow removing enum values directly
-- We'll handle ADDOMINALI as deprecated in the application layer
