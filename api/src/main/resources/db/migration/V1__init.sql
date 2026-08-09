-- Sequenznamen folgen Hibernate/Panache's impliziter Generator-Konvention (<table>_seq),
-- damit die Schema-Validierung beim Start nicht fehlschlägt.
CREATE SEQUENCE admins_seq START WITH 1 INCREMENT BY 50;
CREATE TABLE admins (
    id            BIGINT       NOT NULL DEFAULT nextval('admins_seq') PRIMARY KEY,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name          VARCHAR(255) NOT NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);
ALTER SEQUENCE admins_seq OWNED BY admins.id;

-- Beispiel-Tabelle nur zur End-to-End-Verifikation (React -> Quarkus -> Postgres).
-- Kann entfernt werden, sobald echte Fachentitäten existieren.
CREATE SEQUENCE ping_entries_seq START WITH 1 INCREMENT BY 50;
CREATE TABLE ping_entries (
    id         BIGINT       NOT NULL DEFAULT nextval('ping_entries_seq') PRIMARY KEY,
    message    VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);
ALTER SEQUENCE ping_entries_seq OWNED BY ping_entries.id;
