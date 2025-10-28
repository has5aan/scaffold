const crypto = require('crypto')

// Generate device fingerprint from request headers and optional client data
function generateDeviceFingerprint(req) {
  const platform = req.get('X-Platform')

  if (platform === 'native') {
    // Native apps - use install ID
    const nativeComponents = [
      req.get('X-Install-ID') || '',
      req.get('X-Platform') || '',
      req.get('X-App-Version') || '',
      req.get('X-Device-Model') || '',
      req.get('X-OS-Version') || '',
      req.get('X-Screen-Resolution') || '',
      req.get('X-Device-ID') || '',
      req.get('User-Agent') || '', // Still useful for native apps
      req.ip || '' // IP address for additional uniqueness
    ].filter(Boolean)

    const fingerprintString = nativeComponents.join('|')

    return crypto
      .createHash('sha256')
      .update('native:' + fingerprintString)
      .digest('hex')
      .substring(0, 16)
  } else {
    // Browser - always use headers + IP (no session dependency)
    const browserComponents = [
      req.get('User-Agent') || '',
      req.get('Accept-Language') || '',
      req.get('Accept-Encoding') || '',
      req.get('Accept') || '',
      req.get('Sec-CH-UA') || '',
      req.get('Sec-CH-UA-Platform') || '',
      req.ip || ''
      // TODO: Use the session ID if available
    ].filter(Boolean)

    const fingerprintString = browserComponents.join('|')
    return crypto
      .createHash('sha256')
      .update('browser:' + fingerprintString)
      .digest('hex')
      .substring(0, 16)
  }
}

module.exports = {
  generateDeviceFingerprint
}
