// location.controller.ts
import { Controller, Get, Param } from '@nestjs/common';
import { LocationService } from './location.service.js';

@Controller('locations')
export class LocationController {
  constructor(private locationService: LocationService) {}

  @Get('user/:userId')
  async getUserLocations(@Param('userId') userId: string) {
    console.log('see the userId', userId);
    return this.locationService.getUserLocations(userId);
  }
}
