const { buildQuery, exists, counts } = require('knex-tools')
const tagModel = require('../models/tag.model')
const { RepositoryError } = require('../../lib/errors')

function TagRepository({ knexInstance }) {
  this.knexInstance = knexInstance
}

TagRepository.prototype.create = async function ({ tag }) {
  try {
    const result = await this.knexInstance(tagModel.tableName)
      .insert(tag)
      .returning(tagModel.primaryKey)
    return result[0]
  } catch (error) {
    throw new RepositoryError(error.message)
  }
}

TagRepository.prototype.update = async function ({ id, tag }) {
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

TagRepository.prototype.delete = async function ({ id }) {
  try {
    return await this.knexInstance(tagModel.tableName)
      .where(tagModel.primaryKey, id)
      .delete()
  } catch (error) {
    throw new RepositoryError(error.message)
  }
}

TagRepository.prototype.find = async function ({ options }) {
  try {
    return await buildQuery(this.knexInstance, tagModel, options)
  } catch (error) {
    throw new RepositoryError(error.message)
  }
}

TagRepository.prototype.exists = async function ({ options }) {
  try {
    return await exists(this.knexInstance, tagModel, options)
  } catch (error) {
    throw new RepositoryError(error.message)
  }
}

TagRepository.prototype.count = async function ({ options }) {
  try {
    return await counts(this.knexInstance, tagModel, options)
  } catch (error) {
    throw new RepositoryError(error.message)
  }
}

module.exports = TagRepository
