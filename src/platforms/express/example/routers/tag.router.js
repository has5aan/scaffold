const express = require('express')
const { adaptExpressJsonResponse } = require('../../adapters/response.adapter')

module.exports = ({ tagHandler }) => {
  const router = express.Router()

  router.post('/', async (req, res) => {
    const response = await tagHandler.create(req, req.user.id)
    adaptExpressJsonResponse(response, res)
  })

  router.put('/:id', async (req, res) => {
    const response = await tagHandler.update(req, req.user.id)
    adaptExpressJsonResponse(response, res)
  })

  router.delete('/:id', async (req, res) => {
    const response = await tagHandler.delete(req, req.user.id)
    adaptExpressJsonResponse(response, res)
  })

  router.get('/', async (req, res) => {
    const response = await tagHandler.find(req, req.user.id)
    adaptExpressJsonResponse(response, res)
  })

  router.get('/:id', async (req, res) => {
    const response = await tagHandler.findById(req, req.user.id)
    adaptExpressJsonResponse(response, res)
  })

  return router
}
