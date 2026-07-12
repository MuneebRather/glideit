import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Image as ImageIcon, Loader2 } from 'lucide-react';

const ImageAnalyzer = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const res = await api.get('/admin/images');
      setImages(res.data);
    } catch (err) {
      console.error('Images fetch failed');
    } finally {
      setLoading(false);
    }
  };

  const formatSize = (mb) => {
    if (mb < 1) return (mb * 1024).toFixed(0) + ' KB';
    return mb.toFixed(1) + ' MB';
  };

  const maxSize = Math.max(...images.map(i => i.size), 1);

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <div className="card-icon"><ImageIcon /></div>
          Image Analyzer
        </div>
      </div>
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)' }}>
          <Loader2 size={16} className="spin-icon" /> Loading...
        </div>
      ) : (
        <div className="image-list">
          {images.map((img, idx) => (
            <div key={idx} className="image-item">
              <div className="image-header">
                <span className="image-name">{img.repoTags[0]}</span>
                <span className="image-size">{formatSize(img.size)}</span>
              </div>
              <div className="image-meta">Layers: {img.layers} • ID: {img.id.substring(7, 19)}</div>
              <div className="layer-bar">
                <div className="layer-bar-fill" style={{ width: `${(img.size / maxSize) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageAnalyzer;