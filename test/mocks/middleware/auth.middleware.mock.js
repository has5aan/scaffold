const mockAuthenticateToken = (req, _, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader) {
    next()
    return
  }

  const token = authHeader.split(' ')[1]
  if (!token) {
    next()
    return
  }
  // assuming the token is the user id
  req.user = {
    id: token
  }

  next()
}

module.exports = { mockAuthenticateToken }
