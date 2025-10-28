function AppError(message) {
  Error.call(this, message)
  this.name = this.constructor.name
  this.message = message

  // Capture stack trace
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, this.constructor)
  } else {
    this.stack = new Error().stack
  }
}

AppError.prototype = Object.create(Error.prototype)
AppError.prototype.constructor = AppError

function RepositoryError(message) {
  AppError.call(this, message)
}

RepositoryError.prototype = Object.create(AppError.prototype)
RepositoryError.prototype.constructor = RepositoryError

function ActionError(message) {
  AppError.call(this, message)
}

ActionError.prototype = Object.create(AppError.prototype)
ActionError.prototype.constructor = ActionError

function ValidationError(message) {
  AppError.call(this, message)
}

ValidationError.prototype = Object.create(AppError.prototype)
ValidationError.prototype.constructor = ValidationError

function AuthenticationError(message) {
  AppError.call(this, message)
}

AuthenticationError.prototype = Object.create(AppError.prototype)
AuthenticationError.prototype.constructor = AuthenticationError

function ResolverError(message) {
  AppError.call(this, message)
}

ResolverError.prototype = Object.create(AppError.prototype)
ResolverError.prototype.constructor = ResolverError

function RouteError(message) {
  AppError.call(this, message)
}

RouteError.prototype = Object.create(AppError.prototype)
RouteError.prototype.constructor = RouteError

function getErrorChain(error) {
  if (!error.stack) {
    return [error]
  }

  // Split stack into lines and filter out the first line (error message)
  const stackLines = error.stack
    .split('\n')
    .slice(1) // Skip the first line which is the error message
    .map(line => line.trim())
    .filter(line => line.startsWith('at ')) // Only keep lines that start with 'at '
    .map(line => {
      // Extract function name and location from stack line
      // Handle both formats:
      // 1. "at Object.update (/path/to/file.js:95:29)"
      // 2. "at /path/to/file.js:53:24"
      const match = line.match(/at\s+(?:([^(]+)\s+)?\(?([^)]+)\)?/)
      if (match) {
        return {
          function: match[1] || 'anonymous',
          location: match[2]
        }
      }
      return {
        function: 'unknown',
        location: line
      }
    })

  return {
    error: {
      type: error.name,
      message: error.message
    },
    stack: stackLines
  }
}

function wrapError(fn, ErrorType) {
  return async (...args) => {
    try {
      return await fn(...args)
    } catch (error) {
      // If error is already one of our custom types, propagate it
      if (error instanceof AppError) {
        return Promise.reject(error)
      }
      // Otherwise wrap it in the specified error type
      const wrappedError = new ErrorType(error.message)

      // Check if original stack has proper "at ..." lines
      if (error.stack && error.stack.includes('\n    at ')) {
        // Preserve original stack if it has proper trace lines
        wrappedError.stack = error.stack
      }
      // If original stack is malformed, the new error will use its own stack trace

      return Promise.reject(wrappedError)
    }
  }
}

function makeError(error, ErrorType) {
  if (error instanceof AppError) {
    return error
  }
  return new ErrorType(error.message)
}

module.exports = {
  AppError,
  RepositoryError,
  ActionError,
  ValidationError,
  AuthenticationError,
  ResolverError,
  RouteError,
  getErrorChain,
  wrapError,
  makeError
}
