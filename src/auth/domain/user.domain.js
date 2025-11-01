class User {
  #gotrueUser
  #frozenAppMetadata
  #frozenUserMetadata

  constructor(gotrueUser) {
    if (!gotrueUser || !gotrueUser.id) {
      throw new Error('Invalid user data: id is required')
    }

    // Store the original user data
    this.#gotrueUser = gotrueUser

    // Freeze metadata to make them immutable
    this.#frozenAppMetadata = Object.freeze({
      ...(gotrueUser.app_metadata || {})
    })
    this.#frozenUserMetadata = Object.freeze({
      ...(gotrueUser.user_metadata || {})
    })

    Object.freeze(this)
  }

  get id() {
    return this.#gotrueUser.id
  }

  get email() {
    return this.#gotrueUser.email
  }

  get role() {
    return this.#gotrueUser.role
  }

  get emailConfirmedAt() {
    return this.#gotrueUser.email_confirmed_at
  }

  get createdAt() {
    return this.#gotrueUser.created_at
  }

  get updatedAt() {
    return this.#gotrueUser.updated_at
  }

  get appMetadata() {
    return this.#frozenAppMetadata
  }

  get userMetadata() {
    return this.#frozenUserMetadata
  }

  isEmailConfirmed() {
    return !!this.emailConfirmedAt
  }

  isAuthenticated() {
    return this.role === 'authenticated'
  }

  toJSON() {
    return {
      id: this.id,
      email: this.email,
      role: this.role,
      emailConfirmedAt: this.emailConfirmedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    }
  }
}

module.exports = User
