import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Login = () => {
  const [mode, setMode] = useState('user');
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

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
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>GlideIt</h1>
        <p className="tagline">Secure Cloud Storage Gateway</p>

        <div className="mode-toggle">
          <button 
            className={mode === 'user' ? 'active' : ''} 
            onClick={() => { setMode('user'); setIsLogin(true); setError(''); }}
          >
            Login as User
          </button>
          <button 
            className={mode === 'admin' ? 'active' : ''} 
            onClick={() => { setMode('admin'); setIsLogin(true); setError(''); }}
          >
            Login as Admin
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === 'user' && !isLogin && (
            <p className="form-header">Create Account</p>
          )}
          {mode === 'admin' && (
            <p className="form-header">Admin Access</p>
          )}

          {mode === 'user' && (
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          )}

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit" className="submit-btn">
            {isLogin ? 'Login' : 'Sign Up'}
          </button>
        </form>

        {mode === 'user' && (
          <p className="switch-mode">
            {isLogin ? (
              <>No account? <button onClick={() => setIsLogin(false)}>Sign Up</button></>
            ) : (
              <>Have an account? <button onClick={() => setIsLogin(true)}>Login</button></>
            )}
          </p>
        )}

        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
};

export default Login;