CREATE TABLE goals (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    frequency VARCHAR(50) NOT NULL,
    frequency_config VARCHAR(255),
    scheduled_time TIME,
    color VARCHAR(20),
    icon VARCHAR(50),
    active BOOLEAN NOT NULL DEFAULT FALSE,
    preconfigured_key VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

ALTER TABLE events ADD COLUMN goal_id BIGINT REFERENCES goals(id) ON DELETE SET NULL;

CREATE INDEX idx_goals_user_id ON goals(user_id);
CREATE INDEX idx_goals_active ON goals(user_id, active);
CREATE INDEX idx_events_goal ON events(goal_id) WHERE goal_id IS NOT NULL;
