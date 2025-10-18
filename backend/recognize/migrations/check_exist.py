import json
import os
from typing import Dict
from elasticsearch import Elasticsearch
from helper import Helper

ids = [
    "5e4PVtYVBu9BpJVhmQhIvS",
    "15VRO9CQwMpbqUYA7e6Hwg",
    "4hTCrHBobyRw5GCChPgPj6",
    "244AvzGQ4Ksa5637JQu5Gy",
    "7vOP1qpsMmex9TLLkMQPZx",
]

def _create_elastic_client() -> Elasticsearch:
        config = Helper.load_config().get("elastic", {})
        url = os.getenv("ELASTIC_URL", "http://localhost:9200")
        user = config.get("user") or os.getenv("ELASTIC_USER")
        password = os.getenv("ELASTIC_PASSWORD")
        kwargs: Dict[str, object] = {"hosts": [url]}
        if user and password:
            kwargs["basic_auth"] = (user, password)
        return Elasticsearch(**kwargs)

es = _create_elastic_client()
docs = es.mget(index="songs_index", ids=ids)
for doc in docs["docs"]:
    print(doc["_id"], "found=", doc.get("found"), "source keys=", list((doc.get("_source") or {}).keys()))