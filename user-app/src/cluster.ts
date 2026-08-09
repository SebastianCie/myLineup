import type { MapEvent } from "./api";
import { project } from "./germanyMap";

export interface EventCluster {
  x: number;
  y: number;
  events: MapEvent[];
}

const CLUSTER_RADIUS = 50; // SVG-Einheiten; deckt Nachbarstädte ab (Leipzig/Halle ~41,
// Dortmund/Wuppertal ~38), ohne echte eigenständige Metropolregionen zu verschmelzen
// (Hamburg/Bremen ~98).

/** Gruppiert geografisch nahe Events (fester Radius) zu Clustern für die Kartenanzeige. */
export function clusterEvents(events: MapEvent[]): EventCluster[] {
  const points = events.map((event) => ({ event, ...project(event.lat, event.lng) }));
  const clusters: EventCluster[] = [];
  const used = new Set<number>();

  for (let i = 0; i < points.length; i++) {
    if (used.has(i)) continue;
    const group = [points[i]];
    used.add(i);
    for (let j = i + 1; j < points.length; j++) {
      if (used.has(j)) continue;
      const dx = points[i].x - points[j].x;
      const dy = points[i].y - points[j].y;
      if (Math.sqrt(dx * dx + dy * dy) <= CLUSTER_RADIUS) {
        group.push(points[j]);
        used.add(j);
      }
    }
    const x = group.reduce((sum, p) => sum + p.x, 0) / group.length;
    const y = group.reduce((sum, p) => sum + p.y, 0) / group.length;
    clusters.push({ x, y, events: group.map((p) => p.event) });
  }

  return clusters;
}
