-- Öffentlicher Zugang pro Event: Direktlink/QR-Token (immer gültig) und optionale
-- Sichtbarkeit auf der Besucher-Landkarte.
ALTER TABLE events ADD COLUMN public_token VARCHAR(20);
UPDATE events SET public_token = substr(md5(random()::text || id::text), 1, 10) WHERE public_token IS NULL;
ALTER TABLE events ALTER COLUMN public_token SET NOT NULL;
ALTER TABLE events ADD CONSTRAINT events_public_token_unique UNIQUE (public_token);

ALTER TABLE events ADD COLUMN show_on_map BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE events ADD COLUMN map_visible_from DATE;

-- Besucher-Accounts (getrennt von admins, eigener Rollen-Claim im JWT).
CREATE SEQUENCE participants_seq START WITH 1 INCREMENT BY 50;
CREATE TABLE participants (
    id            BIGINT       NOT NULL DEFAULT nextval('participants_seq') PRIMARY KEY,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name          VARCHAR(255) NOT NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);
ALTER SEQUENCE participants_seq OWNED BY participants.id;
