import { useState, type FormEvent } from "react";
import { api, ApiError, type Level } from "../../api";
import { randomLevelColor, readableTextColor } from "../../colors";
import Modal from "../../Modal";

interface Props {
  eventId: number;
  levels: Level[];
  onChange: () => void;
}

export default function LevelsTab({ eventId, levels, onChange }: Props) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(randomLevelColor);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const formOpen = creating || editingId != null;

  function startCreate() {
    setEditingId(null);
    setName("");
    setColor(randomLevelColor());
    setError(null);
    setCreating(true);
  }

  function startEdit(level: Level) {
    setEditingId(level.id);
    setName(level.name);
    setColor(level.color);
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setCreating(false);
    setName("");
    setColor(randomLevelColor());
    setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (editingId != null) {
        await api.updateLevel(eventId, editingId, { name, color });
      } else {
        await api.createLevel(eventId, { name, color });
      }
      setName("");
      setColor(randomLevelColor());
      setEditingId(null);
      setCreating(false);
      onChange();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Level konnte nicht gespeichert werden");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    await api.deleteLevel(eventId, id);
    if (editingId === id) cancelEdit();
    onChange();
  }

  async function handleMoveUp(id: number) {
    await api.moveLevelUp(eventId, id);
    onChange();
  }

  async function handleMoveDown(id: number) {
    await api.moveLevelDown(eventId, id);
    onChange();
  }

  return (
    <div className="tab-panel">
      <div className="page-toolbar">
        <h2>Level</h2>
        <button type="button" onClick={startCreate}>
          + Level hinzufügen
        </button>
      </div>

      <ul className="item-list">
        {levels.map((level, index) => (
          <li key={level.id} className="item-row">
            <div className="item-row-grow" style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div className="item-row-order">
                <button
                  type="button"
                  className="order-button"
                  disabled={index === 0}
                  onClick={() => handleMoveUp(level.id)}
                  aria-label="Nach oben verschieben"
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="order-button"
                  disabled={index === levels.length - 1}
                  onClick={() => handleMoveDown(level.id)}
                  aria-label="Nach unten verschieben"
                >
                  ↓
                </button>
              </div>
              <span
                className="badge"
                style={{ background: level.color, color: readableTextColor(level.color), margin: 0 }}
              >
                {level.name}
              </span>
            </div>
            <div className="item-row-actions">
              <button type="button" onClick={() => startEdit(level)}>
                Bearbeiten
              </button>
              <button type="button" onClick={() => handleDelete(level.id)}>
                Löschen
              </button>
            </div>
          </li>
        ))}
        {levels.length === 0 && (
          <p className="muted">Noch keine Level (z. B. Beginner, Intermediate, Advanced).</p>
        )}
      </ul>

      {formOpen && (
        <Modal onClose={cancelEdit}>
          <form className="panel-form" onSubmit={handleSubmit}>
            <h3>{editingId != null ? "Level bearbeiten" : "Level hinzufügen"}</h3>
            <div className="form-row">
              <label>
                Name
                <input value={name} onChange={(e) => setName(e.target.value)} required />
              </label>
              <label className="color-field">
                Farbe
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
              </label>
            </div>
            {error && <p className="error">{error}</p>}
            <div className="form-actions">
              <button type="submit" disabled={submitting}>
                {submitting ? "Wird gespeichert…" : editingId != null ? "Speichern" : "Level anlegen"}
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
