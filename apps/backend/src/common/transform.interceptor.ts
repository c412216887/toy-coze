import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import type { Request } from 'express'
import { BizResult, BizCode } from './response.dto'
import type { ApiResponse } from './response.dto'

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<unknown>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<unknown>> {
    const req = context.switchToHttp().getRequest<Request>()
    const traceId = req.headers['x-trace-id'] as string | undefined

    if (req.path.includes('/stream')) {
      return next.handle() as Observable<ApiResponse<unknown>>
    }

    return next.handle().pipe(
      map((data) => {
        const isBizResult = data instanceof BizResult
        return {
          code: isBizResult ? data.code : BizCode.Ok,
          message: isBizResult ? data.message : 'success',
          data: isBizResult ? data.data : data,
          ...(traceId ? { traceId } : {}),
        }
      }),
    )
  }
}
