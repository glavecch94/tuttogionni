-- Aggiunge colonna training_days a workout_plans
ALTER TABLE workout_plans ADD COLUMN training_days VARCHAR(100);

-- Aggiunge riferimenti workout alla tabella events
ALTER TABLE events ADD COLUMN workout_plan_id BIGINT REFERENCES workout_plans(id) ON DELETE SET NULL;
ALTER TABLE events ADD COLUMN workout_day_id BIGINT REFERENCES workout_days(id) ON DELETE SET NULL;

-- Indice per query calendario
CREATE INDEX idx_events_workout_plan ON events(workout_plan_id) WHERE workout_plan_id IS NOT NULL;
