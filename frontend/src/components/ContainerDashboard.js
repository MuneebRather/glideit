import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import LiveGraph from './LiveGraph';
import ImageAnalyzer from './ImageAnalyzer';
import VolumeGauge from './VolumeGauge';
import RestartDemo from './RestartDemo';
import NetworkTraffic from './NetworkTraffic';

const ContainerDashboard = () => {
  const { logout } = useAuth();
  const [containers, setContainers] = useState([]);
  const [selectedContainer, setSelectedContainer] = useState(null);
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchContainers = useCallback(async () => {
    try {
      const res = await api.get('/admin/containers');
      setContainers(res.data);
      if (!selectedContainer && res.data.length > 0) {
        setSelectedContainer(res.data[0]);
      }
    } catch (err) {
      setError('Failed to fetch containers');
    }
  }, [selectedContainer]);

  const fetchStats = useCallback(async () => {
    if (!selectedContainer) return;
    try {
      const res = await api.get(`/admin/containers/${selectedContainer.id}/stats`);
      setStats(res.data);
    } catch (err) {
      console.error('Stats fetch failed');
    }
  }, [selectedContainer]);

  const fetchLogs = useCallback(async () => {
    if (!selectedContainer) return;
    try {
      const res = await api.get(`/admin/containers/${selectedContainer.id}/logs`);
      setLogs(res.data.logs || []);
    } catch (err) {
      console.error('Logs fetch failed');
    }
  }, [selectedContainer]);

  useEffect(() => {
    fetchContainers();
    setLoading(false);
  }, [fetchContainers]);

  useEffect(() => {
    fetchStats();
    fetchLogs();
    const interval = setInterval(() => {
      fetchStats();
      fetchLogs();
    }, 2000);
    return () => clearInterval(interval);
  }, [fetchStats, fetchLogs]);

  const getStatusColor = (status) => {
    if (status.includes('healthy')) return 'status-healthy';
    if (status.includes('unhealthy')) return 'status-unhealthy';
    return 'status-unknown';
  };

  return (
    <div className="dashboard-page">
      <header>
        <h2>Container Dashboard</h2>
        <nav>
          <a href="/dashboard">Dashboard</a>
          <a href="/activity">Activity Stream</a>
          <a href="/users">User Directory</a>
        </nav>
        <button onClick={logout} className="logout-btn">Logout</button>
      </header>

      {error && <p className="error">{error}</p>}

      <div className="dashboard-grid">
        <div className="containers-panel">
          <h3>Running Containers</h3>
          {containers.map(c => (
            <div 
              key={c.id} 
              className={`container-card ${selectedContainer?.id === c.id ? 'selected' : ''} ${getStatusColor(c.health)}`}
              onClick={() => setSelectedContainer(c)}
            >
              <div className="container-header">
                <span className="container-name">{c.name}</span>
                <span className={`status-badge ${getStatusColor(c.health)}`}>{c.health}</span>
              </div>
              <div className="container-meta">
                <span>Image: {c.image}</span>
                <span>Uptime: {c.uptime}</span>
                <span>Restarts: {c.restartCount}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="stats-panel">
          {selectedContainer && stats && (
            <>
              <h3>{selectedContainer.name} — Live Stats</h3>
              <div className="stat-cards">
                <div className="stat-card">
                  <span className="stat-label">CPU</span>
                  <span className="stat-value">{stats.cpuPercent}%</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Memory</span>
                  <span className="stat-value">{stats.memoryMB} / {stats.memoryLimitMB} MB</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Network RX</span>
                  <span className="stat-value">{(stats.networkRx / 1024).toFixed(1)} KB</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Network TX</span>
                  <span className="stat-value">{(stats.networkTx / 1024).toFixed(1)} KB</span>
                </div>
              </div>

              <LiveGraph containerId={selectedContainer.id} />

              <div className="logs-panel">
                <h4>Recent Logs</h4>
                <pre className="logs">
                  {logs.length > 0 ? logs.slice(-10).join('\n') : 'No logs available'}
                </pre>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="dashboard-extras">
        <ImageAnalyzer />
        <VolumeGauge />
        <NetworkTraffic />
        <RestartDemo onRestart={fetchContainers} />
      </div>
    </div>
  );
};

export default ContainerDashboard;