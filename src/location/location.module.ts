import { Module } from '@nestjs/common';
import { LocationService } from './location.service.js';
import { LocationController } from './location.controller.js';

@Module({
  providers: [LocationService],
  controllers: [LocationController],
})
export class LocationModule {}
