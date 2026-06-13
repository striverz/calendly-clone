const express = require('express');
const router = express.Router();
const validate = require('../middleware/validate');
const { listRules, cancelRules } = require('../validators/meetingValidator');
const ctrl = require('../controllers/meetingController');

router.get('/', listRules, validate, ctrl.list);
router.patch('/:id/cancel', cancelRules, validate, ctrl.cancel);

module.exports = router;
