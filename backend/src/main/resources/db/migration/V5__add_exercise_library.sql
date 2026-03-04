-- Create muscle group enum type
CREATE TYPE muscle_group AS ENUM ('PETTO', 'SPALLE', 'BICIPITI', 'TRICIPITI', 'DORSALI', 'ADDOMINALI', 'CORE');

-- Create exercise templates table (exercise library)
CREATE TABLE exercise_templates (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    muscle_group muscle_group NOT NULL,
    default_sets INTEGER NOT NULL DEFAULT 3,
    min_reps INTEGER NOT NULL DEFAULT 8,
    max_reps INTEGER NOT NULL DEFAULT 12,
    initial_weight DECIMAL(10,2),
    use_two_dumbbells BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, name)
);

-- Add indexes
CREATE INDEX idx_exercise_templates_user ON exercise_templates(user_id);
CREATE INDEX idx_exercise_templates_muscle_group ON exercise_templates(user_id, muscle_group);

-- Add reference to exercise template in exercises table
ALTER TABLE exercises ADD COLUMN exercise_template_id BIGINT REFERENCES exercise_templates(id) ON DELETE SET NULL;
ALTER TABLE exercises ADD COLUMN use_two_dumbbells BOOLEAN DEFAULT false;

-- Create exercise feedback table for tracking difficulty
CREATE TABLE exercise_feedback (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    workout_log_id BIGINT NOT NULL REFERENCES workout_logs(id) ON DELETE CASCADE,
    exercise_name VARCHAR(255) NOT NULL,
    workout_plan_id BIGINT NOT NULL REFERENCES workout_plans(id) ON DELETE CASCADE,
    difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('LIGHT', 'NEUTRAL', 'HEAVY')),
    weight_used DECIMAL(10,2),
    sets_completed INTEGER,
    reps_completed INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_exercise_feedback_user_plan_name ON exercise_feedback(user_id, workout_plan_id, exercise_name);
