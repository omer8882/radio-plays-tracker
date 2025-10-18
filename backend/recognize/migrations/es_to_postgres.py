import argparse
import json
import logging
import os
import sys
from dataclasses import dataclass
from datetime import datetime, date
from pathlib import Path
from typing import Dict, Iterable, Iterator, List, Optional, Sequence, Set, Tuple

try:
    from elasticsearch import Elasticsearch, helpers  # type: ignore
except ImportError as exc:  # pragma: no cover
    raise RuntimeError(
        "Missing dependency 'elasticsearch'. Install it in your environment before running the migration."
    ) from exc

import psycopg2
from psycopg2.extras import Json, execute_values

BACKEND_RECOGNIZE = Path(__file__).resolve().parents[1]
if str(BACKEND_RECOGNIZE) not in sys.path:
    sys.path.append(str(BACKEND_RECOGNIZE))

from helper import Helper  # pylint: disable=wrong-import-position

STATION_ALIASES = {
    "plays_index": "glglz",
    "radius100_plays_index": "100fm",
}

DEFAULT_BATCH_SIZE = 500
DEFAULT_PREVIEW_SIZE = 5


@dataclass
class MigrationArgs:
    dry_run: bool
    batch_size: int
    station: Optional[List[str]]
    limit_songs: Optional[int]
    limit_plays: Optional[int]
    preview: bool
    preview_size: int


@dataclass
class MigrationStats:
    songs_processed: int = 0
    plays_processed: int = 0
    songs_written: int = 0
    plays_written: int = 0


class ElasticSong:
    def __init__(self, payload: Dict[str, object], fallback_id: Optional[str] = None):
        self.payload = payload
        self._fallback_id = fallback_id

    @property
    def song_id(self) -> str:
        value = self.payload.get("id")
        if not value and self._fallback_id:
            value = self._fallback_id
        return str(value).strip() if value else ""

    @property
    def name(self) -> str:
        return str(self.payload.get("name", "")).strip()

    @property
    def duration_ms(self) -> int:
        return int(self.payload.get("duration_ms") or 0)

    @property
    def popularity(self) -> int:
        return int(self.payload.get("popularity") or 0)

    @property
    def album(self) -> Optional[Dict[str, object]]:
        album = self.payload.get("album")
        return album if isinstance(album, dict) else None

    @property
    def artists(self) -> List[Dict[str, object]]:
        artists = self.payload.get("artists")
        if isinstance(artists, list):
            return [a for a in artists if isinstance(a, dict) and a.get("id")]
        return []

    @property
    def external_links(self) -> Dict[str, object]:
        links = self.payload.get("external_links", {})
        return links if isinstance(links, dict) else {}


