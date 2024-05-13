import os, json, logging
from logging.handlers import RotatingFileHandler
from elasticsearch import Elasticsearch

class Helper:
    def __init__(self):
        return

    @staticmethod
    def load_config(config_filename='config.json'):
        """Loads configuration data from a JSON file."""
        if os.path.exists(config_filename):
            with open(config_filename, 'r') as file:
                return json.load(file)
        return {}
    
    @staticmethod
    def save_config(data, config_filename='config.json'):
        """Saves configuration data to a JSON file."""
        with open(config_filename, 'w') as file:
            json.dump(data, file, indent=4)

    @staticmethod
    def get_station_names():
        config = Helper.load_config()
        station_names = [station_info['name'] for station_info in config['stations']]
        return station_names

    @staticmethod
    def get_rotating_logger(name, log_file='elastic_indexing.log', max_log_size=10*1024*1024, backup_count=5):
        logger = logging.getLogger(name)
        logger.setLevel(logging.INFO)
        
        if not logger.handlers:
            handler = RotatingFileHandler(log_file, maxBytes=max_log_size, backupCount=backup_count, encoding='utf-8')
            formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
            handler.setFormatter(formatter)
            logger.addHandler(handler)
        
        return logger

    @staticmethod
    def get_es_connection():
        """Establishes connection to Elasticsearch using configuration."""
        elastic_config = Helper.load_config().get('elastic')
        elastic_url = elastic_config.get("url", "http://localhost:9200")
        elastic_user = elastic_config.get("user", "elastic")
        elastic_password = elastic_config.get("password", "password")
        
        return Elasticsearch(elastic_url, basic_auth=(elastic_user, elastic_password))