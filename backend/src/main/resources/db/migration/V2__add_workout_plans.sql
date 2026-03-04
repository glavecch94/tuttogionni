-- Workout Plans table
CREATE TABLE workout_plans (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    workouts_per_week INTEGER NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    current_day_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

-- Workout Days table (days within a plan, executed cyclically)
CREATE TABLE workout_days (
    id BIGSERIAL PRIMARY KEY,
    workout_plan_id BIGINT NOT NULL REFERENCES workout_plans(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT
);

-- Exercises table
CREATE TABLE exercises (
    id BIGSERIAL PRIMARY KEY,
    workout_day_id BIGINT NOT NULL REFERENCES workout_days(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    sets INTEGER NOT NULL,
    reps INTEGER NOT NULL,
    weight DOUBLE PRECISION,
    rest_seconds INTEGER,
    notes TEXT,
    exercise_order INTEGER NOT NULL
);

-- Workout Logs table (tracks completed workouts)
CREATE TABLE workout_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    workout_plan_id BIGINT NOT NULL REFERENCES workout_plans(id) ON DELETE CASCADE,
    workout_day_id BIGINT NOT NULL REFERENCES workout_days(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_workout_plans_user_id ON workout_plans(user_id);
CREATE INDEX idx_workout_plans_active ON workout_plans(user_id, is_active);
CREATE INDEX idx_workout_days_plan_id ON workout_days(workout_plan_id);
CREATE INDEX idx_exercises_day_id ON exercises(workout_day_id);
CREATE INDEX idx_workout_logs_user_id ON workout_logs(user_id);
CREATE INDEX idx_workout_logs_date ON workout_logs(date);
CREATE INDEX idx_workout_logs_plan_date ON workout_logs(user_id, workout_plan_id, date);
