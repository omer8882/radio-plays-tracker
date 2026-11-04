# Backups & restore

The database is the only irreplaceable thing in this system. The code is on GitHub, the images
rebuild from it, and the Pi can be re-provisioned. The play history in Postgres exists nowhere
else, and it cannot be re-recorded: a song the recognizer heard on the radio last year is gone
if this database is.

- **`plays`**: every recognised play, per station, going back years
- **`songs`, `artists`, `albums`** and their link tables: the Spotify metadata each play points at
- **`stations`**: the station list

This works the same way as the MaHuRaa and MaHushma Friends backups on purpose: three apps on
one Pi, one way of backing them up, one runbook to remember on a bad day. The scripts are
`deploy/backup.sh` and `deploy/restore.sh`, the same as in the other two repos.

> **Put `RPT_BACKUP_PASSPHRASE` in your password manager now, and label it separately from
> MaHuRaa's and Friends'.**
> Backups are encrypted. If the Pi dies and the passphrase died with it, every copy in Drive is
> noise. That is the one way this whole setup fails completely. The likely mistake isn't a
> leak. It's grabbing the wrong app's passphrase during a stressful restore.

## What it protects against

| Failure | Local copy on the Pi | Copy in Drive |
|---|---|---|
| Bad migration, or a bug that deletes rows | ✅ | ✅ |
| `docker compose down -v` (removes `postgres_data`) | ✅ | ✅ |
| Wrong SQL against the wrong database | ✅ | ✅ |
| A mistake in *another* app on the shared Postgres | ✅ | ✅ |
| SD card wears out or dies | ❌ | ✅ |
| Pi stolen, fire, flood | ❌ | ✅ |

The local copy still matters. It covers the likely failures and restores instantly. It just
isn't enough on its own, which is why there's also a copy off the Pi.

The destination is an **rclone remote**, so changing it later (Drive today, something else
tomorrow) is a config change, not a code change.

Note that this repo's compose file **runs** the shared Postgres (`mahushma-postgres`), but this
backup covers only the `radio_plays` database. MaHuRaa and Friends back up their own databases
on the same server with their own scripts.

## One-time setup

### 1. Google Drive: already authorised

The Pi already has a working `gdrive` remote at `~/.config/rclone/rclone.conf`, set up for
MaHuRaa and reused by Friends. **Reuse it as is.** A separate folder, `RadioPlaysTracker-Backups`,
is all the separation you need. There's nothing to set up in Google Cloud.

```sh
ls -l ~/.config/rclone/rclone.conf     # -rw------- and owned by you
```

That file holds a live refresh token. Treat it like a password. If it's ever lost or the Pi is
rebuilt, the steps to re-authorise are in MaHuRaa's `docs/BACKUP.md`.

### 2. Fill in `.env` on the Pi

`/home/omer/apps/radio-plays-tracker/.env` already has `POSTGRES_USER`, `POSTGRES_PASSWORD`,
`POSTGRES_DB` and `POSTGRES_HOST`. The scripts read those same settings, and they parse the file
as data rather than sourcing it, so a password with spaces, `;` or `$` is fine. Add:

```sh
# Encryption. Store this in your password manager as well. Without it the backups are
# unreadable, including the offsite ones. Use a DIFFERENT passphrase from MaHuRaa's and
# Friends'. Generate one with: openssl rand -base64 32
RPT_BACKUP_PASSPHRASE=<long random string>

# Where the off-box copy goes. rclone creates the folder on first upload.
RPT_BACKUP_REMOTE=gdrive:RadioPlaysTracker-Backups

# Optional. These are the defaults.
#RPT_RCLONE_CONFIG_DIR=/home/omer/.config/rclone
#RPT_BACKUP_DIR=./backups
#RPT_BACKUP_KEEP_LOCAL_DAYS=14
#RPT_BACKUP_KEEP_REMOTE_DAYS=90
# Only if the Docker network can't be found automatically (see below)
#RPT_BACKUP_NETWORK=radio-plays-tracker_app
```

Make the file private:

```sh
chmod 600 .env
```

**The Docker network is found automatically.** The dump runs in a container that has to reach
Postgres by name, so it joins Postgres's network. `POSTGRES_HOST=postgres` is a compose service
alias, not a container name, so the script falls back to the container this compose file names,
`mahushma-postgres`, and uses its network. On the Pi that should print
`network: radio-plays-tracker_app`. If it picks the wrong network (Postgres attached to several),
set `RPT_BACKUP_NETWORK` explicitly.

### 3. Check the pieces are in place

