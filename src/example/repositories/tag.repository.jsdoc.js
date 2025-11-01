/**
 * JSDoc Type Definitions for Tag Repository
 *
 * This file provides type safety for the tag repository.
 * It composes generic query types from query.types.jsdoc.js with tag-specific schema fields.
 */

// Import generic query building types
/**
 * @typedef {import('../../../lib/query.types.jsdoc').WhereValue} WhereValue
 * @typedef {import('../../../lib/query.types.jsdoc').WhereFieldOperators} WhereFieldOperators
 * @typedef {import('../../../lib/query.types.jsdoc').PagingOptions} PagingOptions
 * @typedef {import('../../../lib/query.types.jsdoc').MetadataOptions} MetadataOptions
 * @typedef {import('../../../lib/query.types.jsdoc').Modifiers} Modifiers
 * @typedef {import('../../../lib/query.types.jsdoc').QueryMetadata} QueryMetadata
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
// Query Building Types - Tag-Specific Where Clause
// ============================================================================

/**
 * Complete where clause structure for tags
 *
 * Composes generic WhereFieldOperators with tag-specific schema fields.
 * Can filter by fields, check relations, and use logical operators.
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
// Query Building Types - Tag-Specific Options
// ============================================================================

/**
 * Sorting settings for tags
 *
 * Uses tag-specific schema fields for type-safe sorting.
 *
 * @typedef {Object} SortingOptions
 * @property {'id' | 'user_id' | 'name' | 'created_at' | 'updated_at'} field - Field to sort by
 * @property {'asc' | 'desc'} order - Sort order
 */

/**
 * Options for fetching nested related data (GraphQL-style)
 *
 * Uses tag-specific relations (TagRelation) and where clause for type safety.
 *
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
 * Complete query options for finding tags
 *
 * Composes generic query options (PagingOptions, MetadataOptions, Modifiers)
 * with tag-specific types (WhereClause, SortingOptions, TagRelation, EachOptions).
 *
 * @typedef {Object} QueryOptions
 * @property {'default' | 'summary' | 'minimal'} [projection] - Projection name
 * @property {WhereClause} [where] - Filter conditions (tag-specific fields)
 * @property {PagingOptions} [paging] - Pagination settings (generic)
 * @property {SortingOptions} [sorting] - Sort settings (tag-specific fields)
 * @property {TagRelation[]} [relations] - Relations to include (tag-specific)
 * @property {MetadataOptions} [metadata] - Metadata options (generic)
 * @property {Modifiers} [modifiers] - Reusable query modifiers (generic)
 * @property {Object.<TagRelation, EachOptions>} [each] - Nested data fetching (tag-specific)
 */

/**
 * Query options for checking tag existence
 *
 * @typedef {Object} ExistsOptions
 * @property {WhereClause} [where] - Filter conditions (tag-specific fields)
 * @property {Modifiers} [modifiers] - Reusable query modifiers (generic)
 */

/**
 * Query options for counting tags
 *
 * @typedef {Object} CountOptions
 * @property {WhereClause} [where] - Filter conditions (tag-specific fields)
 * @property {Modifiers} [modifiers] - Reusable query modifiers (generic)
 */

// ============================================================================
// Query Result Types
// ============================================================================

/**
 * Result structure from tag query operations
 *
 * Composes generic QueryMetadata with tag-specific projections.
 *
 * @typedef {Object} QueryResult
 * @property {TagProjection[]} data - Array of tag records
 * @property {QueryMetadata} [metadata] - Optional metadata with counts (generic)
 */

// Export empty object to make this a module
module.exports = {}
