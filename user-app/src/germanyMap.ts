// Affine Lat/Lng->SVG-Projektion, kalibriert anhand von 3 bekannten Referenzpunkten
// aus der Deutschlandkarte (simplemaps.com, viewBox 0 0 1000 1000).
export const MAP_WIDTH = 1000;
export const MAP_HEIGHT = 1000;

export function project(lat: number, lng: number): { x: number; y: number } {
  const x = 72.87389252015663 * lng + 0.02851117983285352 * lat - 262.0636953078913;
  const y = 16.709859957648433 * lng - 136.2264172413614 * lat + 7299.708930483029;
  return { x, y };
}
