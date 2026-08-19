import { Injectable, NestMiddleware } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'

@Injectable()
export class SseMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // 只处理 SSE 路由
    if (req.path.includes('/stream')) {
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')
      res.setHeader('X-Accel-Buffering', 'no') // 禁用 nginx 缓冲
    }
    next()
  }
}
