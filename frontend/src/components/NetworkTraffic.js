import React, { useState, useEffect } from 'react';
import api from '../services/api';

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
    <div className="analyzer-card">
      <h3>Network Traffic</h3>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="network-list">
          {networks.map((net, idx) => (
            <div key={idx} className="network-item">
              <div className="network-header">
                <span className="network-name">{net.name}</span>
                <span className="network-driver">{net.driver}</span>
              </div>
              <div className="network-containers">
                Connected: {net.containers.length} containers
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NetworkTraffic;