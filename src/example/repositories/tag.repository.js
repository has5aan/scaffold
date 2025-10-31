/**
 * @typedef {import('./tag.repository.jsdoc').CreateTagInput} CreateTagInput
 * @typedef {import('./tag.repository.jsdoc').UpdateTagInput} UpdateTagInput
 * @typedef {import('./tag.repository.jsdoc').QueryOptions} QueryOptions
 * @typedef {import('./tag.repository.jsdoc').ExistsOptions} ExistsOptions
 * @typedef {import('./tag.repository.jsdoc').CountOptions} CountOptions
 * @typedef {import('./tag.repository.jsdoc').QueryResult} QueryResult
 */

const { buildQuery, exists, counts } = require('knex-tools')
const tagModel = require('../models/tag.model')
const { RepositoryError } = require('../../lib/errors')

/**
 * Tag Repository
 * Handles all database operations for the Tag domain model
 */
class TagRepository {
  /**
   * @param {Object} params
   * @param {import('knex').Knex} params.knexInstance - Knex database instance
   */
  constructor({ knexInstance }) {
    this.knexInstance = knexInstance
  }

  /**
   * Create a new tag
   * @param {Object} params
   * @param {CreateTagInput} params.tag - Tag data to create
   * @returns {Promise<number>} ID of the created tag
   */
  async create({ tag }) {
    try {
      const result = await this.knexInstance(tagModel.tableName)
        .insert(tag)
        .returning(tagModel.primaryKey)
      return result[0]
    } catch (error) {
      throw new RepositoryError(error.message)
    }
  }

  /**
   * Update an existing tag
   * @param {Object} params
   * @param {number} params.id - Tag ID to update
   * @param {UpdateTagInput} params.tag - Tag data to update
   * @returns {Promise<number>} ID of the updated tag
   */
  async update({ id, tag }) {
    try {
      const result = await this.knexInstance(tagModel.tableName)
        .where(tagModel.primaryKey, id)
        .update(tag)
        .returning(tagModel.primaryKey)
      return result[0]
    } catch (error) {
      throw new RepositoryError(error.message)
    }
  }

  /**
   * Delete a tag
   * @param {Object} params
   * @param {number} params.id - Tag ID to delete
   * @returns {Promise<number>} Number of deleted records
   */
  async delete({ id }) {
    try {
      return await this.knexInstance(tagModel.tableName)
        .where(tagModel.primaryKey, id)
        .delete()
    } catch (error) {
      throw new RepositoryError(error.message)
    }
  }

  /**
   * Find tags matching query options
   *
   * @param {Object} params
   * @param {QueryOptions} params.options - Query options for filtering, sorting, pagination, etc.
   *
   * @example
   * // Find all tags
   * await tagRepository.find({ options: {} })
   *
   * @example
   * // Find with filtering
   * await tagRepository.find({
   *   options: {
   *     where: { name: { contains: 'test' } }
   *   }
   * })
   *
   * @example
   * // Find with pagination and sorting
   * await tagRepository.find({
   *   options: {
   *     where: { user_id: '123' },
   *     paging: { limit: 10, offset: 0 },
   *     sorting: { field: 'created_at', order: 'desc' }
   *   }
   * })
   *
   * @example
   * // Find with nested relations
   * await tagRepository.find({
   *   options: {
   *     each: {
   *       user: {
   *         projection: 'summary',
   *         where: { active: true }
   *       }
   *     }
   *   }
   * })
   *
   * @returns {Promise<QueryResult>} Query result with tag data and optional metadata
   */
  async find({ options }) {
    try {
      return await buildQuery(this.knexInstance, tagModel, options)
    } catch (error) {
      throw new RepositoryError(error.message)
    }
  }

  /**
   * Check if tags exist matching query options
   *
   * @param {Object} params
   * @param {ExistsOptions} params.options - Query options for filtering
   *
   * @example
   * // Check if any tags exist for a user
   * const hasTag = await tagRepository.exists({
   *   options: {
   *     where: { user_id: '123' }
   *   }
   * })
   *
   * @example
   * // Check with relation filter
   * const hasActiveUserTag = await tagRepository.exists({
   *   options: {
   *     where: {
   *       _exists: {
   *         user: { active: true }
   *       }
   *     }
   *   }
   * })
   *
   * @returns {Promise<boolean>} True if at least one tag exists
   */
  async exists({ options }) {
    try {
      return await exists(this.knexInstance, tagModel, options)
    } catch (error) {
      throw new RepositoryError(error.message)
    }
  }

  /**
   * Count tags matching query options
   *
   * @param {Object} params
   * @param {CountOptions} params.options - Query options for filtering
   *
   * @example
   * // Count all tags
   * const total = await tagRepository.count({ options: {} })
   *
   * @example
   * // Count tags for a specific user
   * const userTagCount = await tagRepository.count({
   *   options: {
   *     where: { user_id: '123' }
   *   }
   * })
   *
   * @returns {Promise<number>} Number of matching tags
   */
  async count({ options }) {
    try {
      return await counts(this.knexInstance, tagModel, options)
    } catch (error) {
      throw new RepositoryError(error.message)
    }
  }
}

module.exports = TagRepository
