import {
  Injectable,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';

@Injectable()
export class TemporalWorkerService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  onApplicationBootstrap() {
    console.log('Temporal Worker 以独立进程运行，请执行: dev:pnpm worker');
  }

  onApplicationShutdown() {}
}
