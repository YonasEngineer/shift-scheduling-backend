import { Module } from '@nestjs/common';
import { ScheduleService } from './schedule.service.js';
import { ScheduleController } from './schedule.controller.js';

@Module({
  providers: [ScheduleService],
  controllers: [ScheduleController],
})
export class ScheduleModule {}
