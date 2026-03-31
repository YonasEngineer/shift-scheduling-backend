import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';
import { PrismaController } from './prisma.controller.js';

@Global()
@Module({
  providers: [PrismaService],
  controllers: [PrismaController],
  exports: [PrismaService],
})
export class PrismaModule {}
