#!/usr/bin/env bash
#
# Nightly backup of the radio plays tracker database.
#
#   ./deploy/backup.sh
#
# Produces one encrypted, compressed dump per run, keeps a local window of them, and
# (when a remote is configured) pushes a copy off the box. Run it from the repo root, or
# via cron — see BACKUP.md.
#
# Same design as the MaHuRaa and MaHushma Friends backups, on purpose: three apps on one
# Pi, one way of backing them up, one runbook shape to remember on a bad day.
#
# Design notes, because the failure modes here are all silent ones:
#
#  * `pipefail` is not optional. `pg_dump | gzip > file` reports gzip's exit status, so
#    without it a database that refused to dump produces a perfectly valid 20-byte
#    archive and a script that says "OK".
#  * Every artifact is decrypted and gunzip-tested before it counts as a backup, and
#    checked for content that only a real dump contains. An unverified backup is a
#    rumour.
#  * Nothing is pruned until the new backup has verified. A run that fails must never be
#    able to delete the last good copy.
#  * The passphrase is not stored on the Pi alone. If the card dies and the passphrase
#    died with it, the offsite copies are noise.
#
# The play history goes back years and cannot be re-recorded: a song the recognizer
# heard on the radio in 2024 is gone if this database is.
set -euo pipefail

cd "$(dirname "$0")/.."

# shellcheck source=deploy/lib.sh
source "$(dirname "$0")/lib.sh"

ENV_FILE="${RPT_ENV_FILE:-.env}"
load_env "$ENV_FILE"

BACKUP_DIR="${RPT_BACKUP_DIR:-./backups}"
KEEP_LOCAL_DAYS="${RPT_BACKUP_KEEP_LOCAL_DAYS:-14}"
KEEP_REMOTE_DAYS="${RPT_BACKUP_KEEP_REMOTE_DAYS:-90}"
# Matches the server in docker-compose.yml (postgres:16-bookworm). A newer pg_dump can
# dump an older server, but matching majors is the least-surprise choice — and whatever
# is used here must also be what restore.sh verifies with.
PG_IMAGE="${RPT_BACKUP_PG_IMAGE:-postgres:16-alpine}"
RCLONE_IMAGE="${RPT_BACKUP_RCLONE_IMAGE:-rclone/rclone:latest}"
# The container_name docker-compose.yml gives Postgres; used to find its network.
PG_CONTAINER="${RPT_BACKUP_PG_CONTAINER:-mahushma-postgres}"

# The same POSTGRES_* settings the api and worker use. Overridable so the script can be
# exercised against a dev stack. The port is the one *inside* the Docker network, which
# is always 5432: POSTGRES_PORT in .env is the host-side mapping.
DB_HOST="${RPT_BACKUP_HOST:-${POSTGRES_HOST:-postgres}}"
DB_PORT="${RPT_BACKUP_PORT:-5432}"
DB_NAME="${RPT_BACKUP_DB:-${POSTGRES_DB:-radio_plays}}"
DB_USER="${RPT_BACKUP_USER:-${POSTGRES_USER:-postgres}}"
DB_PASS="${RPT_BACKUP_PASSWORD:-${POSTGRES_PASSWORD:-}}"
NETWORK="${RPT_BACKUP_NETWORK:-}"

# Where the copies go, as an rclone remote and path — "gdrive:RadioPlaysTracker-Backups".
# Empty means local-only.
REMOTE="${RPT_BACKUP_REMOTE:-}"
RCLONE_CONFIG_DIR="${RPT_RCLONE_CONFIG_DIR:-$HOME/.config/rclone}"

# The config directory is mounted writable on purpose (see the upload block), and as the
# invoking user so a root-owned container cannot take ownership of the host's rclone.conf.
rclone_run() {
  docker run --rm \
    --user "$(id -u):$(id -g)" \
    -v "$RCLONE_CONFIG_DIR:/config/rclone" \
    -v "$(cd "$BACKUP_DIR" && pwd):/data:ro" \
    "$RCLONE_IMAGE" "$@"
}

[[ -n "$DB_PASS" ]] || die "no database password (set POSTGRES_PASSWORD in $ENV_FILE)"
[[ -n "${RPT_BACKUP_PASSPHRASE:-}" ]] ||
  die "RPT_BACKUP_PASSPHRASE is not set — refusing to write an unencrypted dump of the
       database. See BACKUP.md."

# The dump runs in a container, so it needs the network the Postgres container is on.
if [[ -z "$NETWORK" ]]; then
  NETWORK="$(docker_network_of "$DB_HOST")"
  [[ -n "$NETWORK" ]] || NETWORK="$(docker_network_of "$PG_CONTAINER")"
  [[ -n "$NETWORK" ]] && log "network: $NETWORK"
