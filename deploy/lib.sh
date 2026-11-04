# Shared helpers for backup.sh and restore.sh. Sourced, never executed.

die() { echo "${0##*/}: $*" >&2; exit 1; }
log() { echo "[$(date -u +%H:%M:%S)] $*"; }

# Read a .env file *as data*, not as shell.
#
# `set -a; source .env` looks equivalent and is not. Compose's .env format is plain
# KEY=VALUE with no quoting rules, so a value with a space, a `;`, a `$` or a backtick —
# all fine in a Postgres password — is run, split or expanded by bash. On some values it
# fails loudly; on others it silently hands the scripts a different password.
#
# Real environment variables win over the file, matching how Compose resolves the same
# file, and keeping the overrides that let these scripts be tested against a dev stack.
load_env() {
  local file="$1" line key val
  [[ -f "$file" ]] || return 0

  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%$'\r'}"                      # tolerate a file edited on Windows
    [[ "$line" =~ ^[[:space:]]*(#|$) ]] && continue
    [[ "$line" =~ ^[[:space:]]*(export[[:space:]]+)?([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]] || continue

    key="${BASH_REMATCH[2]}"
    val="${BASH_REMATCH[3]}"

    # Strip one layer of matching quotes, the only quoting Compose honours.
    if [[ "$val" =~ ^\"(.*)\"$ || "$val" =~ ^\'(.*)\'$ ]]; then
      val="${BASH_REMATCH[1]}"
    fi

    printenv "$key" >/dev/null 2>&1 || export "$key=$val"
  done < "$file"
}

# Which Docker network a container is attached to, or empty if it is not a container.
#
# The dump runs in a throwaway container that has to reach Postgres by name, so it must
# join that Postgres's network. POSTGRES_HOST is usually `postgres`, which is a compose
# *service alias*, not a container name, so there is nothing to inspect under it — which
# is why backup.sh falls back to the container this repo's compose names
# (`mahushma-postgres`). RPT_BACKUP_NETWORK still overrides both when the guess is wrong.
docker_network_of() {
  docker inspect -f '{{range $name, $_ := .NetworkSettings.Networks}}{{$name}}{{"\n"}}{{end}}' \
    "$1" 2>/dev/null | head -1 || true
}
