/**
 * Type declarations for knex-tools
 *
 * IMPORTANT: The scaffold defines the API contract, knex-tools conforms to it.
 * These types reference repository.types.ts to enforce scaffold's structure.
 */

declare module 'knex-tools' {
  import type {
    QueryOptions,
    ExistsOptions,
    CountOptions,
    QueryResult
  } from '../types/repository.types'

  /**
   * Build a query with projections, filtering, pagination, sorting, and nested data fetching
   * @param knexInstance - Knex database instance
   * @param model - Model definition with projections, relations, and modifiers
   * @param options - Query options conforming to scaffold's QueryOptions type
   * @returns Query result with data and optional metadata
   */
  export function buildQuery<T = any>(
    knexInstance: any,
    model: any,
    options?: QueryOptions
  ): Promise<QueryResult<T>>

  /**
   * Check if records exist matching the given conditions
   * @param knexInstance - Knex database instance
   * @param model - Model definition
   * @param options - Existence check options conforming to scaffold's ExistsOptions type
   * @returns True if at least one record exists
   */
  export function exists(
    knexInstance: any,
    model: any,
    options?: ExistsOptions
  ): Promise<boolean>

  /**
   * Count records matching the given conditions
   * @param knexInstance - Knex database instance
   * @param model - Model definition
   * @param options - Count options conforming to scaffold's CountOptions type
   * @returns Count metadata object
   */
  export function counts(
    knexInstance: any,
    model: any,
    options?: CountOptions
  ): Promise<any>
}
