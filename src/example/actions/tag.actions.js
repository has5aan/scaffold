const schema = require('../validators/schema/tag.schema')
const tagRules = require('../validators/rules/tag.rules')
const { ValidationError, ActionError, makeError } = require('../../lib/errors')

class TagActions {
  constructor({ tagRepository }) {
    this.tagRepository = tagRepository
  }

  async create({ tag }) {
    try {
      const { error } = schema.create.validate(tag)
      if (error) {
        throw new ValidationError(error.message)
      }

      await tagRules.tagForUserMustBeUnique(
        { tagRepository: this.tagRepository },
        {
          userId: tag.user_id,
          name: tag.name
        }
      )

      const id = await this.tagRepository.create({
        tag
      })

      const {
        data: [createdTag]
      } = await this.tagRepository.find({
        options: {
          projection: 'default',
          where: { id }
        }
      })
      return { data: createdTag }
    } catch (error) {
      throw makeError(error, ActionError)
    }
  }

  async update({ tag }) {
    try {
      const { error } = schema.update.validate(tag)
      if (error) {
        throw new ValidationError(error.message)
      }

      await tagRules.userMustOwnTheTag(
        { tagRepository: this.tagRepository },
        { id: tag.id, userId: tag.user_id }
      )
      await tagRules.tagForUserMustBeUnique(
        { tagRepository: this.tagRepository },
        {
          id: tag.id,
          userId: tag.user_id,
          name: tag.name
        }
      )

      await this.tagRepository.update({
        tag
      })

      const {
        data: [updatedTag]
      } = await this.tagRepository.find({
        options: {
          projection: 'default',
          where: { id: tag.id }
        }
      })

      return { data: updatedTag }
    } catch (error) {
      throw makeError(error, ActionError)
    }
  }

  async delete({ id, userId }) {
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

  async find({ options }) {
    try {
      const { userId, namePattern, pagingOptions, sortingOptions } = options
      const trimmedNamePattern = namePattern?.trim()
      const hasNamePattern =
        trimmedNamePattern != null && trimmedNamePattern.length > 0

      const { data: tags, metadata } = await this.tagRepository.find({
        options: {
          projection: 'default',
          where: {
            user_id: userId,
            name: {
              contains: trimmedNamePattern,
              _condition: hasNamePattern
            }
          },
          ...pagingOptions,
          orderBy: sortingOptions,
          metadata: { counts: { filtered: true } }
        }
      })
      return { data: tags, metadata: { count: metadata.counts.filtered } }
    } catch (error) {
      throw makeError(error, ActionError)
    }
  }

  async findById({ id, userId }) {
    try {
      const {
        data: [tag]
      } = await this.tagRepository.find({
        options: {
          projection: 'default',
          where: { id, user_id: userId }
        }
      })
      return { data: tag }
    } catch (error) {
      throw makeError(error, ActionError)
    }
  }
}

module.exports = TagActions
