# Linux Security Monitor — Intrusion Detection & EDR Dashboard

A lightweight Linux security monitoring and SOC-style dashboard built to demonstrate **host telemetry, security alert detection, threat simulation, filtering, and real-time visualization**.

The project combines a **React + Vite frontend** with a **FastAPI backend** and **SQLite storage**. A public demo is deployed with the frontend on Vercel and the backend on Render.

## 🚀 Live Demo

**Dashboard:**  
https://linux-security-monitor-intrusion-de.vercel.app

**Backend API:**  
https://linux-security-monitor-intrusion.onrender.com

**Alerts API:**  
https://linux-security-monitor-intrusion.onrender.com/api/alerts

> The public deployment includes an interactive threat simulator so alerts can be generated safely for demonstration purposes.

---

## ✨ Features

### 🛡️ Security Monitoring
- Security alert collection through FastAPI
- Alert severity classification:
  - LOW
  - MEDIUM
  - HIGH
  - CRITICAL
- Security incident table with timestamps and descriptions
- Event/vector categorization

### 📊 Real-Time Dashboard
- Total alert counter
- Critical alert counter
- High-severity alert counter
- Active event vector counter
- CPU telemetry visualization
- RAM telemetry visualization
- Configurable polling interval:
  - 2 seconds
  - 5 seconds
  - 10 seconds
  - Paused

### ⚡ Interactive Threat Simulator
The dashboard can safely inject simulated security events into the backend:

- SSH Brute Force
- Privilege Escalation
- Reverse Shell / Suspicious Outbound Activity
- System Resource Spike

This makes the project easy to demonstrate without requiring a real attack.

### 🔎 Investigation & Reporting
- Search alerts by description, alert type, or ID
- Filter by severity
- Filter by alert type
- Export filtered incidents as CSV
- Export filtered incidents as JSON

### 📱 Responsive UI
- Desktop dashboard layout
- Tablet support
- Mobile-friendly responsive grids
- Horizontal scrolling for the incident table on small screens

---

## 🏗️ Architecture

```text
                    Internet
                       │
                       ▼
          ┌─────────────────────────┐
          │     Vercel Frontend     │
          │     React + Vite        │
          └────────────┬────────────┘
                       │
                       │ HTTPS REST API
                       ▼
          ┌─────────────────────────┐
          │     Render Backend      │
          │     FastAPI + Uvicorn   │
          └────────────┬────────────┘
                       │
                       ▼
              ┌────────────────┐
              │ SQLite Database │
              └───────┬────────┘
                      │
                      ▼
                Security Alerts
```

### Local architecture

```text
Linux Host
   │
   ├── Host telemetry
   ├── Security monitoring
   └── Alert generation
            │
            ▼
       FastAPI Backend
            │
            ▼
         SQLite
            │
            ▼
      React Dashboard
```

---

## 🧰 Tech Stack

### Frontend
- React
- Vite
- Tailwind CSS
- JavaScript
- SVG-based telemetry charts

### Backend
- Python
- FastAPI
- Uvicorn
- Pydantic
- psutil

### Database
- SQLite

### Deployment
- Vercel — frontend
- Render — backend
- GitHub — source control

---

## 📁 Project Structure

```text
linux-ids/
├── dashboard/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   └── .env
│
├── main.py
├── database.py
├── monitor.py
├── security_monitor.db
├── requirements.txt
├── .gitignore
└── README.md
```

> `security_monitor.db` is ignored by Git and is intended for local/runtime storage.

---

## ⚙️ Local Setup

### 1. Clone the repository

```bash
git clone git@github.com:Sandilyakavi/-Linux-Security-Monitor-Intrusion-Detection-System.git
cd -Linux-Security-Monitor-Intrusion-Detection-System
```

### 2. Create and activate a virtual environment

```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Install backend dependencies

```bash
pip install -r requirements.txt
```

### 4. Start the FastAPI backend

```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

The backend will be available at:

```text
http://127.0.0.1:8000
```

### 5. Configure the frontend

```bash
cd dashboard
```

Create `.env`:

```env
VITE_API_URL=http://127.0.0.1:8000
```

### 6. Install frontend dependencies

```bash
npm install
```

### 7. Start the frontend

```bash
npm run dev
```

Open the local Vite URL shown in the terminal.

---

## 🔌 API

### Get alerts

```http
GET /api/alerts
```

Example response:

```json
{
  "status": "success",
  "data": []
}
```

### Create a simulated alert

```http
POST /api/alerts
Content-Type: application/json
```

Example:

```json
{
  "alert_type": "SSH Brute Force",
  "description": "Multiple failed login attempts detected from IP 192.168.1.150 on port 22",
  "severity": "HIGH"
}
```

---

## ☁️ Deployment

### Backend — Render

The FastAPI backend is deployed as a Render Web Service.

Build command:

```bash
pip install -r requirements.txt
```

Start command:

```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

### Frontend — Vercel

The frontend is deployed from the `dashboard/` directory.

Configuration:

```text
Root Directory: dashboard
Build Command: npm run build
Output Directory: dist
```

Production environment variable:

```env
VITE_API_URL=https://linux-security-monitor-intrusion.onrender.com
```

---

## 🧪 Demo Workflow

1. Open the live dashboard.
2. Click **SSH Brute Force** in the Interactive Threat Simulator.
3. The frontend sends a POST request to the FastAPI backend.
4. The backend stores the alert in SQLite.
5. The dashboard refreshes the alert list.
6. The counters and incident table update automatically.
7. Use search/filter controls to investigate the generated alert.
8. Export the filtered results as CSV or JSON if needed.

---

## 🔐 Security & Demo Scope

This project is designed as a **security monitoring and portfolio demonstration project**.

The public deployment uses simulated security events for safe demonstration. It does **not** remotely monitor the developer's personal Linux machine through the public cloud.

For actual host monitoring, the monitoring components run in the local Linux environment where host telemetry can be collected.

---

## ⚠️ Deployment Notes

The free Render instance can spin down after inactivity, so the first request after a period of inactivity may take longer.

The public backend currently uses SQLite for the demo. Cloud filesystem/database persistence should not be treated as production-grade persistent storage. A managed database would be more appropriate for a production deployment requiring durable alert history.

---

## 📌 Future Improvements

- Authentication and role-based access control
- Alert acknowledgement workflow
- Alert filtering by time range
- IP reputation / threat intelligence integration
- Process-level investigation
- Remote process isolation / termination with strong authorization controls
- Persistent production database
- WebSocket-based live event streaming
- Detection rules and correlation engine
- Docker deployment
- SIEM integration

---

## 👨‍💻 Author

**Sandilya Kavi**

Built as a hands-on Linux cybersecurity / EDR / SOC dashboard project.

---

## 📄 License

This project is intended for educational, portfolio, and cybersecurity demonstration purposes.
