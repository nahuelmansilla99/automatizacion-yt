import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { N8nSuccessWebhookDto } from './dto/n8n-success-webhook.dto';
import { N8nErrorWebhookDto } from './dto/n8n-error-webhook.dto';
import { WebhookSecretGuard } from '../../core/guards/webhook-secret.guard';

@Controller('webhooks')
@UseGuards(WebhookSecretGuard)
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('n8n-success')
  @HttpCode(HttpStatus.OK)
  async handleSuccess(@Body() dto: N8nSuccessWebhookDto) {
    const summary = await this.webhooksService.handleSuccess(dto);
    return {
      status: 'success',
      message: 'Resumen actualizado correctamente',
      data: {
        id: summary.id,
        status: summary.status,
      },
    };
  }

  @Post('n8n-error')
  @HttpCode(HttpStatus.OK)
  async handleError(@Body() dto: N8nErrorWebhookDto) {
    const summary = await this.webhooksService.handleError(dto);
    return {
      status: 'error_recorded',
      message: 'Fallo registrado y notificado',
      data: {
        id: summary.id,
        status: summary.status,
        errorMessage: summary.errorMessage,
      },
    };
  }
}
