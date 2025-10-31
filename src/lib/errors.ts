export class AppError extends Error {
  constructor(message: string) {
    super(message)
    this.name = this.constructor.name

    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }
}

export class RepositoryError extends AppError {}

export class ActionError extends AppError {}

export class ValidationError extends AppError {}

export class AuthenticationError extends AppError {}

export class ResolverError extends AppError {}

export class RouteError extends AppError {}

// Type definitions
export interface ErrorStackFrame {
  function: string
  location: string
}

export interface ErrorChain {
  error: {
    type: string
    message: string
  }
  stack: ErrorStackFrame[]
}

export function getErrorChain(error: Error): ErrorChain | Error[] {
  if (!error.stack) {
    return [error]
  }

  // Split stack into lines and filter out the first line (error message)
  const stackLines: ErrorStackFrame[] = error.stack
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
          location: match[2] || 'unknown'
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

export function wrapError<T extends typeof AppError>(
  fn: (...args: any[]) => Promise<any>,
  ErrorType: T
): (...args: any[]) => Promise<any> {
  return async (...args: any[]) => {
    try {
      return await fn(...args)
    } catch (error: any) {
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

export function makeError<T extends typeof AppError>(
  error: Error | AppError,
  ErrorType: T
): InstanceType<T> {
  if (error instanceof AppError) {
    return error as InstanceType<T>
  }
  return new ErrorType(error.message) as InstanceType<T>
}
