import { Module } from '@nestjs/common';
import { ShiftService } from './shift.service.js';
import { ShiftController } from './shift.controller.js';
import { StaffGateway } from '../socket/staff.getway.js';

@Module({
  providers: [ShiftService, StaffGateway],
  controllers: [ShiftController],
})
export class ShiftModule {}
