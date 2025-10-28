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

function extractPagingOptions(req) {
  const { skip, take } = req.query
  const pagingOptions = {}

  if (skip !== undefined) {
    pagingOptions.skip = parseOptionalIntParam(skip, 'skip')
  }
  if (take !== undefined) {
    pagingOptions.take = parseOptionalIntParam(take, 'take')
  }

  return pagingOptions
}

function extractSortingOptions(req) {
  const { sort_field, sort_direction } = req.query
  const sortingOptions = {}

  if (sort_field && sort_direction) {
    sortingOptions[sort_field] = sort_direction
  }

  return sortingOptions
}

module.exports = {
  parseIntParam,
  parseOptionalIntParam,
  extractPagingOptions,
  extractSortingOptions
}
