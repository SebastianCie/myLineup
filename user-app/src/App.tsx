import { Route, Routes } from "react-router-dom";
import OnboardingPage from "./pages/OnboardingPage";
import ParticipantRegisterPage from "./pages/ParticipantRegisterPage";
import ParticipantLoginPage from "./pages/ParticipantLoginPage";
import MapPage from "./pages/MapPage";
import ListPage from "./pages/ListPage";
import EventPage from "./pages/EventPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<OnboardingPage />} />
      <Route path="/registrieren" element={<ParticipantRegisterPage />} />
      <Route path="/anmelden" element={<ParticipantLoginPage />} />
      <Route path="/karte" element={<MapPage />} />
      <Route path="/liste" element={<ListPage />} />
      <Route path="/e/:token" element={<EventPage />} />
    </Routes>
  );
}

export default App;
