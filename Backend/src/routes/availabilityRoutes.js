const express = require('express');
const router = express.Router();
const validate = require('../middleware/validate');
const { updateScheduleRules, updateRulesRules } = require('../validators/availabilityValidator');
const ctrl = require('../controllers/availabilityController');

router.get('/', ctrl.getSchedule);
router.put('/', updateScheduleRules, validate, ctrl.updateSchedule);
router.put('/rules', updateRulesRules, validate, ctrl.updateRules);

module.exports = router;
