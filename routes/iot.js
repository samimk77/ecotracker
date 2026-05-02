const express = require('express');
const router = express.Router();
const { getBins, seedBins, resetBins, disposeInBin } = require('../controllers/iotController');
const { cacheMiddleware } = require('../middleware/cache');

router.get('/bins', cacheMiddleware(5), getBins);
router.post('/seed', seedBins);
router.post('/reset', resetBins);
router.post('/dispose/:id', disposeInBin);

module.exports = router;
