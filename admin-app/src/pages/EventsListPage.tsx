import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, eventLogoUrl, type Event } from "../api";
import { useAuth } from "../AuthContext";
import { formatDateRange } from "../dateFormat";

export default function EventsListPage() {
  const { admin, logout } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .listEvents()
      .then(setEvents)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <header className="page-header">
        <h1>MyLineup Admin</h1>
        <div className="page-header-actions">
          <span className="muted">{admin?.name}</span>
          <button type="button" onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      <div className="page-toolbar">
        <h2>Meine Events</h2>
        <Link className="button" to="/events/new">
          + Neues Event
        </Link>
      </div>

      {loading && <p className="muted">Lädt…</p>}
      {!loading && events.length === 0 && <p className="muted">Noch keine Events angelegt.</p>}

      <div className="event-grid">
        {events.map((event) => (
          <Link key={event.id} to={`/events/${event.id}`} className="event-card">
            {event.hasLogo ? (
              <img className="event-card-logo" src={eventLogoUrl(event.id)} alt="" />
            ) : (
              <div className="event-card-logo event-card-logo--placeholder">{event.name[0]}</div>
            )}
            <div>
              <h3>{event.name}</h3>
              <p className="muted">{formatDateRange(event.startDate, event.endDate)}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
