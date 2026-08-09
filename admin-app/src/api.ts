const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8081";
const TOKEN_KEY = "mylineup_admin_token";

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

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: response.statusText }));
    throw new ApiError(body.message ?? "Unbekannter Fehler", response.status);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
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
  return handleResponse<T>(response);
}

async function requestForm<T>(path: string, method: string, formData: FormData): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(`${API_URL}${path}`, { method, headers, body: formData });
  return handleResponse<T>(response);
}

export interface AuthResponse {
  token: string;
  email: string;
  name: string;
}

export interface MeResponse {
  id: string;
  email: string;
  name: string;
}

export interface Event {
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
  showOnMap: boolean;
  mapVisibleFrom: string | null;
  createdAt: string;
}

export interface Speaker {
  id: number;
  eventId: number;
  name: string;
  country: string | null;
  city: string | null;
  description: string | null;
  confirmed: boolean;
}

export interface Room {
  id: number;
  eventId: number;
  name: string;
  address: string | null;
  color: string;
}

export interface Level {
  id: number;
  eventId: number;
  name: string;
  color: string;
}

export type AgendaItemType = "REGISTRATION" | "WORKSHOP" | "BREAK" | "PARTY";

export interface AgendaItem {
  id: number;
  eventId: number;
  type: AgendaItemType;
  title: string;
  day: string;
  startTime: string;
  endTime: string;
  description: string | null;
  roomId: number | null;
  speakerId: number | null;
  levelId: number | null;
}

export interface EventFormInput {
  name: string;
  startDate: string;
  endDate: string;
  description?: string;
  homepage?: string;
  street?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  showOnMap: boolean;
  mapVisibleFrom?: string;
  logo?: File | null;
  flyer?: File | null;
}

function eventFormData(input: EventFormInput): FormData {
  const fd = new FormData();
  fd.set("name", input.name);
  fd.set("startDate", input.startDate);
  fd.set("endDate", input.endDate);
  if (input.description) fd.set("description", input.description);
  if (input.homepage) fd.set("homepage", input.homepage);
  if (input.street) fd.set("street", input.street);
  if (input.postalCode) fd.set("postalCode", input.postalCode);
  if (input.city) fd.set("city", input.city);
  if (input.country) fd.set("country", input.country);
  fd.set("showOnMap", String(input.showOnMap));
  if (input.mapVisibleFrom) fd.set("mapVisibleFrom", input.mapVisibleFrom);
  if (input.logo) fd.set("logo", input.logo);
  if (input.flyer) fd.set("flyer", input.flyer);
  return fd;
}

export function eventLogoUrl(eventId: number): string {
  return `${API_URL}/api/events/${eventId}/logo`;
}

export function eventFlyerUrl(eventId: number): string {
  return `${API_URL}/api/events/${eventId}/flyer`;
}

const USER_APP_URL = import.meta.env.VITE_USER_APP_URL ?? "http://localhost:5174";

export function eventPublicUrl(publicToken: string): string {
  return `${USER_APP_URL}/e/${publicToken}`;
}

export const api = {
  register: (email: string, password: string, name: string) =>
    request<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    }),
  login: (email: string, password: string) =>
    request<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  me: () => request<MeResponse>("/api/admin/me"),

  listEvents: () => request<Event[]>("/api/admin/events"),
  getEvent: (id: number) => request<Event>(`/api/admin/events/${id}`),
  createEvent: (input: EventFormInput) =>
    requestForm<Event>("/api/admin/events", "POST", eventFormData(input)),
  updateEvent: (id: number, input: EventFormInput) =>
    requestForm<Event>(`/api/admin/events/${id}`, "PUT", eventFormData(input)),
  deleteEvent: (id: number) => request<void>(`/api/admin/events/${id}`, { method: "DELETE" }),

  listSpeakers: (eventId: number) => request<Speaker[]>(`/api/admin/events/${eventId}/speakers`),
  createSpeaker: (eventId: number, data: Omit<Speaker, "id" | "eventId">) =>
    request<Speaker>(`/api/admin/events/${eventId}/speakers`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateSpeaker: (eventId: number, id: number, data: Omit<Speaker, "id" | "eventId">) =>
    request<Speaker>(`/api/admin/events/${eventId}/speakers/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteSpeaker: (eventId: number, id: number) =>
    request<void>(`/api/admin/events/${eventId}/speakers/${id}`, { method: "DELETE" }),

  listRooms: (eventId: number) => request<Room[]>(`/api/admin/events/${eventId}/rooms`),
  createRoom: (eventId: number, data: Omit<Room, "id" | "eventId">) =>
    request<Room>(`/api/admin/events/${eventId}/rooms`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateRoom: (eventId: number, id: number, data: Omit<Room, "id" | "eventId">) =>
    request<Room>(`/api/admin/events/${eventId}/rooms/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteRoom: (eventId: number, id: number) =>
    request<void>(`/api/admin/events/${eventId}/rooms/${id}`, { method: "DELETE" }),

  listLevels: (eventId: number) => request<Level[]>(`/api/admin/events/${eventId}/levels`),
  createLevel: (eventId: number, data: Omit<Level, "id" | "eventId">) =>
    request<Level>(`/api/admin/events/${eventId}/levels`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateLevel: (eventId: number, id: number, data: Omit<Level, "id" | "eventId">) =>
    request<Level>(`/api/admin/events/${eventId}/levels/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteLevel: (eventId: number, id: number) =>
    request<void>(`/api/admin/events/${eventId}/levels/${id}`, { method: "DELETE" }),
  moveLevelUp: (eventId: number, id: number) =>
    request<Level[]>(`/api/admin/events/${eventId}/levels/${id}/move-up`, { method: "POST" }),
  moveLevelDown: (eventId: number, id: number) =>
    request<Level[]>(`/api/admin/events/${eventId}/levels/${id}/move-down`, { method: "POST" }),

  listAgendaItems: (eventId: number, day?: string) =>
    request<AgendaItem[]>(
      `/api/admin/events/${eventId}/agenda-items${day ? `?day=${day}` : ""}`,
    ),
  createAgendaItem: (eventId: number, data: Omit<AgendaItem, "id" | "eventId">) =>
    request<AgendaItem>(`/api/admin/events/${eventId}/agenda-items`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateAgendaItem: (eventId: number, id: number, data: Omit<AgendaItem, "id" | "eventId">) =>
    request<AgendaItem>(`/api/admin/events/${eventId}/agenda-items/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteAgendaItem: (eventId: number, id: number) =>
    request<void>(`/api/admin/events/${eventId}/agenda-items/${id}`, { method: "DELETE" }),
};
