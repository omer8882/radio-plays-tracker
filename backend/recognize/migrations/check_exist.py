import json
import os
from typing import Dict
from elasticsearch import Elasticsearch

ids = [
    "5e4PVtYVBu9BpJVhmQhIvS",
    "15VRO9CQwMpbqUYA7e6Hwg",
    "4hTCrHBobyRw5GCChPgPj6",
    "244AvzGQ4Ksa5637JQu5Gy",
    "7vOP1qpsMmex9TLLkMQPZx",
]

def _create_elastic_client() -> Elasticsearch:
        url = os.getenv("ELASTIC_URL", "http://localhost:9200")
        user = os.getenv("ELASTIC_USER")
        password = os.getenv("ELASTIC_PASSWORD")
        kwargs: Dict[str, object] = {"hosts": [url]}
        if user and password:
            kwargs["basic_auth"] = (user, password)
        return Elasticsearch(**kwargs)

es = _create_elastic_client()

song_id = "5e4PVtYVBu9BpJVhmQhIvS"

doc = es.get(index="songs_index", id=song_id, ignore=[404])
print("lookup by bare id:", doc)
if not doc or not doc.get("found"):
    doc = es.search(index="songs_index", query={"term": {"id.keyword": song_id}}, size=1)
    print("search by term:", doc)
doc = es.get(index="songs_index", id=f"spotify:track:{song_id}", ignore=[404])
print("lookup by prefixed id:", doc)