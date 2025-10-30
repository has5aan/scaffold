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

class TagHandler {
  constructor({ tagActions }) {
    this.tagActions = tagActions
  }

  /**
   * @param {import('express').Request} req
   * @param {string} userId
   */
  async create(req, userId) {
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
  async update(req, userId) {
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
  async delete(req, userId) {
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
  async find(req, userId) {
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
  async findById(req, userId) {
    const tag = await this.tagActions.findById({
      userId,
      id: parseIntParam(req.params.id, 'id')
    })

    if (!tag) {
      return new NotFoundResponse()
    }
    return new OkResponse({ data: tag })
  }
}

module.exports = TagHandler
