const tagModel = {
  tableName: 'example.tag',
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
      table: 'auth.users',
      foreignKey: 'user_id',
      primaryKey: 'id',
      modelDefinition: () => require('../../auth/models/user.model')
    },
    bookmarks: {
      type: 'manyToMany',
      model: 'bookmark',
      table: 'example.bookmark',
      primaryKey: 'id',
      through: {
        table: 'example.bookmark_tag',
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
