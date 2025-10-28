const {
  validatePlatformHeaders
} = require('../../../transport/middleware/header-validation.middleware')

function validatePlatformHeadersMiddleware(req, res, next) {
  const result = validatePlatformHeaders({
    platform: req.get('X-Platform'),
    installId: req.get('X-Install-ID'),
    userAgent: req.get('User-Agent')
  })

  if (!result.valid) {
    res.status(result.statusCode).json({ error: result.error })
    return
  }

  next()
}

module.exports = { validatePlatformHeadersMiddleware }
