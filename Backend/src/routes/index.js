const express = require('express');
const router = express.Router();

router.use('/event-types', require('./eventTypeRoutes'));
router.use('/availability', require('./availabilityRoutes'));
router.use('/booking', require('./bookingRoutes'));
router.use('/meetings', require('./meetingRoutes'));

module.exports = router;
