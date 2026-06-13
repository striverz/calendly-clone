const { body, param, query } = require('express-validator');

const slugRule = [
  param('slug')
    .trim()
    .notEmpty().withMessage('Slug is required'),
];

const slotsQueryRules = [
  param('slug').trim().notEmpty(),
  query('date')
    .notEmpty().withMessage('date query parameter is required')
    .isISO8601().withMessage('date must be a valid date (YYYY-MM-DD)'),
];

const createBookingRules = [
  param('slug').trim().notEmpty(),

  body('start_time')
    .notEmpty().withMessage('start_time is required')
    .isISO8601().withMessage('start_time must be a valid ISO 8601 datetime'),

  body('invitee_name')
    .trim()
    .notEmpty().withMessage('invitee_name is required')
    .isLength({ max: 255 }),

  body('invitee_email')
    .trim()
    .notEmpty().withMessage('invitee_email is required')
    .isEmail().withMessage('invitee_email must be a valid email address')
    .normalizeEmail(),

  body('notes')
    .optional({ nullable: true })
    .isLength({ max: 2000 }),

  body('answers')
    .optional()
    .isArray(),

  body('answers.*.question_id')
    .optional()
    .isInt({ min: 1 }),

  body('answers.*.answer')
    .optional({ nullable: true })
    .isString(),
];

const tokenRule = [
  param('token')
    .trim()
    .notEmpty().withMessage('Token is required'),
];

module.exports = { slugRule, slotsQueryRules, createBookingRules, tokenRule };
