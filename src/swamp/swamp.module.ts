import { Module } from '@nestjs/common';
import { SwampService } from './swamp.service.js';
import { SwampController } from './swamp.controller.js';

@Module({
  providers: [SwampService],
  controllers: [SwampController],
})
export class SwampModule {}
