const availabilityService = require('../services/availabilityService');
const asyncHandler = require('../middleware/asyncHandler');

const getSchedule = asyncHandler(async (req, res) => {
  const data = await availabilityService.getScheduleWithRules();
  res.json({ success: true, data });
});

const updateSchedule = asyncHandler(async (req, res) => {
  const data = await availabilityService.updateSchedule(req.body);
  res.json({ success: true, data });
});

const updateRules = asyncHandler(async (req, res) => {
  const data = await availabilityService.updateRules(req.body.rules);
  res.json({ success: true, data });
});

module.exports = { getSchedule, updateSchedule, updateRules };
