const express = require('express')
const { adaptExpressJsonResponse } = require('../../adapters/response.adapter')

module.exports = ({ tagHandler }) => {
  const router = express.Router()

  router.post('/', async (req, res) => {
    const response = await tagHandler.create({ req, userId: req.user.id })
    adaptExpressJsonResponse(response, res)
  })

  router.put('/:id', async (req, res) => {
    const response = await tagHandler.update({ req, userId: req.user.id })
    adaptExpressJsonResponse(response, res)
  })

  router.delete('/:id', async (req, res) => {
    const response = await tagHandler.delete({ req, userId: req.user.id })
    adaptExpressJsonResponse(response, res)
  })

  router.get('/', async (req, res) => {
    const response = await tagHandler.find({ req, userId: req.user.id })
    adaptExpressJsonResponse(response, res)
  })

  router.get('/:id', async (req, res) => {
    const response = await tagHandler.findById({ req, userId: req.user.id })
    adaptExpressJsonResponse(response, res)
  })

  return router
}