class Migrator:
    def __init__(self, args: MigrationArgs):
        self.args = args
        self.logger = self._configure_logging()
        self.es = self._create_elastic_client()
        self.pg_conn = self._create_pg_connection()
        self.stats = MigrationStats()
        self.station_map = self._load_station_map()

    def _configure_logging(self) -> logging.Logger:
        logger = logging.getLogger("es_to_postgres")
        logger.setLevel(logging.INFO)
        if not logger.handlers:
            handler = logging.StreamHandler()
            handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(message)s"))
            logger.addHandler(handler)
        return logger

    def _create_elastic_client(self) -> Elasticsearch:
        config = Helper.load_config().get("elastic", {})
        url = os.getenv("ELASTIC_URL", "http://localhost:9200")
        user = config.get("user") or os.getenv("ELASTIC_USER")
        password = os.getenv("ELASTIC_PASSWORD")
        kwargs: Dict[str, object] = {"hosts": [url]}
        if user and password:
            kwargs["basic_auth"] = (user, password)
        return Elasticsearch(**kwargs)

    def _create_pg_connection(self) -> psycopg2.extensions.connection:
        config = Helper.load_config().get("postgres", {})
        conn = psycopg2.connect(
            host=config.get("host", os.getenv("POSTGRES_HOST", "localhost")),
            port=config.get("port", os.getenv("POSTGRES_PORT", 5432)),
            database=config.get("database", os.getenv("POSTGRES_DB", "radio_plays")),
            user=config.get("user", os.getenv("POSTGRES_USER", "postgres")),
            password=config.get("password", os.getenv("POSTGRES_PASSWORD", "postgres")),
            options="-c timezone=Asia/Jerusalem",
        )
        conn.autocommit = False
        return conn

    def _load_station_map(self) -> Dict[str, int]:
        station_map: Dict[str, int] = {}
        with self.pg_conn.cursor() as cur:
            cur.execute("SELECT id, name FROM stations")
            for station_id, name in cur.fetchall():
                station_map[str(name)] = int(station_id)
        return station_map

    def close(self) -> None:
        try:
            self.pg_conn.close()
        finally:
            self.es.close()

    def migrate(self) -> MigrationStats:
        self.logger.info(
            "Starting migration | dry_run=%s | batch_size=%s | stations=%s",
            self.args.dry_run,
            self.args.batch_size,
            ",".join(self.args.station) if self.args.station else "all",
        )
        try:
            self._migrate_songs()
            self._migrate_plays()
            self.pg_conn.commit()
        except Exception:
            self.pg_conn.rollback()
            raise
        finally:
            self.close()
        return self.stats

    def _migrate_songs(self) -> None:
        self.logger.info("Migrating songs from songs_index")
        iterator = helpers.scan(self.es, index="songs_index", preserve_order=True)
        iterator = self._limit(iterator, self.args.limit_songs)
        for batch in self._chunk(iterator, self.args.batch_size):
            song_models = []
            for hit in batch:
                source = hit.get("_source")
                if not isinstance(source, dict):
                    continue
                fallback_id = hit.get("_id")
                song_models.append(
                    ElasticSong(source, fallback_id=str(fallback_id) if fallback_id else None)
                )
            self.stats.songs_processed += len(song_models)
            self.logger.info(
                "Songs batch processed | batch_size=%s | processed_total=%s",
                len(song_models),
                self.stats.songs_processed,
            )
            if not song_models:
                continue
            if self.args.dry_run:
                if self.args.preview:
                    self._preview_song_batch(song_models)
                self.logger.info("Dry run enabled: skipping song writes for this batch")
                continue
            albums = self._prepare_album_rows(song_models)
            artists = self._prepare_artist_rows(song_models)
            song_rows = self._prepare_song_rows(song_models)
            song_artist_rows = self._prepare_song_artist_rows(song_models)
            with self.pg_conn:
                with self.pg_conn.cursor() as cur:
                    if albums:
                        self._upsert_albums(cur, albums)
                    if artists:
                        self._upsert_artists(cur, artists)
                    if song_rows:
                        self._upsert_songs(cur, song_rows)
                    if song_artist_rows:
                        self._insert_song_artists(cur, song_artist_rows)
            self.stats.songs_written += len(song_rows)
            self.logger.info(
                "Songs batch written | songs=%s | albums=%s | artists=%s",
                len(song_rows),
                len(albums),
                len(artists),
            )

    def _migrate_plays(self) -> None:
        indices = self._plays_indices()
        if self.args.station:
            indices = [idx for idx in indices if self._resolve_station_name(idx) in self.args.station]
        for index in indices:
            station_name = self._resolve_station_name(index)
            station_id = self._station_id_for_name(station_name)
            self.logger.info("Migrating plays | index=%s | station=%s", index, station_name)
            iterator = helpers.scan(self.es, index=index, preserve_order=True)
            iterator = self._limit(iterator, self.args.limit_plays)
            for batch in self._chunk(iterator, self.args.batch_size):
                rows = []
                for hit in batch:
                    doc = hit["_source"]
                    song_id = doc.get("song_id")
                    played_at_raw = doc.get("played_at")
                    if not song_id or not played_at_raw:
                        continue
                    played_at = self._parse_played_at(str(played_at_raw))
                    rows.append((song_id, station_id, played_at))
                self.stats.plays_processed += len(batch)
                self.logger.info(
                    "Plays batch processed | index=%s | batch_size=%s | processed_total=%s",
                    index,
                    len(batch),
                    self.stats.plays_processed,
                )
                if self.args.dry_run or not rows:
                    if self.args.dry_run and rows:
                        if self.args.preview:
                            self._preview_play_batch(rows)
                        self.logger.info("Dry run enabled: skipping play writes for this batch")
                    continue
                missing_ids = self._ensure_songs_exist([row[0] for row in rows])
                if missing_ids:
                    skipped_rows = [row for row in rows if row[0] in missing_ids]
                    if skipped_rows:
                        rows = [row for row in rows if row[0] not in missing_ids]
                        self.logger.warning(
                            "Skipping %s plays referencing songs missing from all sources: %s",
                            len(skipped_rows),
                            list(missing_ids)[:5],
                        )
                if not rows:
                    continue
                with self.pg_conn:
                    with self.pg_conn.cursor() as cur:
                        self._insert_plays(cur, rows)
                self.stats.plays_written += len(rows)
                self.logger.info(
                    "Plays batch written | index=%s | rows=%s",
                    index,
                    len(rows),
                )

    def _plays_indices(self) -> List[str]:
        response = self.es.indices.get_alias(index="*plays_index")
        return sorted(response.keys())

    @staticmethod
    def _limit(iterator: Iterator[dict], limit: Optional[int]) -> Iterator[dict]:
        if limit is None:
            yield from iterator
            return
        for count, item in enumerate(iterator, start=1):
            if count > limit:
                break
            yield item

    @staticmethod
    def _chunk(iterator: Iterable[dict], size: int) -> Iterator[List[dict]]:
        bucket: List[dict] = []
        for item in iterator:
            bucket.append(item)
            if len(bucket) >= size:
                yield bucket
                bucket = []
        if bucket:
            yield bucket

    def _prepare_album_rows(self, songs: Sequence[ElasticSong]) -> List[Tuple[str, str, Optional[date]]]:
        albums: Dict[str, Tuple[str, str, Optional[date]]] = {}
        for song in songs:
            album = song.album
            if not album or not album.get("id"):
                continue
            album_id = str(album["id"])
            if album_id in albums:
                continue
            release_date = self._parse_release_date(str(album.get("release_date", "")))
            albums[album_id] = (
                album_id,
                str(album.get("name", "")).strip(),
                release_date,
            )
        return list(albums.values())

    def _prepare_artist_rows(self, songs: Sequence[ElasticSong]) -> List[Tuple[str, str]]:
        artists: Dict[str, Tuple[str, str]] = {}
        for song in songs:
            for artist in song.artists:
                artist_id = str(artist["id"])
                if artist_id in artists:
                    continue
                artists[artist_id] = (artist_id, str(artist.get("name", "")).strip())
        return list(artists.values())

    def _prepare_song_rows(self, songs: Sequence[ElasticSong]) -> List[Tuple[str, str, Optional[str], int, int, Json]]:
        rows: List[Tuple[str, str, Optional[str], int, int, Json]] = []
        for song in songs:
            song_id = song.song_id
            if not song_id:
                continue
            album = song.album
            album_id = str(album["id"]) if album and album.get("id") else None
            rows.append(
                (
                    song_id,
                    song.name,
                    album_id,
                    song.duration_ms,
                    song.popularity,
                    Json(song.external_links or {}),
                )
            )
        return rows

    def _prepare_song_artist_rows(self, songs: Sequence[ElasticSong]) -> List[Tuple[str, str, int]]:
        rows: List[Tuple[str, str, int]] = []
        for song in songs:
            song_id = song.song_id
            if not song_id:
                continue
            for order, artist in enumerate(song.artists):
                rows.append((song_id, str(artist["id"]), order))
        return rows

    def _preview_song_batch(self, songs: Sequence[ElasticSong]) -> None:
        size = max(1, min(self.args.preview_size, len(songs)))
        albums = self._prepare_album_rows(songs)[:size]
        artists = self._prepare_artist_rows(songs)[:size]
        song_rows = self._prepare_song_rows(songs)[:size]
        song_artists = self._prepare_song_artist_rows(songs)[:size]
        self.logger.info("Preview albums: %s", json.dumps(albums, default=str))
        self.logger.info("Preview artists: %s", json.dumps(artists, default=str))
        self.logger.info("Preview songs: %s", json.dumps(song_rows, default=str))
        self.logger.info("Preview song_artists: %s", json.dumps(song_artists, default=str))

    def _preview_play_batch(self, rows: Sequence[Tuple[str, int, datetime]]) -> None:
        size = max(1, min(self.args.preview_size, len(rows)))
        subset = [
            {
                "song_id": row[0],
                "station_id": row[1],
                "played_at": row[2].isoformat(sep=" "),
            }
            for row in rows[:size]
        ]
        self.logger.info("Preview plays: %s", json.dumps(subset, default=str))

    def _ensure_songs_exist(self, song_ids: Sequence[str]) -> Set[str]:
        unique_ids = {sid.strip() for sid in song_ids if sid}
        if not unique_ids:
            return set()

        ids_list = list(unique_ids)
        with self.pg_conn.cursor() as cur:
            cur.execute("SELECT id FROM songs WHERE id = ANY(%s)", (ids_list,))
            existing = {row[0] for row in cur.fetchall()}

        missing: Set[str] = {sid for sid in unique_ids if sid not in existing}
        if not missing:
            return set()

        response = self.es.mget(index="songs_index", ids=list(missing))
        docs = response.get("docs", []) if isinstance(response, dict) else []
        song_models: List[ElasticSong] = []
        found_ids: Set[str] = set()
        for doc in docs:
            if not doc.get("found") or not doc.get("_source"):
                continue
            fallback_id = doc.get("_id")
            model = ElasticSong(
                doc["_source"], fallback_id=str(fallback_id) if fallback_id else None
            )
            song_id = model.song_id
            if not song_id:
                continue
            song_models.append(model)
            found_ids.add(song_id)

        missing_not_found = [doc.get("_id") for doc in docs if not doc.get("found")]
        if missing_not_found:
            self.logger.warning("Songs missing in Elasticsearch: %s", missing_not_found)

        albums = self._prepare_album_rows(song_models)
        artists = self._prepare_artist_rows(song_models)
        song_rows = self._prepare_song_rows(song_models)
        song_artist_rows = self._prepare_song_artist_rows(song_models)

        inserted_ids: Set[str] = {row[0] for row in song_rows}

        if song_rows:
            with self.pg_conn:
                with self.pg_conn.cursor() as cur:
                    if albums:
                        self._upsert_albums(cur, albums)
                    if artists:
                        self._upsert_artists(cur, artists)
                    if song_rows:
                        self._upsert_songs(cur, song_rows)
                    if song_artist_rows:
                        self._insert_song_artists(cur, song_artist_rows)

            self.stats.songs_written += len(song_rows)
            self.logger.info("Backfilled %s songs referenced by plays", len(song_rows))

        missing_after_fetch = missing - inserted_ids
        if missing_after_fetch:
            self.logger.warning(
                "Unable to backfill %s songs; skipping related plays. ids=%s",
                len(missing_after_fetch),
                list(missing_after_fetch)[:5],
            )

        return missing_after_fetch

    @staticmethod
    def _parse_release_date(raw: str) -> Optional[date]:
        raw = raw.strip()
        if not raw:
            return None
        if len(raw) == 4:
            raw = f"{raw}-01-01"
        elif len(raw) == 7:
            raw = f"{raw}-01"
        try:
            return datetime.strptime(raw, "%Y-%m-%d").date()
        except ValueError:
            return None

    @staticmethod
    def _parse_played_at(raw: str) -> datetime:
        cleaned = raw.replace("Z", "").replace("T", " ")
        try:
            return datetime.fromisoformat(cleaned)
        except ValueError:
            with_ms = cleaned.split(".")[0]
            return datetime.strptime(with_ms, "%Y-%m-%d %H:%M:%S")

    def _resolve_station_name(self, index: str) -> str:
        if index in STATION_ALIASES:
            return STATION_ALIASES[index]
        if index.endswith("_plays_index"):
            slug = index[: -len("_plays_index")]
            if slug == "plays":
                return "glglz"
            return slug
        if index == "plays_index":
            return "glglz"
        return index

    def _station_id_for_name(self, name: str) -> int:
        resolved = STATION_ALIASES.get(name, name)
        station_id = self.station_map.get(resolved)
        if station_id is None:
            raise KeyError(f"Station '{resolved}' is not present in Postgres. Add it before migrating.")
        return station_id

    def _upsert_albums(self, cur: psycopg2.extensions.cursor, rows: Sequence[Tuple[str, str, Optional[date]]]) -> None:
        execute_values(
            cur,
            """
            INSERT INTO albums (id, name, release_date)
            VALUES %s
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                release_date = COALESCE(EXCLUDED.release_date, albums.release_date),
                updated_at = CURRENT_TIMESTAMP
            """,
            rows,
            page_size=self.args.batch_size,
        )

    def _upsert_artists(self, cur: psycopg2.extensions.cursor, rows: Sequence[Tuple[str, str]]) -> None:
        execute_values(
            cur,
            """
            INSERT INTO artists (id, name)
            VALUES %s
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                updated_at = CURRENT_TIMESTAMP
            """,
            rows,
            page_size=self.args.batch_size,
        )

    def _upsert_songs(self, cur: psycopg2.extensions.cursor, rows: Sequence[Tuple[str, str, Optional[str], int, int, Json]]) -> None:
        execute_values(
            cur,
            """
            INSERT INTO songs (id, name, album_id, duration_ms, popularity, external_links)
            VALUES %s
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                album_id = EXCLUDED.album_id,
                duration_ms = EXCLUDED.duration_ms,
                popularity = EXCLUDED.popularity,
                external_links = EXCLUDED.external_links,
                updated_at = CURRENT_TIMESTAMP
            """,
            rows,
            page_size=self.args.batch_size,
        )

    def _insert_song_artists(self, cur: psycopg2.extensions.cursor, rows: Sequence[Tuple[str, str, int]]) -> None:
        execute_values(
            cur,
            """
            INSERT INTO song_artists (song_id, artist_id, artist_order)
            VALUES %s
            ON CONFLICT (song_id, artist_id) DO NOTHING
            """,
            rows,
            page_size=self.args.batch_size,
        )

    def _insert_plays(self, cur: psycopg2.extensions.cursor, rows: Sequence[Tuple[str, int, datetime]]) -> None:
        execute_values(
            cur,
            """
            INSERT INTO plays (song_id, station_id, played_at)
            VALUES %s
            ON CONFLICT (song_id, station_id, played_at) DO NOTHING
            """,
            rows,
            page_size=self.args.batch_size,
        )


