import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  api,
  eventFlyerUrl,
  eventLogoUrl,
  type AgendaLevel,
  type AgendaRoom,
  type AgendaSpeaker,
  type PublicAgendaItem,
  type PublicEventDetail,
  type PublicSpeakerDetail,
} from "../api";
import { formatDate, formatDateRange, formatDayShort } from "../dateFormat";
import { AGENDA_TYPE_COLORS, AGENDA_TYPE_LABELS, readableTextColor } from "../colors";
import { getFavoriteIds, toggleFavorite } from "../favorites";
import MultiSelect from "../MultiSelect";

type View = "home" | "programm" | "favoriten" | "dozenten";

function formatAddress(e: PublicEventDetail): string {
  const line1 = e.street?.trim() || "";
  const cityLine = [e.postalCode?.trim(), e.city?.trim()].filter(Boolean).join(" ");
  return [line1, cityLine, e.country?.trim()].filter(Boolean).join(", ");
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Baut die Tagesliste aus den lokalen Datumsanteilen (nicht toISOString(), das würde
// bei Zeitzonen westlich von UTC auf den Vortag zurückrunden).
function dateRange(start: string, end: string): string[] {
  const days: string[] = [];
  const cur = new Date(`${start}T00:00:00`);
  const last = new Date(`${end}T00:00:00`);
  while (cur <= last) {
    days.push(toIsoDate(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

function uniqueBy<T extends { id: number }>(items: T[]): T[] {
  const seen = new Map<number, T>();
  for (const item of items) {
    if (!seen.has(item.id)) seen.set(item.id, item);
  }
  return Array.from(seen.values());
}

function speakerSubtitle(s: { country: string | null; city: string | null }): string {
  return [s.city, s.country].filter(Boolean).join(", ");
}

function HomeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5.5 10v9a1 1 0 0 0 1 1H9v-6h6v6h2.5a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}

function ProgramIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4.5" width="14" height="14" rx="2" />
      <path d="M7 3v3M13 3v3M3 9.5h14" />
      <circle cx="17.5" cy="15.5" r="4.5" fill="var(--surface)" />
      <path d="M17.5 13v2.5l1.6 1" />
    </svg>
  );
}

function StarIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m12 3 2.7 5.9 6.3.7-4.7 4.4 1.2 6.3L12 17.3l-5.5 3 1.2-6.3-4.7-4.4 6.3-.7z" />
    </svg>
  );
}

function SpeakerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20c1.2-4 4-6 7.5-6s6.3 2 7.5 6" />
    </svg>
  );
}

interface DayTabsProps {
  days: string[];
  activeDay: string | null;
  onSelect: (day: string) => void;
}

function DayTabs({ days, activeDay, onSelect }: DayTabsProps) {
  return (
    <div className="day-tabs">
      {days.map((d) => (
        <button key={d} type="button" className={d === activeDay ? "active" : ""} onClick={() => onSelect(d)}>
          {formatDayShort(d)}
        </button>
      ))}
    </div>
  );
}

interface AgendaCardProps {
  item: PublicAgendaItem;
  favorited: boolean;
  showDay?: boolean;
  onClick: () => void;
}

function AgendaCard({ item, favorited, showDay, onClick }: AgendaCardProps) {
  const timeText = [showDay ? formatDayShort(item.day) : null, `${item.startTime.slice(0, 5)} – ${item.endTime.slice(0, 5)}`]
    .filter(Boolean)
    .join(" · ");

  return (
    <li className="card agenda-card" onClick={onClick}>
      <div className="agenda-card-line1">
        <span
          className="badge"
          style={{ background: AGENDA_TYPE_COLORS[item.type], color: readableTextColor(AGENDA_TYPE_COLORS[item.type]) }}
        >
          {AGENDA_TYPE_LABELS[item.type]}
        </span>
        {item.level && (
          <span className="badge" style={{ background: item.level.color, color: readableTextColor(item.level.color) }}>
            {item.level.name}
          </span>
        )}
        {item.room && (
          <span
            className="badge agenda-card-room"
            style={{ background: item.room.color, color: readableTextColor(item.room.color) }}
          >
            {item.room.name}
          </span>
        )}
      </div>
      <div className="agenda-card-title-row">
        <span className="agenda-card-title">{item.title}</span>
        {favorited && (
          <span className="agenda-card-fav">
            <StarIcon filled />
          </span>
        )}
      </div>
      <div className="agenda-card-line2">
        <span>{timeText}</span>
        {item.speaker && <span>{item.speaker.name}</span>}
      </div>
    </li>
  );
}

