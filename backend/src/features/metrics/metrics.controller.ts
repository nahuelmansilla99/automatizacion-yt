import { Controller, Get, Post } from '@nestjs/common';
import { MetricsService, AppMetricsResponse } from './metrics.service';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  async getMetrics(): Promise<AppMetricsResponse> {
    return this.metricsService.getMetrics(false);
  }

  @Post('refresh')
  async refreshMetrics(): Promise<AppMetricsResponse> {
    return this.metricsService.getMetrics(true);
  }
}
