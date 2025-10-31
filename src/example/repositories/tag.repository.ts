import { buildQuery, exists, counts } from 'knex-tools'
import type { Knex } from 'knex'
import tagModel from '../models/tag.model'
import { RepositoryError } from '@lib/errors'
import type {
  QueryResult,
  QueryOptions,
  ExistsOptions,
  CountOptions
} from '../../types/repository.types'
import type {
  TagSchema,
  TagProjections,
  CreateTagInput,
  UpdateTagInput
} from '../models/tag.types'
import type { TagRelations, TagRelationMap } from '../models/models.types'

/**
 * Tag Repository
 * Handles all database operations for the Tag domain model
 */
export class TagRepository {
  private knexInstance: Knex

  constructor({ knexInstance }: { knexInstance: Knex }) {
    this.knexInstance = knexInstance
  }

  async create(data: CreateTagInput): Promise<number> {
    try {
      const result = await this.knexInstance(tagModel.tableName)
        .insert(data)
        .returning(tagModel.primaryKey)
      return result[0]
    } catch (error: any) {
      throw new RepositoryError(error.message)
    }
  }

  async update(id: number, data: UpdateTagInput): Promise<number> {
    try {
      const result = await this.knexInstance(tagModel.tableName)
        .where(tagModel.primaryKey, id)
        .update(data)
        .returning(tagModel.primaryKey)
      return result[0]
    } catch (error: any) {
      throw new RepositoryError(error.message)
    }
  }

  async delete(id: number): Promise<number> {
    try {
      return await this.knexInstance(tagModel.tableName)
        .where(tagModel.primaryKey, id)
        .delete()
    } catch (error: any) {
      throw new RepositoryError(error.message)
    }
  }

  async find(
    options: QueryOptions<
      TagSchema,
      TagRelations,
      keyof TagProjections,
      TagRelationMap
    >
  ): Promise<QueryResult<TagProjections[keyof TagProjections]>> {
    try {
      return await buildQuery(this.knexInstance, tagModel, options)
    } catch (error: any) {
      throw new RepositoryError(error.message)
    }
  }

  async exists(
    options: ExistsOptions<TagSchema, TagRelations>
  ): Promise<boolean> {
    try {
      return await exists(this.knexInstance, tagModel, options)
    } catch (error: any) {
      throw new RepositoryError(error.message)
    }
  }

  async count(options: CountOptions<TagSchema, TagRelations>): Promise<number> {
    try {
      return await counts(this.knexInstance, tagModel, options)
    } catch (error: any) {
      throw new RepositoryError(error.message)
    }
  }
}

export default TagRepository
