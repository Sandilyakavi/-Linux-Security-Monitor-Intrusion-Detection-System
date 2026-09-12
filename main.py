from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from database import init_db, log_alert_to_db, get_all_alerts

app = FastAPI(title="Linux Security Monitor API")

# Enable CORS so your frontend dashboard can communicate with the backend seamlessly
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
@app.on_event("startup")
def startup_event():
    init_db()

class AlertCreate(BaseModel):
    alert_type: str
    description: str

@app.get("/api/alerts")
def fetch_alerts():
    """Endpoint for the web dashboard to fetch all recorded security incidents."""
    return {"status": "success", "data": get_all_alerts()}

@app.post("/api/alerts")
def create_alert(alert: AlertCreate):
    """Endpoint for the monitor engine to push new alerts into the database."""
    log_alert_to_db(alert.alert_type, alert.description)
    return {"status": "success", "message": "Alert logged successfully"}
