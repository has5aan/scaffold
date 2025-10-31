/**
 * Repository Type Definitions
 *
 * These types define the contract that repositories in this scaffold must follow.
 * Any query builder library (knex-tools, prisma, typeorm, etc.) must adapt to these types.
 */

// ============================================================================
// Where Clause - Query filtering
// ============================================================================

/**
 * Primitive database value types
 */
export type WhereValue = string | number | boolean | null

/**
 * Operators for field-level conditions
 */
export interface WhereFieldOperators {
  /** Exact match */
  equals?: WhereValue
  /** Not equal to */
  not?: WhereValue
  /** Value is in array */
  in?: WhereValue[]
  /** Value is not in array */
  notIn?: WhereValue[]
  /** Less than */
  lt?: WhereValue
  /** Less than or equal */
  lte?: WhereValue
  /** Greater than */
  gt?: WhereValue
  /** Greater than or equal */
  gte?: WhereValue
  /** String contains (case-insensitive LIKE %value%) */
  contains?: string
  /** String starts with (LIKE value%) */
  startsWith?: string
  /** String ends with (LIKE %value) */
  endsWith?: string
  /** Field is NULL */
  isNull?: boolean
  /** Field is NOT NULL */
  isNotNull?: boolean
  /** Conditional where - only apply this condition if true */
  _condition?: boolean
}

/**
 * Exists clause for filtering based on related records
 * Enables row-level security by checking if related records match conditions
 *
 * @template TRelations - Union of relation names from the model
 */
export type WhereExistsClause<TRelations extends string = string> = {
  _exists?: {
    [K in TRelations]?: WhereClause
  }
}

/**
 * Logical operators for combining multiple where conditions
 */
export interface WhereLogicalOperators<
  TSchema = Record<string, any>,
  TRelations extends string = string
> {
  /** OR - at least one condition must be true */
  OR?: WhereClause<TSchema, TRelations>[]
  /** AND - all conditions must be true (implicit by default, but can be explicit) */
  AND?: WhereClause<TSchema, TRelations>[]
}

/**
 * Where clause structure
 * Can be simple equality, field operators, existence checks, or logical operators
 *
 * @template TSchema - The schema type (database table structure)
 * @template TRelations - Union of relation names from the model
 */
export type WhereClause<
  TSchema = Record<string, any>,
  TRelations extends string = string
> = {
  [K in keyof TSchema]?: WhereValue | WhereFieldOperators
} & WhereExistsClause<TRelations> &
  WhereLogicalOperators<TSchema, TRelations>

// ============================================================================
// Paging Options
// ============================================================================

export interface PagingOptions {
  /** Number of records to return */
  limit?: number
  /** Number of records to skip */
  offset?: number
}

// ============================================================================
// Sorting Options
// ============================================================================

/**
 * Sorting options
 * @template TSchema - The database schema type
 */
export interface SortingOptions<TSchema = Record<string, any>> {
  /** Field name to sort by - type-safe based on schema */
  field: keyof TSchema
  /** Sort order */
  order: 'asc' | 'desc'
}

// ============================================================================
// Metadata Options
// ============================================================================

/**
 * Metadata options
 * Specify which counts to include in the response
 */
export interface MetadataOptions {
  counts?: {
    /** Include total count of all records in the table */
    total?: boolean
    /** Include count of records matching the where clause */
    filtered?: boolean
  }
}

// ============================================================================
// Relation Map - Registry for type-safe nested queries
// ============================================================================

/**
 * Information about a single relation
 * Maps relation name to its schema, relations, and nested relation map
 */
export interface RelationInfo {
  /** Database schema type for this relation */
  schema: any
  /** Union of relation names for this relation */
  relations: string
  /** Nested relation map for this relation's relations */
  relationMap?: Record<string, RelationInfo>
}

// ============================================================================
// Each Options - Nested data fetching
// ============================================================================

/**
 * Options for fetching nested related data (GraphQL-style)
 * Allows specifying how to fetch and filter related records
 *
 * @template TSchema - The database schema type for the related model
 * @template TRelations - Union of relation names for the related model
 * @template TRelationMap - Map of relation names to their schema/relations info
 */
export interface EachOptions<
  TSchema = Record<string, any>,
  TRelations extends string = string,
  TRelationMap extends Record<string, RelationInfo> = Record<
    string,
    RelationInfo
  >
> {
  /** Projection to use for the related records */
  projection?: string
  /** Filter conditions for the related records */
  where?: WhereClause<TSchema, TRelations>
  /** Sorting for the related records - type-safe field names */
  orderBy?: {
    [K in keyof TSchema]?: 'asc' | 'desc'
  }
  /** Number of related records to skip */
  skip?: number
  /** Limit number of related records to fetch */
  take?: number
  /** Include counts of nested relations */
  withRelatedCounts?: {
    [relation: string]: boolean | { where: WhereClause }
  }
  /** Nested data fetching - recursively type-safe */
  each?: {
    [K in TRelations]?: K extends keyof TRelationMap
      ? EachOptions<
          TRelationMap[K]['schema'],
          TRelationMap[K]['relations'],
          TRelationMap[K]['relationMap'] extends Record<string, RelationInfo>
            ? TRelationMap[K]['relationMap']
            : Record<string, RelationInfo>
        >
      : EachOptions
  }
}

// ============================================================================
// Modifiers - Reusable query functions
// ============================================================================

/**
 * Modifier function signature
 * @param query - The Knex query builder instance to modify
 * @param alias - The table alias string
 * @param params - Optional parameters passed when invoking the modifier
 */
export type ModifierFunction = (
  query: any, // Knex.QueryBuilder, but we don't want to depend on Knex types here
  alias: string,
  params?: Record<string, any>
) => void

