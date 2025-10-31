/**
 * Tag Type Definitions
 *
 * This file defines the schema and projection types for the Tag domain model
 */

// ============================================================================
// Database Schema - Storage structure
// ============================================================================

/**
 * Tag table schema - represents the complete database structure
 * This is what exists in the database before any projection
 */
export interface TagSchema {
  id: number
  user_id: string
  name: string
  created_at: string
  updated_at: string
}

// ============================================================================
// Projection Types - What queries return
// ============================================================================

/**
 * Default projection - all fields
 */
export interface TagDefault {
  id: number
  user_id: string
  name: string
  created_at: string
  updated_at: string
}

/**
 * Summary projection - minimal info for lists
 */
export interface TagSummary {
  id: number
  name: string
}

/**
 * Minimal projection - just id and name
 */
export interface TagMinimal {
  id: number
  name: string
}

// ============================================================================
// Projection Mapping
// ============================================================================

/**
 * Maps projection names to their result types
 */
export type TagProjections = {
  default: TagDefault
  summary: TagSummary
  minimal: TagMinimal
}

// ============================================================================
// Input Types
// ============================================================================

/**
 * Data required to create a tag
 */
export interface CreateTagInput {
  name: string
}

/**
 * Data that can be updated on a tag
 */
export interface UpdateTagInput {
  name?: string
}
