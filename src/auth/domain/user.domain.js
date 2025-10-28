function User(gotrueUser) {
  if (!gotrueUser || !gotrueUser.id) {
    throw new Error('Invalid user data: id is required')
  }

  // Freeze metadata to make them immutable
  const frozenAppMetadata = Object.freeze({
    ...(gotrueUser.app_metadata || {})
  })
  const frozenUserMetadata = Object.freeze({
    ...(gotrueUser.user_metadata || {})
  })

  Object.defineProperty(this, 'id', {
    get: function () {
      return gotrueUser.id
    },
    enumerable: true,
    configurable: false
  })

  Object.defineProperty(this, 'email', {
    get: function () {
      return gotrueUser.email
    },
    enumerable: true,
    configurable: false
  })

  Object.defineProperty(this, 'role', {
    get: function () {
      return gotrueUser.role
    },
    enumerable: true,
    configurable: false
  })

  Object.defineProperty(this, 'emailConfirmedAt', {
    get: function () {
      return gotrueUser.email_confirmed_at
    },
    enumerable: true,
    configurable: false
  })

  Object.defineProperty(this, 'createdAt', {
    get: function () {
      return gotrueUser.created_at
    },
    enumerable: true,
    configurable: false
  })

  Object.defineProperty(this, 'updatedAt', {
    get: function () {
      return gotrueUser.updated_at
    },
    enumerable: true,
    configurable: false
  })

  Object.defineProperty(this, 'appMetadata', {
    get: function () {
      return frozenAppMetadata
    },
    enumerable: true,
    configurable: false
  })

  Object.defineProperty(this, 'userMetadata', {
    get: function () {
      return frozenUserMetadata
    },
    enumerable: true,
    configurable: false
  })

  Object.freeze(this)
}

User.prototype.isEmailConfirmed = function () {
  return !!this.emailConfirmedAt
}

User.prototype.isAuthenticated = function () {
  return this.role === 'authenticated'
}

User.prototype.toJSON = function () {
  return {
    id: this.id,
    email: this.email,
    role: this.role,
    emailConfirmedAt: this.emailConfirmedAt,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  }
}

module.exports = User
