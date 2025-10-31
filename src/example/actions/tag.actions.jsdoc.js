/**
 * JSDoc Type Definitions for Tag Actions
 *
 * This file provides type safety for the actions layer (business logic).
 * Actions handle validation, business rules, and orchestrate repository calls.
 */

// Import repository types for reuse
/**
 * @typedef {import('../repositories/tag.repository.jsdoc').TagProjection} TagProjection
 * @typedef {import('../repositories/tag.repository.jsdoc').TagDefault} TagDefault
 * @typedef {import('../repositories/tag.repository.jsdoc').TagSummary} TagSummary
 * @typedef {import('../repositories/tag.repository.jsdoc').TagMinimal} TagMinimal
 * @typedef {import('../repositories/tag.repository.jsdoc').PagingOptions} PagingOptions
 * @typedef {import('../repositories/tag.repository.jsdoc').SortingOptions} SortingOptions
 * @typedef {import('../repositories/tag.repository.jsdoc').QueryResult} QueryResult
 */

// ============================================================================
// Action Input Types
// ============================================================================

/**
 * Tag data for creation (from user input)
 * @typedef {Object} TagCreateData
 * @property {string} name - Tag name
 */

/**
 * Tag data for update (from user input)
 * @typedef {Object} TagUpdateData
 * @property {string} [name] - Tag name (optional)
 */

/**
 * Projection option for selecting which fields to return
 * @typedef {'default' | 'summary' | 'minimal'} ProjectionOption
 */

// ============================================================================
// Action Method Parameters
// ============================================================================

/**
 * Parameters for creating a tag
 * @typedef {Object} CreateTagParams
 * @property {string} userId - User ID creating the tag
 * @property {TagCreateData} tag - Tag data to create
 */

/**
 * Options for create action
 * @typedef {Object} CreateTagOptions
 * @property {ProjectionOption} [projection='default'] - Which projection to return
 */

/**
 * Parameters for updating a tag
 * @typedef {Object} UpdateTagParams
 * @property {string} userId - User ID updating the tag
 * @property {number} id - Tag ID to update
 * @property {TagUpdateData} tag - Tag data to update
 */

/**
 * Options for update action
 * @typedef {Object} UpdateTagOptions
 * @property {ProjectionOption} [projection='default'] - Which projection to return
 */

/**
 * Parameters for deleting a tag
 * @typedef {Object} DeleteTagParams
 * @property {string} userId - User ID deleting the tag
 * @property {number} id - Tag ID to delete
 */

/**
 * Parameters for finding tags
 * @typedef {Object} FindTagsParams
 * @property {string} userId - User ID to find tags for
 * @property {string} [namePattern] - Optional name pattern to filter by
 */

/**
 * Options for find action
 * @typedef {Object} FindTagsOptions
 * @property {ProjectionOption} [projection='default'] - Which projection to return
 * @property {PagingOptions} [pagingOptions] - Pagination settings
 * @property {SortingOptions} [sortingOptions] - Sorting settings
 */

/**
 * Parameters for finding a tag by ID
 * @typedef {Object} FindTagByIdParams
 * @property {string} userId - User ID
 * @property {number} id - Tag ID to find
 */

/**
 * Options for findById action
 * @typedef {Object} FindTagByIdOptions
 * @property {ProjectionOption} [projection='default'] - Which projection to return
 */

// Export empty object to make this a module
module.exports = {}
