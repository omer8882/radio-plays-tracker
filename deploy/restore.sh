#!/usr/bin/env bash
#
# Restore a radio plays tracker backup.
#
#   ./deploy/restore.sh backups/radio-plays-20261104T040001Z.sql.gz.enc
#   ./deploy/restore.sh --from-remote radio-plays-20261104T040001Z.sql.gz.enc
#   ./deploy/restore.sh --list
#
# By default it restores into a DISPOSABLE Postgres container and prints what it found,
# so you can look before you leap. Overwriting the live database takes --into-live,
# typed deliberately.
#
# The rehearsal is the point: a backup nobody has restored is an assumption. Running the
# default mode costs nothing, touches nothing on the live server, and is the only way to
# know the nightly job is producing something real.
set -euo pipefail

cd "$(dirname "$0")/.."

# shellcheck source=deploy/lib.sh
source "$(dirname "$0")/lib.sh"

ENV_FILE="${RPT_ENV_FILE:-.env}"
load_env "$ENV_FILE"

BACKUP_DIR="${RPT_BACKUP_DIR:-./backups}"
COMPOSE_FILE="${RPT_COMPOSE_FILE:-docker-compose.yml}"
# The worker writes every play it recognises, and the api runs its migrations whenever it
# starts. Either one left running can write into a half-restored schema.
APP_SERVICES="${RPT_APP_SERVICES:-api worker}"
# Must match the image backup.sh dumps with — see the note there.
PG_IMAGE="${RPT_BACKUP_PG_IMAGE:-postgres:16-alpine}"
RCLONE_IMAGE="${RPT_BACKUP_RCLONE_IMAGE:-rclone/rclone:latest}"
PG_CONTAINER="${RPT_BACKUP_PG_CONTAINER:-mahushma-postgres}"
DB_HOST="${RPT_BACKUP_HOST:-${POSTGRES_HOST:-postgres}}"
DB_PORT="${RPT_BACKUP_PORT:-5432}"
LIVE_DB="${RPT_BACKUP_DB:-${POSTGRES_DB:-radio_plays}}"
DB_USER="${RPT_BACKUP_USER:-${POSTGRES_USER:-postgres}}"
DB_PASS="${RPT_BACKUP_PASSWORD:-${POSTGRES_PASSWORD:-}}"
NETWORK="${RPT_BACKUP_NETWORK:-}"
# Only ever created inside the disposable container, never on the shared Postgres.
SCRATCH_DB="${RPT_RESTORE_DB:-radio_plays_restore}"
REMOTE="${RPT_BACKUP_REMOTE:-}"
RCLONE_CONFIG_DIR="${RPT_RCLONE_CONFIG_DIR:-$HOME/.config/rclone}"

# $1 is a host directory to expose as /out for downloads; pass "" when not needed.
rclone_run() {
  local out="$1"; shift
  docker run --rm \
    --user "$(id -u):$(id -g)" \
    -v "$RCLONE_CONFIG_DIR:/config/rclone" \
    ${out:+-v "$out:/out"} \
    "$RCLONE_IMAGE" "$@"
}

FROM_REMOTE=false
INTO_LIVE=false
ARTIFACT=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --list)
      echo "Local (${BACKUP_DIR}):"
      ls -1sh "$BACKUP_DIR"/radio-plays-*.sql.gz.enc 2>/dev/null || echo "  (none)"
      if [[ -n "$REMOTE" ]]; then
        echo "Remote (${REMOTE}):"
        rclone_run "" lsl "$REMOTE/" || echo "  (unreachable)"
      fi
      exit 0
      ;;
    --from-remote) FROM_REMOTE=true; shift ;;
    --into-live) INTO_LIVE=true; shift ;;
    -*) die "unknown option $1" ;;
    *) ARTIFACT="$1"; shift ;;
  esac
done

[[ -n "$ARTIFACT" ]] || die "which backup? pass a path, or --list to see them"
# An empty list would make `docker compose stop` stop the whole project, postgres included.
[[ -n "${APP_SERVICES// /}" ]] || die "RPT_APP_SERVICES is empty"
[[ -n "${RPT_BACKUP_PASSPHRASE:-}" ]] || die "RPT_BACKUP_PASSPHRASE is not set"

# Only --into-live talks to the live server; the default mode needs no network at all.
if $INTO_LIVE; then
  [[ -n "$DB_PASS" ]] || die "no database password (set POSTGRES_PASSWORD in $ENV_FILE)"
  if [[ -z "$NETWORK" ]]; then
    NETWORK="$(docker_network_of "$DB_HOST")"
    [[ -n "$NETWORK" ]] || NETWORK="$(docker_network_of "$PG_CONTAINER")"
  fi
  [[ -n "$NETWORK" ]] || die "could not work out which Docker network to use.
       Neither '$DB_HOST' nor '$PG_CONTAINER' is a running container here. Find the
       network Postgres is on with 'docker network ls' and set RPT_BACKUP_NETWORK in $ENV_FILE."
fi

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

if $FROM_REMOTE; then
  [[ -n "$REMOTE" ]] || die "no remote configured (set RPT_BACKUP_REMOTE in $ENV_FILE)"
  log "fetching $(basename "$ARTIFACT") from $REMOTE"
  rclone_run "$WORK" copy "$REMOTE/$(basename "$ARTIFACT")" /out/
  ARTIFACT="$WORK/$(basename "$ARTIFACT")"
