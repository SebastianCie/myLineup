# MyLineup

Monorepo mit Admin-Bereich, mobiler User-App, Quarkus-API und PostgreSQL.

## Struktur

```
api/          Quarkus (Java), REST-API, eigene Admin-Auth (BCrypt + JWT), Flyway-Migrationen
admin-app/    React (Vite) – Admin-Portal, Registrierung/Login für Admins
user-app/     React (Vite) – mobile-first PWA für Endnutzer
infra/        podman-compose Setup für lokale Entwicklung
postgres.txt  Zugangsdaten für das Neon-Projekt "BetaBattle" (NICHT für MyLineup, siehe unten)
.env.local    Echte Zugangsdaten für das Neon-Projekt "MyLineup" (von `neon env pull`, gitignored)
```

## Wichtig: Datenbank-Zugangsdaten

`postgres.txt` enthält Zugangsdaten für ein *anderes* Neon-Projekt ("BetaBattle"), nicht für
"MyLineup". Die echten "MyLineup"-Zugangsdaten liegen in `.env.local` (Projekt-ID
`gentle-frog-83220660`, per `neon env pull` geholt).

## Auth

Es wird **keine** externe Auth-Lösung (z. B. Neon Auth) verwendet — die Aktivierung ist auf
Neon-Seite reproduzierbar mit `NEON_AUTH_SCHEMA_NOT_FOUND` fehlgeschlagen, und der Dienst wäre
ohnehin proprietär/Vendor-gebunden. Stattdessen: eigene `admins`-Tabelle, BCrypt-Passwort-Hashes,
selbst signierte JWTs (`quarkus-smallrye-jwt`). Nur Admins registrieren sich; die User-App ist
aktuell ohne Login.

## Lokale Entwicklung (Podman)

```bash
cd infra
cp .env.example .env   # bei Bedarf anpassen
podman compose --env-file .env -f podman-compose.yml up -d --build
```

Services:
- Postgres: `localhost:5433`
- API: `localhost:8081` (Health: `/q/health`)
- Admin-App: `localhost:8082`
- User-App: `localhost:8083`

Stack stoppen: `podman compose -f infra/podman-compose.yml down` (Daten bleiben im Volume
`mylineup-postgres-data` erhalten).

## Ohne Container (Hot Reload)

```bash
# Postgres separat starten, z.B.:
podman run -d --name mylineup-postgres -e POSTGRES_DB=mylineup -e POSTGRES_USER=mylineup \
  -e POSTGRES_PASSWORD=mylineup -p 5433:5432 -v mylineup-postgres-data:/var/lib/postgresql/data \
  docker.io/library/postgres:16-alpine

# API (Quarkus Dev-Modus, Port 8081)
cd api
DB_URL=jdbc:postgresql://localhost:5433/mylineup DB_USER=mylineup DB_PASSWORD=mylineup \
  ./mvnw quarkus:dev -Dquarkus.http.port=8081

# Admin-App (Port 5173)
cd admin-app && npm install && npm run dev

# User-App (Port 5174)
cd user-app && npm install && npm run dev -- --port 5174
```

## Offene Punkte

- Fachliche Domäne von "MyLineup" ist noch nicht definiert — aktuell nur ein technisches
  Skeleton (Admin-Auth + `ping`-Beispiel-Entity zur E2E-Verifikation).
- Für Prod-Deployment: `DB_URL`/`DB_USER`/`DB_PASSWORD` auf die echten Neon-Werte aus
  `.env.local` setzen (nicht `postgres.txt`).
- JWT-Signierschlüssel (`api/src/main/resources/privateKey.pem`) sind Dev-Schlüssel — vor echtem
  Produktivbetrieb rotieren und sicher verwalten (z. B. Secret Manager statt Classpath-Resource).
