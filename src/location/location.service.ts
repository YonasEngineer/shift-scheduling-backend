// location.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class LocationService {
  constructor(private prisma: PrismaService) {}

  async getUserLocations(userId: string) {
    const userLocations = await this.prisma.userLocation.findMany({
      where: { userId },
      include: {
        location: {
          select: {
            id: true,
            name: true,
            timezone: true, //  IMPORTANT for your frontend
          },
        },
      },
    });

    return userLocations.map((ul) => ({
      id: ul.location.id,
      name: ul.location.name,
      timezone: ul.location.timezone,
      role: ul.role,
      isCertified: ul.isCertified,
    }));
  }
}
