ALTER TABLE levels ADD COLUMN color VARCHAR(7) NOT NULL DEFAULT '#AC3B61';

-- Bestehende Level erhalten eine zufällige, kontraststarke Farbe aus der kuratierten Palette
-- (dieselbe Liste wie LevelResource#RANDOM_COLORS, damit Bestand und Neuanlage konsistent sind).
WITH palette AS (
    SELECT unnest(ARRAY[
        '#4A7FB5', '#5B8C5A', '#C68A2E', '#AC3B61', '#7B5EA7',
        '#3F9C8A', '#C1622D', '#8B8489', '#B5566B', '#456C86'
    ]) AS hex
),
numbered AS (
    SELECT hex, ROW_NUMBER() OVER () AS rn FROM palette
),
count AS (
    SELECT count(*) AS n FROM palette
)
UPDATE levels
SET color = numbered.hex
FROM numbered, count
WHERE numbered.rn = (levels.id % count.n) + 1;
