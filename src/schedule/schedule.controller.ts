import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
} from '@nestjs/common';
import { ScheduleService } from './schedule.service.js';

@Controller('schedules')
export class ScheduleController {
  constructor(private service: ScheduleService) {}

  @Post()
  create(@Body() body: any) {
    return this.service.create(body);
  }

  //  manager-based fetch (IMPORTANT for your UI)
  @Get('manager/:managerId')
  getManagerSchedules(@Param('managerId') managerId: string) {
    return this.service.getManagerSchedules(managerId);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.service.getById(id);
  }

  @Patch(':id/publish')
  publish(@Param('id') id: string) {
    return this.service.publish(id);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
