const { buildQuery, exists, counts } = require('knex-tools')
const tagModel = require('../models/tag.model')
const { RepositoryError } = require('../../lib/errors')

class TagRepository {
  constructor({ knexInstance }) {
    this.knexInstance = knexInstance
  }

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

  async update({ tag }) {
    try {
      const { [tagModel.primaryKey]: id, ...updateData } = tag
      const result = await this.knexInstance(tagModel.tableName)
        .where(tagModel.primaryKey, id)
        .update(updateData)
        .returning(tagModel.primaryKey)
      return result[0]
    } catch (error) {
      throw new RepositoryError(error.message)
    }
  }

  async delete({ id }) {
    try {
      return await this.knexInstance(tagModel.tableName)
        .where(tagModel.primaryKey, id)
        .delete()
    } catch (error) {
      throw new RepositoryError(error.message)
    }
  }

  async find({ options }) {
    try {
      return await buildQuery(this.knexInstance, tagModel, options)
    } catch (error) {
      throw new RepositoryError(error.message)
    }
  }

  async exists({ options }) {
    try {
      return await exists(this.knexInstance, tagModel, options)
    } catch (error) {
      throw new RepositoryError(error.message)
    }
  }

  async count({ options }) {
    try {
      return await counts(this.knexInstance, tagModel, options)
    } catch (error) {
      throw new RepositoryError(error.message)
    }
  }
}

module.exports = TagRepository
