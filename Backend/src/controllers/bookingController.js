const bookingService = require('../services/bookingService');
const asyncHandler = require('../middleware/asyncHandler');

const getPublicEventType = asyncHandler(async (req, res) => {
  const data = await bookingService.getPublicEventType(req.params.slug);
  res.json({ success: true, data });
});

const getSlots = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const { date } = req.query;
  const result = await bookingService.getSlots(slug, date);
  res.json({ success: true, ...result });
});

const book = asyncHandler(async (req, res) => {
  const data = await bookingService.createBooking(req.params.slug, req.body);
  res.status(201).json({ success: true, data });
});

const getConfirmation = asyncHandler(async (req, res) => {
  const data = await bookingService.getBookingByToken(req.params.token);
  res.json({ success: true, data });
});

module.exports = { getPublicEventType, getSlots, book, getConfirmation };
