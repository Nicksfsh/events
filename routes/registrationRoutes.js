const express = require('express');
const { createRegistration, getParticipants } = require('../controllers/registrationController');
const validateRegistration = require('../middleware/validateRegistration');
const router = express.Router();

router.post('/', validateRegistration, createRegistration);
router.get('/participants', getParticipants);

module.exports = router;
