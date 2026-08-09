CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Events ----------------------------------------------------------------
CREATE SEQUENCE events_seq START WITH 1 INCREMENT BY 50;
CREATE TABLE events (
    id                 BIGINT       NOT NULL DEFAULT nextval('events_seq') PRIMARY KEY,
    admin_id           BIGINT       NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
    name               VARCHAR(255) NOT NULL,
    start_date         DATE         NOT NULL,
    end_date           DATE         NOT NULL,
    description        TEXT,
    address            VARCHAR(500),
    logo_data          BYTEA,
    logo_content_type  VARCHAR(100),
    logo_filename      VARCHAR(255),
    created_at         TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CHECK (end_date >= start_date)
);
ALTER SEQUENCE events_seq OWNED BY events.id;
CREATE INDEX idx_events_admin_id ON events(admin_id);

-- Dozenten ----------------------------------------------------------------
CREATE SEQUENCE speakers_seq START WITH 1 INCREMENT BY 50;
CREATE TABLE speakers (
    id          BIGINT       NOT NULL DEFAULT nextval('speakers_seq') PRIMARY KEY,
    event_id    BIGINT       NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name        VARCHAR(255) NOT NULL,
    country     VARCHAR(255),
    description TEXT,
    confirmed   BOOLEAN      NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);
ALTER SEQUENCE speakers_seq OWNED BY speakers.id;
CREATE INDEX idx_speakers_event_id ON speakers(event_id);

-- Räume / Säle ------------------------------------------------------------
CREATE SEQUENCE rooms_seq START WITH 1 INCREMENT BY 50;
CREATE TABLE rooms (
    id         BIGINT       NOT NULL DEFAULT nextval('rooms_seq') PRIMARY KEY,
    event_id   BIGINT       NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name       VARCHAR(255) NOT NULL,
    subname    VARCHAR(255),
    address    VARCHAR(500),
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);
ALTER SEQUENCE rooms_seq OWNED BY rooms.id;
CREATE INDEX idx_rooms_event_id ON rooms(event_id);

-- Agenda (Registrierung, Workshop, Pause, Party) ---------------------------
CREATE SEQUENCE agenda_items_seq START WITH 1 INCREMENT BY 50;
CREATE TABLE agenda_items (
    id          BIGINT      NOT NULL DEFAULT nextval('agenda_items_seq') PRIMARY KEY,
    event_id    BIGINT      NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    type        VARCHAR(20) NOT NULL CHECK (type IN ('REGISTRATION', 'WORKSHOP', 'BREAK', 'PARTY')),
    day         DATE        NOT NULL,
    start_time  TIME        NOT NULL,
    end_time    TIME        NOT NULL,
    description TEXT,
    room_id     BIGINT      REFERENCES rooms(id) ON DELETE SET NULL,
    speaker_id  BIGINT      REFERENCES speakers(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (end_time > start_time),
    CHECK (type <> 'WORKSHOP' OR (room_id IS NOT NULL AND speaker_id IS NOT NULL)),
    time_range  tsrange GENERATED ALWAYS AS (tsrange(day + start_time, day + end_time)) STORED
);
ALTER SEQUENCE agenda_items_seq OWNED BY agenda_items.id;
CREATE INDEX idx_agenda_items_event_id ON agenda_items(event_id);
CREATE INDEX idx_agenda_items_event_day ON agenda_items(event_id, day);

-- Ein Raum kann zeitgleich nur einen Programmpunkt haben.
ALTER TABLE agenda_items ADD CONSTRAINT no_room_double_booking
    EXCLUDE USING gist (room_id WITH =, time_range WITH &&) WHERE (room_id IS NOT NULL);

-- Ein Dozent kann zeitgleich nur einen Workshop halten (auch raumübergreifend).
ALTER TABLE agenda_items ADD CONSTRAINT no_speaker_double_booking
    EXCLUDE USING gist (speaker_id WITH =, time_range WITH &&) WHERE (speaker_id IS NOT NULL);
