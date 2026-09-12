import React, { useState, useEffect } from 'react';
import { ShieldAlert, Activity, Server, RefreshCw, Terminal } from 'lucide-react';

function App() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAlerts = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/alerts');
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

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 3000); 
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: '#f8fafc', fontFamily: 'monospace', padding: '2rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '1rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Terminal color="#38bdf8" size={32} />
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, color: '#38bdf8' }}>LINUX EDR & SOC DASHBOARD</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#94a3b8' }}>
          <span style={{ width: '10px', height: '10px', backgroundColor: error ? '#ef4444' : '#22c55e', borderRadius: '50%', display: 'inline-block' }}></span>
          {error ? 'API Disconnected' : 'Engine Live'}
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ backgroundColor: '#1e293b', padding: '1.5rem', borderRadius: '8px', border: '1px solid #334155' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.9rem' }}>
            <span>Total Incidents</span>
            <ShieldAlert color="#ef4444" size={20} />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', marginTop: '0.5rem' }}>{alerts.length}</div>
        </div>
        <div style={{ backgroundColor: '#1e293b', padding: '1.5rem', borderRadius: '8px', border: '1px solid #334155' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.9rem' }}>
            <span>Target OS</span>
            <Server color="#38bdf8" size={20} />
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginTop: '0.8rem', color: '#38bdf8' }}>Linux (Kali/Debian)</div>
        </div>
        <div style={{ backgroundColor: '#1e293b', padding: '1.5rem', borderRadius: '8px', border: '1px solid #334155' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.9rem' }}>
            <span>Monitoring State</span>
            <Activity color="#22c55e" size={20} />
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginTop: '0.8rem', color: '#22c55e' }}>Active / Polling</div>
        </div>
      </div>

      <div style={{ backgroundColor: '#1e293b', borderRadius: '8px', border: '1px solid #334155', padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.1rem', margin: 0, color: '#e2e8f0' }}>Live Incident Stream</h2>
          <button onClick={fetchAlerts} style={{ background: '#334155', border: 'none', color: '#f8fafc', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontFamily: 'monospace' }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {error && <div style={{ color: '#ef4444', padding: '1rem 0' }}>{error}</div>}

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                <th style={{ padding: '0.75rem' }}>ID</th>
                <th style={{ padding: '0.75rem' }}>Timestamp</th>
                <th style={{ padding: '0.75rem' }}>Alert Type</th>
                <th style={{ padding: '0.75rem' }}>Description</th>
              </tr>
            </thead>
            <tbody>
              {alerts.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                    No security incidents logged yet. System is secure.
                  </td>
                </tr>
              ) : (
                alerts.map((alert) => (
                  <tr key={alert.id} style={{ borderBottom: '1px solid #334155' }}>
                    <td style={{ padding: '0.75rem', color: '#94a3b8' }}>#{alert.id}</td>
                    <td style={{ padding: '0.75rem' }}>{alert.timestamp}</td>
                    <td style={{ padding: '0.75rem', color: '#ef4444', fontWeight: 'bold' }}>{alert.alert_type}</td>
                    <td style={{ padding: '0.75rem' }}>{alert.description}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default App;
