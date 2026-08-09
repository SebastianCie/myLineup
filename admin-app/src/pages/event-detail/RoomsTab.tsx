import { useState, type FormEvent } from "react";
import { api, ApiError, type Room } from "../../api";
import { randomColor, readableTextColor } from "../../colors";
import Modal from "../../Modal";

interface Props {
  eventId: number;
  rooms: Room[];
  onChange: () => void;
}

const EMPTY = { name: "", address: "", color: "" };

export default function RoomsTab({ eventId, rooms, onChange }: Props) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const formOpen = creating || editingId != null;

  function startCreate() {
    setEditingId(null);
    setForm({ ...EMPTY, color: randomColor() });
    setError(null);
    setCreating(true);
  }

  function startEdit(room: Room) {
    setEditingId(room.id);
    setForm({ name: room.name, address: room.address ?? "", color: room.color });
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setCreating(false);
    setForm(EMPTY);
    setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (editingId != null) {
        await api.updateRoom(eventId, editingId, form);
      } else {
        await api.createRoom(eventId, form);
      }
      setForm({ ...EMPTY, color: randomColor() });
      setEditingId(null);
      setCreating(false);
      onChange();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Raum konnte nicht gespeichert werden");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    await api.deleteRoom(eventId, id);
    if (editingId === id) cancelEdit();
    onChange();
  }

  return (
    <div className="tab-panel">
      <div className="page-toolbar">
        <h2>Räume</h2>
        <button type="button" onClick={startCreate}>
          + Raum hinzufügen
        </button>
      </div>

      <ul className="item-list">
        {rooms.map((room) => (
          <li key={room.id} className="item-row">
            <div>
              <span
                className="badge"
                style={{ background: room.color, color: readableTextColor(room.color), marginLeft: 0 }}
              >
                {room.name}
              </span>
              {room.address && <p className="muted">{room.address}</p>}
            </div>
            <div className="item-row-actions">
              <button type="button" onClick={() => startEdit(room)}>
                Bearbeiten
              </button>
              <button type="button" onClick={() => handleDelete(room.id)}>
                Löschen
              </button>
            </div>
          </li>
        ))}
        {rooms.length === 0 && <p className="muted">Noch keine Räume.</p>}
      </ul>

      {formOpen && (
        <Modal onClose={cancelEdit}>
          <form className="panel-form" onSubmit={handleSubmit}>
            <h3>{editingId != null ? "Raum bearbeiten" : "Raum hinzufügen"}</h3>
            <div className="form-row">
              <label>
                Name
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </label>
              <label className="color-field">
                Farbe
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                />
              </label>
            </div>
            <label>
              Adresse (optional)
              <input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </label>
            {error && <p className="error">{error}</p>}
            <div className="form-actions">
              <button type="submit" disabled={submitting}>
                {submitting ? "Wird gespeichert…" : editingId != null ? "Speichern" : "Raum anlegen"}
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
