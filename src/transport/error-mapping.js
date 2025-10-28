const { ValidationError, AuthenticationError } = require('../lib/errors')

// Maps domain errors to HTTP status codes and messages
// HTTP-dependent but platform-agnostic

function mapErrorToHttp(error) {
  // Validation errors
  if (error instanceof ValidationError) {
    return {
      statusCode: 400,
      message: error.message
    }
  }

  // Authentication errors
  if (error instanceof AuthenticationError) {
    return {
      statusCode: 401,
      message: error.message
    }
  }

  // Default to 500 for unknown errors
  const message =
    process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : error.message

  return {
    statusCode: 500,
    message
  }
}

module.exports = { mapErrorToHttp }
