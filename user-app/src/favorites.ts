// Favoriten werden pro Event im LocalStorage abgelegt (Agenda-Item-IDs). Funktioniert
// unabhängig davon, ob der Besucher ein Konto hat oder nicht (siehe Onboarding-Entscheidung).
function storageKey(eventToken: string): string {
  return `mylineup_favorites_${eventToken}`;
}

export function getFavoriteIds(eventToken: string): number[] {
  try {
    const raw = localStorage.getItem(storageKey(eventToken));
    return raw ? (JSON.parse(raw) as number[]) : [];
  } catch {
    return [];
  }
}

export function toggleFavorite(eventToken: string, agendaItemId: number): number[] {
  const current = getFavoriteIds(eventToken);
  const next = current.includes(agendaItemId)
    ? current.filter((id) => id !== agendaItemId)
    : [...current, agendaItemId];
  localStorage.setItem(storageKey(eventToken), JSON.stringify(next));
  return next;
}
