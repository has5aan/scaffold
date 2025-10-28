const baseConfig = {
  registration: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 registration attempts per device per hour
    message: {
      error:
        'Too many registration attempts from this device. Please try again later.'
    }
  },
  login: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 login attempts per email per device per 15 min
    message: {
      error:
        'Too many login attempts for this account from this device. Please try again later.'
    }
  },
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per device per 15 min
    message: {
      error: 'Too many requests from this device. Please try again later.'
    }
  },
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 2, // 2 reset attempts per email per device per hour
    message: {
      error:
        'Too many password reset attempts for this email from this device. Please try again in an hour.'
    }
  },
  emailVerification: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 resend attempts per email per device per hour
    message: {
      error:
        'Too many verification email requests for this email from this device. Please try again in an hour.'
    }
  }
}

// Environment-specific overrides
const environmentOverrides = {
  development: {
    registration: { max: 10 }, // More lenient in dev
    general: { max: 200 }
  },
  test: {
    registration: { max: 100 }, // Very lenient in tests
    login: { max: 100 },
    general: { max: 1000 },
    passwordReset: { max: 100 },
    emailVerification: { max: 100 }
  },
  production: {
    registration: { max: 3 }, // Stricter in production
    general: { max: 50 }
  }
}

// Merge base config with environment-specific overrides
function getRateLimitingConfig() {
  const env = process.env.NODE_ENV || 'development'
  const overrides = environmentOverrides[env] || {}

  const config = { ...baseConfig }

  // Apply environment overrides
  Object.keys(overrides).forEach(key => {
    if (config[key]) {
      config[key] = { ...config[key], ...overrides[key] }
    }
  })

  return config
}

module.exports = {
  getRateLimitingConfig
}
