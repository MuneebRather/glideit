import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Network, Loader2 } from 'lucide-react';

const NetworkTraffic = () => {
  const [networks, setNetworks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNetworks();
  }, []);

  const fetchNetworks = async () => {
    try {
      const res = await api.get('/admin/networks');
      setNetworks(res.data);
    } catch (err) {
      console.error('Networks fetch failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <div className="card-icon"><Network /></div>
          Network Traffic
        </div>
      </div>
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)' }}>
          <Loader2 size={16} className="spin-icon" /> Loading...
        </div>
      ) : (
        <div className="network-list">
          {networks.map((net, idx) => (
            <div key={idx} className="network-item">
              <div className="network-header">
                <span className="network-name">{net.name}</span>
                <span className="network-driver">{net.driver}</span>
              </div>
              <div className="network-containers">
                {net.containers.length} containers connected
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NetworkTraffic;