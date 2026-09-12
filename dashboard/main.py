from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from database import init_db, log_alert_to_db, get_all_alerts

app = FastAPI(title="Linux Security Monitor API")

# Explicit CORS configuration for localhost and 127.0.0.1
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    init_db()

class AlertCreate(BaseModel):
    alert_type: str
    description: str

@app.get("/api/alerts")
def fetch_alerts():
    return {"status": "success", "data": get_all_alerts()}

@app.post("/api/alerts")
def create_alert(alert: AlertCreate):
    log_alert_to_db(alert.alert_type, alert.description)
    return {"status": "success", "message": "Alert logged successfully"}
