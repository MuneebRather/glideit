import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './App.css';
import {
  Cloud, LogOut, FolderOpen, Save, Upload, Search,
  FileText, Download, Link2, Trash2, FolderX, AlertTriangle
} from 'lucide-react';

const MyVault = () => {
  const { logout } = useAuth();
  const [files, setFiles] = useState([]);
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [storageUsed, setStorageUsed] = useState(0);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

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

  const handleUpload = async (file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    setUploadProgress(0);
    setUploadSuccess(false);
    setError('');
    try {
      await api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (evt) => {
          if (evt.total) {
            setUploadProgress(Math.round((evt.loaded / evt.total) * 100));
          }
        }
      });
      setUploading(false);
      setUploadSuccess(true);
      fetchFiles();
      setTimeout(() => {
        setUploadSuccess(false);
        setUploadProgress(0);
      }, 1500);
    } catch (err) {
      setError('Upload failed: ' + (err.response?.data?.message || 'Unknown error'));
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
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
    if (!window.confirm('Are you sure you want to delete this file?')) return;
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
      const shareUrl = `${window.location.origin}${res.data.shareUrl}`;
      navigator.clipboard.writeText(shareUrl);
      alert('Share link copied to clipboard!');
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

  const storagePercent = Math.min((storageUsed / (5 * 1024 * 1024 * 1024)) * 100, 100);
  const barClass = storagePercent > 90 ? 'danger' : storagePercent > 70 ? 'warn' : '';

  return (
    <div>
      <header className="app-header">
        <div className="app-header-left">
          <div className="app-logo">
            <div className="app-logo-icon"><Cloud /></div>
            <span><span className="logo-text-glide">Glide</span><span className="logo-text-it">It</span></span>
          </div>
          <div className="page-title">My Vault</div>
        </div>
        <button onClick={logout} className="logout-btn">
          <LogOut size={14} style={{ marginRight: 6, verticalAlign: -2 }} />
          Logout
        </button>
      </header>

      <div className="page-container">
        <div className="page-header animate-fadeIn">
          <h2>My Vault</h2>
          <p>Manage your files securely in the cloud</p>
        </div>

        <div className="grid-2 stagger-children" style={{ marginBottom: '20px' }}>
          <div className="stat-card">
            <div className="stat-icon blue"><FolderOpen /></div>
            <div className="stat-label">Total Files</div>
            <div className="stat-value mono">{files.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green"><Save /></div>
            <div className="stat-label">Storage Used</div>
            <div className="stat-value mono">{formatSize(storageUsed)}</div>
            <div className="storage-bar-container" style={{ marginTop: '12px' }}>
              <div className={`storage-bar-fill ${barClass}`} style={{ width: `${storagePercent}%` }}></div>
              <div className="storage-bar-text">{storagePercent.toFixed(1)}% of 5 GB</div>
            </div>
          </div>
        </div>

        <div
          className={`upload-zone ${uploadSuccess ? 'success' : dragOver || uploading ? 'uploading' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <input type="file" id="file-input" onChange={(e) => handleUpload(e.target.files[0])} hidden disabled={uploading} />
          <label htmlFor="file-input" style={{ cursor: uploading ? 'default' : 'pointer', display: 'block' }}>
            <span className="upload-icon">
              {uploadSuccess ? (
                <svg className="upload-success-icon" width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <circle cx="20" cy="20" r="18" strokeWidth="2" />
                  <path d="M12 20.5L17 25.5L28 14" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <Upload />
              )}
            </span>
            <div className="upload-text">
              {uploadSuccess ? 'Upload complete!' : uploading ? 'Uploading your file...' : 'Drop files here or click to browse'}
            </div>
            <div className="upload-hint">
              {uploadSuccess ? 'Your file is now securely stored' : uploading ? `${uploadProgress}% complete` : 'Supports all file types up to 100MB'}
            </div>
            {uploading && (
              <div className="upload-progress-track">
                <div className="upload-progress-fill" style={{ width: `${uploadProgress}%` }} />
              </div>
            )}
          </label>
        </div>

        {error && (
          <p className="error" style={{ marginTop: '16px' }}>
            <AlertTriangle size={15} style={{ flexShrink: 0 }} /> {error}
          </p>
        )}

        <div className="search-bar-wrap" style={{ marginTop: '24px', maxWidth: 'none' }}>
          <Search />
          <input
            type="text"
            placeholder="Search your files..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-bar"
          />
        </div>

        <div className="file-list" style={{ marginTop: '20px' }}>
          {filteredFiles.length === 0 ? (
            <div className="empty-state animate-fadeIn">
              <div className="empty-state-icon"><FolderX /></div>
              <h3>No files yet</h3>
              <p>Upload your first file to get started</p>
            </div>
          ) : (
            filteredFiles.map((file, idx) => (
              <div key={file._id} className="file-card" style={{ animationDelay: `${idx * 0.04}s` }}>
                <div className="file-icon"><FileText /></div>
                <div className="file-info">
                  <div className="file-name">{file.originalName}</div>
                  <div className="file-meta">
                    {formatSize(file.size)} • {new Date(file.createdAt).toLocaleDateString()} • {file.downloadCount} downloads
                  </div>
                </div>
                <div className="file-actions">
                  <button className="btn btn-success btn-sm" onClick={() => handleDownload(file._id)}>
                    <Download size={14} /> Download
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => handleShare(file._id)}>
                    <Link2 size={14} /> Share
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(file._id)}>
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <footer className="app-footer">Crafted by Muneeb Ahmad Rather</footer>
      </div>
    </div>
  );
};

export default MyVault;