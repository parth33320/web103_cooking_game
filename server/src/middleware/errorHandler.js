/**
 * Middleware for unhandled /api routes
 * Inputs: req, res, next
 * Outputs: 404 response with standard error body
 */
export function notFoundHandler(req, res, next) {
  return res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found',
      details: {},
    },
  });
}

/**
 * Express error handling middleware
 * Inputs: err, req, res, next
 * Outputs: 500 (or custom status) response with standard error body
 */
export function errorHandler(err, req, res, next) {
  const statusCode = err.status || err.statusCode || 500;
  const errorCode = err.code || 'INTERNAL_ERROR';
  const errorMessage = err.message || 'An unexpected error occurred';
  const errorDetails = err.details || {};

  return res.status(statusCode).json({
    error: {
      code: errorCode,
      message: errorMessage,
      details: errorDetails,
    },
  });
}
