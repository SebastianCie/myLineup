# MyLineup

Monorepo mit Admin-Bereich, mobiler User-App, Quarkus-API und PostgreSQL.

## Struktur

```
api/                Quarkus (Java), REST-API, eigene Admin-Auth (BCrypt + JWT), Flyway-Migrationen
admin-app/          React (Vite) – Admin-Portal, Registrierung/Login für Admins
user-app/           React (Vite) – mobile-first PWA für Endnutzer
infra/              podman-compose Setup für lokale Entwicklung
infra/openshift/    Deployment/Service/Route-Manifeste für die Red Hat Developer Sandbox
.github/workflows/  GitHub Actions: Build & Push der drei Images nach GHCR
postgres.txt        Zugangsdaten für das Neon-Projekt "BetaBattle" (NICHT für MyLineup, siehe unten)
.env.local          Echte Zugangsdaten für das Neon-Projekt "MyLineup" (von `neon env pull`, gitignored)
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

## Deployment auf die Red Hat Developer Sandbox (OpenShift)

Prod-Setup: die drei Images werden per GitHub Actions nach GHCR gebaut und laufen auf der
kostenlosen [Red Hat Developer Sandbox](https://console.redhat.com/openshift/sandbox) gegen die
Neon-DB (Projekt "MyLineup", siehe `.env.local`). Datenbank-Schema/-Migrationen übernimmt Flyway
automatisch beim API-Start (`quarkus.flyway.migrate-at-start=true`).

### 1. Images bauen lassen (GitHub Actions → GHCR)

Passiert automatisch bei jedem Push auf `main` über
[.github/workflows/build-push.yml](.github/workflows/build-push.yml). Manuell anstoßen:

```bash
gh workflow run build-push.yml
gh run watch   # letzten Lauf beobachten
```

Ergebnis: `ghcr.io/sebastiancie/mylineup-api:latest`, `mylineup-admin-app:latest`,
`mylineup-user-app:latest` (Owner-Teil des Pfads muss klein geschrieben sein, auch wenn der
GitHub-User "SebastianCie" heißt). Die Packages sind public, daher braucht OpenShift kein
Image-Pull-Secret.

`admin-app`/`user-app` bekommen die API-URL als Vite-Build-Arg zur **Build-Zeit** eingebrannt
(`VITE_API_URL`, `VITE_USER_APP_URL`). Diese Werte kommen aus GitHub Actions Repository-Variablen:

```bash
gh variable set VITE_API_URL --body "https://mylineup-api-<namespace>.<sandbox-domain>"
gh variable set VITE_USER_APP_URL --body "https://mylineup-user-app-<namespace>.<sandbox-domain>"
gh workflow run build-push.yml   # danach neu bauen, damit die URLs im Bundle landen
```

`<namespace>` und `<sandbox-domain>` erfährt man erst nach dem `oc login` (Schritt 2) bzw. nachdem
die Route für `mylineup-api` existiert (Schritt 3) – siehe dort für die konkreten aktuellen Werte.

### 2. Bei der Sandbox einloggen

Login-Token ist zeitlich begrenzt (~24h) und muss bei jeder neuen Session neu geholt werden:

1. https://console.redhat.com/openshift/sandbox öffnen, Sandbox starten ("Launch")
2. In der OpenShift-Weboberfläche oben rechts auf den Usernamen klicken → **"Copy login command"**
3. Ggf. erneut einloggen, dann auf **"Display Token"**
4. Den angezeigten Befehl im Terminal ausführen, z. B.:
   ```bash
   oc login --token=sha256~xxxxxxxx --server=https://api.<cluster>.openshiftapps.com:6443
   ```

Aktuell verwendetes Projekt/Namespace: `sebastianeichh-dev` auf
`apps.rm2.thpm.p1.openshiftapps.com` (wird beim Login automatisch ausgewählt). Prüfen mit
`oc whoami` / `oc project`.

### 3. Deployen

Alle Manifeste liegen unter [infra/openshift/](infra/openshift/) (Deployment + Service + Route pro
Service, Klartext-Namen ohne Platzhalter für den obigen Namespace/Domain – bei Bedarf anpassen,
z. B. falls sich der Sandbox-Namespace mal ändert).

**Einmalig:** DB-Zugangsdaten als Secret anlegen (Werte aus `.env.local`, `DATABASE_URL` in
JDBC-Form umwandeln):

```bash
oc create secret generic mylineup-db \
  --from-literal=DB_URL='jdbc:postgresql://ep-super-tree-b2d4oqlh-pooler.c-6.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require' \
  --from-literal=DB_USER='neondb_owner' \
  --from-literal=DB_PASSWORD='<Passwort aus .env.local>'
```

**Einmalig:** eigenes JWT-Signierschlüsselpaar für Prod anlegen (NICHT den Dev-Key aus
`api/src/main/resources/privateKey.pem` wiederverwenden – der ist gitignored und landet nie im
GHCR-Image, siehe Stolpersteine unten):

```bash
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out privateKey.pem
openssl rsa -pubout -in privateKey.pem -out publicKey.pem

