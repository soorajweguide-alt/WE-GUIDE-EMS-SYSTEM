import os
import json
from threading import Lock

DB_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'database'))
DB_FILE = os.path.join(DB_DIR, 'weguide.json')

default_data = {
    "employees": [],
    "attendance": []
}

_lock = Lock()
_db_data = None

def init_db():
    global _db_data
    if not os.path.exists(DB_DIR):
        os.makedirs(DB_DIR)
        
    with _lock:
        if not os.path.exists(DB_FILE):
            with open(DB_FILE, 'w', encoding='utf-8') as f:
                json.dump(default_data, f, indent=2)
            _db_data = default_data
        else:
            with open(DB_FILE, 'r', encoding='utf-8') as f:
                _db_data = json.load(f)
                
def get_db():
    global _db_data
    if _db_data is None:
        init_db()
    return _db_data

def write_db():
    global _db_data
    with _lock:
        with open(DB_FILE, 'w', encoding='utf-8') as f:
            json.dump(_db_data, f, indent=2)
