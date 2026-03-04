CREATE TABLE media_items (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    media_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'TO_CONSUME',
    rating INTEGER,
    notes TEXT,
    favorite BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX idx_media_items_user ON media_items(user_id);
CREATE INDEX idx_media_items_user_type ON media_items(user_id, media_type);
CREATE INDEX idx_media_items_user_status ON media_items(user_id, status);
