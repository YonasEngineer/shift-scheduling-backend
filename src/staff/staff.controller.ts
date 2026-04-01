// staff.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { StaffService } from './staff.service.js';

@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Get()
  async getStaff(
    @Query('locationId') locationId: string,
    @Query('skillId') skillId: string,
    @Query('shiftStart') shiftStart: string,
    @Query('shiftEnd') shiftEnd: string,
  ) {
    if (!locationId || !skillId) {
      throw new Error('locationId and skillId are required');
    }

    return this.staffService.getAvailableStaff(
      locationId,
      skillId,
      new Date(shiftStart),
      new Date(shiftEnd),
    );
  }
}
