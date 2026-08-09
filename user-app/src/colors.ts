import type { AgendaItemType } from "./api";

/**
 * Liefert für einen beliebigen Hex-Hintergrund die besser lesbare Textfarbe
 * (Schwarz oder Weiß), basierend auf WCAG-Kontrastberechnung.
 */
export function readableTextColor(bgHex: string): string {
  const hex = bgHex.replace("#", "");
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  const chan = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const luminance = 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b);
  const contrastWithWhite = 1.05 / (luminance + 0.05);
  const contrastWithBlack = (luminance + 0.05) / 0.05;
  return contrastWithBlack >= contrastWithWhite ? "#141414" : "#ffffff";
}

// Feste, klar unterscheidbare Farben je Agenda-Typ, identisch zur admin-app.
export const AGENDA_TYPE_COLORS: Record<AgendaItemType, string> = {
  REGISTRATION: "#4A7FB5",
  WORKSHOP: "#AC3B61",
  BREAK: "#8B8489",
  PARTY: "#C68A2E",
};

export const AGENDA_TYPE_LABELS: Record<AgendaItemType, string> = {
  REGISTRATION: "Registrierung",
  WORKSHOP: "Workshop",
  BREAK: "Pause",
  PARTY: "Party",
};
