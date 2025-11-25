function mockRateLimiter(req, res, next) {
  next()
}

module.exports = { mockRateLimiter }
