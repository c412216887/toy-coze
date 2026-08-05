export enum BizCode {
  Ok = 200,

  BadRequest = 400,
  Unauthorized = 401,
  Forbidden = 403,
  NotFound = 404,

  InternalError = 500,

  UserExists = 10001,
  WrongPassword = 10002,
  UserNotFound = 10003,
}

export class BizResult<T = unknown> {
  readonly code: BizCode
  readonly message: string
  readonly data: T

  private constructor(code: BizCode, message: string, data: T) {
    this.code = code
    this.message = message
    this.data = data
  }

  static ok<T>(data: T, message = 'success'): BizResult<T> {
    return new BizResult(BizCode.Ok, message, data)
  }

  static fail<T = null>(code: BizCode, message: string, data: T = null as T): BizResult<T> {
    return new BizResult(code, message, data)
  }
}

export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
  traceId?: string
}
