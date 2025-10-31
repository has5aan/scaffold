/**
 * @typedef {import('./tag.actions.jsdoc').CreateTagParams} CreateTagParams
 * @typedef {import('./tag.actions.jsdoc').CreateTagOptions} CreateTagOptions
 * @typedef {import('./tag.actions.jsdoc').UpdateTagParams} UpdateTagParams
 * @typedef {import('./tag.actions.jsdoc').UpdateTagOptions} UpdateTagOptions
 * @typedef {import('./tag.actions.jsdoc').DeleteTagParams} DeleteTagParams
 * @typedef {import('./tag.actions.jsdoc').FindTagsParams} FindTagsParams
 * @typedef {import('./tag.actions.jsdoc').FindTagsOptions} FindTagsOptions
 * @typedef {import('./tag.actions.jsdoc').FindTagByIdParams} FindTagByIdParams
 * @typedef {import('./tag.actions.jsdoc').FindTagByIdOptions} FindTagByIdOptions
 * @typedef {import('./tag.actions.jsdoc').TagProjection} TagProjection
 * @typedef {import('./tag.actions.jsdoc').QueryResult} QueryResult
 */

const schema = require('../validators/schema/tag.schema')
const tagRules = require('../validators/rules/tag.rules')
const { ValidationError, ActionError, makeError } = require('../../lib/errors')

/**
 * Tag Actions
 * Business logic layer for tag operations
 * Handles validation, business rules, and orchestrates repository calls
 */
class TagActions {
  /**
   * @param {Object} params
   * @param {import('../repositories/tag.repository')} params.tagRepository - Tag repository instance
   */
  constructor({ tagRepository }) {
    this.tagRepository = tagRepository
  }

  /**
   * Create a new tag for a user
   *
   * Validates the tag data and ensures uniqueness before creating.
   *
   * @param {CreateTagParams} params - Parameters for creating the tag
   * @param {CreateTagOptions} [options={}] - Options for the operation
   * @returns {Promise<TagProjection>} The created tag
   *
   * @throws {ValidationError} If tag data is invalid
   * @throws {ActionError} If tag name already exists for user or other errors occur
   *
   * @example
   * const tag = await tagActions.create(
   *   { userId: '123', tag: { name: 'JavaScript' } },
   *   { projection: 'summary' }
   * )
   */
  async create({ userId, tag }, { projection = 'default' } = {}) {
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

  /**
   * Update an existing tag
   *
   * Validates ownership, ensures uniqueness, and updates the tag.
   *
   * @param {UpdateTagParams} params - Parameters for updating the tag
   * @param {UpdateTagOptions} [options={}] - Options for the operation
   * @returns {Promise<TagProjection>} The updated tag
   *
   * @throws {ValidationError} If tag data is invalid
   * @throws {ActionError} If user doesn't own the tag, name conflicts, or other errors occur
   *
   * @example
   * const tag = await tagActions.update(
   *   { userId: '123', id: 5, tag: { name: 'TypeScript' } },
   *   { projection: 'default' }
   * )
   */
  async update({ userId, id, tag }, { projection = 'default' } = {}) {
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

  /**
   * Delete a tag
   *
   * Validates ownership before deletion.
   *
   * @param {DeleteTagParams} params - Parameters for deleting the tag
   * @returns {Promise<void>}
   *
   * @throws {ActionError} If user doesn't own the tag or other errors occur
   *
   * @example
   * await tagActions.delete({ userId: '123', id: 5 })
   */
  async delete({ userId, id }) {
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

  /**
   * Find tags for a user
   *
   * Optionally filters by name pattern with pagination and sorting.
   *
   * @param {FindTagsParams} params - Parameters for finding tags
   * @param {FindTagsOptions} [options={}] - Options for the operation
   * @returns {Promise<QueryResult>} Query result with tags and optional metadata
   *
   * @throws {ActionError} If errors occur during query
   *
   * @example
   * // Find all tags for a user
   * const result = await tagActions.find({ userId: '123' })
   *
   * @example
   * // Find with filtering and pagination
   * const result = await tagActions.find(
   *   { userId: '123', namePattern: 'java' },
   *   {
   *     projection: 'summary',
   *     pagingOptions: { limit: 10, offset: 0 },
   *     sortingOptions: { field: 'name', order: 'asc' }
   *   }
   * )
   */
  async find(
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

  /**
   * Find a specific tag by ID
   *
   * Returns the tag if it exists and belongs to the user.
   *
   * @param {FindTagByIdParams} params - Parameters for finding the tag
   * @param {FindTagByIdOptions} [options={}] - Options for the operation
   * @returns {Promise<TagProjection|undefined>} The tag if found, undefined otherwise
   *
   * @throws {ActionError} If errors occur during query
   *
   * @example
   * const tag = await tagActions.findById(
   *   { userId: '123', id: 5 },
   *   { projection: 'summary' }
   * )
   */
  async findById({ userId, id }, { projection = 'default' } = {}) {
    try {
      const {
        data: [tag]
      } = await this.tagRepository.find({
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
}

module.exports = TagActions
