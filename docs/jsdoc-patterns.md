# JSDoc Type Patterns

This document explains how to create type-safe JSDoc definitions for new domains (entities) in the scaffold.

## Type Architecture Overview

```
┌─────────────────────────────────┐
│  query.types.jsdoc.js (lib)     │  ← Generic, reusable across all domains
│  - WhereFieldOperators          │
│  - PagingOptions                │
│  - MetadataOptions              │
│  - Modifiers                    │
│  - QueryMetadata                │
└─────────────────────────────────┘
           ▲
           │ imports
           │
┌─────────────────────────────────┐
│  tag.repository.jsdoc.js        │  ← Domain-specific (Tag)
│  - TagSchema (fields)           │
│  - TagRelation (relations)      │
│  - TagWhereClause (fields)      │
│  - TagSortingOptions (fields)   │
│  - TagQueryOptions (composed)   │
└─────────────────────────────────┘
           ▲
           │ imports
           │
┌─────────────────────────────────┐
│  tag.actions.jsdoc.js           │  ← Business logic layer
│  - CreateTagParams              │
│  - UpdateTagParams              │
│  - FindTagsOptions              │
└─────────────────────────────────┘
```

## Key Principles

1. **Generic types are reusable** - Operators, pagination, metadata work the same across all domains
2. **Field names are domain-specific** - Each domain defines its own schema fields
3. **Relations are domain-specific** - Each domain defines its own relationships
4. **Composition over duplication** - Import generic types, extend with domain specifics

## Creating a New Domain Repository

Follow this pattern when creating `bookmark.repository.jsdoc.js`:

### Step 1: Import Generic Query Types

```javascript
/**
 * JSDoc Type Definitions for Bookmark Repository
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
```

### Step 2: Define Domain Schema

```javascript
// ============================================================================
// Bookmark Domain Types
// ============================================================================

/**
 * Bookmark table schema - represents the complete database structure
 * @typedef {Object} BookmarkSchema
 * @property {number} id - Primary key
 * @property {string} user_id - Foreign key to user
 * @property {string} url - Bookmark URL
 * @property {string} title - Bookmark title
 * @property {string} [description] - Optional description
 * @property {string} created_at - Creation timestamp
 * @property {string} updated_at - Update timestamp
 */
```

### Step 3: Define Projections

```javascript
/**
 * Default projection - all fields
 * @typedef {Object} BookmarkDefault
 * @property {number} id
 * @property {string} user_id
 * @property {string} url
 * @property {string} title
 * @property {string} [description]
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * Summary projection - for lists
 * @typedef {Object} BookmarkSummary
 * @property {number} id
 * @property {string} url
 * @property {string} title
 */

/**
 * Union type for all bookmark projections
 * @typedef {BookmarkDefault | BookmarkSummary} BookmarkProjection
 */
```

### Step 4: Define Relations

```javascript
/**
 * Bookmark relation names
 * @typedef {'user' | 'tags'} BookmarkRelation
 */
```

### Step 5: Build Domain-Specific Where Clause

**This is where you compose generic operators with your schema fields:**

```javascript
/**
 * Complete where clause structure for bookmarks
 *
 * Composes generic WhereFieldOperators with bookmark-specific schema fields.
 *
 * @typedef {Object} WhereClause
 * @property {WhereValue | WhereFieldOperators} [id]
 * @property {WhereValue | WhereFieldOperators} [user_id]
 * @property {WhereValue | WhereFieldOperators} [url]
 * @property {WhereValue | WhereFieldOperators} [title]
 * @property {WhereValue | WhereFieldOperators} [description]
 * @property {WhereValue | WhereFieldOperators} [created_at]
 * @property {WhereValue | WhereFieldOperators} [updated_at]
 * @property {Object.<BookmarkRelation, WhereClause>} [_exists] - Filter by related records
 * @property {WhereClause[]} [OR] - OR logical operator
 * @property {WhereClause[]} [AND] - AND logical operator
 */
```

### Step 6: Build Domain-Specific Sorting

```javascript
/**
 * Sorting settings for bookmarks
 *
 * Uses bookmark-specific schema fields for type-safe sorting.
 *
 * @typedef {Object} SortingOptions
 * @property {'id' | 'user_id' | 'url' | 'title' | 'created_at' | 'updated_at'} field
 * @property {'asc' | 'desc'} order
 */
```

