const { body, param } = require('express-validator');

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const updateScheduleRules = [
  body('name')
    .optional()
    .trim()
    .notEmpty().withMessage('Name cannot be empty')
    .isLength({ max: 255 }),

  body('timezone')
    .optional()
    .trim()
    .notEmpty().withMessage('Timezone cannot be empty')
    .isLength({ max: 100 }),
];

const updateRulesRules = [
  body('rules')
    .isArray({ min: 7, max: 7 }).withMessage('Must provide exactly 7 day rules (Sunday to Saturday)'),

  body('rules.*.day_of_week')
    .isInt({ min: 0, max: 6 }).withMessage('day_of_week must be 0-6'),

  body('rules.*.is_available')
    .isBoolean().withMessage('is_available must be a boolean'),

  body('rules.*.start_time')
    .if(body('rules.*.is_available').equals('true'))
    .optional({ nullable: true })
    .matches(timeRegex).withMessage('start_time must be in HH:MM format'),

  body('rules.*.end_time')
    .if(body('rules.*.is_available').equals('true'))
    .optional({ nullable: true })
    .matches(timeRegex).withMessage('end_time must be in HH:MM format'),
];

module.exports = { updateScheduleRules, updateRulesRules };
