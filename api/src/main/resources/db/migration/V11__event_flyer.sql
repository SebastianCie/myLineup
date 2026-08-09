ALTER TABLE events
    ADD COLUMN flyer_data BYTEA,
    ADD COLUMN flyer_content_type VARCHAR(100),
    ADD COLUMN flyer_filename VARCHAR(255);
