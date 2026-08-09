import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, type MapEvent } from "../api";
import { formatDateRange } from "../dateFormat";

type SortDirection = "asc" | "desc";

export default function ListPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<MapEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bundesland, setBundesland] = useState<string>("");
  const [plz, setPlz] = useState<string>("");
  const [sort, setSort] = useState<SortDirection>("asc");

  useEffect(() => {
    api
      .listMapEvents()
      .then(setEvents)
      .catch(() => setError("Events konnten nicht geladen werden"))
      .finally(() => setLoading(false));
  }, []);

  const bundeslaender = useMemo(() => {
    const values = new Set(events.map((e) => e.bundesland).filter((b): b is string => !!b));
    return Array.from(values).sort((a, b) => a.localeCompare(b, "de"));
  }, [events]);

  const filtered = useMemo(() => {
    const plzQuery = plz.trim();
    const result = events.filter((event) => {
      if (bundesland && event.bundesland !== bundesland) return false;
      if (plzQuery && !(event.postalCode ?? "").startsWith(plzQuery)) return false;
      return true;
    });
    result.sort((a, b) =>
      sort === "asc" ? a.startDate.localeCompare(b.startDate) : b.startDate.localeCompare(a.startDate),
    );
    return result;
  }, [events, bundesland, plz, sort]);

  return (
    <div className="screen">
      <header className="topbar">
        <h1>Events in Deutschland</h1>
      </header>

      <main className="content">
        {loading && <p className="hint">Lädt…</p>}
        {error && <p className="hint error">{error}</p>}

        {!loading && !error && (
          <>
            <div className="filter-bar">
              <select
                value={bundesland}
                onChange={(e) => setBundesland(e.target.value)}
                aria-label="Nach Bundesland filtern"
              >
                <option value="">Alle Bundesländer</option>
                {bundeslaender.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
              <input
                type="text"
                inputMode="numeric"
                placeholder="PLZ"
                value={plz}
                onChange={(e) => setPlz(e.target.value)}
                aria-label="Nach PLZ filtern"
              />
              <button
                type="button"
                className="sort-toggle"
                onClick={() => setSort((s) => (s === "asc" ? "desc" : "asc"))}
                title="Sortierung nach Startdatum umkehren"
              >
                Datum {sort === "asc" ? "↑" : "↓"}
              </button>
            </div>

            {filtered.length === 0 && <p className="hint">Keine Events gefunden.</p>}

            <ul className="list">
              {filtered.map((event) => (
                <li key={event.id} className="card" onClick={() => navigate(`/e/${event.publicToken}`)}>
                  <p>{event.name}</p>
                  <time>
                    {formatDateRange(event.startDate, event.endDate)}
                    {event.city && ` · ${event.city}`}
                    {event.bundesland && ` · ${event.bundesland}`}
                  </time>
                </li>
              ))}
            </ul>
          </>
        )}
      </main>

      <nav className="tabbar">
        <Link to="/karte">Karte</Link>
        <Link to="/liste" className="active">
          Liste
        </Link>
      </nav>
    </div>
  );
}
