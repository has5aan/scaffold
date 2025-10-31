export class HttpResponse {
  statusCode: number
  data: any

  constructor(statusCode: number, data?: any) {
    this.statusCode = statusCode
    this.data = data !== undefined ? data : null
  }
}

export class OkResponse extends HttpResponse {
  constructor({ data }: { data?: any }) {
    super(200, data)
  }
}

export class CreatedResponse extends HttpResponse {
  constructor({ data }: { data?: any }) {
    super(201, data)
  }
}

export class NoContentResponse extends HttpResponse {
  constructor() {
    super(204, null)
  }
}

export class NotFoundResponse extends HttpResponse {
  constructor() {
    super(404, null)
  }
}
