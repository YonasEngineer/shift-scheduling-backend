import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
// import { Pool } from 'pg';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(private readonly configService: ConfigService) {
    const adapter = new PrismaPg({
      connectionString: configService.get<string>('DATABASE_URL'),
      ssl: {
        rejectUnauthorized: false, // Required for Render's self-signed certificates
      },
    });
    super({
      adapter,
    });
  }

  async onModuleInit() {
    await this.$connect();
    console.log('Prisma connected');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