Each of these prints something specific. Run them from the repo root on the Pi.

```sh
# Scripts present AND executable. The leading -rwxr-xr-x is the part that matters.
ls -l deploy/backup.sh deploy/restore.sh

# Unix line endings. Should print a bare "$" at the end, NOT "^M$": a CRLF script
# fails with an unhelpful "\r: command not found".
head -1 deploy/backup.sh | cat -A

# rclone config present and private: -rw------- and your user.
ls -l ~/.config/rclone/rclone.conf

# Both settings present, without printing the secret itself.
grep -c '^RPT_BACKUP_PASSPHRASE=.\+' .env      # must print 1
grep '^RPT_BACKUP_REMOTE=' .env                # must print the gdrive line
```

### 4. Run it once by hand

```sh
./deploy/backup.sh
```

A good run looks like this (from a test run against a copy of this setup; your sizes will be
larger):

```
[00:42:27] network: radio-plays-tracker_app
[00:42:27] dumping radio_plays from postgres as postgres
[00:42:33] verifying radio-plays-20261104T004227Z.sql.gz.enc
[00:42:33] verified: 4.0K encrypted, 760 lines of SQL
[00:42:33] uploading to gdrive:RadioPlaysTracker-Backups
[00:42:36] pruning remote copies older than 90d
[00:42:36] pruning local copies older than 14d
[00:42:36] done: ./backups/radio-plays-20261104T004227Z.sql.gz.enc
```

The first run on the Pi may not need to pull `postgres:16-alpine` for arm64, because the
Friends backup already uses that image.

`verified:` is the line that matters. It means the file was decrypted, its gzip stream tested,
and data for `plays`, `songs`, `artists`, `albums` and `stations` found inside. If the script
fails it leaves **no** file behind, on purpose.

**Don't schedule it until a manual run has worked.** A cron job that has never worked is worse
than none, because it looks like protection.

### 5. Confirm it arrived

```sh
./deploy/restore.sh --list
```

Both ends should list the same filename:

```
Local (./backups):
4.0K ./backups/radio-plays-20261104T004227Z.sql.gz.enc
Remote (gdrive:RadioPlaysTracker-Backups):
     3664 2026-11-04 00:42:36.000000000 radio-plays-20261104T004227Z.sql.gz.enc
```

The remote line proves it left the Pi. In Google Drive in the browser you should also see a
**RadioPlaysTracker-Backups** folder next to MaHuRaa's and Friends'.

### 6. Prove it restores (the real test)

Everything above proves a file exists. Only this proves it's a backup:

```sh
./deploy/restore.sh backups/radio-plays-<stamp>.sql.gz.enc
```

It starts a **throwaway Postgres container**, loads the dump into it, counts what came back,
and removes the container. It never touches the live Postgres and leaves nothing behind, so
it's safe to run any time.

```
plays: 500
songs: 1
artists: 1
albums: 1
stations: 2
earliest play: 2026-10-14 04:42:26.889527
latest play: 2026-11-03 23:42:26.889527
```

Compare against the live database:

```sh
docker exec -i mahushma-postgres psql -U postgres -d radio_plays -At \
  -c "SELECT 'plays: '||(SELECT count(*) FROM plays)||'  songs: '||(SELECT count(*) FROM songs)||'  artists: '||(SELECT count(*) FROM artists)||'  stations: '||(SELECT count(*) FROM stations)"
```

Matching numbers mean the backups work. Plays may run a little ahead of the backup, because the
worker keeps recording. Stations should match exactly.

### 7. Schedule it

First prove it works in cron's bare environment. "Works in my shell, fails at 3am" is the
classic version of this failure:

```sh
env -i HOME="$HOME" PATH=/usr/bin:/bin bash -c 'cd /home/omer/apps/radio-plays-tracker && ./deploy/backup.sh'
```

Then:

```sh
crontab -e
```

```cron
# Radio plays tracker: nightly backup at 04:00, after MaHuRaa (03:20) and Friends
# (03:40) so they don't all hit the Pi at once. ADD this line; keep the other two.
0 4 * * * cd /home/omer/apps/radio-plays-tracker && ./deploy/backup.sh >> /home/omer/rpt-backup.log 2>&1
```

Check it the next morning. Until a *scheduled* run has landed, the schedule is untested:

```sh
tail -20 ~/rpt-backup.log
ls -lh ~/apps/radio-plays-tracker/backups/
```

## Restoring

**The verify restore isn't optional practice. It's how you find out the backups are real.**
Do it now, and again whenever the database schema changes.

