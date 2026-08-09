/**
 * Formatiert ein ISO-Datum (yyyy-mm-dd) in der Sprache des Browsers, inkl.
 * Wochentag, z.B. "Fr., 28.08.2026" (de) oder "Fri, 08/28/2026" (en).
 * "T00:00:00" statt "Z" verhindert einen Tagesversatz durch Zeitzonen.
 */
export function formatDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`);
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateRange(startIso: string, endIso: string): string {
  return `${formatDate(startIso)} – ${formatDate(endIso)}`;
}

/** Wie formatDate, aber ohne Jahr — spart Platz z.B. in Tages-Reitern. */
export function formatDayShort(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`);
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
}
