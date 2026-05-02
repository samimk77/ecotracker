const express = require('express');
const router = express.Router();
const { getOptimalRoute } = require('../controllers/fleetController');

router.get('/route', getOptimalRoute);

module.exports = router;