export default function EventPage() {
  const { token } = useParams<{ token: string }>();
  const [event, setEvent] = useState<PublicEventDetail | null>(null);
  const [agenda, setAgenda] = useState<PublicAgendaItem[]>([]);
  const [speakerList, setSpeakerList] = useState<PublicSpeakerDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<View>("home");

  const [activeDay, setActiveDay] = useState<string | null>(null);
  const [roomFilters, setRoomFilters] = useState<number[]>([]);
  const [levelFilters, setLevelFilters] = useState<number[]>([]);
  const [speakerFilters, setSpeakerFilters] = useState<number[]>([]);

  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [selectedItem, setSelectedItem] = useState<PublicAgendaItem | null>(null);
  const [selectedSpeaker, setSelectedSpeaker] = useState<PublicSpeakerDetail | null>(null);

  useEffect(() => {
    if (!token) return;
    setFavoriteIds(getFavoriteIds(token));
    Promise.all([api.getEventByToken(token), api.getEventAgenda(token), api.getEventSpeakers(token)])
      .then(([eventDetail, agendaItems, speakersList]) => {
        setEvent(eventDetail);
        setAgenda(agendaItems);
        setSpeakerList(speakersList);
        const days = dateRange(eventDetail.startDate, eventDetail.endDate);
        setActiveDay(days[0] ?? null);
      })
      .catch(() => setError("Event nicht gefunden"))
      .finally(() => setLoading(false));
  }, [token]);

  const days = event ? dateRange(event.startDate, event.endDate) : [];

  const rooms: AgendaRoom[] = useMemo(
    () => uniqueBy(agenda.map((a) => a.room).filter((r): r is AgendaRoom => !!r)),
    [agenda],
  );
  const levels: AgendaLevel[] = useMemo(
    () => uniqueBy(agenda.map((a) => a.level).filter((l): l is AgendaLevel => !!l)),
    [agenda],
  );
  const speakers: AgendaSpeaker[] = useMemo(
    () => uniqueBy(agenda.map((a) => a.speaker).filter((s): s is AgendaSpeaker => !!s)),
    [agenda],
  );

  const dayItems = useMemo(
    () =>
      agenda
        .filter((item) => item.day === activeDay)
        .filter((item) => roomFilters.length === 0 || (item.room != null && roomFilters.includes(item.room.id)))
        .filter((item) => levelFilters.length === 0 || (item.level != null && levelFilters.includes(item.level.id)))
        .filter(
          (item) => speakerFilters.length === 0 || (item.speaker != null && speakerFilters.includes(item.speaker.id)),
        )
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [agenda, activeDay, roomFilters, levelFilters, speakerFilters],
  );

  const favoriteItems = useMemo(
    () =>
      agenda
        .filter((item) => favoriteIds.includes(item.id))
        .sort((a, b) => (a.day === b.day ? a.startTime.localeCompare(b.startTime) : a.day.localeCompare(b.day))),
    [agenda, favoriteIds],
  );

  const favoriteDayItems = useMemo(
    () => favoriteItems.filter((item) => item.day === activeDay).sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [favoriteItems, activeDay],
  );

  function handleToggleFavorite(id: number) {
    if (!token) return;
    setFavoriteIds(toggleFavorite(token, id));
  }

  return (
    <div className="screen">
      <header className="topbar">
        <Link to="/karte" className="back-link">
          ← Events
        </Link>
        <h1>{event?.name ?? "Event"}</h1>
        {event && view === "home" && (
          <>
            <p className="event-detail-subtitle">{formatDateRange(event.startDate, event.endDate)}</p>
            {formatAddress(event) && <p className="event-detail-subtitle">{formatAddress(event)}</p>}
          </>
        )}
      </header>

      <main className="content">
        {loading && <p className="hint">Lädt…</p>}
        {error && <p className="hint error">{error}</p>}

        {event && view === "home" && (
          <div className="event-detail">
            {event.hasLogo && <img className="event-detail-logo" src={eventLogoUrl(event.id)} alt="" />}
            {event.hasFlyer && (
              <img className="event-flyer" src={eventFlyerUrl(event.id)} alt="Flyer" />
            )}
            {event.description && <p className="description-text">{event.description}</p>}
            {event.homepage && (
              <p>
                <a href={event.homepage} target="_blank" rel="noreferrer">
                  Zur Event-Homepage
                </a>
              </p>
            )}
          </div>
        )}

        {event && view === "programm" && days.length > 0 && (
          <div className="program">
            <DayTabs days={days} activeDay={activeDay} onSelect={setActiveDay} />

            <div className="filter-bar">
              <MultiSelect
                label="Räume"
                options={rooms.map((r) => ({ id: r.id, label: r.name }))}
                selected={roomFilters}
                onChange={setRoomFilters}
              />
              <MultiSelect
                label="Level"
                options={levels.map((l) => ({ id: l.id, label: l.name }))}
                selected={levelFilters}
                onChange={setLevelFilters}
              />
              <MultiSelect
                label="Dozenten"
                options={speakers.map((s) => ({ id: s.id, label: s.name }))}
                selected={speakerFilters}
                onChange={setSpeakerFilters}
              />
            </div>

            {dayItems.length === 0 && <p className="hint">Keine Einträge gefunden.</p>}

            <ul className="list agenda-list">
              {dayItems.map((item) => (
                <AgendaCard
                  key={item.id}
                  item={item}
                  favorited={favoriteIds.includes(item.id)}
                  onClick={() => setSelectedItem(item)}
                />
              ))}
            </ul>
          </div>
        )}

        {event && view === "programm" && days.length === 0 && (
          <p className="hint">Für dieses Event gibt es noch kein Programm.</p>
        )}

        {event && view === "favoriten" && days.length > 0 && (
          <div className="program">
            <DayTabs days={days} activeDay={activeDay} onSelect={setActiveDay} />

            {favoriteItems.length === 0 && (
              <p className="hint">Noch keine Favoriten. Tippe im Programm auf einen Eintrag, um ihn zu favorisieren.</p>
            )}
            {favoriteItems.length > 0 && favoriteDayItems.length === 0 && (
              <p className="hint">Keine Favoriten an diesem Tag.</p>
            )}

            <ul className="list agenda-list">
              {favoriteDayItems.map((item) => (
                <AgendaCard key={item.id} item={item} favorited onClick={() => setSelectedItem(item)} />
              ))}
            </ul>
          </div>
        )}

        {event && view === "dozenten" && (
          <div className="program">
            {speakerList.length === 0 && <p className="hint">Noch keine Dozenten hinterlegt.</p>}
            <ul className="list">
              {speakerList.map((s) => (
                <li key={s.id} className="card" onClick={() => setSelectedSpeaker(s)}>
                  <p>{s.name}</p>
                  {speakerSubtitle(s) && <time>{speakerSubtitle(s)}</time>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>

      {selectedItem && (
        <div className="sheet-overlay" onClick={() => setSelectedItem(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <span
              className="badge"
              style={{ background: AGENDA_TYPE_COLORS[selectedItem.type], color: readableTextColor(AGENDA_TYPE_COLORS[selectedItem.type]) }}
            >
              {AGENDA_TYPE_LABELS[selectedItem.type]}
            </span>
            {selectedItem.level && (
              <span className="badge" style={{ background: selectedItem.level.color, color: readableTextColor(selectedItem.level.color) }}>
                {selectedItem.level.name}
              </span>
            )}
            {selectedItem.room && (
              <span className="badge" style={{ background: selectedItem.room.color, color: readableTextColor(selectedItem.room.color) }}>
                {selectedItem.room.name}
              </span>
            )}
            <h2>{selectedItem.title}</h2>
            <p className="sheet-meta">
              {formatDate(selectedItem.day)} · {selectedItem.startTime.slice(0, 5)} – {selectedItem.endTime.slice(0, 5)}
            </p>
            {selectedItem.speaker && (
              <p className="sheet-meta">
                {selectedItem.speaker.name}
                {speakerSubtitle(selectedItem.speaker) && ` (${speakerSubtitle(selectedItem.speaker)})`}
              </p>
            )}
            {selectedItem.description && <p className="description-text">{selectedItem.description}</p>}
            <button type="button" className="favorite-toggle" onClick={() => handleToggleFavorite(selectedItem.id)}>
              <StarIcon filled={favoriteIds.includes(selectedItem.id)} />
              {favoriteIds.includes(selectedItem.id) ? "Favorit entfernen" : "Favorisieren"}
            </button>
            <button type="button" onClick={() => setSelectedItem(null)}>
              Schließen
            </button>
          </div>
        </div>
      )}

      {selectedSpeaker && (
        <div className="sheet-overlay" onClick={() => setSelectedSpeaker(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <h2>
              {selectedSpeaker.name}
              {speakerSubtitle(selectedSpeaker) && ` (${speakerSubtitle(selectedSpeaker)})`}
            </h2>
            {selectedSpeaker.description && <p className="description-text">{selectedSpeaker.description}</p>}
            <button type="button" onClick={() => setSelectedSpeaker(null)}>
              Schließen
            </button>
          </div>
        </div>
      )}

      <nav className="tabbar">
        <button type="button" className={view === "home" ? "active" : ""} onClick={() => setView("home")} aria-label="Start" title="Start">
          <HomeIcon />
        </button>
        <button type="button" className={view === "programm" ? "active" : ""} onClick={() => setView("programm")} aria-label="Programm" title="Programm">
          <ProgramIcon />
        </button>
        <button type="button" className={view === "favoriten" ? "active" : ""} onClick={() => setView("favoriten")} aria-label="Favoriten" title="Favoriten">
          <StarIcon filled={view === "favoriten"} />
        </button>
        <button type="button" className={view === "dozenten" ? "active" : ""} onClick={() => setView("dozenten")} aria-label="Dozenten" title="Dozenten">
          <SpeakerIcon />
        </button>
      </nav>
    </div>
  );
}
