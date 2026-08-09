import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, type MapEvent } from "../api";
import { clusterEvents, type EventCluster } from "../cluster";
import { MAP_HEIGHT, MAP_WIDTH } from "../germanyMap";
import GermanyOutline from "../GermanyOutline";
import { formatDateRange } from "../dateFormat";

export default function MapPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<MapEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<EventCluster | null>(null);

  useEffect(() => {
    api
      .listMapEvents()
      .then(setEvents)
      .catch(() => setError("Karte konnte nicht geladen werden"))
      .finally(() => setLoading(false));
  }, []);

  const clusters = clusterEvents(events);

  function handleClusterClick(cluster: EventCluster) {
    if (cluster.events.length === 1) {
      navigate(`/e/${cluster.events[0].publicToken}`);
    } else {
      setSelected(cluster);
    }
  }

  return (
    <div className="screen">
      <header className="topbar">
        <h1>Events in Deutschland</h1>
      </header>

      <main className="content map-content">
        {loading && <p className="hint">Lädt…</p>}
        {error && <p className="hint error">{error}</p>}
        {!loading && !error && events.length === 0 && (
          <p className="hint">Aktuell sind keine Events auf der Karte sichtbar.</p>
        )}

        {!loading && !error && events.length > 0 && (
          <svg
            className="germany-map"
            viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
            role="img"
            aria-label="Karte Deutschlands mit Event-Standorten"
          >
            <g className="germany-map-outline">
              <GermanyOutline />
            </g>
            {clusters.map((cluster, i) => (
              <g
                key={i}
                className="map-pin"
                transform={`translate(${cluster.x}, ${cluster.y})`}
                onClick={() => handleClusterClick(cluster)}
              >
                <circle r={cluster.events.length > 1 ? 30 : 24} />
                <text textAnchor="middle" dominantBaseline="central">
                  {cluster.events.length}
                </text>
              </g>
            ))}
          </svg>
        )}
      </main>

      {selected && (
        <div className="sheet-overlay" onClick={() => setSelected(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <h2>{selected.events.length} Events in dieser Region</h2>
            <ul className="list">
              {selected.events.map((event) => (
                <li key={event.id} className="card" onClick={() => navigate(`/e/${event.publicToken}`)}>
                  <p>{event.name}</p>
                  <time>
                    {formatDateRange(event.startDate, event.endDate)}
                    {event.city && ` · ${event.city}`}
                  </time>
                </li>
              ))}
            </ul>
            <button type="button" onClick={() => setSelected(null)}>
              Schließen
            </button>
          </div>
        </div>
      )}

      <nav className="tabbar">
        <Link to="/karte" className="active">
          Karte
        </Link>
        <Link to="/liste">Liste</Link>
      </nav>
    </div>
  );
}
