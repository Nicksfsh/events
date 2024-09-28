const express = require('express');
const { getLocations, getEvents } = require('../controllers/eventController');
const router = express.Router();

router.get('/locations', getLocations);
router.get('/', getEvents);

module.exports = router;

