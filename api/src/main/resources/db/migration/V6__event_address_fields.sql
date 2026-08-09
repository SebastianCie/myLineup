-- Freitext-Adresse durch strukturierte Felder ersetzen.
ALTER TABLE events DROP COLUMN address;
ALTER TABLE events ADD COLUMN street VARCHAR(255);
ALTER TABLE events ADD COLUMN postal_code VARCHAR(20);
ALTER TABLE events ADD COLUMN city VARCHAR(255);
ALTER TABLE events ADD COLUMN country VARCHAR(255);
