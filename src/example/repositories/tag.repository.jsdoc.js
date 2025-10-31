/**
 * JSDoc Type Definitions for Tag Repository
 *
 * This file provides type safety for JavaScript without TypeScript.
 * All types mirror the TypeScript definitions for complete type coverage.
 */

// ============================================================================
// Tag Domain Types
// ============================================================================

/**
 * Tag table schema - represents the complete database structure
 * @typedef {Object} TagSchema
 * @property {number} id - Primary key
 * @property {string} user_id - Foreign key to user
 * @property {string} name - Tag name
 * @property {string} created_at - Creation timestamp
 * @property {string} updated_at - Update timestamp
 */

/**
 * Data required to create a tag
 * @typedef {Object} CreateTagInput
 * @property {string} name - Tag name
 */

/**
 * Data that can be updated on a tag
 * @typedef {Object} UpdateTagInput
 * @property {string} [name] - Tag name (optional)
 */

/**
 * Default projection - all fields
 * @typedef {Object} TagDefault
 * @property {number} id
 * @property {string} user_id
 * @property {string} name
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * Summary projection - minimal info for lists
 * @typedef {Object} TagSummary
 * @property {number} id
 * @property {string} name
 */

/**
 * Minimal projection - just id and name
 * @typedef {Object} TagMinimal
 * @property {number} id
 * @property {string} name
 */

/**
 * Union type for all possible tag projections
 * @typedef {TagDefault | TagSummary | TagMinimal} TagProjection
 */

/**
 * Tag relation names
 * @typedef {'user' | 'bookmarks'} TagRelation
 */

// ============================================================================
// Query Building Types - Where Clause
// ============================================================================

/**
 * Primitive database value types
 * @typedef {string | number | boolean | null} WhereValue
 */

/**
 * Operators for field-level conditions
 * @typedef {Object} WhereFieldOperators
 * @property {WhereValue} [equals] - Exact match
 * @property {WhereValue} [not] - Not equal to
 * @property {WhereValue[]} [in] - Value is in array
 * @property {WhereValue[]} [notIn] - Value is not in array
 * @property {WhereValue} [lt] - Less than
 * @property {WhereValue} [lte] - Less than or equal
 * @property {WhereValue} [gt] - Greater than
 * @property {WhereValue} [gte] - Greater than or equal
 * @property {string} [contains] - String contains (LIKE %value%)
 * @property {string} [startsWith] - String starts with (LIKE value%)
 * @property {string} [endsWith] - String ends with (LIKE %value)
 * @property {boolean} [isNull] - Field is NULL
 * @property {boolean} [isNotNull] - Field is NOT NULL
 * @property {boolean} [_condition] - Conditional where - only apply if true
 */

/**
 * Exists clause for filtering based on related records (row-level security)
 * @typedef {Object} WhereExistsClause
 * @property {Object.<TagRelation, WhereClause>} [_exists] - Check if related records exist
 */

/**
 * Logical operators for combining multiple where conditions
 * @typedef {Object} WhereLogicalOperators
 * @property {WhereClause[]} [OR] - At least one condition must be true
 * @property {WhereClause[]} [AND] - All conditions must be true
 */

/**
 * Complete where clause structure
 * Can filter by fields, check relations, and use logical operators
 *
 * @typedef {Object} WhereClause
 * @property {WhereValue | WhereFieldOperators} [id] - Filter by id
 * @property {WhereValue | WhereFieldOperators} [user_id] - Filter by user_id
 * @property {WhereValue | WhereFieldOperators} [name] - Filter by name
 * @property {WhereValue | WhereFieldOperators} [created_at] - Filter by created_at
 * @property {WhereValue | WhereFieldOperators} [updated_at] - Filter by updated_at
 * @property {Object.<TagRelation, WhereClause>} [_exists] - Filter by related records
 * @property {WhereClause[]} [OR] - OR logical operator
 * @property {WhereClause[]} [AND] - AND logical operator
 */

// ============================================================================
// Query Building Types - Options
// ============================================================================

/**
 * Pagination settings
 * @typedef {Object} PagingOptions
 * @property {number} [limit] - Number of records to return
 * @property {number} [offset] - Number of records to skip
 */

/**
 * Sorting settings
 * @typedef {Object} SortingOptions
 * @property {'id' | 'user_id' | 'name' | 'created_at' | 'updated_at'} field - Field to sort by
 * @property {'asc' | 'desc'} order - Sort order
 */

/**
 * Metadata options - specify which counts to include
 * @typedef {Object} MetadataOptions
 * @property {Object} [counts] - Count options
 * @property {boolean} [counts.total] - Include total count
 * @property {boolean} [counts.filtered] - Include filtered count
 */

/**
 * Modifier invocation - reusable query functions with parameters
 *
 * Modifiers are defined in the model and allow you to apply reusable filtering logic.
 * The 'default' modifier is automatically applied to every query.
 *
 * @typedef {Object.<string, Object>} Modifiers
 *
 * @example
 * // Invoke modifiers without parameters
 * {
 *   modifiers: {
 *     activeOnly: {}
 *   }
 * }
 *
 * @example
 * // Invoke modifiers with parameters
 * {
 *   modifiers: {
 *     forUser: { userId: '123' },
 *     createdAfter: { date: '2024-01-01' }
 *   }
 * }
 */

/**
 * Options for fetching nested related data (GraphQL-style)
 * @typedef {Object} EachOptions
 * @property {string} [projection] - Projection to use for related records
 * @property {WhereClause} [where] - Filter conditions for related records
 * @property {Object.<string, 'asc' | 'desc'>} [orderBy] - Sorting for related records
 * @property {number} [skip] - Number of related records to skip
 * @property {number} [take] - Limit number of related records
 * @property {Object.<string, boolean | {where: WhereClause}>} [withRelatedCounts] - Include counts of nested relations
 * @property {Object.<TagRelation, EachOptions>} [each] - Nested data fetching (recursive)
 */

/**
 * Complete query options for finding records
 * @typedef {Object} QueryOptions
 * @property {'default' | 'summary' | 'minimal'} [projection] - Projection name
 * @property {WhereClause} [where] - Filter conditions
 * @property {PagingOptions} [paging] - Pagination settings
 * @property {SortingOptions} [sorting] - Sort settings
 * @property {TagRelation[]} [relations] - Relations to include (join)
 * @property {MetadataOptions} [metadata] - Metadata options (counts)
 * @property {Modifiers} [modifiers] - Reusable query modifiers
 * @property {Object.<TagRelation, EachOptions>} [each] - Nested data fetching
 */

/**
 * Query options for checking existence
 * @typedef {Object} ExistsOptions
 * @property {WhereClause} [where] - Filter conditions
 * @property {Modifiers} [modifiers] - Reusable query modifiers
 */

/**
 * Query options for counting records
 * @typedef {Object} CountOptions
 * @property {WhereClause} [where] - Filter conditions
 * @property {Modifiers} [modifiers] - Reusable query modifiers
 */

// ============================================================================
// Query Result Types
// ============================================================================

/**
 * Count metadata returned with query results
 * @typedef {Object} QueryMetadata
 * @property {Object} counts - Count information
 * @property {number} counts.total - Total number of records in table
 * @property {number} counts.filtered - Number of records matching filter
 */

/**
 * Result structure from query operations
 * @typedef {Object} QueryResult
 * @property {TagProjection[]} data - Array of records
 * @property {QueryMetadata} [metadata] - Optional metadata with counts
 */

// Export empty object to make this a module
module.exports = {}
