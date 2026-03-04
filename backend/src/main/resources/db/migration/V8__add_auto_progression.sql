ALTER TABLE workout_plans ADD COLUMN auto_progression BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE exercises ADD COLUMN min_reps INTEGER;
ALTER TABLE exercises ADD COLUMN max_reps INTEGER;

UPDATE exercises e
SET min_reps = et.min_reps, max_reps = et.max_reps
FROM exercise_templates et
WHERE e.exercise_template_id = et.id AND e.min_reps IS NULL;
