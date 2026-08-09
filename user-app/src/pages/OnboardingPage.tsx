import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { USER_MODE_KEY } from "../api";

export default function OnboardingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem(USER_MODE_KEY)) {
      navigate("/karte", { replace: true });
    }
  }, [navigate]);

  function continueAsGuest() {
    localStorage.setItem(USER_MODE_KEY, "guest");
    navigate("/karte");
  }

  return (
    <div className="onboarding">
      <div className="onboarding-card">
        <h1>Willkommen bei MyLineup</h1>
        <p>
          Möchtest du ein Konto anlegen, um dein persönliches Programm (Favoriten, Workshops)
          dauerhaft zu speichern?
        </p>
        <div className="onboarding-actions">
          <Link className="button button-primary" to="/registrieren">
            Konto anlegen
          </Link>
          <Link className="button" to="/anmelden">
            Anmelden
          </Link>
          <button type="button" className="button button-ghost" onClick={continueAsGuest}>
            Ohne Konto fortfahren
          </button>
        </div>
        <p className="hint">
          Ohne Konto wird dein Programm nur auf diesem Gerät im Browser gespeichert.
        </p>
      </div>
    </div>
  );
}
