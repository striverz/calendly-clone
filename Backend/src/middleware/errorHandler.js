const AppError = require('./AppError');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.error('[Error]', err);
  }

  // express-validator validation error
  if (err.type === 'validation') {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: err.errors,
    });
  }

  // MySQL duplicate entry
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      message: 'A record with this value already exists.',
    });
  }

  // MySQL foreign key constraint
  if (err.code === 'ER_ROW_IS_REFERENCED_2') {
    return res.status(409).json({
      success: false,
      message: 'Cannot delete this record because it is referenced by other records.',
    });
  }

  if (err instanceof AppError && err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // Unknown / programming errors
  res.status(500).json({
    success: false,
    message: 'An unexpected error occurred.',
    ...(process.env.NODE_ENV === 'development' && { detail: err.message, stack: err.stack }),
  });
};

module.exports = errorHandler;
