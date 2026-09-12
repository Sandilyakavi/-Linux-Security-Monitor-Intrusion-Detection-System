import React, { useState, useEffect } from 'react';
import { ShieldAlert, Activity, Server, RefreshCw, Terminal } from 'lucide-r>

function App() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAlerts = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/alerts');
      const data = await response.json();
      if (data.status === 'success') {
        setAlerts(data.data);
        setError(null);
      }
    } catch (err) {
      setError('Failed to connect to FastAPI backend');
    } finally {
      setLoading(false);
    }
  };
