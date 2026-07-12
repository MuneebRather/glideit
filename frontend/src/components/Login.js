import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './App.css';
import { User, Lock, Cloud, AlertTriangle, Loader2 } from 'lucide-react';

const Login = () => {
  const [mode, setMode] = useState('user');
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const payload = mode === 'admin'
        ? { email: 'admin', password }
        : { email, password };

      const res = await api.post(endpoint, payload);
      login(res.data.token, res.data.user);

      if (res.data.user.role === 'admin') {
        navigate('/dashboard');
      } else {
        navigate('/vault');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card animate-scaleIn">
        <div className="app-logo" style={{ justifyContent: 'center', marginBottom: '8px' }}>
          <div className="app-logo-icon" style={{ width: 44, height: 44 }}><Cloud size={22} /></div>
          <h1><span className="logo-text-glide">Glide</span><span className="logo-text-it">It</span></h1>
        </div>
        <p className="tagline">Secure Cloud Storage Gateway</p>

        <div className={`mode-toggle ${mode === 'admin' ? 'admin-active' : ''}`}>
          <button
            type="button"
            className={mode === 'user' ? 'active' : ''}
            onClick={() => { setMode('user'); setIsLogin(true); setError(''); }}
          >
            <User /> Login as User
          </button>
          <button
            type="button"
            className={mode === 'admin' ? 'active' : ''}
            onClick={() => { setMode('admin'); setIsLogin(true); setError(''); }}
          >
            <Lock /> Login as Admin
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === 'user' && !isLogin && (
            <p className="form-header">Create Your Account</p>
          )}
          {mode === 'admin' && (
            <p className="form-header">Admin Access Portal</p>
          )}

          {mode === 'user' && (
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <Loader2 size={16} className="spin-icon" /> Please wait...
              </span>
            ) : (
              isLogin ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        {mode === 'user' && (
          <p className="switch-mode">
            {isLogin ? (
              <>New here? <button type="button" onClick={() => setIsLogin(false)}>Create an account</button></>
            ) : (
              <>Already have an account? <button type="button" onClick={() => setIsLogin(true)}>Sign in</button></>
            )}
          </p>
        )}

        {error && (
          <p className="error">
            <AlertTriangle size={15} style={{ flexShrink: 0 }} />
            {error}
          </p>
        )}
      </div>
      <footer className="app-footer" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 1 }}>Crafted by Muneeb Ahmad Rather</footer>
    </div>
  );
};

export default Login;