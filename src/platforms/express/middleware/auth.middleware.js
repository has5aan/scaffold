const { authenticateToken } = require('../../../auth/services/auth.service')

function buildAuthMiddleware() {
  return async (req, _res, next) => {
    const bearerToken = req.headers.authorization?.replace('Bearer ', '')
    const user = await authenticateToken(bearerToken)
    req.user = user
    next()
  }
}

module.exports = { buildAuthMiddleware }