fi
[[ -n "$NETWORK" ]] || die "could not work out which Docker network to use.
       Neither '$DB_HOST' nor '$PG_CONTAINER' is a running container here. Find the
       network Postgres is on with 'docker network ls' and set RPT_BACKUP_NETWORK in $ENV_FILE."

mkdir -p "$BACKUP_DIR"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
ARTIFACT="$BACKUP_DIR/radio-plays-$STAMP.sql.gz.enc"

# Built under a .partial name and only renamed once it has verified, so a run that dies
# part-way cannot leave a file that *looks* like a backup. Found by testing in MaHuRaa:
# with `set -e` a failed pg_dump aborts the script before any cleanup line can run, and
# openssl has already written a perfectly well-formed 48-byte encryption of an empty
# stream. Restoring "the latest backup" would then hand you an empty database.
PARTIAL="$ARTIFACT.partial"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK" "$PARTIAL"' EXIT

log "dumping $DB_NAME from $DB_HOST as $DB_USER"

# --no-owner/--no-privileges so a restore does not depend on the role layout of the box
# it is being restored onto — which, on the day you need it, may be a fresh machine.
set -o pipefail
docker run --rm --network "$NETWORK" \
  -e PGPASSWORD="$DB_PASS" \
  "$PG_IMAGE" \
  pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    --no-owner --no-privileges \
  | gzip -9 \
  | openssl enc -aes-256-cbc -pbkdf2 -iter 200000 -salt \
      -pass env:RPT_BACKUP_PASSPHRASE \
      -out "$PARTIAL"

[[ -s "$PARTIAL" ]] || die "dump produced an empty file"

# ── Verify before trusting ──────────────────────────────────────────────────────
# Decrypt, test the gzip stream, and confirm the SQL contains the tables we expect.
# This is what separates a backup from a file.
log "verifying $(basename "$ARTIFACT")"

# Round-trip it exactly the way a restore would: decrypt, check the compression stream,
# then read the SQL. Anything that fails here means the artifact is not a backup, and the
# EXIT trap removes the .partial on the way out.
openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 \
  -pass env:RPT_BACKUP_PASSPHRASE -in "$PARTIAL" -out "$WORK/dump.gz" ||
  die "artifact would not decrypt"

gzip -t "$WORK/dump.gz" || die "artifact failed gzip verification"

gunzip -c "$WORK/dump.gz" > "$WORK/dump.sql"

# A dump that restores cleanly but is missing the history would be the worst outcome of
# all: silent, and only discovered on the day it matters. Matched on the table's COPY
# line rather than the bare word: "plays" or "songs" turn up in index and constraint
# names, so a grep for the word alone would pass a dump that holds no data at all.
for table in plays songs artists albums stations; do
  grep -q "^COPY public\.$table " "$WORK/dump.sql" ||
    die "no '$table' data in the dump — refusing to keep it"
done

# Only now is it a backup.
mv "$PARTIAL" "$ARTIFACT"

LINES="$(wc -l < "$WORK/dump.sql")"
SIZE="$(du -h "$ARTIFACT" | cut -f1)"
log "verified: $SIZE encrypted, $LINES lines of SQL"

# ── Off-box copy ────────────────────────────────────────────────────────────────
# Destination-agnostic: anything rclone can talk to. Configured as a named remote in an
# rclone.conf rather than through environment variables, because Google Drive hands back a
# refreshed OAuth token periodically and rclone can only persist that to a file it can
# write. Env-var config would work until the day the token rotated, and then stop silently.
if [[ -n "$REMOTE" ]]; then
  [[ -f "$RCLONE_CONFIG_DIR/rclone.conf" ]] ||
    die "no rclone.conf in $RCLONE_CONFIG_DIR — see BACKUP.md"

  log "uploading to $REMOTE"
  rclone_run copy "/data/$(basename "$ARTIFACT")" "$REMOTE/" ||
    die "upload failed — local copy kept at $ARTIFACT"

  log "pruning remote copies older than ${KEEP_REMOTE_DAYS}d"
  rclone_run delete --min-age "${KEEP_REMOTE_DAYS}d" "$REMOTE/" ||
    log "WARNING: remote prune failed (the new backup is safely uploaded)"
else
  log "no remote configured — local copy only. This does NOT survive the SD card dying."
fi

# ── Local retention, last, and only after everything above succeeded ─────────────
log "pruning local copies older than ${KEEP_LOCAL_DAYS}d"
find "$BACKUP_DIR" -name 'radio-plays-*.sql.gz.enc' -type f \
  -mtime "+$KEEP_LOCAL_DAYS" -print -delete

log "done: $ARTIFACT"
