class HttpResponse {
  constructor(statusCode, data) {
    this.statusCode = statusCode
    this.data = data !== undefined ? data : null
  }
}

class OkResponse extends HttpResponse {
  constructor({ data }) {
    super(200, data)
  }
}

class CreatedResponse extends HttpResponse {
  constructor({ data }) {
    super(201, data)
  }
}

class NoContentResponse extends HttpResponse {
  constructor() {
    super(204, null)
  }
}

class NotFoundResponse extends HttpResponse {
  constructor() {
    super(404, null)
  }
}

module.exports = {
  HttpResponse,
  OkResponse,
  CreatedResponse,
  NoContentResponse,
  NotFoundResponse
}
