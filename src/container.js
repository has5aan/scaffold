const Middlewares = {
  auth: 'auth',
  validatePlatformHeaders: 'validatePlatformHeaders',
  rateLimiting: 'rateLimiting'
}

class DI {
  constructor({ knexInstance, cacheClient, fileStorageService }) {
    this.knexInstance = knexInstance
    this.cacheClient = cacheClient
    this.fileStorageService = fileStorageService
    this.repositories = new Map()
    this.middlewares = new Map()
  }

  updateConnection(newKnexInstance) {
    this.knexInstance = newKnexInstance
    if (this.repositories.has('user')) {
      this.repositories.get('user').knexInstance = newKnexInstance
    }
  }

  setMiddleware(name, middleware) {
    this.middlewares.set(name, middleware)
  }

  getMiddleware(name) {
    if (!this.middlewares.has(name)) {
      throw new Error(`Middleware ${name} not found`)
    }
    return this.middlewares.get(name)
  }
}

module.exports = { DI, Middlewares }
