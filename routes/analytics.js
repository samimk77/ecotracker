const express = require('express');
const router = express.Router();
const { getTrashForecast } = require('../controllers/analyticsController');

router.get('/forecast', getTrashForecast);

module.exports = router;
