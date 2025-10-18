import json
import os
import sys
from pathlib import Path
from typing import Dict, Iterable, Tuple

try:
    from elasticsearch import Elasticsearch  # type: ignore
except ImportError as exc:  # pragma: no cover
    raise RuntimeError(
        "Missing dependency 'elasticsearch'. Install it in your environment before running this script."
    ) from exc

import psycopg2

BACKEND_RECOGNIZE = Path(__file__).resolve().parents[1]
if str(BACKEND_RECOGNIZE) not in sys.path:
    sys.path.append(str(BACKEND_RECOGNIZE))

from helper import Helper  # pylint: disable=wrong-import-position

STATION_ALIASES = {
    "plays_index": "glglz",
    "radius100_plays_index": "100fm",
}


def _resolve_station_name(index: str) -> str:
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


def _create_pg_connection() -> psycopg2.extensions.connection:
    config = Helper.load_config().get("postgres", {})
    conn = psycopg2.connect(
        host=config.get("host", os.getenv("POSTGRES_HOST", "localhost")),
        port=config.get("port", os.getenv("POSTGRES_PORT", 5432)),
        database=config.get("database", os.getenv("POSTGRES_DB", "radio_plays")),
        user=config.get("user", os.getenv("POSTGRES_USER", "postgres")),
        password=config.get("password", os.getenv("POSTGRES_PASSWORD", "postgres")),
        options="-c timezone=Asia/Jerusalem",
    )
    conn.autocommit = True
    return conn


def _create_es_client() -> Elasticsearch:
    config = Helper.load_config().get("elastic", {})
    url = config.get("url") or os.getenv("ELASTIC_URL", "http://localhost:9200")
    user = config.get("user") or os.getenv("ELASTIC_USER")
    password = config.get("password") or os.getenv("ELASTIC_PASSWORD")
    kwargs: Dict[str, object] = {"hosts": [url]}
    if user and password:
        kwargs["basic_auth"] = (user, password)
    return Elasticsearch(**kwargs)


def fetch_postgres_stations() -> Dict[int, str]:
    with _create_pg_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id, name FROM stations ORDER BY name")
            return {int(row[0]): str(row[1]) for row in cur.fetchall()}


def fetch_elastic_stations() -> Dict[str, str]:
    client = _create_es_client()
    try:
        aliases = client.indices.get_alias(index="*plays_index")
    finally:
        client.close()
    return {index: _resolve_station_name(index) for index in sorted(aliases.keys())}


def _format_block(title: str, rows: Iterable[Tuple[str, str]]) -> str:
    return "\n".join([title] + [f"  {left:>12} -> {right}" for left, right in rows])


def main() -> None:
    pg = fetch_postgres_stations()
    es = fetch_elastic_stations()

    pg_block = _format_block(
        "Postgres stations:",
        [(str(station_id), name) for station_id, name in sorted(pg.items(), key=lambda item: item[1])],
    )
    es_block = _format_block(
        "Elasticsearch stations:",
        [(index, name) for index, name in es.items()],
    )

    pg_names = set(pg.values())
    es_names = set(es.values())
    missing_in_pg = sorted(es_names - pg_names)
    missing_in_es = sorted(pg_names - es_names)

    diff_summary = {
        "missing_in_postgres": missing_in_pg,
        "missing_in_elastic": missing_in_es,
    }

    print(pg_block)
    print()
    print(es_block)
    print()
    print("Differences:")
    print(json.dumps(diff_summary, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
