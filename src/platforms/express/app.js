const express = require('express')
const {
  commonContainer,
  exampleContainer,
  cacheClient,
  logger
} = require('../containers')
const cors = require('cors')
const { Middlewares } = require('../../container')
const exampleApp = require('./example/example.app')
const { buildAuthMiddleware } = require('./middleware/auth.middleware')
const {
  buildJsonErrorHandlerMiddleware
} = require('./middleware/error-handler.middleware')
const {
  validatePlatformHeadersMiddleware
} = require('./middleware/header-validation.middleware')
const {
  buildRateLimitingMiddleware
} = require('./middleware/rate-limiting.middleware')

commonContainer.setMiddleware(Middlewares.auth, buildAuthMiddleware())
commonContainer.setMiddleware(
  Middlewares.validatePlatformHeaders,
  validatePlatformHeadersMiddleware
)
commonContainer.setMiddleware(
  Middlewares.rateLimiting,
  buildRateLimitingMiddleware(cacheClient)
)

const app = express()
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

exampleApp({
  expressInstance: app,
  commonContainer,
  container: exampleContainer
})

app.use(buildJsonErrorHandlerMiddleware(logger))

async function startServer() {
  await cacheClient.connect()
  const port = process.env.PORT || 3000
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
  })
}

startServer().catch(err => {
  console.error('Server startup error:', err)
  process.exit(1)
})