fi

[[ -f "$ARTIFACT" ]] || die "no such file: $ARTIFACT"

log "decrypting $(basename "$ARTIFACT")"
openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 \
  -pass env:RPT_BACKUP_PASSPHRASE -in "$ARTIFACT" -out "$WORK/dump.gz" ||
  die "could not decrypt — wrong passphrase?"
gzip -t "$WORK/dump.gz" || die "corrupt archive"
gunzip -c "$WORK/dump.gz" > "$WORK/dump.sql"

TARGET="$LIVE_DB"
if $INTO_LIVE; then
  echo
  echo "  About to overwrite the LIVE database '$TARGET' on $DB_HOST."
  echo "  Everything currently in it will be replaced by this backup — every play the"
  echo "  recognizer has recorded since the backup was taken is lost."
  echo
  read -r -p "  Type the database name to confirm: " typed
  [[ "$typed" == "$TARGET" ]] || die "aborted"
  # Stop the writers first, or they write into a half-restored schema. Never `down`:
  # postgres is in this compose file too, and the other apps on the Pi use it.
  log "stopping $APP_SERVICES"
  # shellcheck disable=SC2086
  docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" stop $APP_SERVICES 2>/dev/null || true
else
  log "verifying into a throwaway database (use --into-live to restore for real)"
fi

COUNTS_SQL="
  SELECT 'plays: '              || (SELECT count(*) FROM plays)
  UNION ALL SELECT 'songs: '    || (SELECT count(*) FROM songs)
  UNION ALL SELECT 'artists: '  || (SELECT count(*) FROM artists)
  UNION ALL SELECT 'albums: '   || (SELECT count(*) FROM albums)
  UNION ALL SELECT 'stations: ' || (SELECT count(*) FROM stations)
  UNION ALL SELECT 'earliest play: ' || COALESCE((SELECT min(played_at)::text FROM plays), 'none')
  UNION ALL SELECT 'latest play: '   || COALESCE((SELECT max(played_at)::text FROM plays), 'none');"

if $INTO_LIVE; then
  psql_live() {
    docker run --rm -i --network "$NETWORK" -e PGPASSWORD="$DB_PASS" "$PG_IMAGE" \
      psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$LIVE_DB" "$@"
  }

  # Emptied by dropping its schema rather than dropping the database: the same command
  # works whatever role owns it, and it cannot reach the other apps' databases on the
  # same server.
  log "emptying $LIVE_DB"
  psql_live -v ON_ERROR_STOP=1 --quiet \
    -c "DROP SCHEMA public CASCADE;" \
    -c "CREATE SCHEMA public AUTHORIZATION \"$DB_USER\";" > /dev/null

  log "loading dump"
  psql_live -v ON_ERROR_STOP=1 --quiet < "$WORK/dump.sql" > /dev/null

  log "checking what came back"
  psql_live -At -c "$COUNTS_SQL"

  log "starting $APP_SERVICES"
  # shellcheck disable=SC2086
  docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --no-deps $APP_SERVICES
  log "restored into the live database."
else
  # Verification runs in a disposable Postgres of its own, with no route to the real one.
  # It needs no privileges, leaves no scratch database beside the other apps' data, and
  # has nothing to clean up — so it is a check nobody is reluctant to run.
  CONTAINER="rpt-restore-check-$$"
  log "starting a throwaway postgres to restore into"
  docker run -d --rm --name "$CONTAINER" \
    -e POSTGRES_PASSWORD=verify -e POSTGRES_DB="$SCRATCH_DB" \
    "$PG_IMAGE" > /dev/null
  # shellcheck disable=SC2064
  trap "rm -rf '$WORK'; docker rm -f '$CONTAINER' >/dev/null 2>&1 || true" EXIT

  # Wait over TCP, and by actually querying the target database rather than asking whether
  # a server is listening.
  #
  # The postgres image runs a *temporary* server during initdb so it can execute init
  # scripts, then shuts it down and starts the real one. That temporary server listens on
  # the unix socket only — so `pg_isready` inside the container reports ready during init,
  # and the next command dies with "the database system is shutting down". Checking over
  # 127.0.0.1 cannot see the temporary server, so success means the real one is up and the
  # database we asked for exists. 60s, because initdb on arm64 off an SD card is far
  # slower than on a desktop.
  ready=false
  for _ in $(seq 60); do
    if docker exec -e PGPASSWORD=verify "$CONTAINER" \
         psql -h 127.0.0.1 -U postgres -d "$SCRATCH_DB" -c 'SELECT 1' >/dev/null 2>&1; then
      ready=true
      break
    fi
    sleep 1
  done
  $ready || die "throwaway postgres never became ready"

  log "loading dump"
  docker exec -i -e PGPASSWORD=verify "$CONTAINER" \
    psql -h 127.0.0.1 -U postgres -d "$SCRATCH_DB" -v ON_ERROR_STOP=1 --quiet \
    < "$WORK/dump.sql" > /dev/null

  log "checking what came back"
  docker exec -e PGPASSWORD=verify "$CONTAINER" \
    psql -h 127.0.0.1 -U postgres -d "$SCRATCH_DB" -At -c "$COUNTS_SQL"

  echo
  log "those numbers came out of the backup file, in a database of its own."
  log "nothing on $DB_HOST was read or written. Compare them with the live app."
fi
