import { Module } from '@nestjs/common';
import { SkillService } from './skill.service.js';
import { SkillController } from './skill.controller.js';

@Module({
  providers: [SkillService],
  controllers: [SkillController],
})
export class SkillModule {}
