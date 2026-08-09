import type { AgendaItemType } from "./api";

/**
 * Liefert für einen beliebigen Hex-Hintergrund die besser lesbare Textfarbe
 * (Schwarz oder Weiß), basierend auf WCAG-Kontrastberechnung. So bleiben auch
 * frei wählbare Level-Farben immer ausreichend kontrastreich.
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

// Feste, klar unterscheidbare Farben je Agenda-Typ (Kontrast mit readableTextColor geprüft).
export const AGENDA_TYPE_COLORS: Record<AgendaItemType, string> = {
  REGISTRATION: "#4A7FB5",
  WORKSHOP: "#AC3B61",
  BREAK: "#8B8489",
  PARTY: "#C68A2E",
};

// Kuratierte Palette für die zufällige Standardfarbe neuer Level (identisch zur
// Backend-Palette in LevelResource, damit Vorschau und tatsächlich gespeicherte
// Farbe übereinstimmen). Jede Farbe erreicht mit schwarzem oder weißem Text ≥4.5:1.
export const RANDOM_LEVEL_COLORS = [
  "#4A7FB5",
  "#5B8C5A",
  "#C68A2E",
  "#AC3B61",
  "#7B5EA7",
  "#3F9C8A",
  "#C1622D",
  "#8B8489",
  "#B5566B",
  "#456C86",
];

export function randomLevelColor(): string {
  return RANDOM_LEVEL_COLORS[Math.floor(Math.random() * RANDOM_LEVEL_COLORS.length)];
}

// Gleiche Palette, generischer Name für andere farbige Badges (z.B. Räume).
export const randomColor = randomLevelColor;
