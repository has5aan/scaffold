const { getTableName } = require('../../lib/database/migration-helpers')

const tagModel = {
  tableName: getTableName('example', 'tag', { dbType: process.env.DB_TYPE || 'pg' }),
  alias: 't',
  primaryKey: 'id',

  // Projections define which columns to select
  projections: {
    default: (_knexInstanceOrQuery, alias, _relationName = null) => [
      `${alias}.id`,
      `${alias}.user_id`,
      `${alias}.name`,
      `${alias}.created_at`,
      `${alias}.updated_at`
    ],
    summary: (_knexInstanceOrQuery, alias, _relationName = null) => [
      `${alias}.id`,
      `${alias}.name`
    ],
    minimal: (_knexInstanceOrQuery, alias, _relationName = null) => [
      `${alias}.id`,
      `${alias}.name`
    ]
  },

  // Relations for data fetching
  relations: {
    user: {
      type: 'belongsTo',
      model: 'users',
      table: getTableName('auth', 'users', { dbType: process.env.DB_TYPE || 'pg' }),
      foreignKey: 'user_id',
      primaryKey: 'id',
      modelDefinition: () => require('../../auth/models/user.model')
    },
    bookmarks: {
      type: 'manyToMany',
      model: 'bookmark',
      table: getTableName('example', 'bookmark', { dbType: process.env.DB_TYPE || 'pg' }),
      primaryKey: 'id',
      through: {
        table: getTableName('example', 'bookmark_tag', { dbType: process.env.DB_TYPE || 'pg' }),
        alias: 'bt',
        foreignKey: 'tag_id',
        otherKey: 'bookmark_id'
      },
      modelDefinition: () => require('./bookmark.model')
    }
  },

  // Modifiers for reusable query logic
  modifiers: {
    forUser: (query, alias, { userId }) => {
      query.where(`${alias}.user_id`, userId)
    }
  }
}

module.exports = tagModel
