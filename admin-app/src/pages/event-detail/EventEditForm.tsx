import { useState, type FormEvent } from "react";
import { api, ApiError, type Event } from "../../api";
import CountrySearchSelect from "../../CountrySearchSelect";

interface Props {
  event: Event;
  onSaved: (event: Event) => void;
  onCancel: () => void;
}

export default function EventEditForm({ event, onSaved, onCancel }: Props) {
  const [name, setName] = useState(event.name);
  const [startDate, setStartDate] = useState(event.startDate);
  const [endDate, setEndDate] = useState(event.endDate);
  const [description, setDescription] = useState(event.description ?? "");
  const [homepage, setHomepage] = useState(event.homepage ?? "");
  const [street, setStreet] = useState(event.street ?? "");
  const [postalCode, setPostalCode] = useState(event.postalCode ?? "");
  const [city, setCity] = useState(event.city ?? "");
  const [country, setCountry] = useState(event.country ?? "");
  const [showOnMap, setShowOnMap] = useState(event.showOnMap);
  const [mapVisibleFrom, setMapVisibleFrom] = useState(event.mapVisibleFrom ?? "");
  const [logo, setLogo] = useState<File | null>(null);
  const [flyer, setFlyer] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const updated = await api.updateEvent(event.id, {
        name,
        startDate,
        endDate,
        description,
        homepage,
        street,
        postalCode,
        city,
        country,
        showOnMap,
        mapVisibleFrom,
        logo,
        flyer,
      });
      onSaved(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Event konnte nicht gespeichert werden");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="panel-form" onSubmit={handleSubmit}>
      <h3>Event bearbeiten</h3>
      <label>
        Name
        <input value={name} onChange={(e) => setName(e.target.value)} required />
      </label>
      <div className="form-row">
        <label>
          Startdatum
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </label>
        <label>
          Enddatum
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
        </label>
      </div>
      <label>
        Beschreibung
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
      </label>
      <label>
        Event-Homepage
        <input
          type="url"
          placeholder="https://…"
          value={homepage}
          onChange={(e) => setHomepage(e.target.value)}
        />
      </label>
      <label>
        Straße
        <input value={street} onChange={(e) => setStreet(e.target.value)} />
      </label>
      <div className="form-row">
        <label>
          PLZ
          <input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
        </label>
        <label>
          Ort
          <input value={city} onChange={(e) => setCity(e.target.value)} />
        </label>
      </div>
      <label>
        Land
        <CountrySearchSelect value={country} onChange={setCountry} />
      </label>
      <label className="checkbox-label">
        <input type="checkbox" checked={showOnMap} onChange={(e) => setShowOnMap(e.target.checked)} />
        Auf Besucher-Landkarte anzeigen
      </label>
      {showOnMap && (
        <label>
          Sichtbar ab
          <input
            type="date"
            value={mapVisibleFrom}
            onChange={(e) => setMapVisibleFrom(e.target.value)}
            required
          />
        </label>
      )}
      <label>
        Neues Logo (optional, SVG/GIF/JPG/PNG)
        <input
          type="file"
          accept="image/svg+xml,image/gif,image/jpeg,image/png"
          onChange={(e) => setLogo(e.target.files?.[0] ?? null)}
        />
      </label>
      <label>
        Neuer Flyer (optional, Bild – GIF/JPG/PNG/…)
        <input type="file" accept="image/*" onChange={(e) => setFlyer(e.target.files?.[0] ?? null)} />
      </label>
      {error && <p className="error">{error}</p>}
      <div className="form-actions">
        <button type="submit" disabled={submitting}>
          {submitting ? "Wird gespeichert…" : "Speichern"}
        </button>
        <button type="button" onClick={onCancel}>
          Abbrechen
        </button>
      </div>
    </form>
  );
}
