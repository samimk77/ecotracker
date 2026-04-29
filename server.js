const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const cron = require('node-cron');
require('dotenv').config();

const { connectDB } = require('./config/db');
const { initSockets } = require('./sockets');
const { recalculateAllUrgencyScores } = require('./services/urgencyService');
const { recalculateWardScores } = require('./services/wardScoreService');

// Route imports
const authRoutes = require('./routes/auth');
const issueRoutes = require('./routes/issues');
const eventRoutes = require('./routes/events');
const profileRoutes = require('./routes/profile');
const wardRoutes = require('./routes/wards');
const leaderboardRoutes = require('./routes/leaderboard');
const impactWallRoutes = require('./routes/impactWall');
const notificationRoutes = require('./routes/notifications');
const telemetryRoutes = require('./routes/telemetry');
const reelRoutes = require('./routes/reels');

const app = express();
const server = http.createServer(app);

// Clean the FRONTEND_URL to prevent hidden character crashes
let allowedOrigin = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.trim().replace(/\/$/, '') : 'http://localhost:5173';

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      // Allow the specific frontend URL, or localhost, or bypass if no origin (like postman)
      if (!origin || origin.includes('localhost') || origin === allowedOrigin) {
        callback(null, true);
      } else {
        // Fallback for debugging on Render
        callback(null, true); 
      }
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Make io accessible to routes
app.set('io', io);

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || origin.includes('localhost') || origin === allowedOrigin) {
      callback(null, true);
    } else {
      // Temporarily allow all to prevent Render deployment blocking
      callback(null, true);
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/wards', wardRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/impact-wall', impactWallRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/telemetry', telemetryRoutes);
app.use('/api/reels', reelRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Initialize socket handlers
initSockets(io);

// Cron Jobs
// Recalculate urgency scores every 3 hours
cron.schedule('0 */3 * * *', async () => {
  console.log('[CRON] Recalculating urgency scores...');
  try {
    await recalculateAllUrgencyScores();
    console.log('[CRON] Urgency scores updated.');
  } catch (e) {
    console.error('[CRON] Urgency score error:', e.message);
  }
});

// Recalculate ward sustainability scores every 6 hours
cron.schedule('0 */6 * * *', async () => {
  console.log('[CRON] Recalculating ward sustainability scores...');
  try {
    await recalculateWardScores();
    console.log('[CRON] Ward scores updated.');
  } catch (e) {
    console.error('[CRON] Ward score error:', e.message);
  }
});

// Start server
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`\n🌿 EcoTrack backend running on port ${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV}`);
    console.log(`   MongoDB: connected`);
    console.log(`   Socket.io: ready\n`);
  });
});
