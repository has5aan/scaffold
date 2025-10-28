function validatePlatformHeaders({ platform, installId, userAgent }) {
  // Require platform
  if (!platform) {
    return {
      valid: false,
      error: 'X-Platform header is required. Must be: native or browser',
      statusCode: 400
    }
  }

  // Validate platform value
  if (!['native', 'browser'].includes(platform)) {
    return {
      valid: false,
      error: 'Invalid X-Platform header. Must be: native or browser',
      statusCode: 400
    }
  }

  // Validate required headers based on platform
  if (platform === 'native') {
    if (!installId) {
      return {
        valid: false,
        error: 'X-Install-ID header is required for native platform',
        statusCode: 400
      }
    }
  } else if (platform === 'browser') {
    if (!userAgent) {
      return {
        valid: false,
        error: 'User-Agent header is required for browser platform',
        statusCode: 400
      }
    }
  }

  return { valid: true }
}

module.exports = { validatePlatformHeaders }
