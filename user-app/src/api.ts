// Wenn die App über eine andere Adresse als "localhost" aufgerufen wird (z.B. die
// lokale LAN-IP, um sie auf dem Handy zu testen), aber im Build noch "localhost"
// als API-Ziel einkompiliert ist, automatisch an den tatsächlich aufgerufenen Host
// anpassen (gleicher Port) statt eine feste IP im Build zu benötigen.
function resolveApiUrl(): string {
  const configured = import.meta.env.VITE_API_URL;
  if (!configured) {
    return `${window.location.protocol}//${window.location.hostname}:8081`;
  }
  try {
    if (new URL(configured).hostname === "localhost" && window.location.hostname !== "localhost") {
      return `${window.location.protocol}//${window.location.hostname}:8081`;
    }
  } catch {
    // ignore malformed VITE_API_URL, fall through to configured value
  }
  return configured;
}

const API_URL = resolveApiUrl();
const TOKEN_KEY = "mylineup_participant_token";
export const USER_MODE_KEY = "mylineup_user_mode";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: response.statusText }));
    throw new ApiError(body.message ?? "Unbekannter Fehler", response.status);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

export interface AuthResponse {
  token: string;
  email: string;
  name: string;
}

export interface MapEvent {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  city: string | null;
  postalCode: string | null;
  bundesland: string | null;
  lat: number;
  lng: number;
  publicToken: string;
}

export interface PublicEventDetail {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  description: string | null;
  homepage: string | null;
  street: string | null;
  postalCode: string | null;
  city: string | null;
  country: string | null;
  hasLogo: boolean;
  hasFlyer: boolean;
  publicToken: string;
}

export type AgendaItemType = "REGISTRATION" | "WORKSHOP" | "BREAK" | "PARTY";

export interface AgendaRoom {
  id: number;
  name: string;
  color: string;
}

export interface AgendaSpeaker {
  id: number;
  name: string;
  country: string | null;
  city: string | null;
}

export interface AgendaLevel {
  id: number;
  name: string;
  color: string;
}

export interface PublicAgendaItem {
  id: number;
  type: AgendaItemType;
  title: string;
  day: string;
  startTime: string;
  endTime: string;
  description: string | null;
  room: AgendaRoom | null;
  speaker: AgendaSpeaker | null;
  level: AgendaLevel | null;
}

export interface PublicSpeakerDetail {
  id: number;
  name: string;
  country: string | null;
  city: string | null;
  description: string | null;
}

export function eventLogoUrl(eventId: number): string {
  return `${API_URL}/api/events/${eventId}/logo`;
}

export function eventFlyerUrl(eventId: number): string {
  return `${API_URL}/api/events/${eventId}/flyer`;
}

export const api = {
  register: (email: string, password: string, name: string) =>
    request<AuthResponse>("/api/participant/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    }),
  login: (email: string, password: string) =>
    request<AuthResponse>("/api/participant/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  listMapEvents: () => request<MapEvent[]>("/api/public/map-events"),
  getEventByToken: (token: string) => request<PublicEventDetail>(`/api/public/events/${token}`),
  getEventAgenda: (token: string) => request<PublicAgendaItem[]>(`/api/public/events/${token}/agenda`),
  getEventSpeakers: (token: string) =>
    request<PublicSpeakerDetail[]>(`/api/public/events/${token}/speakers`),
};
