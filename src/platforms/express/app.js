const express = require('express')
const {
  commonContainer,
  exampleContainer,
  cacheClient,
  logger
} = require('../containers')
const cors = require('cors')
const swaggerUi = require('swagger-ui-express')
const swaggerSpec = require('./swagger.config')
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

// Swagger documentation
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Scaffold API Documentation'
  })
)

// Swagger JSON endpoint
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json')
  res.send(swaggerSpec)
})

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
