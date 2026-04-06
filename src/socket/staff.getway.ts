// socket.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'staff', // 👈 important (optional but cleaner)
})
export class StaffGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;

    console.log('✅ Connected:', client.id, 'user:', userId);

    if (userId) {
      client.join(userId);
    } else {
      console.log(' No userId provided');
    }
  }

  handleDisconnect(client: Socket) {
    console.log(' Disconnected:', client.id);
  }

  sendToStaff(userId: string, event: string, data: any) {
    this.server.to(userId).emit(event, data);
  }
}
