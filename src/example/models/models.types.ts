/**
 * Models Type Definitions
 *
 * This file defines relation maps for all models in the example domain.
 * Centralizing relation maps here prevents circular dependencies between model types.
 */

import type { TagSchema } from './tag.types'

// ============================================================================
// Relation Maps - Cross-model relationships
// ============================================================================

/**
 * Tag relation map - maps each relation to its schema, relations, and nested map
 * This enables recursive type-safe nested queries with 'each'
 */
export type TagRelationMap = {
  user: {
    schema: any // Replace with UserSchema when user types are available
    relations: string // Replace with UserRelations when available
    relationMap: any // Replace with UserRelationMap when available
  }
  bookmarks: {
    schema: any // Replace with BookmarkSchema when bookmark types are available
    relations: string // Replace with BookmarkRelations when available
    relationMap: any // Replace with BookmarkRelationMap when available
  }
}

/**
 * Bookmark relation map (placeholder for future implementation)
 */
export type BookmarkRelationMap = {
  tags: {
    schema: TagSchema
    relations: TagRelations
    relationMap: TagRelationMap
  }
  user: {
    schema: any // UserSchema
    relations: string // UserRelations
    relationMap: any // UserRelationMap
  }
}

/**
 * User relation map (placeholder for future implementation)
 */
export type UserRelationMap = {
  tags: {
    schema: TagSchema
    relations: TagRelations
    relationMap: TagRelationMap
  }
  bookmarks: {
    schema: any // BookmarkSchema
    relations: string // BookmarkRelations
    relationMap: any // BookmarkRelationMap
  }
}

// ============================================================================
// Relation Names - Derived from relation maps
// ============================================================================

/**
 * Tag relation names - derived from TagRelationMap
 * This ensures relation names stay in sync with the relation map
 */
export type TagRelations = keyof TagRelationMap

/**
 * Bookmark relation names - derived from BookmarkRelationMap
 */
export type BookmarkRelations = keyof BookmarkRelationMap

/**
 * User relation names - derived from UserRelationMap
 */
export type UserRelations = keyof UserRelationMap
