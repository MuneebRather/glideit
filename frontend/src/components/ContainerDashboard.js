import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './App.css';
import {
  Box, CheckCircle2, RotateCw, HardDrive,
  ArrowDownToLine, ArrowUpFromLine, Activity, FileText, Image as ImageIcon,
  Database, Network as NetworkIcon, Zap, Clock, Package, LogOut, Cloud,
  LayoutGrid, ScrollText
} from 'lucide-react';

/* Animates a number from its previous value to the new one whenever it changes. */
const useCountUp = (value, decimals = 0) => {
  const [display, setDisplay] = useState(0);
  const frame = useRef(null);
  const from = useRef(0);

  useEffect(() => {
    const start = performance.now();
    const startVal = from.current;
    const endVal = Number(value) || 0;
    const duration = 500;

    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = startVal + (endVal - startVal) * eased;
      setDisplay(current);
      if (t < 1) {
        frame.current = requestAnimationFrame(tick);
      } else {
        from.current = endVal;
      }
    };

    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [value]);

  return decimals > 0 ? display.toFixed(decimals) : Math.round(display);
};

const CountUp = ({ value, decimals = 0, suffix = '' }) => {
  const display = useCountUp(value, decimals);
  return <span className="mono">{display}{suffix}</span>;
};

/* Circular progress ring — used for CPU / Memory live gauges. */
const RadialGauge = ({ value, size = 72, stroke = 7, color }) => {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(Math.max(value, 0), 100) / 100;
  const offset = circumference * (1 - pct);
  return (
    <div className="radial-gauge" style={{ width: size, height: size, color }}>
      <svg width={size} height={size}>
        <circle className="radial-track" cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} fill="none" />
        <circle
          className="radial-fill"
          cx={size / 2} cy={size / 2} r={radius}
          strokeWidth={stroke}
          fill="none"
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="radial-center">
        <span className="radial-value mono">{Math.round(value)}%</span>
      </div>
    </div>
  );
};

