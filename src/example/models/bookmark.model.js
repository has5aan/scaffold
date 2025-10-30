const { getTableName } = require('../../lib/database/migration-helpers')

const bookmarkModel = {
  tableName: getTableName('example', 'bookmark', {
    dbType: process.env.DB_TYPE || 'pg'
  }),
  alias: 'b',
  primaryKey: 'id',

  // Projections define which columns to select
  projections: {
    default: (_knexInstanceOrQuery, alias, _relationName) => [
      `${alias}.id`,
      `${alias}.user_id`,
      `${alias}.url`,
      `${alias}.title`,
      `${alias}.description`,
      `${alias}.created_at`,
      `${alias}.updated_at`
    ],
    summary: (_knexInstanceOrQuery, alias, _relationName) => [
      `${alias}.id`,
      `${alias}.title`,
      `${alias}.url`,
      `${alias}.created_at`
    ],
    minimal: (_knexInstanceOrQuery, alias, _relationName) => [
      `${alias}.id`,
      `${alias}.title`,
      `${alias}.url`
    ]
  },

  // Relations for data fetching
  relations: {
    user: {
      type: 'belongsTo',
      model: 'user',
      table: getTableName('auth', 'users', {
        dbType: process.env.DB_TYPE || 'pg'
      }),
      foreignKey: 'user_id',
      primaryKey: 'id',
      modelDefinition: () => require('../../auth/models/user.model')
    },
    tags: {
      type: 'manyToMany',
      model: 'tag',
      table: getTableName('example', 'tag', {
        dbType: process.env.DB_TYPE || 'pg'
      }),
      primaryKey: 'id',
      through: {
        table: getTableName('example', 'bookmark_tag', {
          dbType: process.env.DB_TYPE || 'pg'
        }),
        alias: 'bt',
        foreignKey: 'bookmark_id',
        otherKey: 'tag_id'
      },
      modelDefinition: () => require('./tag.model')
    }
  },

  // Modifiers for reusable query logic
  modifiers: {
    forUser: (query, alias, { userId }) => {
      query.where(`${alias}.user_id`, userId)
    },
    byUrl: (query, alias, { url }) => {
      query.where(`${alias}.url`, url)
    },
    byTitle: (query, alias, { title }) => {
      query.where(`${alias}.title`, title)
    },
    search: (query, alias, { term }) => {
      query.where(function () {
        this.where(`${alias}.title`, 'like', `%${term}%`)
          .orWhere(`${alias}.description`, 'like', `%${term}%`)
          .orWhere(`${alias}.url`, 'like', `%${term}%`)
      })
    }
  }
}

module.exports = bookmarkModel
