import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, ApiError, setToken, USER_MODE_KEY } from "../api";

export default function ParticipantLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await api.login(email, password);
      setToken(res.token);
      localStorage.setItem(USER_MODE_KEY, "account");
      navigate("/karte");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login fehlgeschlagen");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h1>Anmelden</h1>
        <label>
          E-Mail
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label>
          Passwort
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? "Anmelden…" : "Anmelden"}
        </button>
        <p>
          Noch kein Konto? <Link to="/registrieren">Jetzt registrieren</Link>
        </p>
      </form>
    </div>
  );
}
