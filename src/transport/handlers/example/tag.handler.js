const { getCurrentIsoDateTimeAsString } = require('../../../lib/date-tools')
const {
  CreatedResponse,
  OkResponse,
  NoContentResponse,
  NotFoundResponse
} = require('../../../lib/http-responses')
const {
  parseIntParam,
  parseOptionalIntParam
} = require('../../../lib/param-tools')

class TagHandler {
  constructor({ tagActions }) {
    this.tagActions = tagActions
  }

  async create({ req, userId }) {
    const tag = await this.tagActions.create({
      tag: {
        user_id: userId,
        name: req.body.name,
        created_at: getCurrentIsoDateTimeAsString(),
        updated_at: getCurrentIsoDateTimeAsString()
      }
    })
    return new CreatedResponse(tag)
  }

  async update({ req, userId }) {
    const tag = await this.tagActions.update({
      tag: {
        id: parseIntParam(req.params.id, 'id'),
        user_id: userId,
        name: req.body.name,
        updated_at: getCurrentIsoDateTimeAsString()
      }
    })
    return new OkResponse(tag)
  }

  async delete({ req, userId }) {
    await this.tagActions.delete({
      id: parseIntParam(req.params.id, 'id'),
      userId
    })
    return new NoContentResponse()
  }

  async find({ req, userId }) {
    const result = await this.tagActions.find({
      options: {
        userId,
        namePattern: req.query.namePattern,
        pagingOptions: {
          take: parseOptionalIntParam(req.query.take, 'take'),
          skip: parseOptionalIntParam(req.query.skip, 'skip')
        },
        sortingOptions:
          req.query.sort_field && req.query.sort_direction
            ? {
                [req.query.sort_field]: req.query.sort_direction
              }
            : {}
      }
    })
    return new OkResponse(result)
  }

  async findById({ req, userId }) {
    const tag = await this.tagActions.findById({
      id: parseIntParam(req.params.id, 'id'),
      userId
    })

    if (!tag) {
      return new NotFoundResponse()
    }
    return new OkResponse(tag)
  }
}

module.exports = TagHandler
