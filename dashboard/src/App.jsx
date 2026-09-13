import React, { useState, useEffect } from 'react';

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const parseTelemetryMetrics = (alertsList) => {
  return alertsList
    .filter(item => item.alert_type === "System Telemetry")
    .slice(-15)
    .reverse()
    .map(item => {
      const cpuMatch = item.description.match(/CPU:\s*([\d.]+)%/);
      const ramMatch = item.description.match(/RAM:\s*([\d.]+)%/);
      return {
        time: item.timestamp ? item.timestamp.split(" ")[1] : "00:00:00",
        cpu: cpuMatch ? parseFloat(cpuMatch[1]) : 0,
        ram: ramMatch ? parseFloat(ramMatch[1]) : 0
      };
    });
};

function App() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Auto-refresh interval state
  const [refreshInterval, setRefreshInterval] = useState(5000);

  const fetchAlerts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/alerts`);
      const data = await response.json();
      if (data.status === 'success') {
        setAlerts(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    if (refreshInterval === null) return;
    const interval = setInterval(fetchAlerts, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const chartData = parseTelemetryMetrics(alerts);

  const getSvgPoints = (dataKey) => {
    if (chartData.length === 0) return "0,70 300,70";
    const width = 300;
    const height = 70;
    
    const values = chartData.map(d => d[dataKey]);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal || 1; 
    
    const paddedMin = Math.max(0, minVal - range * 0.1);
    const paddedMax = maxVal + range * 0.1;
    const paddedRange = paddedMax - paddedMin;

    return chartData.map((d, index) => {
      const x = (index / Math.max(chartData.length - 1, 1)) * width;
      const y = height - ((d[dataKey] - paddedMin) / paddedRange) * height;
      return `${x},${isNaN(y) ? height / 2 : y}`;
    }).join(" ");
  };

  const latestCpu = chartData.length > 0 ? chartData[chartData.length - 1].cpu : 0;
  const latestRam = chartData.length > 0 ? chartData[chartData.length - 1].ram : 0;

  // Summary Metrics
  const totalAlertsCount = alerts.length;
  const criticalCount = alerts.filter(a => a.severity === 'CRITICAL').length;
  const highCount = alerts.filter(a => a.severity === 'HIGH').length;
  const uniqueTypesCount = new Set(alerts.map(a => a.alert_type)).size;

  const triggerThreat = async (alertType, description, severity) => {
    setSimulating(true);
    try {
      await fetch(`${API_URL}/api/alerts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alert_type: alertType, description: description, severity: severity }),
      });
      await fetchAlerts();
    } catch (error) {
      console.error("Failed to simulate threat:", error);
    } finally {
      setSimulating(false);
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = searchTerm === '' || 
      alert.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.alert_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.id.toString().includes(searchTerm);
    
    const matchesSeverity = severityFilter === 'ALL' || alert.severity === severityFilter;
    const matchesType = typeFilter === 'ALL' || alert.alert_type === typeFilter;
    
    return matchesSearch && matchesSeverity && matchesType;
  });

  const uniqueAlertTypes = Array.from(new Set(alerts.map(a => a.alert_type)));

  const exportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredAlerts, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `soc_threat_report_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const exportCSV = () => {
    if (filteredAlerts.length === 0) return;
    const headers = ["ID", "Timestamp", "Alert Type", "Description", "Severity"];
    const rows = filteredAlerts.map(a => [
      a.id, `"${a.timestamp}"`, `"${a.alert_type}"`, `"${a.description.replace(/"/g, '""')}"`, a.severity
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", encodeURI(csvContent));
    downloadAnchor.setAttribute("download", `soc_threat_report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="min-h-screen bg-[#06090f] text-slate-100 font-sans antialiased selection:bg-cyan-500 selection:text-black">
      
      {/* Global input/select/button contrast safeguard */}
      <style>{`
        input, select, option, button {
          color: #f8fafc !important;
        }
        input::placeholder {
          color: #64748b !important;
        }
      `}</style>

      {/* Modern Compact Refined Header */}
      <header className="border-b border-slate-800/85 bg-[#090e17]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shadow-inner">
              <span className="text-cyan-400 font-mono text-sm font-bold">🛡️</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xs font-mono font-bold tracking-wider text-cyan-400 uppercase">
                  Linux EDR & SOC
                </h1>
                <span className="px-1.5 py-0.2 text-[9px] font-mono bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 rounded">
                  v2.4 SEC-OPS
                </span>
              </div>
              <p className="text-[10px] font-mono text-slate-400">Host Detection & Real-time Telemetry Grid</p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 bg-[#0f172a] border border-slate-800 rounded-md text-xs font-mono text-slate-300">
              <span className="text-slate-400 text-[10px]">Poll:</span>
              <select
                value={refreshInterval === null ? 'paused' : refreshInterval}
                onChange={(e) => setRefreshInterval(e.target.value === 'paused' ? null : Number(e.target.value))}
                className="bg-[#131d31] border border-slate-700/60 rounded px-1.5 py-0.5 text-[11px] text-cyan-400 font-bold focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value={2000}>2s</option>
                <option value={5000}>5s</option>
                <option value={10000}>10s</option>
                <option value="paused">Paused</option>
              </select>
            </div>

            <button 
              onClick={exportCSV}
              className="px-2.5 py-1 bg-[#0f172a] hover:bg-slate-800 border border-slate-800 rounded-md text-[11px] font-mono transition text-emerald-400 font-medium cursor-pointer"
            >
              CSV
            </button>

            <button 
              onClick={exportJSON}
              className="px-2.5 py-1 bg-[#0f172a] hover:bg-slate-800 border border-slate-800 rounded-md text-[11px] font-mono transition text-cyan-400 font-medium cursor-pointer"
            >
              JSON
            </button>

            <button 
              onClick={fetchAlerts}
              className="px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold rounded-md text-[11px] transition cursor-pointer shadow-sm"
            >
              Sync
            </button>
          </div>
        </div>
      </header>

      {/* Main Container with Controlled Breathing Room */}
      <main className="max-w-7xl mx-auto px-6 py-5 space-y-5">

        {/* Metric Summary Cards Grid - Responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          
          <div className="bg-[#0b101c] border border-slate-800/80 rounded-xl p-3.5 shadow-sm hover:border-slate-700 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-mono tracking-wider text-slate-400 uppercase font-bold">Total Alerts</p>
                <h3 className="text-xl font-bold font-mono text-slate-100 mt-0.5">{totalAlertsCount}</h3>
                <div className="flex items-center space-x-1.5 mt-1 text-[10px] text-cyan-400 font-mono">
                  <span className={`w-1.5 h-1.5 rounded-full ${refreshInterval === null ? 'bg-amber-400' : 'bg-cyan-400 animate-pulse'}`}></span>
                  <span>{refreshInterval === null ? 'Engine Paused' : 'Engine Live'}</span>
                </div>
              </div>
              <div className="w-8 h-8 bg-cyan-500/10 border border-cyan-500/20 rounded-lg flex items-center justify-center text-cyan-400 text-sm">🔔</div>
            </div>
          </div>

          <div className="bg-[#0b101c] border border-red-500/20 rounded-xl p-3.5 shadow-sm hover:border-red-500/30 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-mono tracking-wider text-red-400 uppercase font-bold">Critical</p>
                <h3 className="text-xl font-bold font-mono text-red-400 mt-0.5">{criticalCount}</h3>
                <p className="text-[10px] text-red-400/80 font-mono mt-1">Requires action</p>
              </div>
              <div className="w-8 h-8 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center justify-center text-red-400 text-sm">🚨</div>
            </div>
          </div>

          <div className="bg-[#0b101c] border border-orange-500/20 rounded-xl p-3.5 shadow-sm hover:border-orange-500/30 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-mono tracking-wider text-orange-400 uppercase font-bold">High Severity</p>
                <h3 className="text-xl font-bold font-mono text-orange-400 mt-0.5">{highCount}</h3>
                <p className="text-[10px] text-orange-400/80 font-mono mt-1">Potential risks</p>
              </div>
              <div className="w-8 h-8 bg-orange-500/10 border border-orange-500/20 rounded-lg flex items-center justify-center text-orange-400 text-sm">⚠️</div>
            </div>
          </div>

          <div className="bg-[#0b101c] border border-emerald-500/20 rounded-xl p-3.5 shadow-sm hover:border-emerald-500/30 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-mono tracking-wider text-emerald-400 uppercase font-bold">Event Vectors</p>
                <h3 className="text-xl font-bold font-mono text-emerald-400 mt-0.5">{uniqueTypesCount}</h3>
                <p className="text-[10px] text-emerald-400/80 font-mono mt-1">Active categories</p>
              </div>
              <div className="w-8 h-8 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center text-emerald-400 text-sm">⚡</div>
            </div>
          </div>

        </div>

        {/* Threat Simulator Section */}
        <div className="bg-[#0b101c] border border-slate-800/80 rounded-xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-2.5">
            <div>
              <h2 className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold flex items-center space-x-2">
                <span>⚡ Interactive Threat Simulator</span>
              </h2>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">EDR test injection — trigger simulated attacks into backend</p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-800/60 border border-slate-700/50 text-slate-300 rounded">
              FastAPI Endpoint
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full">
            
            {/* SSH Brute Force */}
            <button
              type="button"
              disabled={simulating}
              onClick={() => triggerThreat("SSH Brute Force", "Multiple failed login attempts detected from IP 192.168.1.150 on port 22", "HIGH")}
              className="group w-full min-w-0 min-h-[115px] p-3.5 bg-[#0f172a] hover:bg-[#131d33] border border-orange-500/25 hover:border-orange-500/50 rounded-xl text-left transition duration-200 cursor-pointer disabled:opacity-50 flex flex-col justify-between shadow-sm"
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-base">🔐</span>
                <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-orange-500/15 text-orange-400 border border-orange-500/30 rounded">HIGH</span>
              </div>
              <div>
                <h3 className="text-xs font-mono font-bold text-slate-200 group-hover:text-orange-300 transition">SSH Brute Force</h3>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">Simulate login attempts</p>
              </div>
            </button>

            {/* Privilege Escalation */}
            <button
              type="button"
              disabled={simulating}
              onClick={() => triggerThreat("Privilege Escalation", "Unauthorized root/sudo execution detected via CVE-2021-4034 exploit", "CRITICAL")}
              className="group w-full min-w-0 min-h-[115px] p-3.5 bg-[#0f172a] hover:bg-[#131d33] border border-red-500/25 hover:border-red-500/50 rounded-xl text-left transition duration-200 cursor-pointer disabled:opacity-50 flex flex-col justify-between shadow-sm"
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-base">🚨</span>
                <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-red-500/15 text-red-400 border border-red-500/30 rounded">CRITICAL</span>
              </div>
              <div>
                <h3 className="text-xs font-mono font-bold text-slate-200 group-hover:text-red-300 transition">Privilege Escalate</h3>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">Simulate root shell takeover</p>
              </div>
            </button>

            {/* Reverse Shell */}
            <button
              type="button"
              disabled={simulating}
              onClick={() => triggerThreat("Suspicious Outbound", "Netcat process established outbound C2 socket connection to 45.33.32.156:4444", "MEDIUM")}
              className="group w-full min-w-0 min-h-[115px] p-3.5 bg-[#0f172a] hover:bg-[#131d33] border border-yellow-500/25 hover:border-yellow-500/50 rounded-xl text-left transition duration-200 cursor-pointer disabled:opacity-50 flex flex-col justify-between shadow-sm"
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-base">🌐</span>
                <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 rounded">MEDIUM</span>
              </div>
              <div>
                <h3 className="text-xs font-mono font-bold text-slate-200 group-hover:text-yellow-300 transition">Reverse Shell</h3>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">Simulate C2 connection</p>
              </div>
            </button>

            {/* Resource Spike */}
            <button
              type="button"
              disabled={simulating}
              onClick={() => triggerThreat("System Telemetry", "CPU: 96.2% | RAM: 88.5% (1450MB / 16384MB) - High Load Spike", "LOW")}
              className="group w-full min-w-0 min-h-[115px] p-3.5 bg-[#0f172a] hover:bg-[#131d33] border border-blue-500/25 hover:border-blue-500/50 rounded-xl text-left transition duration-200 cursor-pointer disabled:opacity-50 flex flex-col justify-between shadow-sm"
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-base">📊</span>
                <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30 rounded">LOW</span>
              </div>
              <div>
                <h3 className="text-xs font-mono font-bold text-slate-200 group-hover:text-blue-300 transition">Resource Spike</h3>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">Simulate CPU/RAM load</p>
              </div>
            </button>

          </div>
        </div>

        {/* Telemetry Charts Section - Strict Two Column, Controlled Height */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* CPU Telemetry Card */}
          <div className="bg-[#0b101c] border border-slate-800/80 rounded-xl p-4 shadow-sm">
            <div className="flex justify-between items-center mb-2.5">
              <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">CPU Telemetry</span>
              <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded">
                {latestCpu}%
              </span>
            </div>
            <div className="h-20 w-full relative">
              <svg viewBox="0 0 300 70" width="100%" height="100%" preserveAspectRatio="none" className="overflow-visible">
                <line x1="0" y1="0" x2="300" y2="0" stroke="#1e293b" strokeDasharray="3 3" />
                <line x1="0" y1="35" x2="300" y2="35" stroke="#1e293b" strokeDasharray="3 3" />
                <line x1="0" y1="70" x2="300" y2="70" stroke="#1e293b" strokeDasharray="3 3" />
                <polyline fill="none" stroke="#22d3ee" strokeWidth="2" points={getSvgPoints('cpu')} />
              </svg>
            </div>
          </div>

          {/* RAM Telemetry Card */}
          <div className="bg-[#0b101c] border border-slate-800/80 rounded-xl p-4 shadow-sm">
            <div className="flex justify-between items-center mb-2.5">
              <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">RAM Telemetry</span>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                {latestRam}%
              </span>
            </div>
            <div className="h-20 w-full relative">
              <svg viewBox="0 0 300 70" width="100%" height="100%" preserveAspectRatio="none" className="overflow-visible">
                <line x1="0" y1="0" x2="300" y2="0" stroke="#1e293b" strokeDasharray="3 3" />
                <line x1="0" y1="35" x2="300" y2="35" stroke="#1e293b" strokeDasharray="3 3" />
                <line x1="0" y1="70" x2="300" y2="70" stroke="#1e293b" strokeDasharray="3 3" />
                <polyline fill="none" stroke="#34d399" strokeWidth="2" points={getSvgPoints('ram')} />
              </svg>
            </div>
          </div>

        </div>

        {/* Live Security Incidents Table & Controls */}
        <div className="bg-[#0b101c] border border-slate-800/80 rounded-xl p-4 shadow-sm space-y-3.5">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div>
              <h2 className="text-xs font-mono uppercase tracking-wider text-slate-200 font-bold">
                Live Security Incidents ({filteredAlerts.length})
              </h2>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">Real-time log stream filtered by severity and type</p>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <input
                type="text"
                placeholder="Search logs & events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-[#0f172a] border border-slate-700/70 rounded-lg px-2.5 py-1 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
              />

              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="bg-[#0f172a] border border-slate-700/70 rounded-lg px-2 py-1 text-xs text-slate-100 font-mono cursor-pointer focus:outline-none focus:border-cyan-500"
              >
                <option value="ALL">Severity: ALL</option>
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-[#0f172a] border border-slate-700/70 rounded-lg px-2 py-1 text-xs text-slate-100 font-mono cursor-pointer focus:outline-none focus:border-cyan-500"
              >
                <option value="ALL">Type: ALL</option>
                {uniqueAlertTypes.map((type, idx) => (
                  <option key={idx} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-800/80">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="bg-[#0f172a] border-b border-slate-800 text-slate-300 text-[10px] uppercase font-bold tracking-wider">
                  <th className="py-2.5 px-3.5">ID</th>
                  <th className="py-2.5 px-3.5">Timestamp</th>
                  <th className="py-2.5 px-3.5">Alert Type</th>
                  <th className="py-2.5 px-3.5">Description</th>
                  <th className="py-2.5 px-3.5">Severity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-[#070b14]/50">
                {filteredAlerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-slate-800/20 transition">
                    <td className="py-2.5 px-3.5 text-cyan-400 font-bold">#{alert.id}</td>
                    <td className="py-2.5 px-3.5 text-slate-400 text-[11px]">{alert.timestamp}</td>
                    <td className="py-2.5 px-3.5 text-slate-200 font-medium">{alert.alert_type}</td>
                    <td className="py-2.5 px-3.5 text-slate-300 text-[11px]">{alert.description}</td>
                    <td className="py-2.5 px-3.5">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wider ${
                        alert.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                        alert.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                        alert.severity === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                        'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      }`}>
                        {alert.severity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}

export default App;
