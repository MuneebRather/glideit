import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';

const LiveGraph = ({ containerId }) => {
  const [cpuHistory, setCpuHistory] = useState(Array(30).fill(0));
  const [memHistory, setMemHistory] = useState(Array(30).fill(0));
  const canvasRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/admin/containers/${containerId}/stats`);
        const { cpuPercent, memoryMB, memoryLimitMB } = res.data;
        
        setCpuHistory(prev => [...prev.slice(1), cpuPercent]);
        setMemHistory(prev => [...prev.slice(1), (memoryMB / memoryLimitMB) * 100]);
      } catch (err) {
        console.error('Graph update failed');
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [containerId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    // Draw CPU line
    ctx.strokeStyle = '#e94560';
    ctx.lineWidth = 2;
    ctx.beginPath();
    cpuHistory.forEach((val, i) => {
      const x = (i / (cpuHistory.length - 1)) * width;
      const y = height - (val / 100) * height;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    
    // Draw Memory line
    ctx.strokeStyle = '#667eea';
    ctx.beginPath();
    memHistory.forEach((val, i) => {
      const x = (i / (memHistory.length - 1)) * width;
      const y = height - (val / 100) * height;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    
    // Labels
    ctx.fillStyle = '#333';
    ctx.font = '12px sans-serif';
    ctx.fillText('CPU %', 10, 15);
    ctx.fillStyle = '#667eea';
    ctx.fillText('Memory %', 10, 30);
  }, [cpuHistory, memHistory]);

  return (
    <div className="live-graph">
      <h4>Live Resource Usage (30s)</h4>
      <canvas ref={canvasRef} width={600} height={150} className="graph-canvas" />
    </div>
  );
};

export default LiveGraph;