const { param, body, query } = require('express-validator');

const idRule = [param('id').isInt({ min: 1 }).withMessage('Invalid meeting ID')];

const listRules = [
  query('type')
    .optional()
    .isIn(['upcoming', 'past', 'all', 'cancelled'])
    .withMessage('type must be one of: upcoming, past, all, cancelled'),

  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
];

const cancelRules = [
  param('id').isInt({ min: 1 }).withMessage('Invalid meeting ID'),
  body('reason')
    .optional({ nullable: true })
    .isLength({ max: 1000 }).withMessage('Cancel reason cannot exceed 1000 characters'),
];

module.exports = { idRule, listRules, cancelRules };