### Step 7: Build Each Options (for nested data)

```javascript
/**
 * Options for fetching nested related data (GraphQL-style)
 *
 * Uses bookmark-specific relations and where clause.
 *
 * @typedef {Object} EachOptions
 * @property {string} [projection]
 * @property {WhereClause} [where]
 * @property {Object.<string, 'asc' | 'desc'>} [orderBy]
 * @property {number} [skip]
 * @property {number} [take]
 * @property {Object.<string, boolean | {where: WhereClause}>} [withRelatedCounts]
 * @property {Object.<BookmarkRelation, EachOptions>} [each]
 */
```

### Step 8: Compose Query Options

**This combines generic types (PagingOptions, MetadataOptions, Modifiers) with domain-specific types:**

```javascript
/**
 * Complete query options for finding bookmarks
 *
 * Composes generic query options with bookmark-specific types.
 *
 * @typedef {Object} QueryOptions
 * @property {'default' | 'summary'} [projection]
 * @property {WhereClause} [where] - Filter conditions (bookmark-specific fields)
 * @property {PagingOptions} [paging] - Pagination settings (generic)
 * @property {SortingOptions} [sorting] - Sort settings (bookmark-specific fields)
 * @property {BookmarkRelation[]} [relations] - Relations to include (bookmark-specific)
 * @property {MetadataOptions} [metadata] - Metadata options (generic)
 * @property {Modifiers} [modifiers] - Reusable query modifiers (generic)
 * @property {Object.<BookmarkRelation, EachOptions>} [each] - Nested data (bookmark-specific)
 */

/**
 * Query options for checking bookmark existence
 * @typedef {Object} ExistsOptions
 * @property {WhereClause} [where]
 * @property {Modifiers} [modifiers]
 */

/**
 * Query options for counting bookmarks
 * @typedef {Object} CountOptions
 * @property {WhereClause} [where]
 * @property {Modifiers} [modifiers]
 */
```

### Step 9: Define Query Results

```javascript
/**
 * Result structure from bookmark query operations
 *
 * @typedef {Object} QueryResult
 * @property {BookmarkProjection[]} data - Array of bookmark records
 * @property {QueryMetadata} [metadata] - Optional metadata (generic)
 */

// Export empty object to make this a module
module.exports = {}
```

## Type Safety Benefits

### ✅ Field-Level Type Safety

```javascript
// ✓ Correct - 'url' is a valid bookmark field
await bookmarkRepository.find({
  options: {
    where: { url: { contains: 'github.com' } }
  }
})

// ✗ Error - 'name' doesn't exist on BookmarkSchema
await bookmarkRepository.find({
  options: {
    where: { name: { contains: 'test' } } // IDE will warn!
  }
})
```

### ✅ Relation Type Safety

```javascript
// ✓ Correct - 'tags' is a valid BookmarkRelation
await bookmarkRepository.find({
  options: {
    each: {
      tags: { projection: 'summary' }
    }
  }
})

// ✗ Error - 'bookmarks' doesn't exist on BookmarkRelation
await bookmarkRepository.find({
  options: {
    each: {
      bookmarks: { projection: 'summary' } // IDE will warn!
    }
  }
})
```

### ✅ Operator Type Safety

```javascript
// ✓ Correct - operators work the same across all domains
await bookmarkRepository.find({
  options: {
    where: {
      created_at: { gte: '2024-01-01' },
      title: { contains: 'important' },
      id: { in: [1, 2, 3] }
    }
  }
})
```

## Summary

This pattern ensures:

1. **Generic operators are reused** (no duplication)
2. **Domain fields are type-safe** (WhereClause knows about BookmarkSchema)
3. **Relations are type-safe** (EachOptions knows about BookmarkRelation)
4. **IntelliSense works** in VS Code with autocomplete for fields and operators
5. **Consistency across domains** - same pattern for tag, bookmark, user, etc.

When creating a new domain, simply follow steps 1-9 with your domain-specific:

- Schema fields
- Projection types
- Relation names
- Field lists in WhereClause and SortingOptions
