import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { Activity } from 'lucide-react';

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
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 3; i++) {
      const y = (i / 3) * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    const drawSeries = (data, color) => {
      ctx.beginPath();
      data.forEach((val, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - (val / 100) * height;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
    };

    drawSeries(memHistory, '#22d3ee');
    drawSeries(cpuHistory, '#3b82f6');

    ctx.font = '600 11px Inter, sans-serif';
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(10, 8, 10, 10);
    ctx.fillStyle = '#8b93a7';
    ctx.fillText('CPU %', 26, 17);

    ctx.fillStyle = '#22d3ee';
    ctx.fillRect(10, 26, 10, 10);
    ctx.fillStyle = '#8b93a7';
    ctx.fillText('Memory %', 26, 35);
  }, [cpuHistory, memHistory]);

  return (
    <div className="live-graph">
      <h4><Activity size={16} /> Live Resource Usage (30s)</h4>
      <canvas ref={canvasRef} className="graph-canvas" style={{ width: '100%', height: '150px', display: 'block' }} />
    </div>
  );
};

export default LiveGraph;