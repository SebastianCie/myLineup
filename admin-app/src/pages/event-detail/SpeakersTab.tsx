import { useState, type FormEvent } from "react";
import { api, ApiError, type Speaker } from "../../api";
import CountrySearchSelect from "../../CountrySearchSelect";
import Modal from "../../Modal";

interface Props {
  eventId: number;
  speakers: Speaker[];
  onChange: () => void;
}

const EMPTY = { name: "", country: "", city: "", description: "", confirmed: false };

export default function SpeakersTab({ eventId, speakers, onChange }: Props) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const formOpen = creating || editingId != null;

  function startCreate() {
    setEditingId(null);
    setForm(EMPTY);
    setError(null);
    setCreating(true);
  }

  function startEdit(speaker: Speaker) {
    setEditingId(speaker.id);
    setForm({
      name: speaker.name,
      country: speaker.country ?? "",
      city: speaker.city ?? "",
      description: speaker.description ?? "",
      confirmed: speaker.confirmed,
    });
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
        await api.updateSpeaker(eventId, editingId, form);
      } else {
        await api.createSpeaker(eventId, form);
      }
      setForm(EMPTY);
      setEditingId(null);
      setCreating(false);
      onChange();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Dozent konnte nicht gespeichert werden");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    await api.deleteSpeaker(eventId, id);
    if (editingId === id) cancelEdit();
    onChange();
  }

  return (
    <div className="tab-panel">
      <div className="page-toolbar">
        <h2>Dozenten</h2>
        <button type="button" onClick={startCreate}>
          + Dozent hinzufügen
        </button>
      </div>

      <ul className="item-list">
        {speakers.map((speaker) => (
          <li key={speaker.id} className="item-row">
            <div>
              <strong>{speaker.name}</strong>
              {(speaker.city || speaker.country) && (
                <span className="muted">
                  {" "}
                  · {[speaker.city, speaker.country].filter(Boolean).join(", ")}
                </span>
              )}
              {speaker.confirmed ? (
                <span className="badge badge--ok">bestätigt</span>
              ) : (
                <span className="badge">offen</span>
              )}
              {speaker.description && <p className="muted description-text">{speaker.description}</p>}
            </div>
            <div className="item-row-actions">
              <button type="button" onClick={() => startEdit(speaker)}>
                Bearbeiten
              </button>
              <button type="button" onClick={() => handleDelete(speaker.id)}>
                Löschen
              </button>
            </div>
          </li>
        ))}
        {speakers.length === 0 && <p className="muted">Noch keine Dozenten.</p>}
      </ul>

      {formOpen && (
        <Modal onClose={cancelEdit}>
          <form className="panel-form" onSubmit={handleSubmit}>
            <h3>{editingId != null ? "Dozent bearbeiten" : "Dozent hinzufügen"}</h3>
            <label>
              Name
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </label>
            <div className="form-row">
              <label>
                Stadt
                <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </label>
              <label>
                Land
                <CountrySearchSelect
                  value={form.country}
                  onChange={(country) => setForm({ ...form, country })}
                />
              </label>
            </div>
            <label>
              Beschreibung
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
              />
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={form.confirmed}
                onChange={(e) => setForm({ ...form, confirmed: e.target.checked })}
              />
              Bestätigt
            </label>
            {error && <p className="error">{error}</p>}
            <div className="form-actions">
              <button type="submit" disabled={submitting}>
                {submitting ? "Wird gespeichert…" : editingId != null ? "Speichern" : "Dozent anlegen"}
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
