import sqlite3
from datetime import datetime

DB_NAME = "security_monitor.db"

def init_db():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT,
            alert_type TEXT,
            description TEXT,
            severity TEXT DEFAULT 'MEDIUM'
        )
    ''')
    conn.commit()
    conn.close()

def log_alert_to_db(alert_type, description, severity="MEDIUM"):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute(
        "INSERT INTO alerts (timestamp, alert_type, description, severity) VALUES (?, ?, ?, ?)",
        (timestamp, alert_type, description, severity)
    )
    conn.commit()
    conn.close()

def get_all_alerts():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM alerts ORDER BY id DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]
