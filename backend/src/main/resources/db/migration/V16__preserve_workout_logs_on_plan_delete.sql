-- Preserve workout logs when a plan is deleted
-- Add denormalized name columns so history remains readable after plan/day deletion

ALTER TABLE workout_logs
    ADD COLUMN workout_plan_name VARCHAR(255),
    ADD COLUMN workout_day_name  VARCHAR(255),
    ADD COLUMN workout_day_number INTEGER;

-- Backfill existing rows
UPDATE workout_logs wl
SET workout_plan_name  = wp.name,
    workout_day_name   = wd.name,
    workout_day_number = wd.day_number
FROM workout_plans wp,
     workout_days wd
WHERE wl.workout_plan_id = wp.id
  AND wl.workout_day_id = wd.id;

-- Make FKs nullable
ALTER TABLE workout_logs
    ALTER COLUMN workout_plan_id DROP NOT NULL,
    ALTER COLUMN workout_day_id  DROP NOT NULL;

-- Replace CASCADE with SET NULL on workout_plan_id
ALTER TABLE workout_logs DROP CONSTRAINT IF EXISTS workout_logs_workout_plan_id_fkey;
ALTER TABLE workout_logs
    ADD CONSTRAINT workout_logs_workout_plan_id_fkey
        FOREIGN KEY (workout_plan_id) REFERENCES workout_plans (id) ON DELETE SET NULL;

-- Replace CASCADE with SET NULL on workout_day_id
ALTER TABLE workout_logs DROP CONSTRAINT IF EXISTS workout_logs_workout_day_id_fkey;
ALTER TABLE workout_logs
    ADD CONSTRAINT workout_logs_workout_day_id_fkey
        FOREIGN KEY (workout_day_id) REFERENCES workout_days (id) ON DELETE SET NULL;
