import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { VideoSummary } from '../summaries/entities/video-summary.entity';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})
export class SummariesGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SummariesGateway.name);

  afterInit() {
    this.logger.log('WebSocket Gateway initialized for real-time notifications');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  notifySummaryCreated(summary: VideoSummary) {
    this.server.emit('summary:created', summary);
    this.server.emit('summary:updated', summary);
  }

  notifySummaryUpdated(summary: VideoSummary) {
    this.server.emit(`summary:${summary.id}`, summary);
    this.server.emit('summary:updated', summary);
  }

  notifySummaryError(summary: VideoSummary) {
    this.server.emit(`summary:${summary.id}`, summary);
    this.server.emit('summary:error', summary);
    this.server.emit('summary:updated', summary);
  }

  notifySummaryDeleted(id: string) {
    this.server.emit('summary:deleted', { id });
  }
}
