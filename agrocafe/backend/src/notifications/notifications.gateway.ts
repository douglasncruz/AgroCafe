import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
@Injectable()
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Simple tracking of connected sockets if needed
  private connectedClients = new Map<string, Socket>();

  handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.query?.token;
      if (!token) {
        client.disconnect();
        return;
      }
      
      const payload: any = jwt.verify(token as string, process.env.JWT_SECRET || 'agrocafe-super-secret');
      
      // Store user id in socket data
      client.data.userId = payload.sub;
      
      this.connectedClients.set(client.id, client);
      
      // Users can join their own personal room
      client.join(`user_${payload.sub}`);

      console.log(`Socket connected: ${client.id} (User: ${payload.sub})`);
    } catch (err) {
      console.log('Socket unauthorized:', err.message);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.connectedClients.delete(client.id);
  }

  @SubscribeMessage('joinFarm')
  handleJoinFarm(client: Socket, farmId: string) {
    // If a user selects a farm in UI, they join that farm's room to receive farm-specific alerts
    client.join(`farm_${farmId}`);
    return { event: 'joined', data: `farm_${farmId}` };
  }

  @SubscribeMessage('leaveFarm')
  handleLeaveFarm(client: Socket, farmId: string) {
    client.leave(`farm_${farmId}`);
    return { event: 'left', data: `farm_${farmId}` };
  }

  notifyFarm(farmId: string, notification: any) {
    this.server.to(`farm_${farmId}`).emit('newNotification', notification);
  }

  notifyUser(userId: string, notification: any) {
    this.server.to(`user_${userId}`).emit('newNotification', notification);
  }

  notifyAll(notification: any) {
    this.server.emit('newNotification', notification);
  }
}
