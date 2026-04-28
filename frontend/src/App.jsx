import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Feed from './pages/Feed';
import Telemetry from './pages/Telemetry';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import Moderator from './pages/Moderator';
import { LocationProvider } from './context/LocationContext';

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

  return (
    <LocationProvider>
      <Router>
        <div className="flex flex-col min-h-screen">
          {isAuthenticated && <Navbar />}
          <main className="flex-1 w-full" style={{ paddingBottom: isAuthenticated ? '4rem' : '0' }}>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
              <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/" />} />

              {/* Protected Routes */}
              <Route path="/" element={isAuthenticated ? <Home /> : <Navigate to="/login" />} />
              <Route path="/feed" element={isAuthenticated ? <Feed /> : <Navigate to="/login" />} />
              <Route path="/telemetry" element={isAuthenticated ? <Telemetry /> : <Navigate to="/login" />} />
              <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} />
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


