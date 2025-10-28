const {
  checkRateLimit,
  generateDeviceFingerprint
} = require('../../../transport/middleware/rate-limiting.middleware')

function buildRateLimitingMiddleware(cacheClient, type = 'general') {
  return async (req, res, next) => {
    const fingerprint = generateDeviceFingerprint(req)
    const email = req.body?.email || req.query?.email

    const result = await checkRateLimit({
      fingerprint,
      email,
      type,
      cacheClient
    })

    if (!result.allowed) {
      res.status(result.statusCode).json({ error: result.error })
      return
    }

    next()
  }
}

module.exports = { buildRateLimitingMiddleware }
