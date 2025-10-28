const schema = require('../validators/schema/tag.schema')
const tagRules = require('../validators/rules/tag.rules')
const { ValidationError, ActionError, makeError } = require('../../lib/errors')

function TagActions({ tagRepository }) {
  this.tagRepository = tagRepository
}

TagActions.prototype.create = async function (
  { userId, tag },
  { projection = 'default' } = {}
) {
  try {
    const { error } = schema.create.validate({ ...tag, user_id: userId })
    if (error) {
      throw new ValidationError(error.message)
    }

    await tagRules.tagForUserMustBeUnique(
      { tagRepository: this.tagRepository },
      {
        userId,
        name: tag.name
      }
    )

    const id = await this.tagRepository.create({
      tag: {
        ...tag,
        user_id: userId
      }
    })

    const result = await this.tagRepository.find({
      options: {
        projection,
        where: { id }
      }
    })
    return result.data[0]
  } catch (error) {
    throw makeError(error, ActionError)
  }
}

TagActions.prototype.update = async function (
  { userId, id, tag },
  { projection = 'default' } = {}
) {
  try {
    const { error } = schema.update.validate({ ...tag, id, user_id: userId })
    if (error) {
      throw new ValidationError(error.message)
    }

    await tagRules.userMustOwnTheTag(
      { tagRepository: this.tagRepository },
      { id, userId }
    )
    await tagRules.tagForUserMustBeUnique(
      { tagRepository: this.tagRepository },
      {
        id,
        userId,
        name: tag.name
      }
    )

    await this.tagRepository.update({
      id,
      tag
    })

    const result = await this.tagRepository.find({
      options: {
        projection,
        where: { id }
      }
    })

    return result.data[0]
  } catch (error) {
    throw makeError(error, ActionError)
  }
}

TagActions.prototype.delete = async function ({ userId, id }) {
  try {
    await tagRules.userMustOwnTheTag(
      { tagRepository: this.tagRepository },
      { id, userId }
    )
    await this.tagRepository.delete({ id })
  } catch (error) {
    throw makeError(error, ActionError)
  }
}

TagActions.prototype.find = async function (
  { userId, namePattern },
  { projection = 'default', pagingOptions, sortingOptions } = {}
) {
  try {
    const trimmedNamePattern = namePattern?.trim()

    const tags = await this.tagRepository.find({
      options: {
        projection,
        where: {
          user_id: userId,
          name: {
            contains: trimmedNamePattern,
            _condition:
              trimmedNamePattern != null && trimmedNamePattern.length > 0
          }
        },
        paging: pagingOptions,
        sorting: sortingOptions
      }
    })
    return tags
  } catch (error) {
    throw makeError(error, ActionError)
  }
}

TagActions.prototype.findById = async function (
  { userId, id },
  { projection = 'default' } = {}
) {
  try {
    const [tag] = await this.tagRepository.find({
      options: {
        projection,
        where: { id, user_id: userId }
      }
    })
    return tag
  } catch (error) {
    throw makeError(error, ActionError)
  }
}

module.exports = TagActions
