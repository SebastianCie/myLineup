import { useEffect, useMemo, useState } from "react";
import { api, type AgendaItem, type Level, type Room, type Speaker } from "../../api";
import { AGENDA_TYPE_COLORS, readableTextColor } from "../../colors";
import { formatDate } from "../../dateFormat";

interface Props {
  eventId: number;
  startDate: string;
  endDate: string;
  rooms: Room[];
  speakers: Speaker[];
  levels: Level[];
}

const NO_LEVEL = "none";

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Lokale Datumsanteile statt toISOString(), damit Zeitzonen westlich von UTC
// nicht auf den Vortag zurückrunden.
function dateRange(start: string, end: string): string[] {
  const days: string[] = [];
  const cur = new Date(`${start}T00:00:00`);
  const last = new Date(`${end}T00:00:00`);
  while (cur <= last) {
    days.push(toIsoDate(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function levelKey(levelId: number | null): string {
  return levelId != null ? String(levelId) : NO_LEVEL;
}

function conicGradient(segments: { color: string; value: number }[]): string {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total === 0) return "var(--border)";
  let acc = 0;
  const stops: string[] = [];
  for (const seg of segments) {
    if (seg.value === 0) continue;
    const start = (acc / total) * 360;
    acc += seg.value;
    const end = (acc / total) * 360;
    stops.push(`${seg.color} ${start}deg ${end}deg`);
  }
  return `conic-gradient(${stops.join(", ")})`;
}

type SubTab = "level" | "dozenten" | "raeume";

interface HoverInfo {
  item: AgendaItem;
  top: number;
  left: number;
}

export default function DashboardTab({ eventId, startDate, endDate, rooms, speakers, levels }: Props) {
  const days = useMemo(() => dateRange(startDate, endDate), [startDate, endDate]);
  const [day, setDay] = useState(days[0] ?? startDate);
  const [items, setItems] = useState<AgendaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState<SubTab>("level");
  const [hover, setHover] = useState<HoverInfo | null>(null);

  useEffect(() => {
    setLoading(true);
    api
      .listAgendaItems(eventId)
      .then(setItems)
      .finally(() => setLoading(false));
  }, [eventId]);

  // Nur Tage innerhalb des offiziellen Event-Zeitraums zählen — verwaiste
  // Programmpunkte außerhalb (z.B. nach nachträglicher Verkürzung des Events)
  // würden sonst in der Summe auftauchen, ohne in einer Tagesspalte sichtbar zu sein.
  const daySet = useMemo(() => new Set(days), [days]);
  const workshops = useMemo(
    () => items.filter((i) => i.type === "WORKSHOP" && daySet.has(i.day)),
    [items, daySet],
  );

  const hasUnleveledWorkshop = workshops.some((w) => w.levelId == null);
  const levelColumns = [
    ...levels.map((l) => ({ key: levelKey(l.id), name: l.name, color: l.color })),
    ...(hasUnleveledWorkshop ? [{ key: NO_LEVEL, name: "Ohne Level", color: "#8B8489" }] : []),
  ];

  // Tabelle 1: Level-Auslastung – Anzahl Workshops je Level und Tag.
  const levelByDay = useMemo(() => {
    const map = new Map<string, Map<string, number>>();
    for (const col of levelColumns) map.set(col.key, new Map());
    for (const w of workshops) {
      const col = map.get(levelKey(w.levelId));
      if (!col) continue;
      col.set(w.day, (col.get(w.day) ?? 0) + 1);
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workshops, levels]);

  // Tabelle 2/3: Dozent x Level – Anzahl Workshops, tagesfein und gesamt.
  function speakerLevelCounts(forItems: AgendaItem[]) {
    const map = new Map<number, Map<string, number>>();
    for (const w of forItems) {
      if (w.speakerId == null) continue;
      if (!map.has(w.speakerId)) map.set(w.speakerId, new Map());
      const row = map.get(w.speakerId)!;
      const key = levelKey(w.levelId);
      row.set(key, (row.get(key) ?? 0) + 1);
    }
    return map;
  }

  const speakerCountsByDay = useMemo(
    () => speakerLevelCounts(workshops.filter((w) => w.day === day)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [workshops, day],
  );
  const speakerCountsTotal = useMemo(() => speakerLevelCounts(workshops), [workshops]);

  const activeSpeakers = useMemo(
    () => speakers.filter((s) => speakerCountsTotal.has(s.id)),
    [speakers, speakerCountsTotal],
  );

  function rowSum(row: Map<string, number> | undefined): number {
    if (!row) return 0;
    let sum = 0;
    for (const v of row.values()) sum += v;
    return sum;
  }

  // Tabelle 4: Räume x Zeit-Raster für den gewählten Tag.
  const dayItemsWithRoom = useMemo(
    () => items.filter((i) => i.day === day && i.roomId != null),
    [items, day],
  );

  const usedRooms = useMemo(
    () => rooms.filter((r) => dayItemsWithRoom.some((i) => i.roomId === r.id)),
    [rooms, dayItemsWithRoom],
  );

  const timeAxis = useMemo(() => {
    if (dayItemsWithRoom.length === 0) return null;
    let min = Infinity;
    let max = -Infinity;
    for (const i of dayItemsWithRoom) {
      min = Math.min(min, timeToMinutes(i.startTime));
      max = Math.max(max, timeToMinutes(i.endTime));
    }
    const axisStart = Math.floor(min / 60) * 60;
    const axisEnd = Math.ceil(max / 60) * 60;
    const hours: number[] = [];
    for (let m = axisStart; m <= axisEnd; m += 60) hours.push(m);
    return { axisStart, axisEnd, total: axisEnd - axisStart, hours };
  }, [dayItemsWithRoom]);

  function levelOf(id: number | null): Level | undefined {
    return id != null ? levels.find((l) => l.id === id) : undefined;
  }

  function speakerOf(id: number | null): Speaker | undefined {
    return id != null ? speakers.find((s) => s.id === id) : undefined;
  }

  if (loading) {
    return <p className="muted">Lädt…</p>;
  }

  return (
    <div className="tab-panel">
      <div className="page-toolbar">
        <h2>Dashboard</h2>
      </div>

      <nav className="tabs">
        <button type="button" className={subTab === "level" ? "active" : ""} onClick={() => setSubTab("level")}>
          Level
        </button>
        <button type="button" className={subTab === "dozenten" ? "active" : ""} onClick={() => setSubTab("dozenten")}>
          Dozenten
        </button>
        <button type="button" className={subTab === "raeume" ? "active" : ""} onClick={() => setSubTab("raeume")}>
          Räume
        </button>
      </nav>

      {subTab === "level" && (
        <section className="dashboard-section">
          <h3>Workshops je Level und Tag</h3>
          {levelColumns.length === 0 && <p className="muted">Noch keine Level angelegt.</p>}
          {levelColumns.length > 0 && (
            <div className="pie-chart-wrap">
              <div
                className="pie-chart"
                style={{
                  background: conicGradient(
                    levelColumns.map((col) => ({ color: col.color, value: rowSum(levelByDay.get(col.key)) })),
                  ),
                }}
              />
              <ul className="pie-chart-legend">
                {levelColumns.map((col) => {
                  const sum = rowSum(levelByDay.get(col.key));
                  return (
                    <li key={col.key}>
                      <span className="pie-chart-swatch" style={{ background: col.color }} />
                      {col.name} – {sum} {sum === 1 ? "Workshop" : "Workshops"}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          {levelColumns.length > 0 && (
            <div className="dashboard-table-wrap">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Level</th>
                    {days.map((d) => (
                      <th key={d}>{formatDate(d)}</th>
                    ))}
                    <th>Summe</th>
                  </tr>
                </thead>
                <tbody>
                  {levelColumns.map((col) => {
                    const row = levelByDay.get(col.key);
                    const sum = rowSum(row);
                    return (
                      <tr key={col.key}>
                        <td>
                          <span className="badge" style={{ background: col.color, color: readableTextColor(col.color), marginLeft: 0 }}>
                            {col.name}
                          </span>
                        </td>
                        {days.map((d) => (
                          <td key={d} className="dashboard-num">
                            {row?.get(d) ?? 0}
                          </td>
                        ))}
                        <td className="dashboard-num dashboard-sum">{sum}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {subTab === "dozenten" && (
        <>
          <div className="day-tabs">
            {days.map((d) => (
              <button key={d} type="button" className={d === day ? "active" : ""} onClick={() => setDay(d)}>
                {formatDate(d)}
              </button>
            ))}
          </div>

          <section className="dashboard-section">
            <h3>Dozenten – {formatDate(day)}</h3>
            {activeSpeakers.length === 0 && <p className="muted">Noch keine Dozenten mit Workshops.</p>}
            {activeSpeakers.length > 0 && (
              <div className="dashboard-table-wrap">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Dozent</th>
                      {levelColumns.map((col) => (
                        <th key={col.key}>{col.name}</th>
                      ))}
                      <th>Summe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeSpeakers.map((s) => {
                      const row = speakerCountsByDay.get(s.id);
                      return (
                        <tr key={s.id}>
                          <td>{s.name}</td>
                          {levelColumns.map((col) => (
                            <td key={col.key} className="dashboard-num">
                              {row?.get(col.key) ?? 0}
                            </td>
                          ))}
                          <td className={`dashboard-num dashboard-sum${rowSum(row) === 0 ? " dashboard-zero" : ""}`}>
                            {rowSum(row)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="dashboard-section">
            <h3>Dozenten – Gesamt (gesamte Eventdauer)</h3>
            {activeSpeakers.length > 0 && (
              <div className="dashboard-table-wrap">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Dozent</th>
                      {levelColumns.map((col) => (
                        <th key={col.key}>{col.name}</th>
                      ))}
                      <th>Summe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeSpeakers.map((s) => {
                      const row = speakerCountsTotal.get(s.id);
                      return (
                        <tr key={s.id}>
                          <td>{s.name}</td>
                          {levelColumns.map((col) => (
                            <td key={col.key} className="dashboard-num">
                              {row?.get(col.key) ?? 0}
                            </td>
                          ))}
                          <td className={`dashboard-num dashboard-sum${rowSum(row) === 0 ? " dashboard-zero" : ""}`}>
                            {rowSum(row)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {subTab === "raeume" && (
        <>
          <div className="day-tabs">
            {days.map((d) => (
              <button key={d} type="button" className={d === day ? "active" : ""} onClick={() => setDay(d)}>
                {formatDate(d)}
              </button>
            ))}
          </div>

          <section className="dashboard-section">
            <h3>Räume – {formatDate(day)}</h3>
            {!timeAxis && <p className="muted">Keine Programmpunkte mit Raum an diesem Tag.</p>}
            {timeAxis && (
              <div className="room-grid">
                <div className="room-grid-header">
                  <div className="room-grid-label" />
                  <div className="room-grid-track">
                    {timeAxis.hours.map((m) => (
                      <span
                        key={m}
                        className="room-grid-hour"
                        style={{ left: `${((m - timeAxis.axisStart) / timeAxis.total) * 100}%` }}
                      >
                        {String(Math.floor(m / 60)).padStart(2, "0")}:{String(m % 60).padStart(2, "0")}
                      </span>
                    ))}
                  </div>
                </div>
                {usedRooms.map((room) => (
                  <div className="room-grid-row" key={room.id}>
                    <div className="room-grid-label">
                      <span className="badge" style={{ background: room.color, color: readableTextColor(room.color), marginLeft: 0 }}>
                        {room.name}
                      </span>
                    </div>
                    <div className="room-grid-track">
                      {timeAxis.hours.map((m) => (
                        <span
                          key={m}
                          className="room-grid-gridline"
                          style={{ left: `${((m - timeAxis.axisStart) / timeAxis.total) * 100}%` }}
                        />
                      ))}
                      {dayItemsWithRoom
                        .filter((i) => i.roomId === room.id)
                        .map((i) => {
                          const level = levelOf(i.levelId);
                          const color = level ? level.color : AGENDA_TYPE_COLORS[i.type];
                          const left = ((timeToMinutes(i.startTime) - timeAxis.axisStart) / timeAxis.total) * 100;
                          const width = ((timeToMinutes(i.endTime) - timeToMinutes(i.startTime)) / timeAxis.total) * 100;
                          return (
                            <div
                              key={i.id}
                              className="room-grid-block"
                              style={{
                                left: `${left}%`,
                                width: `${width}%`,
                                background: color,
                                color: readableTextColor(color),
                              }}
                              onMouseEnter={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setHover({ item: i, top: rect.top, left: rect.left + rect.width / 2 });
                              }}
                              onMouseLeave={() => setHover(null)}
                            >
                              {i.title}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {hover && (
            <div className="room-grid-tooltip" style={{ top: hover.top - 8, left: hover.left }}>
              <strong>{hover.item.title}</strong>
              <div className="room-grid-tooltip-time">
                {formatDate(hover.item.day)} · {hover.item.startTime.slice(0, 5)} – {hover.item.endTime.slice(0, 5)}
              </div>
              {levelOf(hover.item.levelId) && (
                <span
                  className="badge"
                  style={{
                    background: levelOf(hover.item.levelId)!.color,
                    color: readableTextColor(levelOf(hover.item.levelId)!.color),
                    marginLeft: 0,
                  }}
                >
                  {levelOf(hover.item.levelId)!.name}
                </span>
              )}
              {speakerOf(hover.item.speakerId) && (
                <div className="room-grid-tooltip-speaker">{speakerOf(hover.item.speakerId)!.name}</div>
              )}
              {hover.item.description && <p className="description-text">{hover.item.description}</p>}
            </div>
          )}
        </>
      )}
    </div>
  );
}
