# Agent Instructions

These instructions apply to the entire `radio-plays-tracker` repository. Read
this file before changing code, connecting to the Raspberry Pi, or deploying.

**`CLAUDE.md` is loaded automatically every session and carries the rules that
must apply from the first turn** - above all, that finishing any piece of work
means bringing up all three dev services and waiting for the user's manual
approval before continuing. Keep the two files consistent: a workflow rule added
here must also be reflected in `CLAUDE.md`, or it will not be in context when it
matters.

## Environments and authority

- The checked-out repository on the user's Windows machine is the development
  environment. The usual workspace is
  `C:\Users\omer8\Omer\Dev\MaHushma\radio-plays-tracker`.
- The public production environment is a Raspberry Pi reachable on the user's
  LAN as `omer@raspberrypi.local`. The production checkout is
  `/home/omer/apps/radio-plays-tracker`.
- MaHuRaa is a separate repository. Its development checkout is the sibling
  `../MahuRaa`; its Pi checkout is `/home/omer/apps/MaHuRaa`.
- A production problem does not, by itself, authorize editing the Pi. Diagnose
  read-only first. Change or deploy on the Pi only when the user explicitly asks
  for production changes or deployment.
- Never put SSH passwords, tunnel tokens, API keys, or the contents of `.env`
  files in source, documentation, commands that print them, or chat responses.

The normal workflow is:

1. Develop and test in the Windows development checkout.
2. Review the exact diff and keep unrelated user changes out of the commit.
3. Commit and push from the development checkout.
4. On the Pi, verify its worktree is safe, pull the pushed commit, and deploy.
5. Verify both the container-local path and the public domains.

Do not bypass that workflow with a direct Pi hotfix unless the user explicitly
requests an emergency production fix. If an emergency fix is made, mirror it in
development, commit/push it, and reconcile the Pi before finishing.

## Public production endpoints

- Frontend: `https://mahushma.com`
- API: `https://server.mahushma.com`
- Preferred browser API path: `https://mahushma.com/api/...` (same origin)

The `www` names are not canonical. As of 2026-09-08,
`www.mahushma.com` reaches the tunnel fallback and returns 404, while
`www.server.mahushma.com` has no DNS record. Do not report them as working or
silently substitute them for the canonical names.

## Production architecture constraints

Docker Compose projects share the external reachability network named
`radio-plays-tracker_app`. Docker service names become DNS aliases, so generic
names such as `api`, `web`, and `frontend` can collide across projects.

This caused the September 2026 outage: both the radio tracker and MaHuRaa
advertised `api` on the shared network. Requests alternated between the radio API
(`200`) and MaHuRaa API (`401`), and the browser surfaced the wrong API's missing
CORS header as a secondary error.

Required invariants:

- Radio API shared alias: `radio-plays-tracker-api`
- Radio frontend shared alias: `radio-plays-tracker-frontend`
- MaHuRaa may use `api` only on its private `mahuraa_internal` network; its
  shared alias is `mahuraa-api`.
- New services attached to a cross-project network must use project-qualified
  aliases. Never route production traffic to a generic service name.
- Production React builds keep `FRONTEND_API_BASE_URL` empty. The browser calls
  `/api/...`, and Nginx proxies to `radio-plays-tracker-api:8080`.
- Local `npm start` uses `http://localhost:5000` unless explicitly overridden.

The tunnel is remotely managed by Cloudflare. The Pi may have
`ops/cloudflared/config.yml`, but Cloudflare currently pushes dashboard ingress
configuration to the connector and can override the local ingress entries. A
local file edit is therefore not proof that a public hostname changed. Verify
the connector logs and the public URL. When Cloudflare access is available,
prefer the project-qualified aliases in `ops/cloudflared/config.template.yml`.

`cloudflared` is pinned operationally to the latest pulled image and forced to
HTTP/2 because the Pi previously showed DNS startup failures and intermittent
QUIC timeouts. Do not remove that hardening without verifying the Pi network.

## Safe production procedure

Before pulling on the Pi:

```bash
cd /home/omer/apps/radio-plays-tracker
git status --short --branch
git fetch origin
git log --oneline --left-right HEAD...origin/main
```

Do not run `git reset --hard`, clean untracked files, overwrite `.env`, or remove
runtime state. The Pi contains ignored secrets, tunnel credentials, recognizer
state, and deployment keys that must remain local.

For an ordinary fast-forward deployment after local changes are pushed:

```bash
git pull --ff-only
docker compose --env-file .env config --quiet
docker compose --env-file .env build api frontend
docker compose --env-file .env up -d --no-deps api frontend
docker compose --env-file .env --profile tunnel up -d cloudflared
```

Only build/recreate services affected by the change. Never use
`docker compose down -v` in production; it removes the PostgreSQL volume.

For a MaHuRaa Compose change:

```bash
cd /home/omer/apps/MaHuRaa
git status --short --branch
git pull --ff-only
docker compose -f compose.pi.yaml config --quiet
docker compose -f compose.pi.yaml up -d --no-deps mahuraa-api web
```

## Required verification

After routing or deployment changes, check all layers rather than treating one
successful request as proof:

```bash
docker compose --env-file .env ps
docker exec mahushma-frontend getent hosts radio-plays-tracker-api

for i in $(seq 1 20); do
  curl -sS -o /dev/null -w '%{http_code}\n' \
    'http://localhost:3000/api/top_hits?days=7'
done | sort | uniq -c

for i in $(seq 1 20); do
  curl -sS --max-time 10 -o /dev/null -w '%{http_code}\n' \
    'https://mahushma.com/api/top_hits?days=7'
done | sort | uniq -c

for i in $(seq 1 20); do
  curl -sS --max-time 10 -o /dev/null -w '%{http_code}\n' \
    'https://server.mahushma.com/api/top_hits?days=7'
done | sort | uniq -c
```

