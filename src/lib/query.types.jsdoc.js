/**
 * JSDoc Type Definitions for Query Building
 *
 * This file provides reusable type definitions for query building across all domains.
 * These types are generic and domain-agnostic - each domain will compose them
 * with their specific schema fields, relations, and projections.
 */

// ============================================================================
// Primitive Value Types
// ============================================================================

/**
 * Primitive database value types
 * @typedef {string | number | boolean | null} WhereValue
 */

// ============================================================================
// Field-Level Operators (Generic Structure)
// ============================================================================

/**
 * Operators for field-level conditions
 *
 * This provides the structure for filtering individual fields.
 * Each domain will use these operators with their specific field names.
 *
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

// ============================================================================
// Pagination & Sorting (Generic)
// ============================================================================

/**
 * Pagination settings
 *
 * Universal pagination structure used across all domains.
 *
 * @typedef {Object} PagingOptions
 * @property {number} [limit] - Number of records to return
 * @property {number} [offset] - Number of records to skip
 */

/**
 * Generic sorting structure
 *
 * Note: Each domain will define their own SortingOptions with specific field names.
 * This is just the structural pattern.
 *
 * @template {string} TField
 * @typedef {Object} SortingOptionsStructure
 * @property {TField} field - Field to sort by (domain-specific)
 * @property {'asc' | 'desc'} order - Sort order
 */

// ============================================================================
// Metadata Options (Generic)
// ============================================================================

/**
 * Metadata options - specify which counts to include
 *
 * Universal metadata structure for requesting counts with queries.
 *
 * @typedef {Object} MetadataOptions
 * @property {Object} [counts] - Count options
 * @property {boolean} [counts.total] - Include total count
 * @property {boolean} [counts.filtered] - Include filtered count
 */

/**
 * Count metadata returned with query results
 *
 * Universal count result structure.
 *
 * @typedef {Object} QueryMetadata
 * @property {Object} counts - Count information
 * @property {number} counts.total - Total number of records in table
 * @property {number} counts.filtered - Number of records matching filter
 */

// ============================================================================
// Modifiers (Generic Structure)
// ============================================================================

/**
 * Modifier invocation - reusable query functions with parameters
 *
 * Modifiers are defined in each domain's model and allow applying reusable filtering logic.
 * The 'default' modifier is automatically applied to every query.
 *
 * This is a generic structure - each domain defines their own modifier names and parameters.
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

// ============================================================================
// Nested Data Fetching (Generic Structure)
// ============================================================================

/**
 * Generic structure for fetching nested related data (GraphQL-style)
 *
 * Note: Each domain will define their own EachOptions with specific relation names.
 * This shows the structural pattern for nested data fetching.
 *
 * @template {string} TRelation - Domain-specific relation names
 * @template TWhereClause - Domain-specific where clause type
 * @typedef {Object} EachOptionsStructure
 * @property {string} [projection] - Projection to use for related records
 * @property {TWhereClause} [where] - Filter conditions for related records (domain-specific)
 * @property {Object.<string, 'asc' | 'desc'>} [orderBy] - Sorting for related records
 * @property {number} [skip] - Number of related records to skip
 * @property {number} [take] - Limit number of related records
 * @property {Object.<string, boolean | {where: TWhereClause}>} [withRelatedCounts] - Include counts of nested relations
 * @property {Object.<TRelation, EachOptionsStructure>} [each] - Nested data fetching (recursive)
 */

// ============================================================================
// Count Result (Generic)
// ============================================================================

/**
 * Count result structure
 *
 * Universal structure for count query results.
 *
 * @typedef {Object} CountResult
 * @property {number} [total] - Total number of records in table
 * @property {number} [filtered] - Number of records matching filter
 */

// ============================================================================
// Usage Pattern Documentation
// ============================================================================

/**
 * PATTERN: How to build domain-specific query types
 *
 * Each domain (tag, bookmark, user, etc.) should:
 *
 * 1. Define their schema fields (e.g., TagSchema)
 * 2. Define their relations (e.g., TagRelation = 'user' | 'bookmarks')
 * 3. Define their projections (e.g., 'default' | 'summary' | 'minimal')
 *
 * 4. Build WhereClause using schema fields + WhereFieldOperators:
 *    @typedef {Object} TagWhereClause
 *    @property {WhereValue | WhereFieldOperators} [id]
 *    @property {WhereValue | WhereFieldOperators} [user_id]
 *    @property {WhereValue | WhereFieldOperators} [name]
 *    @property {Object.<TagRelation, TagWhereClause>} [_exists]
 *    @property {TagWhereClause[]} [OR]
 *    @property {TagWhereClause[]} [AND]
 *
 * 5. Build SortingOptions using schema fields:
 *    @typedef {Object} TagSortingOptions
 *    @property {'id' | 'user_id' | 'name' | 'created_at' | 'updated_at'} field
 *    @property {'asc' | 'desc'} order
 *
 * 6. Build EachOptions using relation names + WhereClause:
 *    @typedef {Object} TagEachOptions
 *    @property {string} [projection]
 *    @property {TagWhereClause} [where]
 *    @property {Object.<string, 'asc' | 'desc'>} [orderBy]
 *    @property {number} [skip]
 *    @property {number} [take]
 *    @property {Object.<string, boolean | {where: TagWhereClause}>} [withRelatedCounts]
 *    @property {Object.<TagRelation, TagEachOptions>} [each]
 *
 * 7. Build QueryOptions by composing all types:
 *    @typedef {Object} TagQueryOptions
 *    @property {TagProjectionName} [projection]
 *    @property {TagWhereClause} [where]
 *    @property {PagingOptions} [paging]           // From query.types.jsdoc.js
 *    @property {TagSortingOptions} [sorting]
 *    @property {TagRelation[]} [relations]
 *    @property {MetadataOptions} [metadata]       // From query.types.jsdoc.js
 *    @property {Modifiers} [modifiers]            // From query.types.jsdoc.js
 *    @property {Object.<TagRelation, TagEachOptions>} [each]
 *
 * This pattern ensures:
 * - Generic operators/options are reused (PagingOptions, MetadataOptions, WhereFieldOperators)
 * - Domain-specific fields provide type safety (WhereClause knows about tag schema)
 * - Relations are type-safe (EachOptions knows about TagRelation)
 */

// Export empty object to make this a module
module.exports = {}