/* Tiny inline trend line for the last N samples of a metric. */
const Sparkline = ({ data, color }) => {
  const w = 100;
  const h = 30;
  const max = Math.max(...data, 1);
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * (h - 4) - 2}`)
    .join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="sparkline" style={{ color }}>
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const ContainerDashboard = () => {
  const { logout } = useAuth();
  const [containers, setContainers] = useState([]);
  const [selectedContainer, setSelectedContainer] = useState(null);
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [images, setImages] = useState([]);
  const [volumes, setVolumes] = useState([]);
  const [networks, setNetworks] = useState([]);
  const [error, setError] = useState('');
  const [cpuHistory, setCpuHistory] = useState(Array(30).fill(0));
  const [memHistory, setMemHistory] = useState(Array(30).fill(0));
  const [rxHistory, setRxHistory] = useState(Array(20).fill(0));
  const [txHistory, setTxHistory] = useState(Array(20).fill(0));
  const [activeTab, setActiveTab] = useState('overview');
  const canvasRef = useRef(null);

  const fetchAllData = useCallback(async () => {
    try {
      const [containersRes, imagesRes, volumesRes, networksRes] = await Promise.all([
        api.get('/admin/containers'),
        api.get('/admin/images'),
        api.get('/admin/volumes'),
        api.get('/admin/networks')
      ]);
      setContainers(containersRes.data);
      setImages(imagesRes.data);
      setVolumes(volumesRes.data);
      setNetworks(networksRes.data);
      if (!selectedContainer && containersRes.data.length > 0) {
        setSelectedContainer(containersRes.data[0]);
      }
    } catch (err) {
      console.error('Data fetch failed');
    }
  }, [selectedContainer]);

  const fetchStats = useCallback(async () => {
    if (!selectedContainer) return;
    try {
      const res = await api.get(`/admin/containers/${selectedContainer.id}/stats`);
      setStats(res.data);
      setCpuHistory(prev => [...prev.slice(1), res.data.cpuPercent]);
      setMemHistory(prev => [...prev.slice(1), (res.data.memoryMB / res.data.memoryLimitMB) * 100]);
      setRxHistory(prev => [...prev.slice(1), res.data.networkRx / 1024]);
      setTxHistory(prev => [...prev.slice(1), res.data.networkTx / 1024]);
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
    fetchAllData();
    const interval = setInterval(fetchAllData, 10000);
    return () => clearInterval(interval);
  }, [fetchAllData]);

  useEffect(() => {
    fetchStats();
    fetchLogs();
    const interval = setInterval(() => {
      fetchStats();
      fetchLogs();
    }, 2000);
    return () => clearInterval(interval);
  }, [fetchStats, fetchLogs]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    // grid
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = (i / 4) * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    const drawSeries = (data, color, fillFrom, fillTo) => {
      ctx.beginPath();
      data.forEach((val, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - (val / 100) * height;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      ctx.stroke();

      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, fillFrom);
      grad.addColorStop(1, fillTo);
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();
    };

    drawSeries(memHistory, '#22d3ee', 'rgba(34,211,238,0.20)', 'rgba(34,211,238,0)');
    drawSeries(cpuHistory, '#3b82f6', 'rgba(59,130,246,0.25)', 'rgba(59,130,246,0)');

    ctx.font = '600 11px Inter, sans-serif';
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(width - 118, 12, 10, 10);
    ctx.fillStyle = '#8b93a7';
    ctx.fillText('CPU %', width - 102, 21);

    ctx.fillStyle = '#22d3ee';
    ctx.fillRect(width - 118, 30, 10, 10);
    ctx.fillStyle = '#8b93a7';
    ctx.fillText('Memory %', width - 102, 39);
  }, [cpuHistory, memHistory]);

  const getStatusColor = (status) => {
    if (status?.includes('healthy')) return 'status-healthy';
    if (status?.includes('unhealthy')) return 'status-unhealthy';
    return 'status-unknown';
  };

  const handleKill = async () => {
    if (!window.confirm('This will kill the backend container to test auto-restart. Continue?')) return;
    try {
      const backend = containers.find(c => c.name.includes('backend'));
      if (!backend) return;
      await api.post(`/admin/containers/${backend.id}/kill`);
      setTimeout(fetchAllData, 3000);
    } catch (err) {
      setError('Kill failed');
    }
  };

  const formatSize = (mb) => {
    if (mb < 1) return (mb * 1024).toFixed(0) + ' KB';
    if (mb < 1024) return mb.toFixed(1) + ' MB';
    return (mb / 1024).toFixed(1) + ' GB';
  };

  const maxImageSize = Math.max(...images.map(i => i.size), 1);
  const healthyCount = containers.filter(c => c.health === 'healthy').length;
  const restartTotal = containers.reduce((sum, c) => sum + (c.restartCount || 0), 0);

  return (
    <div>
      <header className="app-header">
        <div className="app-header-left">
          <div className="app-logo">
            <div className="app-logo-icon"><Cloud /></div>
            <span><span className="logo-text-glide">Glide</span><span className="logo-text-it">It</span></span>
          </div>
          <div className="page-title">Container Dashboard</div>
        </div>
        <nav className="app-nav">
          <a href="/dashboard" className="active">Dashboard</a>
          <a href="/activity">Activity Stream</a>
          <a href="/users">User Directory</a>
        </nav>
        <button onClick={logout} className="logout-btn">
          <LogOut size={14} style={{ marginRight: 6, verticalAlign: -2 }} />
          Logout
        </button>
      </header>

      <div className="page-container">
        <div className="page-header animate-fadeIn">
          <h2>Infrastructure Overview</h2>
          <p>Real-time container monitoring and resource analytics</p>
        </div>

        {/* Stats Overview */}
        <div className="grid-4 stagger-children" style={{ marginBottom: '20px' }}>
          <div className="stat-card">
            <div className="stat-icon blue"><Box /></div>
            <div className="stat-label">Containers</div>
            <div className="stat-value"><CountUp value={containers.length} /></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green"><CheckCircle2 /></div>
            <div className="stat-label">Healthy</div>
            <div className="stat-value"><CountUp value={healthyCount} /></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon orange"><RotateCw /></div>
            <div className="stat-label">Restarts</div>
            <div className="stat-value"><CountUp value={restartTotal} /></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon cyan"><HardDrive /></div>
            <div className="stat-label">Images</div>
            <div className="stat-value"><CountUp value={images.length} /></div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="tab-nav">
          <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>
            <LayoutGrid size={15} /> Overview
          </button>
          <button className={activeTab === 'images' ? 'active' : ''} onClick={() => setActiveTab('images')}>
            <ImageIcon size={15} /> Image Analyzer
          </button>
          <button className={activeTab === 'logs' ? 'active' : ''} onClick={() => setActiveTab('logs')}>
            <ScrollText size={15} /> Recent Logs
          </button>
          <button className={activeTab === 'volumes' ? 'active' : ''} onClick={() => setActiveTab('volumes')}>
            <Database size={15} /> Volume Usage
          </button>
        </div>

        {activeTab === 'overview' && (
        <>
        {/* Main Dashboard Grid */}
        <div className="dashboard-grid">
          {/* Containers Panel */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <div className="card-icon"><Box /></div>
                Running Containers
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {containers.map(c => (
                <div
                  key={c.id}
                  className={`container-card ${selectedContainer?.id === c.id ? 'selected' : ''} ${getStatusColor(c.health)}`}
                  onClick={() => setSelectedContainer(c)}
                >
                  <div className="container-header">
                    <span className="container-name">{c.name}</span>
                    <span className={`status-badge ${getStatusColor(c.health)}`}>
                      <span className="status-dot" />
                      {c.health}
                    </span>
                  </div>
                  <div className="container-meta">
                    <span><Package /> {c.image}</span>
                    <span><Clock /> {c.uptime}</span>
                    <span><RotateCw /> Restarts: {c.restartCount}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats Panel */}
          <div>
            {selectedContainer && stats && (
              <>
                <div className="card" style={{ marginBottom: '20px' }}>
                  <div className="card-header">
                    <div className="card-title">
                      <div className="card-icon"><Activity /></div>
                      {selectedContainer.name} — Live Metrics
                    </div>
                    <span className="live-indicator"></span>
                  </div>
                  <div className="grid-2" style={{ gap: '14px' }}>
                    <div className="stat-card" style={{ padding: '16px' }}>
                      <div className="metric-gauge-row">
                        <RadialGauge value={stats.cpuPercent} color="#3b82f6" />
                        <div className="metric-gauge-info">
                          <div className="stat-label">CPU Usage</div>
                          <div className="stat-value" style={{ fontSize: '1.125rem' }}>
                            <CountUp value={stats.cpuPercent} decimals={1} suffix="%" />
                          </div>
                        </div>
                      </div>
                      <Sparkline data={cpuHistory} color="#3b82f6" />
                    </div>
                    <div className="stat-card" style={{ padding: '16px' }}>
                      <div className="metric-gauge-row">
                        <RadialGauge value={(stats.memoryMB / stats.memoryLimitMB) * 100} color="#22d3ee" />
                        <div className="metric-gauge-info">
                          <div className="stat-label">Memory</div>
                          <div className="stat-value" style={{ fontSize: '1.125rem' }}>
                            <CountUp value={stats.memoryMB} decimals={1} suffix=" MB" />
                          </div>
                        </div>
                      </div>
                      <Sparkline data={memHistory} color="#22d3ee" />
                    </div>
                    <div className="stat-card" style={{ padding: '16px' }}>
                      <div className="stat-icon green flow-down"><ArrowDownToLine /></div>
                      <div className="stat-label">Network RX</div>
                      <div className="stat-value"><CountUp value={stats.networkRx / 1024} decimals={1} suffix=" KB" /></div>
                      <Sparkline data={rxHistory} color="#34d399" />
                    </div>
                    <div className="stat-card" style={{ padding: '16px' }}>
                      <div className="stat-icon orange flow-up"><ArrowUpFromLine /></div>
                      <div className="stat-label">Network TX</div>
                      <div className="stat-value"><CountUp value={stats.networkTx / 1024} decimals={1} suffix=" KB" /></div>
                      <Sparkline data={txHistory} color="#fbbf24" />
                    </div>
                  </div>
                </div>

                {/* Live Graph */}
                <div className="card" style={{ marginBottom: '20px' }}>
                  <div className="card-header">
                    <div className="card-title">
                      <div className="card-icon"><Activity /></div>
                      Live Resource Usage (60s)
                    </div>
                    <span className="live-indicator"></span>
                  </div>
                  <div className="graph-wrap">
                    <canvas ref={canvasRef} style={{ width: '100%', height: '200px', display: 'block', borderRadius: '10px' }} />
                    <span
                      className="graph-pulse-dot"
                      style={{ top: `${100 - cpuHistory[cpuHistory.length - 1]}%`, background: '#3b82f6', '--pulse-color': 'rgba(59,130,246,0.5)' }}
                    />
                    <span
                      className="graph-pulse-dot"
                      style={{ top: `${100 - memHistory[memHistory.length - 1]}%`, background: '#22d3ee', '--pulse-color': 'rgba(34,211,238,0.5)' }}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Overview extras: Restart Demo + Network Traffic only */}
        <div className="dashboard-extras" style={{ marginTop: '20px' }}>
          {/* Network Traffic */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <div className="card-icon"><NetworkIcon /></div>
                Network Traffic
              </div>
            </div>
            <div className="network-list">
              {networks.map((net, idx) => (
                <div key={idx} className="network-item">
                  <div className="network-header">
                    <span className="network-name">{net.name}</span>
                    <span className="network-driver">{net.driver}</span>
                  </div>
                  <div className="network-containers">{net.containers.length} containers connected</div>
                </div>
              ))}
            </div>
          </div>

          {/* Restart Demo */}
          <div className="card restart-demo">
            <div className="card-header" style={{ justifyContent: 'center' }}>
              <div className="card-title">
                <div className="card-icon"><RotateCw /></div>
                Restart Policy Demo
              </div>
            </div>
            <p>Test auto-recovery by killing a container. Docker will restart it automatically.</p>
            <button onClick={handleKill} className="kill-btn">
              <Zap size={16} />
              Test Restart Policy
            </button>
            {error && <p style={{ marginTop: '16px', color: 'var(--danger)' }}>{error}</p>}
          </div>
        </div>
        </>
        )}

        {/* Image Analyzer tab */}
        {activeTab === 'images' && (
          <div className="card animate-fadeIn">
            <div className="card-header">
              <div className="card-title">
                <div className="card-icon"><ImageIcon /></div>
                Image Analyzer
              </div>
            </div>
            <div className="image-list">
              {images.map((img, idx) => (
                <div key={idx} className="image-item">
                  <div className="image-header">
                    <span className="image-name">{img.repoTags[0]}</span>
                    <span className="image-size">{formatSize(img.size)}</span>
                  </div>
                  <div className="image-meta">{img.layers} layers • ID: {img.id?.substring(7, 19)}</div>
                  <div className="layer-bar">
                    <div className="layer-bar-fill" style={{ width: `${(img.size / maxImageSize) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Logs tab */}
        {activeTab === 'logs' && (
          <div className="logs-panel animate-fadeIn">
            <h4>
              <FileText />
              {selectedContainer ? `Recent Logs — ${selectedContainer.name}` : 'Recent Logs'}
            </h4>
            {!selectedContainer ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                Select a container from the Overview tab to view its logs.
              </p>
            ) : (
              <pre className="logs">
                {logs.length > 0 ? logs.slice(-20).join('') : 'No logs available'}
              </pre>
            )}
          </div>
        )}

        {/* Volume Usage tab */}
        {activeTab === 'volumes' && (
          <div className="card animate-fadeIn">
            <div className="card-header">
              <div className="card-title">
                <div className="card-icon"><Database /></div>
                Volume Usage
              </div>
            </div>
            <div className="volume-list">
              {volumes.map((vol, idx) => (
                <div key={idx} className="volume-item">
                  <div className="volume-header">
                    <span className="volume-name">{vol.name}</span>
                    <span className="volume-driver">{vol.driver}</span>
                  </div>
                  <div className="volume-path">{vol.mountpoint}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <footer className="app-footer">Crafted by Muneeb Ahmad Rather</footer>
      </div>
    </div>
  );
};

export default ContainerDashboard;