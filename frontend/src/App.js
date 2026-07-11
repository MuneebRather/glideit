import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import MyVault from './components/MyVault';
import ContainerDashboard from './components/ContainerDashboard';
import ActivityStream from './components/ActivityStream';
import UserDirectory from './components/UserDirectory';

const PrivateRoute = ({ children, adminOnly }) => {
  const { user } = useAuth();
  
  if (!user) return <Navigate to="/" />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/vault" />;
  
  return children;
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/vault" element={
            <PrivateRoute>
              <MyVault />
            </PrivateRoute>
          } />
          <Route path="/dashboard" element={
            <PrivateRoute adminOnly>
              <ContainerDashboard />
            </PrivateRoute>
          } />
          <Route path="/activity" element={
            <PrivateRoute adminOnly>
              <ActivityStream />
            </PrivateRoute>
          } />
          <Route path="/users" element={
            <PrivateRoute adminOnly>
              <UserDirectory />
            </PrivateRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;