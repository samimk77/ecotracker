import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Feed from './pages/Feed';
import Telemetry from './pages/Telemetry';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import { LocationProvider } from './context/LocationContext';

function App() {
  return (
    <LocationProvider>
      <Router>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-1 w-full" style={{ paddingBottom: '4rem' }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/feed" element={<Feed />} />
              <Route path="/telemetry" element={<Telemetry />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Routes>
          </main>
        </div>
      </Router>
    </LocationProvider>
  );
}

export default App;

