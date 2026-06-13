const { body, param } = require('express-validator');

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const VALID_COLORS = [
  '#006BFF', '#FF6B00', '#00BFA5', '#8B5CF6', '#EC4899',
  '#F59E0B', '#10B981', '#EF4444', '#6366F1', '#14B8A6',
];

const createRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ max: 255 }).withMessage('Name cannot exceed 255 characters'),

  body('slug')
    .trim()
    .notEmpty().withMessage('Slug is required')
    .matches(slugRegex).withMessage('Slug must be lowercase alphanumeric with hyphens (e.g. "my-meeting")')
    .isLength({ max: 100 }).withMessage('Slug cannot exceed 100 characters'),

  body('duration')
    .notEmpty().withMessage('Duration is required')
    .isInt({ min: 5, max: 480 }).withMessage('Duration must be between 5 and 480 minutes'),

  body('description')
    .optional({ nullable: true })
    .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),

  body('color')
    .optional({ nullable: true })
    .matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Color must be a valid hex color (e.g. #006BFF)'),

  body('location')
    .optional({ nullable: true })
    .isLength({ max: 500 }).withMessage('Location cannot exceed 500 characters'),
];

const updateRules = [
  param('id').isInt({ min: 1 }).withMessage('Invalid event type ID'),
  body('name')
    .optional()
    .trim()
    .notEmpty().withMessage('Name cannot be empty')
    .isLength({ max: 255 }),

  body('slug')
    .optional()
    .trim()
    .matches(slugRegex).withMessage('Slug must be lowercase alphanumeric with hyphens')
    .isLength({ max: 100 }),

  body('duration')
    .optional()
    .isInt({ min: 5, max: 480 }).withMessage('Duration must be between 5 and 480 minutes'),

  body('description')
    .optional({ nullable: true })
    .isLength({ max: 1000 }),

  body('color')
    .optional({ nullable: true })
    .matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Color must be a valid hex color'),

  body('location')
    .optional({ nullable: true })
    .isLength({ max: 500 }),
];

const idRule = [param('id').isInt({ min: 1 }).withMessage('Invalid event type ID')];

module.exports = { createRules, updateRules, idRule };
