// Express-specific response adapter
// Converts domain response objects to Express JSON responses

/**
 * @param {import('../../../lib/http-responses').HttpResponse} response
 * @param {import('express').Response} res
 */
function adaptExpressJsonResponse(response, res) {
  if (response.data !== null) {
    return res.status(response.statusCode).json(response.data)
  }
  return res.status(response.statusCode).send()
}

module.exports = { adaptExpressJsonResponse }
