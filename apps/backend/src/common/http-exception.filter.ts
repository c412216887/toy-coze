import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common'
import type { Request, Response } from 'express'

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const res = ctx.getResponse<Response>()
    const req = ctx.getRequest<Request>()
    const traceId = req.headers['x-trace-id'] as string | undefined

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR

    const message =
      exception instanceof HttpException
        ? this.resolveMessage(exception)
        : 'Internal server error'

    res.status(status).json({
      code: status,
      message,
      data: null,
      ...(traceId ? { traceId } : {}),
    })
  }

  private resolveMessage(exception: HttpException): string {
    const response = exception.getResponse()
    if (typeof response === 'string') return response
    if (typeof response === 'object' && response !== null) {
      const r = response as Record<string, unknown>
      if (typeof r['message'] === 'string') return r['message']
      if (Array.isArray(r['message'])) return (r['message'] as string[]).join('; ')
    }
    return exception.message
  }
}
