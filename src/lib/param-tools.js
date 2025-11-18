const { ValidationError } = require('./errors')

function parseIntParam(value, paramName) {
  const parsed = parseInt(value)
  if (isNaN(parsed) || parsed <= 0) {
    throw new ValidationError(`Invalid ${paramName}: must be a positive number`)
  }
  return parsed
}

function parseOptionalIntParam(value, paramName, { allowNull = false } = {}) {
  if (value === undefined || value === '') {
    return undefined
  }
  if (allowNull && (value === null || value === 'null')) {
    return null
  }
  return parseIntParam(value, paramName)
}

module.exports = {
  parseIntParam,
  parseOptionalIntParam
}
