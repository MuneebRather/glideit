import React, { useState } from 'react';
import api from '../services/api';

const RestartDemo = ({ onRestart }) => {
  const [killing, setKilling] = useState(false);
  const [message, setMessage] = useState('');

  const handleKill = async () => {
    setKilling(true);
    setMessage('');
    
    try {
      const containersRes = await api.get('/admin/containers');
      const backend = containersRes.data.find(c => c.name.includes('backend'));
      
      if (!backend) {
        setMessage('Backend container not found');
        return;
      }

      await api.post(`/admin/containers/${backend.id}/kill`);
      setMessage(`Killed ${backend.name}. Watching for restart...`);
      
      let attempts = 0;
      const checkInterval = setInterval(async () => {
        attempts++;
        const res = await api.get('/admin/containers');
        const restarted = res.data.find(c => c.name.includes('backend'));
        
        if (restarted && restarted.restartCount > backend.restartCount) {
          clearInterval(checkInterval);
          setMessage(`Container restarted! Restart count: ${restarted.restartCount}`);
          onRestart();
        }
        
        if (attempts > 15) {
          clearInterval(checkInterval);
          setMessage('Timeout waiting for restart');
        }
      }, 1000);
      
    } catch (err) {
      setMessage('Kill failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setKilling(false);
    }
  };

  return (
    <div className="analyzer-card restart-demo">
      <h3>Restart Policy Demo</h3>
      <p>Click to kill the backend container and watch it auto-recover.</p>
      <button 
        onClick={handleKill} 
        disabled={killing}
        className="kill-btn"
      >
        {killing ? 'Killing...' : 'Test Restart Policy'}
      </button>
      {message && <p className="restart-message">{message}</p>}
    </div>
  );
};

export default RestartDemo;