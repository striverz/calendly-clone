const eventTypeService = require('../services/eventTypeService');
const asyncHandler = require('../middleware/asyncHandler');

const list = asyncHandler(async (req, res) => {
  const data = await eventTypeService.listEventTypes();
  res.json({ success: true, data });
});

const create = asyncHandler(async (req, res) => {
  const data = await eventTypeService.createEventType(req.body);
  res.status(201).json({ success: true, data });
});

const update = asyncHandler(async (req, res) => {
  const data = await eventTypeService.updateEventType(req.params.id, req.body);
  res.json({ success: true, data });
});

const remove = asyncHandler(async (req, res) => {
  await eventTypeService.deleteEventType(req.params.id);
  res.json({ success: true, message: 'Event type deleted successfully' });
});

module.exports = { list, create, update, remove };
