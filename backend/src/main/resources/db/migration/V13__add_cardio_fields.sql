-- Make sets and reps nullable to support cardio exercises
ALTER TABLE exercises
    ALTER COLUMN sets DROP NOT NULL,
    ALTER COLUMN reps DROP NOT NULL,
    ADD COLUMN cardio_type VARCHAR(50),
    ADD COLUMN duration_minutes INTEGER,
    ADD COLUMN distance_km DECIMAL(6,2);

-- Make sets/reps nullable in templates, add cardio fields
ALTER TABLE exercise_templates
    ALTER COLUMN default_sets DROP NOT NULL,
    ALTER COLUMN min_reps DROP NOT NULL,
    ALTER COLUMN max_reps DROP NOT NULL,
    ADD COLUMN cardio_type VARCHAR(50),
    ADD COLUMN default_duration_minutes INTEGER;
