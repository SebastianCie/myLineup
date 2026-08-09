-- Level (z.B. Beginner, Intermediate, Advanced) sind pro Event frei definierbar,
-- analog zu Dozenten/Räumen, und können optional einem Workshop zugeordnet werden.
CREATE SEQUENCE levels_seq START WITH 1 INCREMENT BY 50;
CREATE TABLE levels (
    id         BIGINT       NOT NULL DEFAULT nextval('levels_seq') PRIMARY KEY,
    event_id   BIGINT       NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name       VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);
ALTER SEQUENCE levels_seq OWNED BY levels.id;
CREATE INDEX idx_levels_event_id ON levels(event_id);

ALTER TABLE agenda_items ADD COLUMN level_id BIGINT REFERENCES levels(id) ON DELETE SET NULL;