```sh
./deploy/restore.sh --list                                    # what's there, locally and in Drive
./deploy/restore.sh backups/radio-plays-<stamp>.sql.gz.enc
```

That loads the dump into a **throwaway Postgres container** and prints what it found. The live
database isn't read or written, and the container is gone when the command returns.

### Restoring for real

Only when you need it:

```sh
./deploy/restore.sh --into-live backups/radio-plays-<stamp>.sql.gz.enc
```

It makes you type the database name, then stops `worker` (it writes every play) and `api` (it runs
migrations when it starts) so nothing writes into a half-restored schema, and starts them again afterwards. It never
touches the `postgres` container, which the other apps also use.

It empties the database by dropping and recreating its `public` schema rather than dropping the
database. The other databases on the server are untouched.

Expect afterwards: plays recorded between the backup and the restore are gone. The worker
carries on from its own state file (`ops/recognizer/state.json`), so it won't re-record those
past plays either.

### From Drive, on a fresh Pi

```sh
./deploy/restore.sh --list                                         # find the newest
./deploy/restore.sh --from-remote --into-live radio-plays-<stamp>.sql.gz.enc
```

This needs three things that are **not** on the dead Pi: `.env`, `rclone.conf`, and the
passphrase. Keep all three in your password manager. The rclone token can be regenerated by
re-authorising Drive. The passphrase can't be regenerated by anyone.

Full rebuild order: bring up `postgres` (its first start creates the `radio_plays` database),
start `api` once so its migrations create the schema, then restore over it.

## How it works, and why

- **`pg_dump` → gzip → AES-256.** Plain SQL rather than a custom-format dump: at this size
  there's no performance reason not to, and plain SQL can be read, grepped and partly recovered
  by hand. `--no-owner --no-privileges` so a restore doesn't depend on the roles of the machine
  it lands on, which on the day you need it may be a new one.
- **Encrypted before it leaves the Pi.** Google encrypting it at rest isn't the same as Google
  not having it, and it keeps all three apps' backups the same.
- **Postgres 16 client, matching the server** (`postgres:16-bookworm` in `docker-compose.yml`).
  If the server is ever upgraded, change `RPT_BACKUP_PG_IMAGE` (or the default in both scripts)
  to match. `backup.sh` and `restore.sh` must use the same major version.
- **Port 5432, not `POSTGRES_PORT`.** The dump connects inside the Docker network, where
  Postgres always listens on 5432. `POSTGRES_PORT` in `.env` is the host-side port mapping.
- **The `.env` is parsed, never sourced.** `set -a; source .env` runs each line as shell, so a
  password with a space, `;`, `$` or backtick gets split, run or expanded. `load_env` reads it
  line by line as data, strips one layer of quotes, tolerates Windows line endings, and lets
  real environment variables win, the way Compose does.
- **`set -o pipefail`.** Without it `pg_dump | gzip > file` reports *gzip's* exit status, so a
  database that refused to dump gives a valid tiny archive and a script that claims success.
- **Built as `.partial`, renamed only after verifying.** With `set -e`, a failed `pg_dump` stops
  the script before any cleanup runs, and openssl has already written a valid ~48-byte
  encryption of nothing. Restoring "the latest backup" would give you an empty database. Nothing
  counts as a backup until it has round-tripped.
- **Verification is a real decrypt.** Every run decrypts its own file, tests the gzip stream,
  and checks for each table's data section (`COPY public.plays …`), not just the word, because
  table names also appear in index and constraint names.
- **Pruning happens last, and only after everything else worked.** A failing run can never
  delete the last good copy.
- **The verify container is waited for over TCP**, by querying the target database. During
  `initdb` the postgres image runs a temporary server on the unix socket only, so `pg_isready`
  reports ready too early and the next command fails with "the database system is shutting
  down". The 60s allowance is for `initdb` on arm64 off an SD card.

## What is *not* backed up

- **`.env`**: not in git and not in the backups. Copy it into your password manager once; it
  rarely changes.
- **`~/.config/rclone/rclone.conf`**: same reasoning, and storing the credentials for the backup
  destination *inside* that destination would be circular.
- **`ops/cloudflared/`** (tunnel credentials): local to the Pi, and the tunnel is managed from
  the Cloudflare dashboard.
- **`ops/recognizer/state.json`**: the worker's last-seen song per station. It rebuilds itself;
  losing it at worst records a song twice.
- **The other apps' databases** on the same Postgres: each app backs up its own.
- Everything else is reproducible from git.
