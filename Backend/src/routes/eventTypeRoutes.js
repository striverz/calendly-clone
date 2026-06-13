const express = require('express');
const router = express.Router();
const validate = require('../middleware/validate');
const { createRules, updateRules, idRule } = require('../validators/eventTypeValidator');
const ctrl = require('../controllers/eventTypeController');

router.get('/', ctrl.list);
router.post('/', createRules, validate, ctrl.create);
router.put('/:id', updateRules, validate, ctrl.update);
router.delete('/:id', idRule, validate, ctrl.remove);

module.exports = router;
