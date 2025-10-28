const { getErrorChain } = require('../../../lib/errors')
const { mapErrorToHttp } = require('../../../transport/error-mapping')

// Express-specific JSON error handler middleware

function buildJsonErrorHandlerMiddleware(logger) {
  return (err, req, res, next) => {
    // Log the full error with stack trace
    logger.error({
      err,
      url: req.originalUrl,
      method: req.method,
      chain: getErrorChain(err)
    })

    // If headers already sent, let Express handle it
    if (res.headersSent) {
      return next(err)
    }

    // Map error to HTTP status and message
    const { statusCode, message } = mapErrorToHttp(err)

    // Send Express JSON response
    res.status(statusCode).json({ error: message })
  }
}

module.exports = { buildJsonErrorHandlerMiddleware }
