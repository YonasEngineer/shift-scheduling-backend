import { Module } from '@nestjs/common';
import { StaffGateway } from './staff.getway.js';

@Module({
  providers: [StaffGateway],
  exports: [StaffGateway],
})
export class SocketModule {}
