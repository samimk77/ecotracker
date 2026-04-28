const express = require('express');
const router = express.Router();
const { getTelemetryDashboard } = require('../controllers/telemetryController');

// GET /api/telemetry
router.get('/', getTelemetryDashboard);

module.exports = router;
