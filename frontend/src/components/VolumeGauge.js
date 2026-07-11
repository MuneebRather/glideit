import React, { useState, useEffect } from 'react';
import api from '../services/api';

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
    <div className="analyzer-card">
      <h3>Volume Usage</h3>
      {loading ? (
        <p>Loading...</p>
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