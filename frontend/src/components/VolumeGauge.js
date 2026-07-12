import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Database, Loader2 } from 'lucide-react';

const VolumeGauge = () => {
  const [volumes, setVolumes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVolumes();
  }, []);

  const fetchVolumes = async () => {
    try {
      const res = await api.get('/admin/volumes');
      setVolumes(res.data);
    } catch (err) {
      console.error('Volumes fetch failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <div className="card-icon"><Database /></div>
          Volume Usage
        </div>
      </div>
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)' }}>
          <Loader2 size={16} className="spin-icon" /> Loading...
        </div>
      ) : (
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
      )}
    </div>
  );
};

export default VolumeGauge;