/**
 * Modifiers defined in a model
 * Maps modifier names to their function implementations
 */
export type ModelModifiers = Record<string, ModifierFunction>

/**
 * Modifiers invocation in query options
 * The 'default' modifier is automatically applied to every query
 * Other modifiers can be explicitly invoked with optional parameters
 *
 * Example:
 * ```typescript
 * modifiers: {
 *   activeOnly: {},  // Invoke without parameters
 *   forUser: { userId: '123' }  // Invoke with parameters
 * }
 * ```
 */
export type Modifiers = Record<string, Record<string, any>>

// ============================================================================
// Query Options - Complete query specification
// ============================================================================

/**
 * Full query options for finding records
 * @template TSchema - The database schema type
 * @template TRelations - Union of relation names
 * @template P - The projection names
 * @template TRelationMap - Map of relation names to their schema/relations info
 */
export interface QueryOptions<
  TSchema = Record<string, any>,
  TRelations extends string = string,
  P extends string = string,
  TRelationMap extends Record<string, RelationInfo> = Record<
    string,
    RelationInfo
  >
> {
  /** Projection name from model (e.g., 'default', 'summary', 'minimal') */
  projection?: P
  /** Filter conditions - type-safe based on schema and relations */
  where?: WhereClause<TSchema, TRelations>
  /** Pagination settings */
  paging?: PagingOptions
  /** Sort settings - type-safe field names */
  sorting?: SortingOptions<TSchema>
  /** Relations to include (join) - type-safe relation names */
  relations?: TRelations[]
  /** Metadata options (counts) to include in the response */
  metadata?: MetadataOptions
  /** Reusable query modifiers with optional parameters */
  modifiers?: Modifiers
  /** Nested data fetching options - recursively type-safe */
  each?: {
    [K in TRelations]?: K extends keyof TRelationMap
      ? EachOptions<
          TRelationMap[K]['schema'],
          TRelationMap[K]['relations'],
          TRelationMap[K]['relationMap'] extends Record<string, RelationInfo>
            ? TRelationMap[K]['relationMap']
            : Record<string, RelationInfo>
        >
      : EachOptions
  }
}

/**
 * Query options for checking existence
 * Only includes options relevant for exists queries (no relations support)
 * @template TSchema - The database schema type
 * @template TRelations - Union of relation names
 */
export interface ExistsOptions<
  TSchema = Record<string, any>,
  TRelations extends string = string
> {
  /** Filter conditions - type-safe based on schema and relations */
  where?: WhereClause<TSchema, TRelations>
  /** Reusable query modifiers with optional parameters */
  modifiers?: Modifiers
}

/**
 * Query options for counting records
 * Only includes options relevant for count queries (no relations support)
 * @template TSchema - The database schema type
 * @template TRelations - Union of relation names
 */
export interface CountOptions<
  TSchema = Record<string, any>,
  TRelations extends string = string
> {
  /** Filter conditions - type-safe based on schema and relations */
  where?: WhereClause<TSchema, TRelations>
  /** Reusable query modifiers with optional parameters */
  modifiers?: Modifiers
}

// ============================================================================
// Query Result - What queries return
// ============================================================================

/**
 * Count metadata returned with query results (when requested)
 */
export interface QueryMetadata {
  counts: {
    /** Total number of records in the table */
    total: number
    /** Number of records matching the where clause */
    filtered: number
  }
}

/**
 * Result structure from query operations
 */
export interface QueryResult<T> {
  /** Array of records */
  data: T[]
  /** Optional metadata with counts (included when explicitly requested) */
  metadata?: QueryMetadata
}

// ============================================================================
// Repository Interface - What every repository must implement
// ============================================================================

/**
 * Base repository interface
 * All domain repositories should implement this contract
 *
 * @template TSchema - The database schema type (table structure)
 * @template TRelations - Union of relation names from the model
 * @template TResult - The result type (after projection)
 * @template P - Projection names
 * @template TRelationMap - Map of relation names to their schema/relations info
 * @template TCreateInput - Input type for create operations
 * @template TUpdateInput - Input type for update operations
 * @template TPrimaryKey - Type of the primary key (number for auto-increment, string for UUIDs, etc.)
 */
export interface Repository<
  TSchema = Record<string, any>,
  TRelations extends string = string,
  TResult = unknown,
  P extends string = string,
  TRelationMap extends Record<string, RelationInfo> = Record<
    string,
    RelationInfo
  >,
  TCreateInput = Record<string, any>,
  TUpdateInput = Record<string, any>,
  TPrimaryKey extends WhereValue = number | string
> {
  /**
   * Create a new record
   * @returns Primary key of created record
   */
  create(params: TCreateInput): Promise<TPrimaryKey>

  /**
   * Update an existing record
   * @returns Primary key of updated record
   */
  update(params: { id: TPrimaryKey } & TUpdateInput): Promise<TPrimaryKey>

  /**
   * Delete a record
   * @returns Number of records deleted
   */
  delete(params: { id: TPrimaryKey }): Promise<number>

  /**
   * Find records matching query options
   * @returns Query result with data and optional metadata
   */
  find(params: {
    options: QueryOptions<TSchema, TRelations, P, TRelationMap>
  }): Promise<QueryResult<TResult>>

  /**
   * Check if records exist matching query options
   * @returns True if at least one record exists
   */
  exists(params: {
    options: ExistsOptions<TSchema, TRelations>
  }): Promise<boolean>

  /**
   * Count records matching query options
   * @returns Number of matching records
   */
  count(params: { options: CountOptions<TSchema, TRelations> }): Promise<number>
}
