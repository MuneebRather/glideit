import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './App.css';
import {
  Cloud, LogOut, Users, CheckCircle2, FolderOpen, Search,
  Loader2, UserX
} from 'lucide-react';

const UserDirectory = () => {
  const { logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } catch (err) {
      console.error('Users fetch failed');
    } finally {
      setLoading(false);
    }
  };

  const toggleUser = async (userId) => {
    try {
      await api.put(`/admin/users/${userId}/disable`);
      fetchUsers();
    } catch (err) {
      console.error('Toggle failed');
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  };

  const filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <header className="app-header">
        <div className="app-header-left">
          <div className="app-logo">
            <div className="app-logo-icon"><Cloud /></div>
            <span><span className="logo-text-glide">Glide</span><span className="logo-text-it">It</span></span>
          </div>
          <div className="page-title">User Directory</div>
        </div>
        <nav className="app-nav">
          <a href="/dashboard">Dashboard</a>
          <a href="/activity">Activity Stream</a>
          <a href="/users" className="active">User Directory</a>
        </nav>
        <button onClick={logout} className="logout-btn">
          <LogOut size={14} style={{ marginRight: 6, verticalAlign: -2 }} />
          Logout
        </button>
      </header>

      <div className="page-container">
        <div className="page-header animate-fadeIn">
          <h2>User Management</h2>
          <p>Manage user accounts and monitor platform usage</p>
        </div>

        <div className="grid-3 stagger-children" style={{ marginBottom: '20px' }}>
          <div className="stat-card">
            <div className="stat-icon blue"><Users /></div>
            <div className="stat-label">Total Users</div>
            <div className="stat-value mono">{users.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green"><CheckCircle2 /></div>
            <div className="stat-label">Active</div>
            <div className="stat-value mono">{users.filter(u => u.isActive).length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon orange"><FolderOpen /></div>
            <div className="stat-label">Total Files</div>
            <div className="stat-value mono">{users.reduce((sum, u) => sum + (u.fileCount || 0), 0)}</div>
          </div>
        </div>

        <div className="search-bar-wrap" style={{ marginBottom: '20px' }}>
          <Search />
          <input
            type="text"
            placeholder="Search users by email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-bar"
          />
        </div>

        {loading ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Loader2 className="spin-icon" /></div>
            <h3>Loading users...</h3>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="empty-state animate-fadeIn">
            <div className="empty-state-icon"><UserX /></div>
            <h3>No users found</h3>
            <p>Users will appear here once they register</p>
          </div>
        ) : (
          <div className="users-table-wrapper">
            <table className="users-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Registered</th>
                  <th>Files</th>
                  <th>Storage Used</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user._id} className={!user.isActive ? 'disabled' : ''}>
                    <td>
                      <span className="user-avatar">{user.email.charAt(0).toUpperCase()}</span>
                      <span style={{ fontWeight: 500 }}>{user.email}</span>
                    </td>
                    <td className="mono" style={{ color: 'var(--text-secondary)' }}>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="mono">{user.fileCount || 0}</td>
                    <td className="mono">{formatSize(user.totalStorage)}</td>
                    <td>
                      <span className={`status-pill ${user.isActive ? 'active' : 'disabled'}`}>
                        <span className={`status-dot ${user.isActive ? '' : ''}`}
                          style={{ background: user.isActive ? 'var(--success)' : 'var(--danger)' }} />
                        {user.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => toggleUser(user._id)}
                        className={`btn btn-sm ${user.isActive ? 'btn-danger' : 'btn-success'}`}
                      >
                        {user.isActive ? 'Disable' : 'Enable'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <footer className="app-footer">Crafted by Muneeb Ahmad Rather</footer>
      </div>
    </div>
  );
};

export default UserDirectory;