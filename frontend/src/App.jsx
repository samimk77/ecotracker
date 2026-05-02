import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Feed from './pages/Feed';
import Telemetry from './pages/Telemetry';
import PersonalDashboard from './pages/PersonalDashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Moderator from './pages/Moderator';
import Events from './pages/Events';
import Reels from './pages/Reels';
import { LocationProvider } from './context/LocationContext';
import { io } from 'socket.io-client';
import SwarmModal from './components/SwarmModal';
import { useState, useEffect } from 'react';

import { Toaster } from 'react-hot-toast';

function App() {
  const token = localStorage.getItem('token');
  const isAuthenticated = !!token;
  let user = null;
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      user = payload; // Assuming payload contains role
    } catch (e) {
      console.error("Token parse error", e);
    }
  }

  const isModerator = user && (user.role === 'moderator' || user.role === 'authority');

  const [swarmAlert, setSwarmAlert] = useState(null);

  useEffect(() => {
    // Global socket connection for app-wide broadcasts
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', { withCredentials: true });
    
    socket.on('crisis_alert', (data) => {
      setSwarmAlert(data);
    });

    return () => socket.disconnect();
  }, []);

  return (
    <LocationProvider>
      <Router>
        <div className="flex flex-col min-h-screen">
          <Toaster 
            position="top-center"
            toastOptions={{
              style: {
                background: '#0f1420',
                color: '#f0f4ff',
                border: '1px solid rgba(255,255,255,0.05)',
                fontSize: '14px',
                fontFamily: '"DM Mono", monospace',
              },
            }}
          />
          {isAuthenticated && <Navbar />}
          
          <SwarmModal alert={swarmAlert} onClose={() => setSwarmAlert(null)} />

          <main className="flex-1 w-full" style={{ paddingBottom: isAuthenticated ? '4rem' : '0' }}>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
              <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/" />} />

              {/* Protected Routes */}
              <Route path="/" element={isAuthenticated ? <Home /> : <Navigate to="/login" />} />
              <Route path="/feed" element={isAuthenticated ? <Feed /> : <Navigate to="/login" />} />
              <Route path="/telemetry" element={isAuthenticated ? <Telemetry /> : <Navigate to="/login" />} />
              <Route path="/profile" element={isAuthenticated ? <PersonalDashboard /> : <Navigate to="/login" />} />
              <Route path="/events" element={isAuthenticated ? <Events /> : <Navigate to="/login" />} />
              <Route path="/reels" element={isAuthenticated ? <Reels /> : <Navigate to="/login" />} />
              <Route path="/moderator" element={isModerator ? <Moderator /> : <Navigate to="/" />} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} />} />
            </Routes>
          </main>
        </div>
      </Router>
    </LocationProvider>
  );
}

export default App;


