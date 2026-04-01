import { Module } from '@nestjs/common';
import { ShiftService } from './shift.service.js';
import { ShiftController } from './shift.controller.js';

@Module({
  providers: [ShiftService],
  controllers: [ShiftController],
})
export class ShiftModule {}
