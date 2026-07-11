import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const MyVault = () => {
  const { user, logout } = useAuth();
  const [files, setFiles] = useState([]);
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [storageUsed, setStorageUsed] = useState(0);
  const [error, setError] = useState('');

  const fetchFiles = useCallback(async () => {
    try {
      const res = await api.get('/files');
      setFiles(res.data);
      const total = res.data.reduce((sum, f) => sum + f.size, 0);
      setStorageUsed(total);
    } catch (err) {
      setError('Failed to load files');
    }
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      await api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      fetchFiles();
    } catch (err) {
      setError('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (fileId) => {
    try {
      const res = await api.get(`/files/download/${fileId}`);
      window.open(res.data.url, '_blank');
    } catch (err) {
      setError('Download failed');
    }
  };

  const handleDelete = async (fileId) => {
    try {
      await api.delete(`/files/${fileId}`);
      fetchFiles();
    } catch (err) {
      setError('Delete failed');
    }
  };

  const handleShare = async (fileId) => {
    try {
      const res = await api.post(`/files/${fileId}/share`, { expiresInHours: 24 });
      alert(`Share link: ${window.location.origin}${res.data.shareUrl}`);
    } catch (err) {
      setError('Share failed');
    }
  };

  const filteredFiles = files.filter(f => 
    f.originalName.toLowerCase().includes(search.toLowerCase())
  );

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  };

  return (
    <div className="vault-page">
      <header>
        <h2>My Vault</h2>
        <div className="storage-bar">
          <div className="storage-fill" style={{ width: `${Math.min(storageUsed / (5 * 1024 * 1024 * 1024) * 100, 100)}%` }}></div>
          <span>{formatSize(storageUsed)} / 5 GB</span>
        </div>
        <button onClick={logout} className="logout-btn">Logout</button>
      </header>

      <div className="upload-zone">
        <input type="file" id="file-input" onChange={handleUpload} hidden />
        <label htmlFor="file-input" className={uploading ? 'uploading' : ''}>
          {uploading ? 'Uploading...' : 'Drop files here or click to upload'}
        </label>
      </div>

      <input
        type="text"
        placeholder="Search files..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="search-bar"
      />

      {error && <p className="error">{error}</p>}

      <div className="file-list">
        {filteredFiles.map(file => (
          <div key={file._id} className="file-card">
            <div className="file-info">
              <span className="file-name">{file.originalName}</span>
              <span className="file-meta">{formatSize(file.size)} • {new Date(file.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="file-actions">
              <button onClick={() => handleDownload(file._id)}>Download</button>
              <button onClick={() => handleShare(file._id)}>Share</button>
              <button onClick={() => handleDelete(file._id)} className="delete">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyVault;