# CLAUDE.md

Loaded automatically at the start of every session. `AGENTS.md` holds the full
operational detail (production, Pi deployment, network invariants); this file
holds the rules that must be in context from the first turn.

## Rule 1 — Never report finished work without a running stack

**Every time** you finish a piece of work and report back to the user, before you
write that report:

1. Start **all three** services (not two — the worker is the one that gets
   forgotten).
2. Verify each one responds.
3. Give the user `http://localhost:3000` and say what to look at.
4. **Stop and wait for their manual approval.** Do not begin the next phase, the
   next task, or any follow-up work until they have tested and said so.

This applies to every report-back, not just large milestones — a single bug fix
counts. "I finished X, here is a summary" without a live stack is a failed
response, even if the code is correct.

```bash
# 1. API  (port 5000 is usually taken by the sibling mahushma-friends project)
cd backend/dotnet-server
ASPNETCORE_ENVIRONMENT=Development dotnet run \
  --project src/RadioPlaysTracker.Api/RadioPlaysTracker.Api.csproj \
  --urls http://localhost:5050

# 2. Frontend
cd frontend/radio-plays
BROWSER=none PORT=3000 REACT_APP_API_BASE_URL=http://localhost:5050 npm start

# 3. Recognizer worker — recognizer.py does NOT read .env itself
cd backend/recognize
set -a && . ./.env && set +a
../../venv/Scripts/python.exe -u recognizer.py
```

Verify before reporting:

```bash
curl -sS -o /dev/null -w '%{http_code}\n' 'http://localhost:3000/'
curl -sS -o /dev/null -w '%{http_code}\n' 'http://localhost:5050/api/top_hits?days=1'
cat backend/recognize/recognizer.heartbeat   # should be within the last minute
```

Leave the services running afterwards. Never kill them to tidy up.

### Gotchas that have cost time before

- **Port 5000** is usually held by `MahushmaFriends.Api` from the sibling
  `mahushma-friends` checkout. Do not stop another project's service — run on
  5050 and pass `REACT_APP_API_BASE_URL`, or `config.js` falls back to 5000.
- **The worker needs `.env` sourced.** Docker Compose injects those variables;
  a native run without them dies with "Spotify client credentials are not
  configured". `config.json` holds stations only, not credentials.
- **`elasticsearch` missing from the venv is a red herring** — `recognizer.py`
  never imports it, only the unused `elastic_connector.py` does.
- **Stop the API before `dotnet build`**, or the build fails with MSB3027 file
  locks on `RadioPlaysTracker.Core.dll`.
- **`TaskStop` does not always kill the node dev server**; check the port and
  `Stop-Process` the PID, otherwise stale code keeps being served.

## Rule 2 — Commit only when asked

Commit only when the user explicitly asks. If on `main`, create a branch first.
The user tests before committing, so "work is done" is not permission to commit.

## Rule 3 — MUI specifics in this frontend

- There is **no `ms`/`me` spacing shorthand** in MUI v5. `ms: 2` is silently
  dropped. Use `ml`/`mr`, or `marginInlineStart`/`marginInlineEnd`.
- The app is Hebrew but the document is **LTR**, with RTL applied per component
  via `dir="rtl"`. Do not flip the whole document to RTL — it was tried and it
  mirrored layouts that were already correct. Fix RTL locally, in the component
  that is wrong.
- `ToggleButtonGroup` sets its end buttons' corner radii from `theme.direction`,
  which desyncs from a child `dir="rtl"`. For a direction-aware tab strip use
  standalone `ToggleButton`s and logical corners
  (`borderStartStartRadius` / `borderStartEndRadius`).

See `AGENTS.md` for production, deployment, and the Pi.
