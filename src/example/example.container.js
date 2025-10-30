const TagRepository = require('./repositories/tag.repository')
const TagActions = require('./actions/tag.actions')

class DI {
  constructor({ knexInstance, commonContainer }) {
    this.knexInstance = knexInstance
    this.repositories = new Map()
    this.actions = new Map()
    this.commonContainer = commonContainer
  }

  updateConnection(newKnexInstance) {
    this.knexInstance = newKnexInstance
    if (this.repositories.has('tag')) {
      this.repositories.get('tag').knexInstance = newKnexInstance
    }
  }

  // Tag
  // --------------------------------
  buildTagRepository() {
    if (!this.repositories.has('tag')) {
      this.repositories.set(
        'tag',
        new TagRepository({ knexInstance: this.knexInstance })
      )
    }
    return this.repositories.get('tag')
  }

  buildTagActions() {
    if (!this.actions.has('tag')) {
      this.actions.set(
        'tag',
        new TagActions({ tagRepository: this.buildTagRepository() })
      )
    }
    return this.actions.get('tag')
  }
}

// Bookmark
// --------------------------------

module.exports = { DI }