def parse_args(argv: Optional[Sequence[str]] = None) -> MigrationArgs:
    parser = argparse.ArgumentParser(description="Migrate legacy Elasticsearch data into Postgres.")
    parser.add_argument("--dry-run", action="store_true", help="Scan data without writing to Postgres")
    parser.add_argument("--batch-size", type=int, default=DEFAULT_BATCH_SIZE, help="Number of documents per batch")
    parser.add_argument("--station", action="append", help="Limit migration to specific station slugs")
    parser.add_argument("--limit-songs", type=int, help="Process only the first N songs")
    parser.add_argument("--limit-plays", type=int, help="Process only the first N plays per index")
    parser.add_argument("--preview", action="store_true", help="Log transformed rows during dry run")
    parser.add_argument(
        "--preview-size",
        type=int,
        default=DEFAULT_PREVIEW_SIZE,
        help="Maximum number of records to include per preview list",
    )
    parsed = parser.parse_args(argv)
    return MigrationArgs(
        dry_run=parsed.dry_run,
        batch_size=max(1, parsed.batch_size),
        station=parsed.station,
        limit_songs=parsed.limit_songs,
        limit_plays=parsed.limit_plays,
        preview=parsed.preview,
        preview_size=max(1, parsed.preview_size),
    )


def main(argv: Optional[Sequence[str]] = None) -> None:
    args = parse_args(argv)
    migrator = Migrator(args)
    stats = MigrationStats()
    try:
        stats = migrator.migrate()
    except Exception:
        migrator.logger.exception("Migration failed")
        raise
    finally:
        migrator.logger.info(
            json.dumps(
                {
                    "songs_processed": stats.songs_processed,
                    "songs_written": stats.songs_written,
                    "plays_processed": stats.plays_processed,
                    "plays_written": stats.plays_written,
                }
            )
        )


if __name__ == "__main__":
    main()
