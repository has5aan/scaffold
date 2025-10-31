/**
 * @typedef {import('./tag.rules.jsdoc').TagRuleDependencies} TagRuleDependencies
 * @typedef {import('./tag.rules.jsdoc').TagForUserMustBeUniqueParams} TagForUserMustBeUniqueParams
 * @typedef {import('./tag.rules.jsdoc').UserMustOwnTheTagParams} UserMustOwnTheTagParams
 * @typedef {import('./tag.rules.jsdoc').UserMustOwnTheTagsParams} UserMustOwnTheTagsParams
 */

const { ValidationError } = require('../../../lib/errors')

/**
 * Tag Rules
 * Reusable validation functions that enforce business constraints for tags
 */

/**
 * Validate that a tag name is unique for a user
 *
 * This rule ensures no duplicate tag names exist for the same user.
 * When updating a tag, the current tag ID is excluded from the check.
 *
 * @param {TagRuleDependencies} dependencies - Injected dependencies
 * @param {TagForUserMustBeUniqueParams} params - Validation parameters
 * @returns {Promise<void>}
 *
 * @throws {ValidationError} If tag name already exists for the user
 *
 * @example
 * // Check uniqueness when creating a tag
 * await tagForUserMustBeUnique(
 *   { tagRepository },
 *   { userId: '123', name: 'JavaScript' }
 * )
 *
 * @example
 * // Check uniqueness when updating a tag (exclude current tag)
 * await tagForUserMustBeUnique(
 *   { tagRepository },
 *   { id: 5, userId: '123', name: 'JavaScript' }
 * )
 */
async function tagForUserMustBeUnique({ tagRepository }, { id, userId, name }) {
  const exists = await tagRepository.exists({
    options: {
      where: {
        user_id: userId,
        name,
        id: { not: id, _condition: id != null }
      }
    }
  })
  if (exists) {
    throw new ValidationError('Tag name must be unique for user')
  }
}

/**
 * Validate that a user owns a specific tag
 *
 * This rule ensures that operations are only performed on tags
 * that belong to the requesting user.
 *
 * @param {TagRuleDependencies} dependencies - Injected dependencies
 * @param {UserMustOwnTheTagParams} params - Validation parameters
 * @returns {Promise<void>}
 *
 * @throws {ValidationError} If user does not own the tag
 *
 * @example
 * // Verify ownership before update or delete
 * await userMustOwnTheTag(
 *   { tagRepository },
 *   { id: 5, userId: '123' }
 * )
 */
async function userMustOwnTheTag({ tagRepository }, { id, userId }) {
  const exists = await tagRepository.exists({
    options: {
      where: { id, user_id: userId }
    }
  })
  if (!exists) {
    throw new ValidationError('User does not own this tag')
  }
}

/**
 * Validate that a user owns all specified tags
 *
 * This rule ensures that batch operations are only performed on tags
 * that all belong to the requesting user. Empty arrays are allowed.
 *
 * @param {TagRuleDependencies} dependencies - Injected dependencies
 * @param {UserMustOwnTheTagsParams} params - Validation parameters
 * @returns {Promise<void>}
 *
 * @throws {ValidationError} If user does not own all tags
 *
 * @example
 * // Verify ownership before batch delete
 * await userMustOwnTheTags(
 *   { tagRepository },
 *   { tagIds: [1, 2, 3], userId: '123' }
 * )
 *
 * @example
 * // Empty array is allowed (no-op)
 * await userMustOwnTheTags(
 *   { tagRepository },
 *   { tagIds: [], userId: '123' }
 * )
 */
async function userMustOwnTheTags({ tagRepository }, { tagIds, userId }) {
  if (tagIds.length === 0) {
    return
  }

  const { filtered: count } = await tagRepository.count({
    options: {
      where: {
        id: { in: tagIds },
        user_id: userId
      },
      counts: {
        filtered: true
      }
    }
  })

  if (count !== tagIds.length) {
    throw new ValidationError('User does not own all the tags')
  }
}

module.exports = {
  tagForUserMustBeUnique,
  userMustOwnTheTag,
  userMustOwnTheTags
}
