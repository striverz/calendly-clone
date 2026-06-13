const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const validate = require('../middleware/validate');
const { slugRule, slotsQueryRules, createBookingRules, tokenRule } = require('../validators/bookingValidator');
const ctrl = require('../controllers/bookingController');

// Rate limit booking creation: max 10 bookings per 15 minutes per IP
const bookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many booking requests. Please try again later.' },
});

// Confirmation lookup (public, no auth)
router.get('/confirmation/:token', tokenRule, validate, ctrl.getConfirmation);

// Public booking flow
router.get('/:slug', slugRule, validate, ctrl.getPublicEventType);
router.get('/:slug/slots', slotsQueryRules, validate, ctrl.getSlots);
router.post('/:slug', bookingLimiter, createBookingRules, validate, ctrl.book);

module.exports = router;
