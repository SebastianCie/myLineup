ALTER TABLE levels ADD COLUMN sort_order INT NOT NULL DEFAULT 0;

-- Bestehende Level erhalten eine Reihenfolge passend zu ihrer Anlage-Reihenfolge (nach id).
WITH ordered AS (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY event_id ORDER BY id) - 1 AS rn
    FROM levels
)
UPDATE levels
SET sort_order = ordered.rn
FROM ordered
WHERE levels.id = ordered.id;
