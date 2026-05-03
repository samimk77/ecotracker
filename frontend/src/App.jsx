import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

import AppSidebar from './components/AppSidebar';
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

// Inner shell — must live inside <Router> to use useLocation
function AppShell({ isAuthenticated, isModerator, swarmAlert, setSwarmAlert }) {
  const { pathname } = useLocation();
  const isHome = pathname === '/';

  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'var(--color-surface-elevated)',
            color: 'var(--color-text)',
            border: '1px solid var(--color-border)',
            fontSize: '14px',
            fontFamily: 'var(--font-body)',
          },
        }}
      />
      <SwarmModal alert={swarmAlert} onClose={() => setSwarmAlert(null)} />

      {isAuthenticated ? (
        <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden' }}>
          {/* Shared sidebar on every authenticated page */}
          <AppSidebar />

          {/* Page content area */}
          <div style={{
            flex: 1,
            height: '100vh',
            overflow: isHome ? 'hidden' : 'auto',
            background: 'var(--color-bg)',
            position: 'relative',
          }}>
            <Routes>
              <Route path="/"          element={<Home />} />
              <Route path="/feed"      element={<Feed />} />
              <Route path="/telemetry" element={<Telemetry />} />
              <Route path="/profile"   element={<PersonalDashboard />} />
              <Route path="/events"    element={<Events />} />
              <Route path="/reels"     element={<Reels />} />
              <Route path="/moderator" element={isModerator ? <Moderator /> : <Navigate to="/" />} />
              <Route path="*"          element={<Navigate to="/" />} />
            </Routes>
          </div>
        </div>
      ) : (
        <Routes>
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*"         element={<Navigate to="/login" />} />
        </Routes>
      )}
    </>
  );
}

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

  const isModerator = user && (user.role === 'moderator' || user.role === 'authority' || user.role === 'admin');

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
        <AppShell
          isAuthenticated={isAuthenticated}
          isModerator={isModerator}
          swarmAlert={swarmAlert}
          setSwarmAlert={setSwarmAlert}
        />
      </Router>
    </LocationProvider>
  );
}

export default App;


