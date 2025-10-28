function HttpResponse(statusCode, data) {
  this.statusCode = statusCode
  this.data = data !== undefined ? data : null
}

function OkResponse({ data }) {
  HttpResponse.call(this, 200, data)
}
OkResponse.prototype = Object.create(HttpResponse.prototype)
OkResponse.prototype.constructor = OkResponse

function CreatedResponse({ data }) {
  HttpResponse.call(this, 201, data)
}
CreatedResponse.prototype = Object.create(HttpResponse.prototype)
CreatedResponse.prototype.constructor = CreatedResponse

function NoContentResponse() {
  HttpResponse.call(this, 204, null)
}
NoContentResponse.prototype = Object.create(HttpResponse.prototype)
NoContentResponse.prototype.constructor = NoContentResponse

function NotFoundResponse() {
  HttpResponse.call(this, 404, null)
}
NotFoundResponse.prototype = Object.create(HttpResponse.prototype)
NotFoundResponse.prototype.constructor = NotFoundResponse

module.exports = {
  HttpResponse,
  OkResponse,
  CreatedResponse,
  NoContentResponse,
  NotFoundResponse
}
