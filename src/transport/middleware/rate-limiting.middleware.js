const { generateDeviceFingerprint } = require('../../lib/fingerprint')
const { getRateLimitingConfig } = require('../../config/rate-limit.config')

// Core rate limiting logic (HTTP-dependent, platform-agnostic)

async function checkRateLimit({
  fingerprint,
  email,
  type = 'general',
  cacheClient
}) {
  const config = getRateLimitingConfig()[type]

  // Generate key
  let key
  if (
    type === 'login' ||
    type === 'registration' ||
    type === 'passwordReset' ||
    type === 'emailVerification'
  ) {
    key = `email:${email}:${fingerprint}`
  } else {
    key = `fp:${fingerprint}`
  }

  // Check current count
  const current = await cacheClient.get(key)
  if (current && parseInt(current) >= config.max) {
    return {
      allowed: false,
      error: config.message.error,
      statusCode: 429
    }
  }

  // Increment and set expiry
  await cacheClient.incr(key)
  await cacheClient.expire(key, config.windowMs / 1000)

  return { allowed: true }
}

module.exports = { checkRateLimit, generateDeviceFingerprint }
