/**
 * JSDoc Type Definitions for Tag Rules
 *
 * This file provides type safety for the validation rules layer.
 * Rules are reusable validation functions that enforce business constraints.
 */

// ============================================================================
// Rule Dependencies
// ============================================================================

/**
 * Dependencies injected into rule functions
 * @typedef {Object} TagRuleDependencies
 * @property {import('../../repositories/tag.repository')} tagRepository - Tag repository instance
 */

// ============================================================================
// Rule Parameters
// ============================================================================

/**
 * Parameters for checking tag uniqueness for a user
 * @typedef {Object} TagForUserMustBeUniqueParams
 * @property {number} [id] - Tag ID (when updating, exclude this ID from uniqueness check)
 * @property {string} userId - User ID to check uniqueness for
 * @property {string} name - Tag name to check for uniqueness
 */

/**
 * Parameters for verifying user owns a tag
 * @typedef {Object} UserMustOwnTheTagParams
 * @property {number} id - Tag ID to check ownership for
 * @property {string} userId - User ID to verify ownership
 */

/**
 * Parameters for verifying user owns multiple tags
 * @typedef {Object} UserMustOwnTheTagsParams
 * @property {number[]} tagIds - Array of tag IDs to check ownership for
 * @property {string} userId - User ID to verify ownership
 */

// ============================================================================
// Rule Function Types
// ============================================================================

/**
 * Rule function that validates tag name uniqueness for a user
 * @typedef {function(TagRuleDependencies, TagForUserMustBeUniqueParams): Promise<void>} TagForUserMustBeUniqueRule
 * @throws {ValidationError} If tag name already exists for user
 */

/**
 * Rule function that validates user owns a specific tag
 * @typedef {function(TagRuleDependencies, UserMustOwnTheTagParams): Promise<void>} UserMustOwnTheTagRule
 * @throws {ValidationError} If user does not own the tag
 */

/**
 * Rule function that validates user owns multiple tags
 * @typedef {function(TagRuleDependencies, UserMustOwnTheTagsParams): Promise<void>} UserMustOwnTheTagsRule
 * @throws {ValidationError} If user does not own all tags
 */

// Export empty object to make this a module
module.exports = {}
