import { useEffect, useState, type FormEvent } from "react";
import {
  api,
  ApiError,
  type AgendaItem,
  type AgendaItemType,
  type Level,
  type Room,
  type Speaker,
} from "../../api";
import { AGENDA_TYPE_COLORS, readableTextColor } from "../../colors";
import { formatDate } from "../../dateFormat";
import Modal from "../../Modal";

interface Props {
  eventId: number;
  startDate: string;
  endDate: string;
  rooms: Room[];
  speakers: Speaker[];
  levels: Level[];
}

const TYPE_LABELS: Record<AgendaItemType, string> = {
  REGISTRATION: "Registrierung",
  WORKSHOP: "Workshop",
  BREAK: "Pause",
  PARTY: "Party",
};

function dateRange(start: string, end: string): string[] {
  const days: string[] = [];
  const cur = new Date(start);
  const last = new Date(end);
  while (cur <= last) {
    days.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

const EMPTY_FORM = {
  type: "WORKSHOP" as AgendaItemType,
  title: "",
  startTime: "",
  endTime: "",
  description: "",
  roomId: "",
  speakerId: "",
  levelId: "",
};

export default function AgendaTab({ eventId, startDate, endDate, rooms, speakers, levels }: Props) {
  const days = dateRange(startDate, endDate);
  const [day, setDay] = useState(days[0] ?? startDate);
  const [items, setItems] = useState<AgendaItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const formOpen = creating || editingId != null;

  function reload(forDay: string) {
    setLoading(true);
    api
      .listAgendaItems(eventId, forDay)
      .then(setItems)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    reload(day);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day]);

  function startCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
    setCreating(true);
  }

  function startEdit(item: AgendaItem) {
    setEditingId(item.id);
    setForm({
      type: item.type,
      title: item.title,
      startTime: item.startTime.slice(0, 5),
      endTime: item.endTime.slice(0, 5),
      description: item.description ?? "",
      roomId: item.roomId != null ? String(item.roomId) : "",
      speakerId: item.speakerId != null ? String(item.speakerId) : "",
      levelId: item.levelId != null ? String(item.levelId) : "",
    });
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setCreating(false);
    setForm(EMPTY_FORM);
    setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        type: form.type,
        title: form.title,
        day,
        startTime: form.startTime ? `${form.startTime}:00` : "",
        endTime: form.endTime ? `${form.endTime}:00` : "",
        description: form.description,
        roomId: form.roomId ? Number(form.roomId) : null,
        speakerId: form.type === "WORKSHOP" && form.speakerId ? Number(form.speakerId) : null,
        levelId: form.type === "WORKSHOP" && form.levelId ? Number(form.levelId) : null,
      };
      if (editingId != null) {
        await api.updateAgendaItem(eventId, editingId, payload);
      } else {
        await api.createAgendaItem(eventId, payload);
      }
      setForm(EMPTY_FORM);
      setEditingId(null);
      setCreating(false);
      reload(day);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Eintrag konnte nicht gespeichert werden");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    await api.deleteAgendaItem(eventId, id);
    if (editingId === id) cancelEdit();
    reload(day);
  }

  function roomName(id: number | null) {
    return id ? rooms.find((r) => r.id === id)?.name : undefined;
  }

  function speakerName(id: number | null) {
    return id ? speakers.find((s) => s.id === id)?.name : undefined;
  }

  function levelOf(id: number | null) {
    return id ? levels.find((l) => l.id === id) : undefined;
  }

  return (
    <div className="tab-panel">
      <div className="day-tabs">
        {days.map((d) => (
          <button
            key={d}
            type="button"
            className={d === day ? "active" : ""}
            onClick={() => {
              setDay(d);
              cancelEdit();
            }}
          >
            {formatDate(d)}
          </button>
        ))}
      </div>

      <div className="page-toolbar">
        <h2>Programm – {formatDate(day)}</h2>
        <button type="button" onClick={startCreate}>
          + Programmpunkt hinzufügen
        </button>
      </div>

      {loading && <p className="muted">Lädt…</p>}
      <ul className="item-list">
        {!loading &&
          items.map((item) => (
            <li key={item.id} className="item-row">
              <div>
                <strong>{item.title}</strong>
                <br />
                <span
                  className="badge"
                  style={{
                    background: AGENDA_TYPE_COLORS[item.type],
                    color: readableTextColor(AGENDA_TYPE_COLORS[item.type]),
                  }}
                >
                  {TYPE_LABELS[item.type]}
                </span>{" "}
                <span className="muted">
                  {item.startTime.slice(0, 5)} – {item.endTime.slice(0, 5)}
                </span>
                {roomName(item.roomId) && <span className="muted"> · {roomName(item.roomId)}</span>}
                {speakerName(item.speakerId) && (
                  <span className="muted"> · {speakerName(item.speakerId)}</span>
                )}
                {levelOf(item.levelId) && (
                  <span
                    className="badge"
                    style={{
                      background: levelOf(item.levelId)!.color,
                      color: readableTextColor(levelOf(item.levelId)!.color),
                    }}
                  >
                    {levelOf(item.levelId)!.name}
                  </span>
                )}
                {item.description && <p className="muted description-text">{item.description}</p>}
              </div>
              <div className="item-row-actions">
                <button type="button" onClick={() => startEdit(item)}>
                  Bearbeiten
                </button>
                <button type="button" onClick={() => handleDelete(item.id)}>
                  Löschen
                </button>
              </div>
            </li>
          ))}
        {!loading && items.length === 0 && <p className="muted">Noch keine Einträge an diesem Tag.</p>}
      </ul>

      {formOpen && (
        <Modal onClose={cancelEdit}>
          <form className="panel-form" onSubmit={handleSubmit}>
            <h3>{editingId != null ? "Programmpunkt bearbeiten" : "Programmpunkt hinzufügen"}</h3>
            <label>
              Titel
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </label>
            <label>
              Typ
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as AgendaItemType })}
              >
                {Object.entries(TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <div className="form-row">
              <label>
                Startzeit
                <input
                  type="time"
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                  required
                />
              </label>
              <label>
                Endzeit
                <input
                  type="time"
                  value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                  required
                />
              </label>
            </div>
            <label>
              Raum {form.type !== "WORKSHOP" && "(optional)"}
              <select
                value={form.roomId}
                onChange={(e) => setForm({ ...form, roomId: e.target.value })}
                required={form.type === "WORKSHOP"}
              >
                <option value="">– kein Raum –</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name}
                  </option>
                ))}
              </select>
            </label>
            {form.type === "WORKSHOP" && (
              <>
                <label>
                  Dozent
                  <select
                    value={form.speakerId}
                    onChange={(e) => setForm({ ...form, speakerId: e.target.value })}
                    required
                  >
                    <option value="">– auswählen –</option>
                    {speakers.map((speaker) => (
                      <option key={speaker.id} value={speaker.id}>
                        {speaker.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Level (optional)
                  <select
                    value={form.levelId}
                    onChange={(e) => setForm({ ...form, levelId: e.target.value })}
                  >
                    <option value="">– kein Level –</option>
                    {levels.map((level) => (
                      <option key={level.id} value={level.id}>
                        {level.name}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            )}
            <label>
              Beschreibung
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
              />
            </label>
            {error && <p className="error">{error}</p>}
            <div className="form-actions">
              <button type="submit" disabled={submitting}>
                {submitting ? "Wird gespeichert…" : editingId != null ? "Speichern" : "Eintrag anlegen"}
              </button>
              <button type="button" onClick={cancelEdit}>
                Abbrechen
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
