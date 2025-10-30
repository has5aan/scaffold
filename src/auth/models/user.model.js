const { getTableName } = require('../../lib/database/migration-helpers')

const userModel = {
  tableName: getTableName('auth', 'users', {
    dbType: process.env.DB_TYPE || 'pg'
  }),
  alias: 'u',
  primaryKey: 'id',

  // Projections define which columns to select
  projections: {
    default: (_knexInstanceOrQuery, alias, _relationName = null) => [
      `${alias}.id`,
      `${alias}.email`,
      `${alias}.role`,
      `${alias}.email_confirmed_at`,
      `${alias}.created_at`,
      `${alias}.updated_at`
    ],
    summary: (_knexInstanceOrQuery, alias, _relationName = null) => [
      `${alias}.id`,
      `${alias}.email`,
      `${alias}.role`
    ],
    minimal: (_knexInstanceOrQuery, alias, _relationName = null) => [
      `${alias}.id`,
      `${alias}.email`
    ]
  },

  // Relations for data fetching
  relations: {
    tags: {
      type: 'hasMany',
      model: 'exampleTag',
      table: getTableName('example', 'tag', {
        dbType: process.env.DB_TYPE || 'pg'
      }),
      foreignKey: 'user_id',
      primaryKey: 'id',
      modelDefinition: () => require('../../example/models/tag.model')
    },
    bookmarks: {
      type: 'hasMany',
      model: 'exampleBookmark',
      table: getTableName('example', 'bookmark', {
        dbType: process.env.DB_TYPE || 'pg'
      }),
      foreignKey: 'user_id',
      primaryKey: 'id',
      modelDefinition: () => require('../../example/models/bookmark.model')
    }
  },

  // Modifiers for reusable query logic
  modifiers: {
    byEmail: (query, alias, { email }) => {
      query.where(`${alias}.email`, email)
    }
  }
}

module.exports = userModel