oc create secret generic mylineup-jwt-keys \
  --from-file=privateKey.pem=privateKey.pem \
  --from-file=publicKey.pem=publicKey.pem

rm privateKey.pem publicKey.pem   # nicht committen, nur im Secret aufbewahren
```

**API deployen:**

```bash
oc apply -f infra/openshift/api.yaml
oc rollout status deployment/mylineup-api
curl https://mylineup-api-sebastianeichh-dev.apps.rm2.thpm.p1.openshiftapps.com/q/health
```

Danach die Route-URL der API in die GitHub-Variablen eintragen (siehe Schritt 1) und
`admin-app`/`user-app` neu bauen lassen, bevor sie deployt werden – sonst zeigen sie auf
`localhost`.

**Frontends deployen:**

```bash
oc apply -f infra/openshift/admin-app.yaml
oc apply -f infra/openshift/user-app.yaml
oc rollout status deployment/mylineup-admin-app
oc rollout status deployment/mylineup-user-app
```

URLs (auto-generiert aus Route-Name + Namespace + Sandbox-Domain):
- API: `https://mylineup-api-sebastianeichh-dev.apps.rm2.thpm.p1.openshiftapps.com`
- Admin-App: `https://mylineup-admin-app-sebastianeichh-dev.apps.rm2.thpm.p1.openshiftapps.com`
- User-App: `https://mylineup-user-app-sebastianeichh-dev.apps.rm2.thpm.p1.openshiftapps.com`

### 4. Nach einem Code-Update neu ausrollen

```bash
gh workflow run build-push.yml && gh run watch   # neue Images bauen
oc rollout restart deployment/mylineup-api deployment/mylineup-admin-app deployment/mylineup-user-app
```

(`imagePullPolicy: Always` sorgt dafür, dass der `:latest`-Tag frisch gezogen wird – ein reiner
`oc apply` ohne Restart würde ein bereits laufendes Deployment nicht neu starten.)

### Stolpersteine, die schon aufgetreten sind

- **Nginx-Image auf OpenShift:** Die Sandbox führt Container mit einer zufälligen, nicht-root
  UID aus (restricted SCC). Das Standard-`nginx:alpine`-Image kann dadurch weder Port 80 binden
  noch in `/var/cache/nginx` schreiben → CrashLoopBackOff. Fix: `admin-app`/`user-app` nutzen
  `nginxinc/nginx-unprivileged` auf Port 8080 (siehe `Containerfile`/`nginx.conf`). Beim lokalen
  Podman-Setup entsprechend auf `8080` im Container gemappt (`infra/podman-compose.yml`).
- **GHCR-Image-Pfad muss komplett klein geschrieben sein** (`ghcr.io/sebastiancie/...`), auch wenn
  der GitHub-Account groß geschrieben ist ("SebastianCie") – sonst `manifest unknown` beim Pull.
- **Sandbox idled Deployments nach Inaktivität automatisch** auf 0 Replicas (siehe andere Projekte
  im gleichen Namespace). Nach Idle-Phase reicht `oc scale deployment/mylineup-api --replicas=1`
  (entsprechend für die anderen beiden).
- **JWT-Signierschlüssel fehlt im GHCR-Image → 500 bei jedem Login:** `privateKey.pem`/
  `publicKey.pem` sind gitignored (Dev-Keys, siehe `api/.gitignore`). Der GitHub-Actions-Build
  checkt sauber aus git aus, hat die Dateien also nie – anders als der lokale Podman-Build, der
  direkt vom Dateisystem baut und die (untracked, aber vorhandenen) lokalen Dev-Keys mit einpackt.
  Fix: eigenes Schlüsselpaar als Secret `mylineup-jwt-keys` anlegen, in die API mounten
  (`/etc/mylineup/jwt`) und `SMALLRYE_JWT_SIGN_KEY_LOCATION` / `MP_JWT_VERIFY_PUBLICKEY_LOCATION`
  per Env-Var auf `file:/etc/mylineup/jwt/...` umbiegen (steht in `infra/openshift/api.yaml`).

## Offene Punkte

- Fachliche Domäne von "MyLineup" ist noch nicht definiert — aktuell nur ein technisches
  Skeleton (Admin-Auth + `ping`-Beispiel-Entity zur E2E-Verifikation).
- Für lokale Entwicklung genutzte JWT-Schlüssel (`api/src/main/resources/privateKey.pem`) sind
  reine Dev-Schlüssel. Auf OpenShift läuft bereits ein eigenes Prod-Schlüsselpaar über das Secret
  `mylineup-jwt-keys` (siehe Deployment-Abschnitt) — bei Bedarf rotieren mit `openssl genpkey` +
  `oc create secret ... --dry-run=client -o yaml | oc apply -f -` gefolgt von
  `oc rollout restart deployment/mylineup-api` (invalidiert alle bestehenden Sessions).
- OpenShift-Deployment läuft aktuell mit 1 Replica pro Service ohne Autoscaling/Healthchecks
  (`readinessProbe`/`livenessProbe`) in den Deployment-Manifesten — für echten Produktivbetrieb
  ergänzen.
