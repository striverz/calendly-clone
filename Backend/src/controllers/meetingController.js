const bookingService = require('../services/bookingService');
const asyncHandler = require('../middleware/asyncHandler');

const list = asyncHandler(async (req, res) => {
  const { type = 'all', page = 1, limit = 20 } = req.query;
  const result = await bookingService.listMeetings({
    type,
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  });
  res.json({ success: true, ...result });
});

const cancel = asyncHandler(async (req, res) => {
  const data = await bookingService.cancelMeeting(req.params.id, req.body);
  res.json({ success: true, data });
});

module.exports = { list, cancel };
