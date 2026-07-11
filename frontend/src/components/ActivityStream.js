import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const ActivityStream = () => {
  const { logout } = useAuth();
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await api.get('/admin/activity');
      setLogs(res.data);
    } catch (err) {
      console.error('Activity fetch failed');
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => 
    !filter || log.action === filter
  );

  const formatSize = (bytes) => {
    if (!bytes) return '-';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  };

  return (
    <div className="dashboard-page">
      <header>
        <h2>Activity Stream</h2>
        <nav>
          <a href="/dashboard">Dashboard</a>
          <a href="/activity">Activity Stream</a>
          <a href="/users">User Directory</a>
        </nav>
        <button onClick={logout} className="logout-btn">Logout</button>
      </header>

      <div className="filter-bar">
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All Actions</option>
          <option value="upload">Upload</option>
          <option value="download">Download</option>
          <option value="delete">Delete</option>
          <option value="rename">Rename</option>
          <option value="share">Share</option>
          <option value="login">Login</option>
          <option value="logout">Logout</option>
          <option value="register">Register</option>
        </select>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="activity-list">
          {filteredLogs.map((log, idx) => (
            <div key={idx} className={`activity-card action-${log.action}`}>
              <div className="activity-header">
                <span className="action-badge">{log.action}</span>
                <span className="activity-time">
                  {new Date(log.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="activity-details">
                <p><strong>User:</strong> {log.userEmail}</p>
                {log.fileName && <p><strong>File:</strong> {log.fileName} ({formatSize(log.fileSize)})</p>}
                {log.details && <p><strong>Details:</strong> {log.details}</p>}
              </div>
              {log.containerSnapshot && (
                <div className="snapshot-card">
                  <h5>Container Snapshot</h5>
                  <p>Name: {log.containerSnapshot.containerName}</p>
                  <p>CPU: {log.containerSnapshot.cpuPercent}%</p>
                  <p>Memory: {log.containerSnapshot.memoryMB} / {log.containerSnapshot.memoryLimitMB} MB</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActivityStream;