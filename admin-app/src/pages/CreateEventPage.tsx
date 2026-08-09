import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, ApiError } from "../api";
import CountrySearchSelect from "../CountrySearchSelect";

export default function CreateEventPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [description, setDescription] = useState("");
  const [homepage, setHomepage] = useState("");
  const [street, setStreet] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [showOnMap, setShowOnMap] = useState(false);
  const [mapVisibleFrom, setMapVisibleFrom] = useState("");
  const [logo, setLogo] = useState<File | null>(null);
  const [flyer, setFlyer] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const event = await api.createEvent({
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
      navigate(`/events/${event.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Event konnte nicht angelegt werden");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>Neues Event</h1>
        <Link to="/">Zurück</Link>
      </header>

      <form className="panel-form" onSubmit={handleSubmit}>
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
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
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
          <input
            type="checkbox"
            checked={showOnMap}
            onChange={(e) => setShowOnMap(e.target.checked)}
          />
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
          Event-Logo (SVG, GIF, JPG oder PNG)
          <input
            type="file"
            accept="image/svg+xml,image/gif,image/jpeg,image/png"
            onChange={(e) => setLogo(e.target.files?.[0] ?? null)}
          />
        </label>
        <label>
          Flyer (optional, Bild – GIF/JPG/PNG/…)
          <input type="file" accept="image/*" onChange={(e) => setFlyer(e.target.files?.[0] ?? null)} />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? "Wird angelegt…" : "Event anlegen"}
        </button>
      </form>
    </div>
  );
}
