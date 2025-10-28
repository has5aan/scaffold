const tagRouter = require('./routers/tag.router')
const TagHandler = require('../../../transport/handlers/example/tag.handler')
const { Middlewares } = require('../../../container')

module.exports = ({ expressInstance, commonContainer, container }) => {
  const tagHandler = new TagHandler({ tagActions: container.buildTagActions() })
  const router = tagRouter({ tagHandler })

  expressInstance.use(
    '/api/example/tags',
    commonContainer.getMiddleware(Middlewares.auth)
  )
  expressInstance.use('/api/example/tags', router)
}
