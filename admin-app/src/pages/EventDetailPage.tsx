import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, eventFlyerUrl, eventLogoUrl, type Event, type Level, type Room, type Speaker } from "../api";
import SpeakersTab from "./event-detail/SpeakersTab";
import RoomsTab from "./event-detail/RoomsTab";
import LevelsTab from "./event-detail/LevelsTab";
import AgendaTab from "./event-detail/AgendaTab";
import DashboardTab from "./event-detail/DashboardTab";
import EventEditForm from "./event-detail/EventEditForm";
import EventShareCard from "./event-detail/EventShareCard";
import { formatDateRange } from "../dateFormat";
import { formatAddress } from "../address";

type Tab = "details" | "speakers" | "rooms" | "levels" | "agenda" | "dashboard";

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const eventId = Number(id);

  const [event, setEvent] = useState<Event | null>(null);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [tab, setTab] = useState<Tab>("details");
  const [editingEvent, setEditingEvent] = useState(false);
  const [mediaVersion, setLogoVersion] = useState(0);
  const [loading, setLoading] = useState(true);

  function reloadSpeakers() {
    api.listSpeakers(eventId).then(setSpeakers);
  }

  function reloadRooms() {
    api.listRooms(eventId).then(setRooms);
  }

  function reloadLevels() {
    api.listLevels(eventId).then(setLevels);
  }

  useEffect(() => {
    Promise.all([
      api.getEvent(eventId),
      api.listSpeakers(eventId),
      api.listRooms(eventId),
      api.listLevels(eventId),
    ])
      .then(([ev, sp, rm, lv]) => {
        setEvent(ev);
        setSpeakers(sp);
        setRooms(rm);
        setLevels(lv);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  if (loading) {
    return <p className="loading">Lädt…</p>;
  }
  if (!event) {
    return <p className="loading">Event nicht gefunden.</p>;
  }

  return (
    <div className="page">
      <header className="page-header">
        <div className="event-header">
          {event.hasLogo && (
            <img
              className="event-header-logo"
              src={`${eventLogoUrl(event.id)}?v=${mediaVersion}`}
              alt=""
            />
          )}
          <div>
            <h1>{event.name}</h1>
            <p className="muted">
              {formatDateRange(event.startDate, event.endDate)}
              {formatAddress(event) && ` · ${formatAddress(event)}`}
              {event.homepage && (
                <>
                  {" · "}
                  <a href={event.homepage} target="_blank" rel="noreferrer">
                    Homepage
                  </a>
                </>
              )}
            </p>
          </div>
        </div>
        <div className="page-header-actions">
          <Link to="/">Zurück</Link>
        </div>
      </header>

      <nav className="tabs">
        <button type="button" className={tab === "details" ? "active" : ""} onClick={() => setTab("details")}>
          Details
        </button>
        <button type="button" className={tab === "speakers" ? "active" : ""} onClick={() => setTab("speakers")}>
          Dozenten
        </button>
        <button type="button" className={tab === "rooms" ? "active" : ""} onClick={() => setTab("rooms")}>
          Räume
        </button>
        <button type="button" className={tab === "levels" ? "active" : ""} onClick={() => setTab("levels")}>
          Level
        </button>
        <button type="button" className={tab === "agenda" ? "active" : ""} onClick={() => setTab("agenda")}>
          Agenda
        </button>
        <button type="button" className={tab === "dashboard" ? "active" : ""} onClick={() => setTab("dashboard")}>
          Dashboard
        </button>
      </nav>

      {tab === "details" && (
        <div className="tab-panel">
          <div className="page-toolbar">
            <h2>Event-Details</h2>
            <button type="button" onClick={() => setEditingEvent((v) => !v)}>
              {editingEvent ? "Bearbeiten schließen" : "Event bearbeiten"}
            </button>
          </div>

          {event.description && <p className="description-text">{event.description}</p>}

          {event.hasFlyer && (
            <img
              className="event-flyer-preview"
              src={`${eventFlyerUrl(event.id)}?v=${mediaVersion}`}
              alt="Flyer"
            />
          )}

          <EventShareCard publicToken={event.publicToken} />

          {editingEvent && (
            <EventEditForm
              event={event}
              onCancel={() => setEditingEvent(false)}
              onSaved={(updated) => {
                setEvent(updated);
                setEditingEvent(false);
                setLogoVersion((v) => v + 1);
              }}
            />
          )}
        </div>
      )}

      {tab === "speakers" && (
        <SpeakersTab eventId={eventId} speakers={speakers} onChange={reloadSpeakers} />
      )}
      {tab === "rooms" && <RoomsTab eventId={eventId} rooms={rooms} onChange={reloadRooms} />}
      {tab === "levels" && <LevelsTab eventId={eventId} levels={levels} onChange={reloadLevels} />}
      {tab === "agenda" && (
        <AgendaTab
          eventId={eventId}
          startDate={event.startDate}
          endDate={event.endDate}
          rooms={rooms}
          speakers={speakers}
          levels={levels}
        />
      )}
      {tab === "dashboard" && (
        <DashboardTab
          eventId={eventId}
          startDate={event.startDate}
          endDate={event.endDate}
          rooms={rooms}
          speakers={speakers}
          levels={levels}
        />
      )}
    </div>
  );
}
