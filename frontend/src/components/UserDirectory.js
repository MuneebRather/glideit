import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const UserDirectory = () => {
  const { logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="dashboard-page">
      <header>
        <h2>User Directory</h2>
        <nav>
          <a href="/dashboard">Dashboard</a>
          <a href="/activity">Activity Stream</a>
          <a href="/users">User Directory</a>
        </nav>
        <button onClick={logout} className="logout-btn">Logout</button>
      </header>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="users-table-wrapper">
          <table className="users-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Registered</th>
                <th>Files</th>
                <th>Storage Used</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user._id} className={!user.isActive ? 'disabled' : ''}>
                  <td>{user.email}</td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td>{user.fileCount}</td>
                  <td>{formatSize(user.totalStorage)}</td>
                  <td>
                    <span className={`status-pill ${user.isActive ? 'active' : 'disabled'}`}>
                      {user.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td>
                    <button 
                      onClick={() => toggleUser(user._id)}
                      className={user.isActive ? 'disable-btn' : 'enable-btn'}
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
    </div>
  );
};

export default UserDirectory;