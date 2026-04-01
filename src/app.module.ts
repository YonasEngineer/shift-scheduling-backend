import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from './schedule/schedule.module.js';
import { ShiftModule } from './shift/shift.module.js';
import { SkillModule } from './skill/skill.module.js';
import { StaffModule } from './staff/staff.module.js';
import { SwampModule } from './swamp/swamp.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // ✅ important
    }),
    AuthModule,
    PrismaModule,
    ScheduleModule,
    ShiftModule,
    SkillModule,
    StaffModule,
    SwampModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
