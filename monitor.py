import time
import re
import psutil
from datetime import datetime
import urllib.request
import json

# Configuration thresholds
SUSPICIOUS_PORTS = {4444, 1337, 31337}  # Common reverse shell/backdoor ports
API_ENDPOINT = "http://127.0.0.1:8000/api/alerts"

def trigger_alert(alert_type, description):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"\033[91m[ALERT] [{timestamp}] {alert_type}: {description}\033[0m")
    
    # Send alert to FastAPI backend
    try:
        payload = json.dumps({
            "alert_type": alert_type,
            "description": description
        }).encode('utf-8')
        
        req = urllib.request.Request(
            API_ENDPOINT, 
            data=payload, 
            headers={'Content-Type': 'application/json'}
        )
        with urllib.request.urlopen(req) as response:
            pass # Successfully logged to backend
    except Exception as e:
        print(f"[!] Failed to log alert to backend API: {e}")

def monitor_network_connections():
    """Scans active network connections for high-risk outbound/inbound ports."""
    for conn in psutil.net_connections(kind='inet'):
        if conn.status == 'ESTABLISHED' and conn.raddr:
            remote_ip, remote_port = conn.raddr
            if remote_port in SUSPICIOUS_PORTS:
                trigger_alert("Suspicious Network Connection", f"Active connection to high-risk port {remote_port} on {remote_ip}")

def monitor_processes():
    """Scans running processes for common suspicious keywords or indicators."""
    suspicious_keywords = ["nc -e", "ncat", "bash -i", "python3 -c 'import socket", "perl -e"]
    for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
        try:
            cmdline = " ".join(proc.info['cmdline'] or [])
            for keyword in suspicious_keywords:
                if keyword in cmdline:
                    trigger_alert("Suspicious Process Detected", f"PID {proc.info['pid']} ({proc.info['name']}) matched signature: {keyword}")
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            continue

if __name__ == "__main__":
    print("[*] Linux Security Monitor Engine Initialized. Forwarding to API...")
    try:
        while True:
            monitor_network_connections()
            monitor_processes()
            time.sleep(5)
    except KeyboardInterrupt:
        print("\n[*] Shutting down Security Monitor...")
