import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { Public } from '../common';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
  ) {}

  @Public()
  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      // database health check
      () => this.db.pingCheck('database'),

      // memory health check if -> check if there's atleast 200mb
      () => this.memory.checkHeap('memory_heap', 200 * 1024 * 1024),

      // disk - health storage should not exceed 90%
      () =>
        this.disk.checkStorage('storage', {
          path: process.platform === 'win32' ? 'C:\\' : '/',
          thresholdPercent: 0.9,
        }),
    ]);
  }

  // liveness probe for k8s (simple might be wrong)
  @Public()
  @Get('live')
  live() {
    return { status: 'ok' };
  }

  // readiness probe - checks if app can handle traffic
  @Public()
  @Get('ready')
  @HealthCheck()
  ready() {
    return this.health.check([() => this.db.pingCheck('database')]);
  }
}
