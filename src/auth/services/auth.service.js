const { GoTrueClient } = require('@supabase/gotrue-js')
const { AuthenticationError } = require('../../lib/errors')
const User = require('../domain/user.domain')
require('dotenv').config()

async function authenticateToken(bearerToken) {
  if (!bearerToken || bearerToken === '') {
    throw new AuthenticationError('No token provided')
  }

  const goTrueClient = new GoTrueClient({
    url: process.env.GOTRUE_URL
  })
  const {
    data: { user },
    error
  } = await goTrueClient.getUser(bearerToken)

  if (error) {
    throw new AuthenticationError(`GoTrue error: ${error.message}`)
  }

  if (!user) {
    throw new AuthenticationError('User not found')
  }

  return new User(user)
}

module.exports = { authenticateToken }