All counts should be `200`. For the direct cross-origin API, also verify a
request with `Origin: https://mahushma.com` returns
`Access-Control-Allow-Origin: https://mahushma.com`.

## Current Pi Git caveat

As of 2026-09-08, the Pi's radio checkout is intentionally not identical to
`origin/main`:

- Pi `main` contains old unpushed commit `3ca6711`, which changes only
  `ops/recognizer/state.template.json`.
- Pulling the production fix produced merge commit `684535f`, so Pi `main`
  reports two commits ahead of `origin/main`.
- `docker-compose.yml` has the user's uncommitted
  `WORKER_CONFIG_PATH: /data/config.json` line.
- Existing untracked deployment-key and recognizer-state files were preserved.

Do not push, rewrite, or discard this Pi-only history without asking the user
whether it should be retained. Future fetch/merge operations can still work,
but `git pull --ff-only` will not work until this divergence is resolved.
MaHuRaa's Pi checkout is clean and tracks `origin/main`.

## Handing work over for user testing

Whenever any piece of work is finished - a phase, a single fix, anything you are
about to report - bring the development stack up **before** writing the report,
then stop and wait for the user's manual approval before starting anything else.
The user tests in this Windows checkout by loading the site in a browser, so the
agent is responsible for leaving the services running and for stating the exact
URL to open.

This is a hard gate, not a courtesy. Reporting completed work without a running
stack is a failed response even when the code is correct, and continuing to the
next task before the user has approved is equally wrong. All three services
count: API, frontend, **and the recognizer worker**.

Standard local stack:

```bash
# API (background). Development env reads appsettings.Development.json.
cd backend/dotnet-server
ASPNETCORE_ENVIRONMENT=Development dotnet run   --project src/RadioPlaysTracker.Api/RadioPlaysTracker.Api.csproj   --urls http://localhost:5050

# Frontend (background)
cd frontend/radio-plays
BROWSER=none PORT=3000 REACT_APP_API_BASE_URL=http://localhost:5050 npm start

# Recognizer worker (background). Start this too, not just API + frontend:
# without it no new plays arrive and every day-windowed screen looks empty.
cd backend/recognize
set -a && . ./.env && set +a       # the script does not load .env itself
../../venv/Scripts/python.exe -u recognizer.py
```

Then hand over `http://localhost:3000`.

Port notes:

- Port 5000 is the documented default for the radio API, but it is frequently
  occupied by `MahushmaFriends.Api` from the sibling `mahushma-friends`
  checkout. Do not stop another project's service to free the port. Run the
  radio API on 5050 instead and pass `REACT_APP_API_BASE_URL` to the frontend
  so `config.js` does not fall back to its `localhost:5000` default.
- `appsettings.Development.json` points at the native PostgreSQL on
  `localhost:5432`, database `radio_plays`. The `mahushma-db-dev` container on
  port 5434 belongs to a different project (`mahushma_friends`) and is not the
  radio database.
- `http://localhost:3000` is already in the API's dev CORS allowlist.

Worker notes:

- Run it with the repo-root `venv` (Python 3.11), which already has `pydub`,
  `shazamio`, `psycopg2` and ffmpeg available. `elasticsearch` is missing from
  that venv but `recognizer.py` never imports it - only `elastic_connector.py`
  does, and that module is unused by the worker.
- Credentials come from environment variables, not `config.json`:
  `Helper.load_config` reads `config.json` (stations only) and then overlays
  `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` / `POSTGRES_*` from the
  environment. Docker Compose injects those; a native run must source
  `backend/recognize/.env` first or startup fails with
  "Spotify client credentials are not configured".
- `backend/recognize/.env` points the worker at `localhost:5432/radio_plays`,
  the same database the API reads, so recognized plays show up in the UI.
- Recognition is slow by nature: each station is sampled, then identified. Expect
  minutes before the first rows land, and do not report the worker as broken just
  because nothing appeared immediately.

Before handing over, verify rather than assume:

```bash
curl -sS -o /dev/null -w '%{http_code}
' 'http://localhost:5050/api/top_hits?days=7'
curl -sS -o /dev/null -w '%{http_code}
' 'http://localhost:3000/'
```

State plainly which screens are actually testable. As of 2026-09-08 the
development database's newest play is 2025-11-25, so any endpoint filtered by
`days=7` or `days=30` returns an empty list. `station_last_plays` has no date
filter and does return rows, so the homepage station list and the artist and
song modals are testable while the Top Hits page and the homepage hits widget
render empty. That is stale development data, not a regression - say so
explicitly instead of reporting a broken feature.

Leave the services running after handing over. Do not kill them to tidy up.

## Validation notes

- Frontend production build: `cd frontend/radio-plays && npm run build`.
- The current legacy CRA/Jest setup fails before running tests because it cannot
  parse the installed Axios ESM package. Do not claim tests passed; distinguish
  this existing test-runner problem from application/build failures.
- Validate Compose with `docker compose config --quiet` before recreating any
  service.
- Preserve all pre-existing dirty work. Stage changes by explicit path or hunk,
  inspect `git diff --cached`, and never commit generated recognizer outputs or
  secrets.

See `DEPLOYMENT.md` for the human-facing production runbook and
`.github/copilot-instructions.md` for codebase architecture details.
