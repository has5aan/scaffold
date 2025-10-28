const { getCurrentIsoDateTimeAsString } = require('../../../lib/date-tools')
const {
  parseIntParam,
  extractPagingOptions,
  extractSortingOptions
} = require('../../../lib/param-tools')
const {
  CreatedResponse,
  OkResponse,
  NoContentResponse,
  NotFoundResponse
} = require('../../../lib/http-responses')

function TagHandler({ tagActions }) {
  this.tagActions = tagActions
}

/**
 * @param {import('express').Request} req
 * @param {string} userId
 */
TagHandler.prototype.create = async function (req, userId) {
  const tag = await this.tagActions.create({
    userId,
    tag: {
      name: req.body.name,
      created_at: getCurrentIsoDateTimeAsString(),
      updated_at: getCurrentIsoDateTimeAsString()
    }
  })
  return new CreatedResponse({ data: tag })
}

/**
 * @param {import('express').Request} req
 * @param {string} userId
 */
TagHandler.prototype.update = async function (req, userId) {
  const tag = await this.tagActions.update({
    userId,
    id: parseIntParam(req.params.id, 'id'),
    tag: {
      name: req.body.name,
      updated_at: getCurrentIsoDateTimeAsString()
    }
  })
  return new OkResponse({ data: tag })
}

/**
 * @param {import('express').Request} req
 * @param {string} userId
 */
TagHandler.prototype.delete = async function (req, userId) {
  await this.tagActions.delete({
    userId,
    id: parseIntParam(req.params.id, 'id')
  })
  return new NoContentResponse()
}

/**
 * @param {import('express').Request} req
 * @param {string} userId
 */
TagHandler.prototype.find = async function (req, userId) {
  const tags = await this.tagActions.find({
    userId,
    namePattern: req.query.namePattern,
    pagingOptions: extractPagingOptions(req),
    sortingOptions: extractSortingOptions(req)
  })
  return new OkResponse({ data: tags })
}

/**
 * @param {import('express').Request} req
 * @param {string} userId
 */
TagHandler.prototype.findById = async function (req, userId) {
  const tag = await this.tagActions.findById({
    userId,
    id: parseIntParam(req.params.id, 'id')
  })

  if (!tag) {
    return new NotFoundResponse()
  }
  return new OkResponse({ data: tag })
}

module.exports = TagHandler
