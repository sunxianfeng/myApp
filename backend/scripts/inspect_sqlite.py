import sqlite3
import sys
from pathlib import Path

db_path = Path('dev.db')
if not db_path.exists():
    print('NO_DB')
    sys.exit(0)

conn = sqlite3.connect(str(db_path))
c = conn.cursor()
c.execute("SELECT name FROM sqlite_master WHERE type='table';")
rows = c.fetchall()
print(sorted(r[0] for r in rows))
conn.close()
