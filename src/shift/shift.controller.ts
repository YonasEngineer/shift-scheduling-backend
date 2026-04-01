import { Controller, Post, Get, Param, Body, Delete } from '@nestjs/common';
import { ShiftService } from './shift.service.js';

@Controller('shifts')
export class ShiftController {
  constructor(private service: ShiftService) {}

  @Post()
  create(@Body() body: any) {
    console.log('see the shifts body', body);
    return this.service.create(body);
  }

  @Get('schedule/:scheduleId')
  getBySchedule(@Param('scheduleId') scheduleId: string) {
    return this.service.getBySchedule(scheduleId);
  }

  @Post(':shiftId/assign/:userId')
  assignUser(
    @Param('shiftId') shiftId: string,
    @Param('userId') userId: string,
  ) {
    return this.service.assignUser(shiftId, userId);
  }

  @Delete(':shiftId/unassign/:userId')
  removeUser(
    @Param('shiftId') shiftId: string,
    @Param('userId') userId: string,
  ) {
    return this.service.removeUser(shiftId, userId);
  }

  @Get('me/:userId')
  getMyAssignments(@Param('userId') userId: string) {
    return this.service.getStaffAssignments(userId);
  }

  @Delete(':shiftId')
  delete(@Param('shiftId') shiftId: string) {
    return this.service.delete(shiftId);
  }
}
