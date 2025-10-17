import os
import json
import logging
from copy import deepcopy
from logging.handlers import RotatingFileHandler

class Helper:
    def __init__(self):
        return

    @staticmethod
    def load_config(config_filename='./config.json'):
        """Loads configuration data from JSON and overlays environment settings."""

        def first_existing_path(paths):
            for candidate in paths:
                if candidate and os.path.exists(candidate):
                    return candidate
            return None

        base_dir = os.path.dirname(os.path.abspath(__file__))
        env_path = os.getenv('WORKER_CONFIG_PATH')
        search_paths = [env_path, config_filename, os.path.join(base_dir, config_filename)]

        config_path = first_existing_path(search_paths)
        config_data = {}
        if config_path:
            with open(config_path, 'r', encoding='utf-8') as file:
                config_data = json.load(file)

        merged_config = deepcopy(config_data) if isinstance(config_data, dict) else {}
        Helper._apply_env_overrides(merged_config)
        return merged_config
    
    @staticmethod
    def save_config(data, config_filename='config.json'):
        """Saves configuration data to a JSON file."""
        target_path = os.getenv('WORKER_CONFIG_PATH', config_filename)
        with open(target_path, 'w', encoding='utf-8') as file:
            json.dump(data, file, indent=4)

    @staticmethod
    def get_station_names():
        config = Helper.load_config()
        stations = config.get('stations') or []
        station_names = [station_info['name'] for station_info in stations if station_info.get('name')]
        return station_names

    @staticmethod
    def get_rotating_logger(name, log_file='elastic_indexing.log', max_log_size=10*1024*1024, backup_count=5, station_info=False):
        logger = logging.getLogger(name)
        logger.setLevel(logging.INFO)
        
        if not logger.handlers:
            handler = RotatingFileHandler(log_file, maxBytes=max_log_size, backupCount=backup_count, encoding='utf-8')
            formatter = logging.Formatter('%(asctime)s - %(levelname)s - ' + ('[%(station)s] ' if station_info else '') + '%(message)s')
            handler.setFormatter(formatter)
            logger.addHandler(handler)
        
        return logger

    @staticmethod
    def get_es_connection():
        """Establishes connection to Elasticsearch using configuration."""
        elastic_config = Helper.load_config().get('elastic', {})
        elastic_url = elastic_config.get("url", "http://localhost:9200")
        elastic_user = elastic_config.get("user", "elastic")
        elastic_password = elastic_config.get("password", "password")
        import importlib

        module_spec = importlib.util.find_spec('elasticsearch')
        if module_spec is None:  # pragma: no cover - optional dependency
            raise ImportError("elasticsearch client is not installed")

        elasticsearch_module = importlib.import_module('elasticsearch')
        Elasticsearch = getattr(elasticsearch_module, 'Elasticsearch')
        return Elasticsearch(elastic_url, basic_auth=(elastic_user, elastic_password))

    @staticmethod
    def _apply_env_overrides(config):
        """Apply environment variable overrides to the mutable config dict."""

        def set_if_env(section, key, env_var, cast=None):
            raw_value = os.getenv(env_var)
            if raw_value in (None, ''):
                return

            value = raw_value
            if cast:
                try:
                    value = cast(raw_value)
                except (ValueError, TypeError):
                    return

            section_dict = config.setdefault(section, {})
            section_dict[key] = value

        set_if_env('spotify', 'access_token', 'SPOTIFY_ACCESS_TOKEN')
        set_if_env('spotify', 'client_id', 'SPOTIFY_CLIENT_ID')
        set_if_env('spotify', 'client_secret', 'SPOTIFY_CLIENT_SECRET')

        set_if_env('postgres', 'host', 'POSTGRES_HOST')
        set_if_env('postgres', 'port', 'POSTGRES_PORT', int)
        set_if_env('postgres', 'database', 'POSTGRES_DB')
        set_if_env('postgres', 'user', 'POSTGRES_USER')
        set_if_env('postgres', 'password', 'POSTGRES_PASSWORD')

        set_if_env('elastic', 'url', 'ELASTIC_URL')
        set_if_env('elastic', 'user', 'ELASTIC_USER')
        set_if_env('elastic', 'password', 'ELASTIC_PASSWORD')