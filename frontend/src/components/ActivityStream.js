import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './App.css';
import {
  Cloud, LogOut, Upload, Download, Trash2, Pencil, Link2, LogIn,
  DoorOpen, UserPlus, ClipboardList, Loader2, Inbox, User, FileText, Box
} from 'lucide-react';

const actionIcons = {
  upload: Upload,
  download: Download,
  delete: Trash2,
  rename: Pencil,
  share: Link2,
  login: LogIn,
  logout: DoorOpen,
  register: UserPlus,
};

const ActionIcon = ({ action, size = 12 }) => {
  const Icon = actionIcons[action] || ClipboardList;
  return <Icon size={size} />;
};

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
    <div>
      <header className="app-header">
        <div className="app-header-left">
          <div className="app-logo">
            <div className="app-logo-icon"><Cloud /></div>
            <span><span className="logo-text-glide">Glide</span><span className="logo-text-it">It</span></span>
          </div>
          <div className="page-title">Activity Stream</div>
        </div>
        <nav className="app-nav">
          <a href="/dashboard">Dashboard</a>
          <a href="/activity" className="active">Activity Stream</a>
          <a href="/users">User Directory</a>
        </nav>
        <button onClick={logout} className="logout-btn">
          <LogOut size={14} style={{ marginRight: 6, verticalAlign: -2 }} />
          Logout
        </button>
      </header>

      <div className="page-container">
        <div className="page-header animate-fadeIn">
          <h2>System Activity</h2>
          <p>Track every action across your infrastructure</p>
        </div>

        <div className="filter-bar">
          <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ maxWidth: '220px' }}>
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
          <div className="empty-state">
            <div className="empty-state-icon"><Loader2 className="spin-icon" /></div>
            <h3>Loading activities...</h3>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="empty-state animate-fadeIn">
            <div className="empty-state-icon"><Inbox /></div>
            <h3>No activities found</h3>
            <p>Actions will appear here once users start using the system</p>
          </div>
        ) : (
          <div className="activity-list">
            {filteredLogs.map((log, idx) => (
              <div key={idx} className="activity-card" style={{ animationDelay: `${idx * 0.04}s` }}>
                <div className="activity-header">
                  <span className={`action-badge action-${log.action}`}>
                    <ActionIcon action={log.action} /> {log.action}
                  </span>
                  <span className="activity-time">{new Date(log.createdAt).toLocaleString()}</span>
                </div>
                <div className="activity-details">
                  <p style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <User size={13} style={{ color: 'var(--text-muted)' }} /> {log.userEmail}
                  </p>
                  {log.fileName && (
                    <p style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <FileText size={13} style={{ color: 'var(--text-muted)' }} />
                      {log.fileName} <span className="mono" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>({formatSize(log.fileSize)})</span>
                    </p>
                  )}
                  {log.details && <p style={{ color: 'var(--text-secondary)' }}>{log.details}</p>}
                </div>
                {log.containerSnapshot && (
                  <div className="snapshot-card">
                    <h5 style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Box size={14} /> Container Snapshot
                    </h5>
                    <p><strong style={{ color: 'var(--text-primary)' }}>Name:</strong> {log.containerSnapshot.containerName}</p>
                    <p><strong style={{ color: 'var(--text-primary)' }}>CPU:</strong> <span className="mono">{log.containerSnapshot.cpuPercent}%</span></p>
                    <p><strong style={{ color: 'var(--text-primary)' }}>Memory:</strong> <span className="mono">{log.containerSnapshot.memoryMB} / {log.containerSnapshot.memoryLimitMB} MB</span></p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <footer className="app-footer">Crafted by Muneeb Ahmad Rather</footer>
      </div>
    </div>
  );
};

export default ActivityStream;