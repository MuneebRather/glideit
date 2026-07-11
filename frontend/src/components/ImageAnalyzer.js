import React, { useState, useEffect } from 'react';
import api from '../services/api';

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

  return (
    <div className="analyzer-card">
      <h3>Image Analyzer</h3>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="image-list">
          {images.map((img, idx) => (
            <div key={idx} className="image-item">
              <div className="image-header">
                <span className="image-name">{img.repoTags[0]}</span>
                <span className="image-size">{formatSize(img.size)}</span>
              </div>
              <div className="image-meta">
                <span>Layers: {img.layers}</span>
                <span>ID: {img.id.substring(7, 19)}</span>
              </div>
              <div className="layer-bar">
                {Array.from({ length: img.layers }).map((_, i) => (
                  <div 
                    key={i} 
                    className="layer-segment" 
                    style={{ width: `${100 / img.layers}%` }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageAnalyzer;