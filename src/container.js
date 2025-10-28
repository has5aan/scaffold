const Middlewares = {
  auth: 'auth',
  validatePlatformHeaders: 'validatePlatformHeaders',
  rateLimiting: 'rateLimiting'
}

function DI({ knexInstance, cacheClient }) {
  this.knexInstance = knexInstance
  this.cacheClient = cacheClient
  this.repositories = new Map()
  this.middlewares = new Map()
}

DI.prototype.updateConnection = function (newKnexInstance) {
  this.knexInstance = newKnexInstance
  if (this.repositories.has('user')) {
    this.repositories.get('user').knexInstance = newKnexInstance
  }
}

DI.prototype.setMiddleware = function (name, middleware) {
  this.middlewares.set(name, middleware)
}

DI.prototype.getMiddleware = function (name) {
  if (!this.middlewares.has(name)) {
    throw new Error(`Middleware ${name} not found`)
  }
  return this.middlewares.get(name)
}

module.exports = { DI, Middlewares }
